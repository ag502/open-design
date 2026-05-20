---
name: web-artifacts-builder
description: |
  Build complex claude.ai HTML artifacts with React and Tailwind. Anthropic's reference workflow for shipping rich, embeddable artifacts.
triggers:
  - "web artifacts"
  - "tailwind artifact"
  - "react artifact"
  - "anthropic artifact"
od:
  mode: prototype
  category: web-artifacts
  upstream: "https://github.com/anthropics/skills/tree/main/web-artifacts-builder"
---

# web-artifacts-builder

> Curated from Anthropic's official skills repository.

## What it does

Build complex claude.ai HTML artifacts with React and Tailwind. Anthropic's reference workflow for shipping rich, embeddable artifacts.

## Source

- Upstream: https://github.com/anthropics/skills/tree/main/web-artifacts-builder
- Category: `web-artifacts`

## How to use

This catalogue entry advertises the skill in Open Design so the agent
discovers it during planning. To run the full upstream workflow with
its original assets, scripts, and references, install the upstream
bundle into your active agent's skills directory:

```bash
# Inspect the upstream README for exact paths
open https://github.com/anthropics/skills/tree/main/web-artifacts-builder
```

Then ask the agent to invoke this skill by name (`web-artifacts-builder`) or with
one of the trigger phrases listed in this skill's frontmatter.

## Design discipline (atom-design cross-reference)

Anthropic's web-artifacts workflow handles wiring, embedding, and React/Tailwind
mechanics. The *visual layer* — type, color, layout rhythm, accent restraint,
microinteraction scope, anti-AI-slop guards — is delegated to
[`skills/atom-design`](../atom-design/SKILL.md). Before emitting an artifact:

- Read [`atom-design/SKILL.md`](../atom-design/SKILL.md) for the design flow
  (pre-flight scan → genre detection → macrostructure pick → theme pick →
  preview → build → slop-test).
- Use the 22-theme catalog in
  [`atom-design/site/css/tokens.css`](../atom-design/site/css/tokens.css) as
  the token source; do not invent OKLCH values mid-render.
- Run the 65 slop-test gates in
  [`atom-design/references/slop-test.md`](../atom-design/references/slop-test.md)
  before handoff.
- Treat web-artifacts as **page-scope** when there are 3+ sections, **component-scope**
  when it is a single element — atom-design routes both.
