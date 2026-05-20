---
name: artifacts-builder
description: |
  Suite of tools for creating elaborate, multi-component claude.ai HTML artifacts using modern frontend web technologies (React, Tailwind CSS, shadcn/ui).
triggers:
  - "artifacts builder"
  - "html artifact"
  - "multi component artifact"
  - "react artifact"
od:
  mode: prototype
  category: web-artifacts
  upstream: "https://github.com/ComposioHQ/awesome-claude-skills/tree/master/artifacts-builder"
---

# artifacts-builder

> Curated from ComposioHQ awesome-claude-skills.

## What it does

Suite of tools for creating elaborate, multi-component claude.ai HTML artifacts using modern frontend web technologies (React, Tailwind CSS, shadcn/ui).

## Source

- Upstream: https://github.com/ComposioHQ/awesome-claude-skills/tree/master/artifacts-builder
- Category: `web-artifacts`

## How to use

This catalogue entry advertises the skill in Open Design so the agent
discovers it during planning. To run the full upstream workflow with
its original assets, scripts, and references, install the upstream
bundle into your active agent's skills directory:

```bash
# Inspect the upstream README for exact paths
open https://github.com/ComposioHQ/awesome-claude-skills/tree/master/artifacts-builder
```

Then ask the agent to invoke this skill by name (`artifacts-builder`) or with
one of the trigger phrases listed in this skill's frontmatter.

## Design discipline (atom-design cross-reference)

This skill ships *structure* (React + Tailwind + shadcn); the *visual layer* is
still governed by [`skills/atom-design`](../atom-design/SKILL.md). Before
writing any artifact CSS, pick:

1. **Macrostructure** — one of the 21 named page shapes in
   [`atom-design/references/macrostructures.md`](../atom-design/references/macrostructures.md).
   The artifact is a single page; it has a structural fingerprint.
2. **Theme** — one of the 22 named themes in
   [`atom-design/site/css/tokens.css`](../atom-design/site/css/tokens.css).
   Or construct a custom one if the brief carries a creative-intent signal.
3. **Components** — 5–7 archetype files from
   [`atom-design/references/components/`](../atom-design/references/components/),
   not the cookbook end-to-end.

Stamp the first non-empty CSS comment with `/* Atom · macrostructure: <name>
· tone: <tone> · accent: <hue> */`. Run the 65-gate slop-test before handing
back. For worked examples of HTML artifacts built to this discipline, see
[`../atom-design/site/examples/`](../atom-design/site/examples/) (5 named) and
[`../atom-design/site/_tests/`](../atom-design/site/_tests/) (13 numbered + custom).
