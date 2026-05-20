---
name: slides
description: |
  Create and edit .pptx presentation decks with PptxGenJS. Useful for sales decks, kickoff briefs, and design-system showcases.
triggers:
  - "slides"
  - "pptxgenjs"
  - "sales deck"
  - "design showcase deck"
od:
  mode: deck
  category: slides
  upstream: "https://github.com/openai/skills"
---

# slides

> Curated from OpenAI's skills repository.

## What it does

Create and edit .pptx presentation decks with PptxGenJS. Useful for sales decks, kickoff briefs, and design-system showcases.

## Source

- Upstream: https://github.com/openai/skills
- Category: `slides`

## How to use

This catalogue entry advertises the skill in Open Design so the agent
discovers it during planning. To run the full upstream workflow with
its original assets, scripts, and references, install the upstream
bundle into your active agent's skills directory:

```bash
# Inspect the upstream README for exact paths
open https://github.com/openai/skills
```

Then ask the agent to invoke this skill by name (`slides`) or with
one of the trigger phrases listed in this skill's frontmatter.

## Design discipline (atom-design cross-reference)

When this skill produces a deck, the visual layer is still governed by
[`skills/atom-design`](../atom-design/SKILL.md): the 22-theme catalog
([`site/css/tokens.css`](../atom-design/site/css/tokens.css)), the diversification
rule (no two consecutive decks sharing macrostructure + theme + accent hue),
and the 65-gate slop-test. Pick a theme per atom's catalog rotation before
laying out slides; stamp the deck's first non-empty CSS comment with
`/* Atom · macrostructure: <name> · tone: <tone> · accent: <hue> */` so the
diversification rule sees the run.

For an exemplar 17-slide narrative built against this discipline, read
[`../atom-design/docs/talk-slides.md`](../atom-design/docs/talk-slides.md).
