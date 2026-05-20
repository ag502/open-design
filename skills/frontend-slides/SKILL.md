---
name: frontend-slides
description: |
  Generate animation-rich HTML presentations with visual style previews. Useful for online keynotes, embedded talks, and interactive briefs.
triggers:
  - "html slides"
  - "animation slides"
  - "interactive deck"
  - "web ppt"
  - "reveal slides"
od:
  mode: deck
  category: slides
  upstream: "https://github.com/zarazhangrui/frontend-slides"
---

# frontend-slides

> Curated from @zarazhangrui.

## What it does

Generate animation-rich HTML presentations with visual style previews. Useful for online keynotes, embedded talks, and interactive briefs.

## Source

- Upstream: https://github.com/zarazhangrui/frontend-slides
- Category: `slides`

## How to use

This catalogue entry advertises the skill in Open Design so the agent
discovers it during planning. To run the full upstream workflow with
its original assets, scripts, and references, install the upstream
bundle into your active agent's skills directory:

```bash
# Inspect the upstream README for exact paths
open https://github.com/zarazhangrui/frontend-slides
```

Then ask the agent to invoke this skill by name (`frontend-slides`) or with
one of the trigger phrases listed in this skill's frontmatter.

## Design discipline (atom-design cross-reference)

This skill ships *animation primitives and slide scaffolding*; the *visual
layer* is still governed by [`skills/atom-design`](../atom-design/SKILL.md).
HTML slide decks are essentially landing pages broken across N panels — pick:

- **Theme** from atom-design's 22-theme catalog
  ([`site/css/tokens.css`](../atom-design/site/css/tokens.css)) so the deck
  rotates against prior runs per the diversification rule (no two consecutive
  decks share paper-band + display-style + accent-hue).
- **Motion** per atom-design's [`motion.md`](../atom-design/references/motion.md)
  rules — transform/opacity only, named easings, respect `prefers-reduced-motion`.
- **Microinteractions** per atom-design's [`microinteractions.md`](../atom-design/references/microinteractions.md)
  — ≤ 3 primitives per slide, no celebratory toasts on slide transitions.

For an exemplar long-form narrative deck, read
[`../atom-design/docs/talk-slides.md`](../atom-design/docs/talk-slides.md).
