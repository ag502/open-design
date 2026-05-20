# Attribution

This skill is adapted from **Nutlope/hallmark** — an anti-AI-slop design skill
created by Hassan El Mghari and the Together AI team.

- Upstream: https://github.com/Nutlope/hallmark
- License: MIT
- Imported at commit (shallow clone, 2026-05-20)

## What we took, unchanged in substance

- `references/` — the universal rule files (typography, color, motion, anti-patterns,
  slop-test, layout-and-space, copy, microinteractions, structure, responsive,
  hero-enrichment, custom-craft, imagery-kit, custom-theme, design-md, etc.)
- `references/macrostructures/` — all 21 named page shapes
- `references/components/` — all 46 component archetypes
- `references/genres/` — the 4 genre files (editorial, modern-minimal, atmospheric, playful)
- `references/verbs/audit.md`, `references/verbs/redesign.md`
- `references/study.md`
- `site/css/tokens.css` — the 22-theme catalog
- `site/css/{base,components,sections}.css` — the static-site scaffold the
  examples render against
- `site/examples/` — the 5 named showcase landing pages: bananastudio,
  hyperlane, najm, tally, wayfare
- `site/_tests/` — 13 numbered macrostructure exemplars + custom-theme demos
  + verb output examples
- `site/index.html` and `site/js/main.js` — the catalog showcase entry
- `docs/recipes.md` — 8 worked try-it prompts
- `docs/study-examples.md` — 3 worked study extractions
- `docs/talk-slides.md` — the 17-slide AI Engineer World's Fair talk (preserved
  with original Hallmark/Together AI branding because it is an attributed talk,
  not a rebrand-friendly artifact)
- `docs/ROADMAP.md` — the upstream roadmap (preserved with original branding;
  treat as "where the discipline is heading," not as our roadmap)

## What we adapted

- Skill name: `hallmark` → `atom-design` (and `Hallmark` → `Atom` across
  references, CSS stamps, examples, and SKILL.md)
- Verb syntax: `hallmark audit/redesign/study` → `atom audit/redesign/study`
- Memory paths: `.hallmark/log.json` → `.od/atom/log.json`; `.hallmark/preflight.json`
  → `.od/atom/preflight.json` — aligns with this project's `.od/` runtime convention
- `SKILL.md` — adapted from hallmark's 551-line routing brain; same flow, same
  step numbering, same disciplines

## What we did NOT touch

- The 65 slop-test gates (still applies as-is)
- The 22-theme axis system (paper-band / display-style / accent-hue)
- The macrostructure / component archetype catalog
- The pre-emit critique (P/H/E/S/R/V six axes)
- The diversification rule

## Future divergence

Anything we add that is NOT in upstream should be flagged in this file as we
go. Right now the local skill is essentially upstream + brand-swap.
