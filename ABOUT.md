# About This Fork

This fork exists to harden agent-facing software packs against privacy leaks, manipulative product framing, and hidden operational drift. The original gStack is a large agent pack. This fork keeps the useful mechanics, but treats every skill, prompt, tool, and helper script as something that should be auditable for:

- outbound telemetry and hosted egress
- dark patterns and authority-driven persuasion
- hidden automation and silent behavioral drift
- brittle generation pipelines and stale packaged artifacts
- unsafe defaults that create dependency or pressure rather than informed use

## What This Fork Is For

This is a working base for auditing and hardening:

- skill packs
- prompt packs
- agent packs
- shell tool bundles
- browser automation helpers
- review and routing frameworks

If a pack can influence user behavior or move data off the machine, it ***should be testable*** under this same health harness.

## Operating Principles

1. Local-first by default<br>Hosted telemetry, update checks, and community dashboards should be optional at most, and easy to hard-disable.

2. No manipulation as product strategy<br>Do not rely on identity expansion, shame, urgency, status signaling, founder conversion, or dependency-building copy to drive adoption.

3. Auditability over charisma<br>Generated docs, shared preambles, and packaged prompts should be traceable back to source and checked continuously.

4. Reuse over one-off cleanup<br>Every problem class that appears more than once should become a harness rule, test fixture, or reusable policy check.

## Included Here

- a reusable stack-health harness
- fixture-backed manipulation-policy tests
- a one-switch no-egress mode for the active hosted paths in this repo
- documentation for reusing the same auditing model across other packs

## Long-Term Direction

The long-term goal is to use this repo as a reference implementation for auditing all skill, tool, and agent packs with the same basic question:

> Does this pack *respect user autonomy*, *keep data local* unless explicitly allowed, and *remain understandable* under change?

***If not, it should fail review, fail policy, and be rewritten until it does!***
