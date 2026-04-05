# syntax=docker/dockerfile:1.7

ARG BUN_VERSION=1.3.10

FROM oven/bun:${BUN_VERSION}-slim AS base

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

ENV DEBIAN_FRONTEND=noninteractive \
    HOME=/root \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    # Prevent Playwright npm postinstall from downloading browsers
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    PATH=/usr/local/bin:/usr/local/sbin:/usr/sbin:/usr/bin:/sbin:/bin

# System deps + Claude Code (single layer, aggressive cleanup)
# - Manual Playwright deps (no install-deps: skip Xvfb, all font packages)
# - NO baked-in fonts — host fonts mounted read-only at runtime (see Makefile)
# - Browser binary installed in deps stage to match project's pinned Playwright version
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        bash ca-certificates curl git \
        # Chromium headless-shell runtime libraries
        libasound2 libatk-bridge2.0-0 libatk1.0-0 libatspi2.0-0 \
        libdbus-1-3 libdrm2 libexpat1 libgbm1 libglib2.0-0 \
        libnspr4 libnss3 libx11-6 libxcb1 libxcomposite1 \
        libxdamage1 libxext6 libxfixes3 libxkbcommon0 libxrandr2 \
        # Font rendering (fonts themselves are mounted from host at runtime)
        libfontconfig1 libfreetype6 \
    && bun install -g @anthropic-ai/claude-code \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* \
              /usr/share/doc/* /usr/share/man/*

RUN mkdir -p /root/.claude /root/.codex /home/gstack/.claude /home/gstack/.codex /workspace

# Container entrypoint: manage Claude config symlinks and volume dirs
RUN cat <<'EOF' >/usr/local/bin/gstack-container-init
#!/usr/bin/env bash
set -euo pipefail

H="${HOME:-/root}"
# Create dirs (may fail if volume-mounted as root — that's OK, the mount provides them)
mkdir -p "$H/.claude" "$H/.codex" "$H/.config" "$H/.cache" "$H/.local/share" 2>/dev/null || true

# Persist Claude's top-level config file inside the Claude volume.
# Non-fatal: fails gracefully when volumes are root-owned (e.g. first Docker run).
if [ ! -L "$H/.claude.json" ] 2>/dev/null; then
    rm -f "$H/.claude.json" 2>/dev/null || true
    ln -s "$H/.claude/.claude.json" "$H/.claude.json" 2>/dev/null || true
fi

# Restore newest backup if primary config is missing
if [ ! -s "$H/.claude/.claude.json" ] 2>/dev/null; then
    latest_backup="$(ls -1t "$H/.claude/backups/.claude.json.backup."* 2>/dev/null | head -n 1 || true)"
    if [ -n "$latest_backup" ]; then
        cp "$latest_backup" "$H/.claude/.claude.json" 2>/dev/null || true
    fi
fi

exec "$@"
EOF
RUN chmod +x /usr/local/bin/gstack-container-init

WORKDIR /workspace

# --- deps stage: install project dependencies + matching browser ---
FROM base AS deps
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile 2>/dev/null || bun install
# Install headless-shell matching the project's pinned playwright version
# (must happen here, not in base, to avoid version mismatch)
# Chromium sandbox is redundant inside Docker (Docker provides its own isolation).
# Install headless-shell, then wrap the binary with --no-sandbox so users don't
# need --security-opt seccomp=unconfined. Done here (not runtime stage) so the
# wrapper is always in the same layer as the binary.
RUN bunx playwright install chromium-headless-shell \
    && SHELL_BIN=$(find /ms-playwright \( -name 'chrome-headless-shell' -o -name 'headless_shell' \) -type f | head -1) \
    && [ -n "$SHELL_BIN" ] && echo "Wrapping $SHELL_BIN with --no-sandbox" \
    && mv "$SHELL_BIN" "${SHELL_BIN}.real" \
    && printf '#!/bin/bash\nexec "%s.real" --no-sandbox "$@"\n' "$SHELL_BIN" > "$SHELL_BIN" \
    && chmod +x "$SHELL_BIN"

# --- build stage ---
FROM deps AS build
COPY . .
# Only regenerate SKILL.md files — skip binary compilation (not needed in container,
# everything runs from source via `bun run dev`). Saves ~230 MB.
RUN bun run gen:skill-docs --host all

# --- runtime ---
FROM base AS runtime

# Non-root user: Chromium refuses to run as root without --no-sandbox.
# A real user lets the sandbox work properly (same approach as Dockerfile.ci).
RUN useradd -m -s /bin/bash gstack \
    && mkdir -p /ms-playwright /workspace /home/gstack/.gstack \
    && chown -R gstack:gstack /workspace /home/gstack/.gstack

WORKDIR /workspace
# Browser binary matching project's playwright version
COPY --from=deps --chown=gstack:gstack /ms-playwright /ms-playwright
# Built workspace (node_modules + compiled artifacts)
COPY --from=build --chown=gstack:gstack /workspace /workspace

ENV HOME=/home/gstack
USER gstack
ENTRYPOINT ["/usr/local/bin/gstack-container-init"]
CMD ["bash"]
