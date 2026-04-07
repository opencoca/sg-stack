# Stack Health Harness

`stack-health` is a config-driven health scanner for agent-heavy repositories.

It is designed to audit any pack that ships prompts, instructions, skills, agents,
shell tools, helper scripts, or browser automation glue — not only gstack.

It has two jobs:
- run hard integrity checks that should fail fast now,
- report softer policy debt that you can ratchet from warning to error as cleanup lands.

## Run It

```bash
bun run stack:health
bun run stack:health --json
bun run stack:health --strict-warnings
bun run stack:health --only generated-output-freshness,touchfile-consistency
bun run stack:health --root /path/to/other-pack
bun run stack:health --root /path/to/other-pack --config configs/pack-health.json
```

## Check Types

### Command checks

Use these for invariants that already have a test or a dry-run mode.
Examples:
- generated-file freshness
- touchfile completeness
- audit compliance

### Pattern checks

Use these for source scans that are easier to express as policy patterns.
Examples:
- outbound telemetry surfaces
- funnel or authority-conversion copy
- mania-adjacent productivity framing

## Config Model

The harness reads `stack-health.config.json`.

Each check has:
- `id`: stable handle for `--only`
- `type`: `command` or `pattern`
- `description`: human-readable purpose
- `severity`: `error` or `warn`

Pattern checks also define:
- `include`: globs to scan
- `exclude`: optional globs to skip
- `matchers`: list of forbidden literals or regexes with finding messages

Manipulation-policy rules should also have fixture coverage in
`test/fixtures/stack-health-policy-fixtures.json` so the scanner is tested
against deliberate positive and negative examples, not only live repo text.

Command checks also define:
- `command`
- `args`
- optional `cwd`
- optional `timeoutMs`

## Reuse Across Packs

The portable part is the pair:
- `scripts/stack-health.ts`
- `stack-health.config.json`

For runtime hardening, pair the harness with the repo's one-switch no-egress setting:

- `gstack-config set network_egress off`

That disables hosted telemetry sync, remote update checks, and community dashboard network calls while keeping local-only analytics and local checks available.

You have two reuse modes:

1. **Portable copy**
Copy the script and config into another repo.

2. **Central auditor**
Run this harness against another pack from one maintained checkout:

```bash
bun run stack:health --root /path/to/pack --config /path/to/pack/stack-health.config.json
```

To apply this to another skill, tool, or agent pack:
1. point the harness at the target root with `--root`,
2. use that pack's own config with `--config`,
3. replace command checks with the pack's real integrity commands,
4. replace pattern rules with the pack's own dark-pattern, telemetry, and autonomy-risk signatures,
5. start with `warn` for known debt and ratchet to `error` as the pack is cleaned.

## Ratchet Strategy

A practical rollout looks like this:
1. hard-fail existing integrity checks immediately,
2. report policy debt as warnings,
3. fix one category at a time,
4. promote a warning rule to `error` once the repo is clean enough to enforce it.

That keeps the harness useful on day one without pretending the repo is already healthy.

## Manipulation Coverage

The current policy fixture corpus covers these families:
- founder and authority funneling
- mania-adjacent productivity hype
- coercive urgency and shame framing
- surveillance and hidden-consent language
- dependency and compliance-building copy
- false authority appeals and fabricated social proof
- manufactured scarcity and artificial exclusivity
- guilt-tripping and value-loss shaming
- infantilizing language and condescending simplification
- dark UX confirm-shaming in decline options
- parasocial relationship building and false intimacy

If you add a new manipulation family, add both:
- a config rule in `stack-health.config.json`
- positive and negative examples in `test/fixtures/stack-health-policy-fixtures.json`

## Pack Categories

The harness is intended to cover all of these:
- skill packs
- agent packs
- prompt packs
- tool bundles and helper CLIs
- shell hooks and safety scripts
- browser automation helpers

If a pack ships behavior that can influence users or move data off-machine, it should be auditable here.
