# gstack in Docker — Zero-Repo Quick Start

Run Claude Code with browser superpowers in a container. No repo clone needed.

---

## Prerequisites

- **Docker** (Desktop or Engine)
- That's it. Auth happens inside the container.

## 1. Pull the image

```bash
docker pull ghcr.io/opencoca/gstack:latest
```

Multi-arch — works on both **amd64** and **arm64**.

## 2. Start a shell

```bash
docker run -it --rm \
  -v agent-claude:/home/agent/.claude \
  -v agent-codex:/home/agent/.codex \
  -v agent-config:/home/agent/.config \
  -v agent-cache:/home/agent/.cache \
  -v "$PWD":/workspace \
  ghcr.io/opencoca/gstack:latest bash
```

You're now inside the container as user `agent` with `/workspace` pointing at your current directory.

## 3. Log in (web login recommended)

```bash
claude login
```

Follow the browser link — web-based OAuth gives you the full interactive experience.
API keys work too (`export ANTHROPIC_API_KEY=sk-...`) but web login is smoother.

Your session is saved in the `agent-claude` volume, so it survives container restarts.

## 4. Use Claude Code

```bash
claude
```

Or go straight to work:

```bash
claude -p "explain this codebase"
```

All gstack skills (`/qa`, `/ship`, `/browse`, `/investigate`, etc.) are pre-installed.

## 5. One-liner: jump straight into Claude

Skip the shell, launch Claude directly:

```bash
docker run -it --rm \
  -v agent-claude:/home/agent/.claude \
  -v agent-codex:/home/agent/.codex \
  -v agent-config:/home/agent/.config \
  -v agent-cache:/home/agent/.cache \
  -v "$PWD":/workspace \
  ghcr.io/opencoca/gstack:latest claude
```

---

## Persistent config

Named volumes keep your auth, settings, and history between runs:

| Volume | What it stores |
|--------|---------------|
| `agent-claude` | Claude auth, config, conversation history, backups |
| `agent-codex` | Codex config |
| `agent-config` | General app config |
| `agent-cache` | Runtime cache |

The container entrypoint automatically sets up config directories and restores
from backups if your primary config goes missing. First run just works.

## Optional: mount host fonts (better screenshots)

Chromium renders pages with whatever fonts are available. Mount your system fonts
for pixel-perfect screenshots:

**macOS:**
```bash
docker run -it --rm \
  -v agent-claude:/home/agent/.claude \
  -v agent-config:/home/agent/.config \
  -v agent-cache:/home/agent/.cache \
  -v "$PWD":/workspace \
  -v /System/Library/Fonts:/usr/share/fonts/system:ro \
  -v /Library/Fonts:/usr/share/fonts/local:ro \
  ghcr.io/opencoca/gstack:latest bash
```

**Linux:**
```bash
  -v /usr/share/fonts:/usr/share/fonts/system:ro \
  -v /usr/local/share/fonts:/usr/share/fonts/local:ro
```

## Optional: environment variables

If you prefer API keys over web login, pass them in:

```bash
docker run -it --rm \
  -e ANTHROPIC_API_KEY \
  -v agent-claude:/home/agent/.claude \
  -v "$PWD":/workspace \
  ghcr.io/opencoca/gstack:latest claude
```

Supported env vars:

| Variable | For |
|----------|-----|
| `ANTHROPIC_API_KEY` | Claude |
| `OPENAI_API_KEY` | Codex / GPT features |
| `GEMINI_API_KEY` | Gemini features |
| `ANTHROPIC_AUTH_TOKEN` | Alternative Claude auth |
| `ANTHROPIC_BASE_URL` | Custom Claude endpoint |

Or use an `.env` file:

```bash
docker run -it --rm --env-file .env \
  -v agent-claude:/home/agent/.claude \
  -v "$PWD":/workspace \
  ghcr.io/opencoca/gstack:latest claude
```

---

## What's in the box

- **Bun** runtime (fast JS/TS toolchain)
- **Claude Code** CLI (pre-installed globally)
- **Chromium headless-shell** (Playwright-managed, sandbox pre-configured)
- **gstack skills** — `/qa`, `/ship`, `/browse`, `/investigate`, `/design-review`, `/benchmark`, `/canary`, and more
- **No sandbox headaches** — Chromium's sandbox is wrapped at build time with `--no-sandbox` since Docker provides its own isolation. No need for `--security-opt seccomp=unconfined`.

---

## Install gstack skills (without Docker)

If you want gstack skills on your local machine (no container), clone from **opencoca/gstack** — the fork with the safety harness (no-egress mode, manipulation auditing, privacy-first defaults):

**Claude Code (global):**
```bash
git clone --depth 1 https://github.com/opencoca/gstack.git ~/.claude/skills/gstack
cd ~/.claude/skills/gstack && ./setup
```

**Claude Code (project-local, shared with your team):**
```bash
git clone --depth 1 https://github.com/opencoca/gstack.git .claude/skills/gstack
cd .claude/skills/gstack && ./setup --local
```

**Codex / Gemini / Cursor:**
```bash
git clone --depth 1 https://github.com/opencoca/gstack.git .agents/skills/gstack
cd .agents/skills/gstack && ./setup --host codex
```

The `./setup` script builds the browse binary, creates skill symlinks, and lets you
pick short names (`/qa`) or namespaced (`/gstack-qa`). Run `./setup --no-prefix` or
`./setup --prefix` to skip the prompt.

> **Why opencoca?** The upstream repo doesn't include the safety harness — an
> auditing layer that detects manipulation patterns, enforces local-first privacy,
> and gives you a one-switch no-egress mode to hard-disable all hosted services.
> Same skills, better defaults.

---

## Quick reference

```bash
# Pull
docker pull ghcr.io/opencoca/gstack:latest

# Interactive shell
docker run -it --rm -v agent-claude:/home/agent/.claude -v "$PWD":/workspace ghcr.io/opencoca/gstack:latest bash

# Straight to Claude
docker run -it --rm -v agent-claude:/home/agent/.claude -v "$PWD":/workspace ghcr.io/opencoca/gstack:latest claude

# With API key
docker run -it --rm -e ANTHROPIC_API_KEY -v "$PWD":/workspace ghcr.io/opencoca/gstack:latest claude

# Log in (inside container)
claude login
```

Happy hacking.
