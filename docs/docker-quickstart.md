# gstack in Docker — From Zero to AI Pair Programmer in 60 Seconds

> **"One `docker run` and you have Claude Code, a headless browser, and 20+ AI skills. No install. No config. No kidding."**

You don't need to clone a repo. You don't need Node.js. You don't even need an API key upfront. Just Docker and a minute of your time.

---

## What you're getting

This isn't just Claude in a box. It's a full AI development environment:

- **Claude Code CLI** — Anthropic's coding agent, pre-installed and ready
- **Headless Chromium** — Playwright-managed, sandbox already handled (no `--security-opt` flags, no kernel workarounds)
- **20+ gstack skills** — `/qa`, `/ship`, `/browse`, `/investigate`, `/design-review`, `/benchmark`, `/canary`, and more
- **Bun runtime** — fast JS/TS toolchain under the hood
- **Multi-arch** — runs on amd64 and arm64 (yes, your M-series Mac too)

> **"It's the mass-production version of 'works on my machine.' It works on every machine."**

---

## Prerequisites

- Docker (Desktop or Engine)

That's the whole list.

---

## Step 1: Pull

```bash
docker pull ghcr.io/opencoca/gstack:latest
```

## Step 2: Run

```bash
docker run -it --rm \
  -v agent-claude:/home/agent/.claude \
  -v agent-codex:/home/agent/.codex \
  -v agent-config:/home/agent/.config \
  -v agent-cache:/home/agent/.cache \
  -v "$PWD":/workspace \
  ghcr.io/opencoca/gstack:latest bash
```

You're in. The container drops you into a shell as user `agent`, with your current directory mounted at `/workspace`.

## Step 3: Log in

```bash
claude login
```

Follow the link in your terminal — web-based OAuth is the way to go. It gives you the full interactive experience and your session persists across container restarts (thanks to the `agent-claude` volume).

API keys work too if that's your thing:
```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

## Step 4: Build something

```bash
claude
```

Or skip the chat and put it to work:
```bash
claude -p "explain this codebase and find the three biggest risks"
```

> **"From `docker pull` to shipping features with an AI pair programmer — under a minute. The future didn't need a setup wizard."**

---

## The one-liner (for the impatient)

Skip the shell entirely, launch Claude directly against your project:

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

## Your config survives restarts

Named Docker volumes keep your auth, history, and settings between runs. Nothing is lost when the container stops.

| Volume | What lives there |
|--------|-----------------|
| `agent-claude` | Auth tokens, config, conversation history, automatic backups |
| `agent-codex` | Codex config (for multi-AI workflows) |
| `agent-config` | General app preferences |
| `agent-cache` | Runtime cache (speeds up repeat operations) |

The container entrypoint handles first-run setup automatically — creates directories, symlinks config files, and even restores from backups if something goes sideways. You don't think about it.

---

## Make it stick: shell aliases

Those `docker run` commands are long. You should only type them once. Drop these
in your `~/.bashrc`, `~/.zshrc`, or wherever you keep aliases:

```bash
# Interactive shell — explore, install tools, poke around
alias gstack='docker run -it --rm \
  -v agent-claude:/home/agent/.claude \
  -v agent-codex:/home/agent/.codex \
  -v agent-config:/home/agent/.config \
  -v agent-cache:/home/agent/.cache \
  -v "$PWD":/workspace \
  ghcr.io/opencoca/gstack:latest bash'

# Jump straight into Claude against your current directory
alias gstack-claude='docker run -it --rm \
  -v agent-claude:/home/agent/.claude \
  -v agent-codex:/home/agent/.codex \
  -v agent-config:/home/agent/.config \
  -v agent-cache:/home/agent/.cache \
  -v "$PWD":/workspace \
  ghcr.io/opencoca/gstack:latest claude'
```

Then reload your shell:
```bash
source ~/.zshrc  # or ~/.bashrc
```

Now it's just:
```bash
cd my-project
gstack-claude
```

> **"Two aliases. That's the entire install. `gstack` for a shell, `gstack-claude` to start building."**

---

## Level up: optional extras

### Mount your fonts (sharper screenshots)

Chromium renders pages with whatever fonts are available. For screenshots that
look like they came from a real browser, mount your system fonts:

**macOS:**
```bash
docker run -it --rm \
  -v agent-claude:/home/agent/.claude \
  -v agent-config:/home/agent/.config \
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

### Pass API keys via environment

Web login is recommended, but if you're running headless or in CI, env vars work:

```bash
docker run -it --rm \
  -e ANTHROPIC_API_KEY \
  -v agent-claude:/home/agent/.claude \
  -v "$PWD":/workspace \
  ghcr.io/opencoca/gstack:latest claude
```

Or drop them in a `.env` file:

```bash
docker run -it --rm --env-file .env \
  -v agent-claude:/home/agent/.claude \
  -v "$PWD":/workspace \
  ghcr.io/opencoca/gstack:latest claude
```

| Variable | What it unlocks |
|----------|----------------|
| `ANTHROPIC_API_KEY` | Claude (primary) |
| `OPENAI_API_KEY` | Codex / GPT features |
| `GEMINI_API_KEY` | Gemini features |
| `ANTHROPIC_AUTH_TOKEN` | Alternative Claude auth |
| `ANTHROPIC_BASE_URL` | Custom/proxy endpoint |

---

## Install gstack without Docker

Prefer skills on your bare metal? Clone from **opencoca/gstack** — the fork
with the safety harness:

**Claude Code (global — available everywhere):**
```bash
git clone --depth 1 https://github.com/opencoca/gstack.git ~/.claude/skills/gstack
cd ~/.claude/skills/gstack && ./setup
```

**Claude Code (project-local — shared with your team via git):**
```bash
git clone --depth 1 https://github.com/opencoca/gstack.git .claude/skills/gstack
cd .claude/skills/gstack && ./setup --local
```

**Codex / Gemini / Cursor:**
```bash
git clone --depth 1 https://github.com/opencoca/gstack.git .agents/skills/gstack
cd .agents/skills/gstack && ./setup --host codex
```

The `./setup` script builds everything, creates skill symlinks, and asks if you
want short names (`/qa`) or namespaced (`/gstack-qa`). Pass `--no-prefix` or
`--prefix` to skip the prompt.

> **Why opencoca?** Same skills, better defaults. The opencoca fork adds a safety
> harness — manipulation detection, local-first privacy enforcement, and a
> one-switch no-egress mode to hard-disable all hosted services. You audit your
> tools; your tools don't audit you.

---

## Cheat sheet

```bash
# Pull the image
docker pull ghcr.io/opencoca/gstack:latest

# Interactive shell with persistent config
docker run -it --rm \
  -v agent-claude:/home/agent/.claude \
  -v "$PWD":/workspace \
  ghcr.io/opencoca/gstack:latest bash

# Jump straight into Claude
docker run -it --rm \
  -v agent-claude:/home/agent/.claude \
  -v "$PWD":/workspace \
  ghcr.io/opencoca/gstack:latest claude

# With API key (headless/CI)
docker run -it --rm \
  -e ANTHROPIC_API_KEY \
  -v "$PWD":/workspace \
  ghcr.io/opencoca/gstack:latest claude

# Log in (inside the container)
claude login
```

---

> **"AI coding assistants shouldn't require a PhD in DevOps to set up. `docker run` and go."**

Happy hacking.
