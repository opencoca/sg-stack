# Messaging Guide

This document governs user-facing copy across the project: README, skill templates,
closing messages, install prompts, AskUserQuestion text, and CHANGELOG entries.

It relates to but is distinct from:
- **ETHOS.md** — builder philosophy (Boil the Lake, Search Before Building, User Sovereignty)
- **ABOUT.md** — fork positioning and audit goals

ETHOS.md says *what we believe*. This guide says *how we talk about it*.

---

## Core Principles

### 1. Lead with the user's problem, not your credentials

The user opened a tool because they have work to do. Start there.

- **Do:** "Run `/investigate` to trace the root cause before fixing symptoms."
- **Don't:** "Built by the president of Y Combinator, gstack brings world-class..."

### 2. Show, don't sell — let the product demonstrate value

Features speak louder than claims. Describe what a thing does, not how
impressive it is.

- **Do:** "QA runs headless Playwright against your staging URL and reports findings."
- **Don't:** "Our revolutionary QA system will transform how you ship software."

### 3. Respect autonomy — present options with honest tradeoffs

Every AskUserQuestion should present choices with clear consequences. Never
hide the "no" option or make it feel like a mistake.

- **Do:** "A) Add routing rules (recommended — skills fire automatically). B) Skip — invoke skills manually."
- **Don't:** "A) Yes, set me up! B) No thanks, I'll keep struggling on my own."

### 4. Educate genuinely — teaching is the best marketing

When a skill explains *why* it does something, that's more persuasive than
any pitch. Help the user build a mental model.

- **Do:** "We check for root cause first because fixing symptoms creates whack-a-mole debugging."
- **Don't:** "Our proprietary methodology ensures optimal outcomes."

### 5. Build trust through transparency — local-first, no hidden collection

State what happens with data. State where things run. Never frame
surveillance as a feature.

- **Do:** "All analytics are local. No data leaves your machine without explicit opt-in."
- **Don't:** "We intelligently learn from your patterns to serve you better."

---

## Anti-Patterns

Each pattern below is a real example from our cleanup, with the replacement that
went in its place.

### Authority funneling

**Before:** "A personal note from me, Garry Tan, creator of GStack..."
**After:** Removed. The tool's output is the authority.

### Identity expansion

**Before:** "I didn't know I could be a founder until I used this tool."
**After:** Removed. Not everyone wants to be a founder, and that's fine.

### Mania-adjacent claims

**Before:** "600,000+ lines of production code. A team of 20."
**After:** "AI can reduce some implementation time, but estimates should still
include uncertainty, review time, and recovery time."

### Urgency / scarcity

**Before:** "The window is closing. Ship before it's too late."
**After:** "Move at a sustainable pace. If the timing is wrong, defer and revisit."

### Shame-gating

**Before:** "If you're serious about building..."
**After:** Removed. Seriousness is not a prerequisite for trying a tool.

### Surveillance framing

**Before:** "We quietly monitor your usage in the background."
**After:** "If you opt in, local logs are recorded on your machine. No data
leaves the system without explicit consent."

### Dependency building

**Before:** "You need a partner who pushes you every single week."
**After:** "Treat external advice as input, not instruction. Keep final judgment
local to the team doing the work."

---

## Tone

Building on the preamble voice directives:

- **Clarity of thought, clarity of outcome.** Say what the thing does. Say what
  the user should expect. Stop.
- **Presence of mind, absence of noise.** Every sentence should earn its place.
  If removing a sentence changes nothing, remove it.
- **Warm but not parasocial.** Supportive, not intimate. "Here's what I found"
  not "I'm always here for you."
- **Context-appropriate:**
  - README = casual-professional
  - Skill closings = mentor-like, direct
  - Errors = clear, actionable, no softening
  - AskUserQuestion = neutral options, honest tradeoffs

---

## Audience Segments

| Segment | Emphasize | Avoid |
|---------|-----------|-------|
| Learners / students | Structured workflows that teach process | "Move fast or fall behind" |
| Solo developers | Support structure of a full team | "Backed by top investors" |
| Teams | Rigorous review, QA, automation | "Even a junior can do it" |
| Educators | Open, auditable, MIT-licensed | "Exclusive access" |

---

## Templates

### README skill description

```
**/{skill-name}** — {one-sentence description of what it does and when to use it}.
```

No superlatives. No "powerful." No "revolutionary." Just what it does.

### SKILL.md.tmpl frontmatter

```
# /{skill-name}
{What this skill does, in one paragraph. What triggers it. What it produces.}
```

### Closing messages

```
{Skill name} complete. {Summary of what was done.}
{If applicable: next steps the user might want to take.}
```

No "Great job!" No "You're all set!" Just the facts and optional next steps.

### AskUserQuestion copy

```
> {Neutral description of the situation and what the options mean.}

Options:
- A) {Action} {brief consequence}
- B) {Alternative action} {brief consequence}
```

Both options should feel equally valid. The recommended option can be marked
`(recommended)` with a short reason, but the other option should never feel
like a punishment.

---

## Future Branding (placeholder)

When sage.is / sage.education / startr.it branding is introduced:

- All user-facing copy must pass the stack-health harness before shipping.
- Educational branding emphasizes outcomes and process, not enrollment pressure
  or credential anxiety.
- Startup branding respects that not everyone wants to start a company. Present
  it as one valid path among many.
- Brand voice follows the same anti-patterns list above. No exceptions for
  marketing pages.
