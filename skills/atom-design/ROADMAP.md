# Atom-design · Forward Roadmap

> Our forward roadmap for this skill — **distinct** from [`docs/ROADMAP.md`](docs/ROADMAP.md), which preserves the upstream Hallmark roadmap unchanged.
>
> Anything written below is what Open Design's team plans to do **on top of** the brand-swapped Hallmark baseline. Treat this file as the single source of truth for what's next.

---

## Now — actively working on

### N.1 · Land the 5 named landing pages as standalone plugins

**Status (2026-05-20).** The 5 named hallmark site/examples (bananastudio · hyperlane · najm · tally · wayfare) live both under `skills/atom-design/site/examples/` (as the catalog showcase) AND as standalone `skills/landing-*` plugins (so the gallery surfaces them with high featured priority).

**Build.** Each `skills/landing-*` carries SKILL.md (rich frontmatter, `od.featured: 0.00011–0.00015` so they rank above the rest of the gallery), the assets (index.html + styles.css + tokens.css + optional script), and a localized `example.md` brief.

**Why it matters.** These five are the strongest demos we have. Surfacing them at the top of the Examples gallery is the cheapest way to make "what good looks like" obvious to new users — before they ever read SKILL.md.

### N.2 · 1:1 fidelity check against upstream hallmark

**Status.** Migration was a bulk copy + sed brand-swap. We have not yet diffed every imported file against upstream.

**Build.** Re-clone Nutlope/hallmark, run a file-by-file diff (normalising for `Hallmark → Atom` and `.hallmark/ → .od/atom/`), confirm no silent divergence. Anything that drifted intentionally goes into [`ATTRIBUTION.md`](ATTRIBUTION.md) § "What we adapted"; anything that drifted unintentionally goes back to upstream.

---

## Tier 1 · Ship next (high impact, contained scope)

### 1.1 · `atom variant` verb — three fingerprints side-by-side

**Status.** Atom produces *one* designed output per brief. The biggest cause of "AI feel" isn't bad output — it's the user accepting the *first* output because they don't know it could be different.

**Build.** New verb `atom variant <target>` produces three structurally distinct versions of the same brief — different fingerprints across the six axes — and presents them as a side-by-side comparison. The user picks one or asks for a fourth.

**Implementation surface.** New file `references/verbs/variant.md` + a SKILL.md routing entry below the `study` block. Reuses the macrostructure/theme/component picker already on disk; the only new logic is "pick three categorically different combos, render previews, prompt user."

**Why it matters.** Borrowed from upstream's roadmap (their § 1.3). High-leverage: same library, new verb, taste forced into the foreground.

### 1.2 · Image-led theme (Plate) + first-class image-gen hook

**Status.** [`references/assets.md`](references/assets.md) lists Nanobanana as Tier C in the enrichment hierarchy, but the integration is *recommend-only* — Atom tells the user to go generate something and bring it back. No first-class image-led theme exists; image-heavy briefs route to a typography-only macrostructure and feel underserved.

**Build.**
1. **First-class image-gen hook.** When the brief signals "needs imagery" (e-commerce, travel, food, lookbook, gallery), Atom generates a brief for the project's configured image model (Nanobanana / Recraft / OD's media pipeline), invokes the API, ingests the returned image, wires it into the build, and caches by prompt hash. Hook lives in the daemon's media-config path.
2. **New image-led theme** (working title **Plate**) — a 23rd entry in `site/css/tokens.css`. Generous photographic framing, neutral chrome around full-bleed imagery, hairline rules, restrained type so the picture leads. Pairs with the Photographic macrostructure (atom #08) and the H6 Photographic-Fold archetype.
3. **Token discipline for generated stills.** Extract dominant hue from the returned image, suggest as accent override, let the user confirm. Prevents "generated image clashes with theme palette."

**Why it matters.** Today Atom is a typography-led tool. Half of real-world landing pages need imagery (consumer brands, hospitality, e-commerce). Adding first-class image-gen + an image-led theme closes the gap without forcing the user to leave the skill.

### 1.3 · Theme-aware microinteraction durations

**Status.** [`references/microinteractions.md`](references/microinteractions.md) describes a duration multiplier per theme as a table — but the multipliers aren't actually expressed in CSS. Atelier and Salon should *feel* slower than Brutal and Sport, but right now they share the same `--dur-short` / `--dur-long`.

**Build.** Move `--dur-micro`, `--dur-short`, `--dur-long` into per-theme overrides in [`site/css/tokens.css`](site/css/tokens.css), scaled by the table in `microinteractions.md`. Newsprint and Terminal use `0ms` for spatial motion (print/terminal metaphors). One pass through the file; small diff.

**Why it matters.** A Salon page and a Brutal page should not animate at the same speed.

---

## Tier 2 · Worth doing, lower urgency

### 2.1 · DESIGN.md export bridge to OD's design-systems library

**Status.** Atom emits `design.md` for portable handoff to other AI tools (Cursor, v0, Bolt). OD has its own `design-systems/` library with brand-specific `DESIGN.md` files. Today these two surfaces don't talk.

**Build.** When Atom emits `design.md`, also offer a one-click "Save to OD design-systems library" action that copies the file into `design-systems/<slug>/DESIGN.md` with a proper manifest. Lets users build a personal catalog of locked-in design systems they can reuse on later projects.

### 2.2 · Project-memory shared across worktrees

**Status.** `.od/atom/log.json` is per-project. Two worktrees on the same monorepo see independent histories — so they could (and do) emit the same Bento Grid + Plain theme twice.

**Build.** Move the log to `~/.od/atom/log.json` with per-project shards. Diversification rule reads the shard for *this* project but also the user-level history for "themes used in the last week". Avoid repeating yourself across projects on the same Tuesday.

### 2.3 · Component-scope demo wrapper as a daemon route

**Status.** Component-scope output includes an 8-state `.preview.html` demo wrapper. Today the user opens it manually.

**Build.** Wire `/api/runs/:id/preview` to detect component-scope outputs and auto-route to the demo wrapper instead of a sample page render. Tiny daemon surface change; large UX win.

---

## Backlog (parked)

- **2.4 · `atom rewrite` verb** — take an existing page and re-emit just the copy with atom's tone discipline, keeping the structure fixed. Useful when copy is the problem, not the layout.
- **2.5 · Per-locale typography defaults** — Bricolage Grotesque pairs differently with Noto Sans SC than with Inter. Catalog the locale-aware overrides per theme.
- **2.6 · Atom-flavoured shadcn theme bundle** — emit a `tweakcn`-compatible CSS variable bundle for each of the 22 themes so shadcn projects can adopt a theme without writing their own tokens.
- **2.7 · A11y diagnostic in slop-test** — slop-test gates 46–50 already cover contrast. Extend with focus-order, ARIA hygiene, and reduced-motion behaviour gates.

---

## Out of scope

- We will **not** maintain the upstream catalog of macrostructures and components in isolation from Hallmark. If Hallmark adds a 22nd macrostructure, we copy it in. If we want a 22nd of our own, we fork and document in `ATTRIBUTION.md`.
- We will **not** ship a custom font infrastructure. Atom's typography rules assume Google Fonts + locally-resolvable variable fonts; anything else is the user's problem.
- We will **not** rebrand the upstream-attributed docs (`docs/ROADMAP.md`, `docs/talk-slides.md`) — those preserve the Hallmark name as a matter of attribution.
