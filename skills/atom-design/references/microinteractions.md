# Microinteractions

The single biggest gap in 2026's anti-slop canon. Most skills correct typography and colour; very few correct *the small, repeated moments where an interface either feels designed or feels generated.* This file is the correction.

A microinteraction is one event with four parts: trigger → rules → feedback → loops/modes (Saffer). Get any of those wrong and the interface feels uncrafted. Ship them all right and the interface feels *made* — even when nothing else is unusual.

## Principles

- **Motion has intent or motion is cut.** Every animation must clarify, guide, or confirm. If you cannot name what a transition communicates, it is decoration. Decoration is slop.
- **Silent success.** A successful action does *not* deserve a "Done!" toast. If the user sees the result, they don't need a confirmation. Reserve toasts for failures and for actions that hide their own effect.
- **Optimism with rollback.** Update the UI immediately on user action. Send the request in the background. If it fails, animate the rollback and offer Undo. Round-trip latency is a perception killer.
- **Restraint, not restraint-as-personality.** Atom is not "no motion." Atom is *the right motion in the right place.* A drag handle that springs into focus on grab is good. A page where every card pulses on hover is slop.
- **Reduced motion is a first-class state, not an afterthought.** Every interaction defines its reduced-motion behaviour explicitly. Default is: collapse spatial motion to opacity crossfade, keep duration ≤ 150ms, preserve functional state changes.
- **Keyboard first, hover second.** Every hover affordance has a focus equivalent. No interaction is hover-only.

## When to ship motion by default

The skill biases toward motion-cut. But certain archetypes feel **broken without** motion — they're so visually busy (or so number-led) that complete stillness reads as a screenshot rather than an interface. For these archetypes, ship 2–3 small purposeful microinteractions automatically, without waiting for the user to ask.

**Default-on archetypes:** Bento Grid · Stat-Led · Workbench · Marquee Hero · Conversational FAQ

**Default-off archetypes:** Editorial · Manifesto · Letter · Quote-Led · Type Specimen · Long Document · Index-First · Letter

For default-on, pick **two or three** from this menu (never more than three primitives per page):

| Microinteraction | When to ship | Recipe |
| --- | --- | --- |
| **Number reveal** | Stat-Led hero, headline numbers anywhere | IntersectionObserver fires on viewport entry; `requestAnimationFrame` counts from 0 to target over 1.2–1.6 s with `--ease-out`. Reduced-motion: skip animation, render final value. |
| **Pricing card lift** | Pricing tier cards | `translateY(-3px)` + shadow upgrade on `:hover`, 180 ms `--ease-out`. Active state: drop back to `translateY(0)` over 60 ms (the press). |
| **CTA hover lift** | Primary CTA buttons | `translateY(-1.5px)` + background-fade. 200 ms `--ease-out`. Active state at 60 ms. |
| **Marquee scroll** | Marquee Hero, customer-logo strip | `@keyframes marquee` `translateX(-100%)` over 40–60 s, infinite. Pauses on hover. Reduced-motion: stops the scroll, shows the first three items. |
| **Stagger reveal** | Testimonials, feature cards, gallery | IntersectionObserver fires on each card; 100 ms stagger; opacity 0 → 1 + `translateY(8px → 0)`; `--ease-out` 400 ms. **One-shot only — never re-fires on scroll.** |
| **Recommended-tier pulse** | The middle pricing tier | One-shot `@keyframes pulse-border` 2 s, runs once on viewport entry. Subtle: opacity 0.4 → 1 → 0.4 on the border. Don't loop. |
| **Caret blink** | *Inside* a typed command (install code, terminal nav, code mockup) — never as standalone decoration | `@keyframes blink` 1 s steps(2) infinite on a 1ch-wide block, placed at the end of a typed command line so it reads as a "you'd type next" affordance. Reduced-motion: solid block, no blink. **Hard rule:** the caret must sit inside `<pre class="code">…▮</pre>` or an N8 Terminal nav line — never as a standalone `<span>` floating in a hero. |
| **Number tick on data update** | Dashboard live values | See *Number tick* recipe below. |

### Hard rules for default-on motion

1. Every animation respects `prefers-reduced-motion: reduce` — either skip entirely or run at 0.01 s.
2. **No more than three distinct animation primitives per page.** A counter + a hover-lift + a marquee = three. Don't add a fourth. The temptation to layer "just one more" is the slop pull.
3. No scroll-linked animations on viewports below 40 rem (existing mobile rule, [`component-cookbook.md` § Mobile collapse](component-cookbook.md)).
4. No animation longer than 2 s except continuous loops (marquee, ambient breathing, caret blink).
5. The "if I removed this animation, would anyone notice?" test still applies — but for the default-on set, the answer is "yes, the page would feel screenshot-stiff and the brand would feel thin."

### What never gets default motion

- Body text reveals on scroll. Reading is not a cinematic experience.
- Background gradient shifts. Distracting.
- Cursor followers. Always slop.
- Section-by-section fade-up-stagger. Pick one orchestrated entrance, not twelve.
- Tab content sliding sideways. Crossfade only (see Tab change recipe below).

When the page is default-off (Editorial, Manifesto, etc.), motion is *opt-in* — the user must ask. Stillness is the brand on those pages.

## The timing canon

Pick from these durations. Do not invent new ones.

| Bucket | Use for |
| --- | --- |
| **80–120 ms** | Instant feedback (button press tick, checkbox state, keystroke echo). The brain reads anything in this window as immediate. |
| **150–200 ms** | Hover state transitions, focus rings appearing, single-property fades, tooltip appears (with delay before — see below). |
| **250–300 ms** | Modal / dropdown / sheet opens, content fades in, validation icon scales in, tab content crossfade. |
| **400–500 ms** | Toast slides in, page-load section reveal, complex multi-property transitions, accordion open. |
| **0 ms** | The right answer surprisingly often. Focus state, keyboard navigation, error appearance — many things should not animate at all. |

Exit durations are 60–75% of the corresponding entrance. A 300ms enter pairs with a 200ms exit. Never the reverse.

## The easing canon

Three curves cover ~90% of UI motion. Tokenise them and never freestyle.

```css
:root {
  /* Entering elements — decelerate into place */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);

  /* Exiting elements — accelerate away */
  --ease-in: cubic-bezier(0.7, 0, 0.84, 0);

  /* State toggles — symmetrical */
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);

  /* Material 3 standard alternative — slightly less aggressive */
  --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
}
```

Spring physics replaces eases for **physical** interactions only — drag-and-drop release, swipe-to-dismiss, picker wheel snap, satisfying button press scale-bounce. Otherwise: ease.

| Spring config | Feel | Use for |
| --- | --- | --- |
| `stiffness: 50, damping: 20` | Gentle, no overshoot | Calm reveals; almost an ease |
| `stiffness: 180, damping: 22` | Snappy, slight overshoot | Drag release; toggle handle |
| `stiffness: 280, damping: 26` | Stiff, minimal bounce | Picker snap; haptic-like button press |
| `stiffness: 400, damping: 40` | Very stiff, no bounce | Position corrections; not a spring per se |

**Banned curves:** `ease` (the browser default — flat and uncrafted), `linear` except for progress bars and infinite loaders, anything with overshoot above ~110% (`cubic-bezier(0.34, 1.56, 0.64, 1)` and friends). Bounce is dated and signals templated work.

## Recipes

Each recipe: trigger, what changes, duration, easing, accessibility note. If a recipe is missing here, return to the principles and derive it from them.

### Button press

Trigger: pointer down. Changes: `transform: scale(0.98)` on press, base styling on release. Duration: 100ms in, 150ms out. Easing: in `--ease-in`, out `--ease-out`. A11y: focus ring stays visible; never animate the focus ring's existence.

```css
.btn {
  transition: background-color var(--dur-short) var(--ease-out),
              transform 100ms var(--ease-out);
}
.btn:hover { background: var(--color-ink); color: var(--color-paper); }
.btn:active { transform: translateY(1px); }
.btn:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 3px; }
```

### Input focus + label float

Trigger: focus event. Changes: border-bottom colour, label slides up + shrinks, optional subtle background tint. Duration: 200ms. Easing: `--ease-out`. **Critical:** the change happens *before* the user types — Stripe / Linear use this to confirm the field is alive. A11y: `:focus-visible` only, not `:focus`; respect reduced-motion by removing the slide and keeping only the colour change.

### Form validation

Trigger: blur after the field has been touched once (the "touched" pattern), then re-validate on every input. Never validate on every keystroke from the start — it's hostile. Changes: icon scales in (200ms `--ease-out`), border tints, helper text replaces. Three-part error message: what broke, why, how to fix.

### Toast notification

Trigger: action completes (or fails). Stack at one viewport corner; new toasts push existing ones in one direction; existing toasts do **not** reposition when a new one arrives. Duration: 400ms slide-in `--ease-out`, 4–6s dwell, 300ms slide-out `--ease-in`. Pause auto-dismiss on hover/focus. **Use sparingly:** if the action's effect is visible (a row was deleted; you can see the row is gone), no toast. Errors *always* get a toast with retry/undo.

### Modal open / close

Trigger: explicit user action (click, key shortcut). Backdrop fades 300ms `--ease-out`. Content scales 0.96 → 1.0 + opacity 0 → 1, 300ms `--ease-out`. Close: 220ms `--ease-in`, scale 1.0 → 0.98, opacity → 0. Use the native `<dialog>` element — it handles focus trap and `::backdrop` for free. `inert` on background. First focus to first interactive element, not the close button. Reduced motion: opacity-only crossfade, 150ms.

### Dropdown / menu

Trigger: click or key shortcut. Open: 180ms `--ease-out`, optional 30ms-stagger items if there are ≤ 8 of them. Close: 140ms `--ease-in`. Light-dismiss on outside click and Escape. Use the Popover API where available. Anchor positioning: flip when within 16px of viewport edge.

### Tooltip

Trigger: mouse hover (with **800–1000ms delay** to prevent flash on casual movement) OR keyboard focus (with **0ms delay** — keyboard users reached this deliberately, never delay them). Animation: 150ms `--ease-out` opacity. WCAG 1.4.13: tooltip must be hoverable (you can move pointer onto it without it disappearing), persistent (doesn't disappear on accidental movement), and dismissible (Escape).

### Tab change

Trigger: click or arrow-key. Underline slides `transform: translateX()` + width transition, 250ms `--ease-out`. Outgoing content fades 100ms `--ease-in`, incoming fades 150ms `--ease-out` with a 50ms delay. **Never animate the tab content's height** — animate `grid-template-rows: 0fr → 1fr` if the tabs change height.

### Number tick

Trigger: data loaded. Counter increments from 0 to value over 400ms with `--ease-out` applied to the *value*, not the element. Use `Intl.NumberFormat` for locale-correct separators. A11y: announce the final value with `aria-live="polite"`, *not* every tick. Reduced motion: skip the tick, show the final value.

### Copy-to-clipboard

Trigger: click. Changes: button label swaps to "Copied" with a check icon; revert after 2.5s. **No toast.** The label change *is* the feedback. Restore on `mouseleave` if user moves away sooner.

```js
btn.addEventListener("click", async () => {
  await navigator.clipboard.writeText(value);
  btn.dataset.state = "copied";
  setTimeout(() => delete btn.dataset.state, 2500);
});
```

```css
.copy-btn[data-state="copied"] .copy-btn__label::after { content: "  ✓  Copied"; }
.copy-btn[data-state="copied"] .copy-btn__label > * { opacity: 0; }
```

### Drag handle

Trigger: hover (after **1–2s delay** — Notion's pattern). Changes: handle reveals via opacity transition, cursor switches to `grab`. On grab: cursor `grabbing`, ghost element at 50% opacity follows pointer, drop indicator (1px line, accent colour) tracks the nearest valid drop target. Spring stiffness 280 / damping 26 on release-snap. A11y: arrow-key reorder when the row is focused; announce drag state with `aria-live`.

### Optimistic update with rollback

Trigger: any action with a known-correct local prediction (toggle, like, archive, reorder). Changes: state mutates immediately; the row visibly updates. Async request fires. On success: nothing happens — silent success is the marker of taste. On failure: 200ms colour rollback animation + a toast with one Undo button. The toast does not auto-dismiss while the user might still want it.

```js
const prevState = item.completed;
item.completed = !prevState; render();
try {
  await api.update(item);
} catch {
  item.completed = prevState; render();
  toast({ tone: "error", message: "Couldn't save.", action: { label: "Try again", run: retry } });
}
```

### Search-as-you-type

Trigger: input event. Debounce by 250ms before requesting; while debouncing, show a subtle indicator (border opacity or label colour shift). Highlight matches in results with `<mark>`. A11y: announce result count with `aria-live="polite"` after debounce settles, never per keystroke.

### Command palette navigation

Trigger: ⌘K or `/`. Open: instant, no animation. Arrow-keys move selection — **the indicator transitions** between rows (120ms `--ease-out` on the highlight's `transform: translateY()`), but the items themselves don't move. Enter selects. Escape closes. Items stagger-fade in on first open only, never on filter change. The text input stays focused throughout. This is the Linear / Raycast / Vercel pattern.

### Page-load reveals

One orchestrated entrance. Stagger by DOM index, capped at ~500ms total. Use `IntersectionObserver`, never scroll listeners. After first reveal, no more on-scroll animations — let the page just *be there*. Theme-specific themes (Atelier, Salon, Newsprint) skip reveals entirely; that is correct, not a bug.

## The named tells (what AI defaults produce)

These are the microinteraction signatures of generated code. The slop test in [`SKILL.md`](../SKILL.md) checks for them; treat any one as a critical finding.

1. **`transition-all`.** Every property animating, including ones that should be instant (visibility, display, focus rings). Always specify the properties. The class is banned in Atom output.
2. **Universal `hover:scale-105`.** Every card lifts on hover, with no shadow change, no easing specified, no purpose. AI's reflexive "make it interactive" gesture.
3. **Bouncy overshoot easings.** `cubic-bezier(0.34, 1.56, 0.64, 1)` and friends on UI elements. Tasteless 2018-throwback. Reserve overshoots for genuine physical interactions (drag release).
4. **Multiple simultaneous hover effects.** A card that translates, scales, shadows, colour-shifts, and rotates on hover. Pick *one* signal.
5. **Animated gradient backgrounds on hover.** The gradient slides through colour space. Distracting, expensive, communicates nothing.
6. **Glow halos on text.** Heavy `text-shadow` for "neon" — destroys contrast, hurts legibility.
7. **Cursor-follower dots.** A trailing dot that lags behind the pointer. Adds nothing; triggers vestibular issues.
8. **Custom cursors on every interactive element.** Conflicts with OS conventions; users learn nothing about what's clickable.
9. **Auto-rotating carousels with no controls.** WCAG 2.2.2 violation. Always.
10. **Parallax on scroll.** Different layers moving at different speeds. Vestibular trigger; rarely serves the content.
11. **`transition` applied to layout properties.** Animating `width`, `height`, `padding`, `margin`, `top`, `left`. Triggers reflow on every frame. Use `transform` or `grid-template-rows: 0fr → 1fr`.
12. **Universal scroll-triggered fade-up-stagger.** Every section fades in on intersection. Page never settles. Pick *one* orchestrated entrance.
13. **Celebratory success toasts.** "Done!" when the user just saved a thing they can see was saved. Silent success is taste.
14. **Confirmation dialogs for reversible actions.** "Are you sure you want to delete this?" Replace with optimistic delete + Undo toast.
15. **Spinners with no minimum visible time.** Spinner flashes on/off when the action completes in 80ms. Either delay showing it (150ms) or set a minimum visible duration (300ms).
16. **Tooltips with the same delay on hover and focus.** Hover should delay 800–1000ms; focus should appear immediately. They are different intents.
17. **Focus rings that animate in.** The ring fades in over 200ms, leaving keyboard users without an indicator at the start of the transition. Focus rings appear instantly. Always.
18. **Color-only state change.** A field turns red on error with no icon, no text, no border style change. Fails WCAG 1.4.1 and is unreadable for ~8% of men.
19. **Toasts that move existing content.** New toast pushes the page down; dismissed toast lets it spring back. Stack toasts; don't shift layout.
20. **Hover delays on touch.** A `:hover` state that the touch user can never reach because there's no equivalent focus / tap behaviour.

## Theme-aware microinteractions

Microinteractions adapt to the theme. The same button press is louder in Brutal than in Atelier. Apply a multiplier per theme:

| Theme | Duration scale | Easing flavour | Notes |
| --- | --- | --- | --- |
| Specimen | 1.0× | `--ease-out` | Default. Restrained. |
| Midnight | 0.9× | `--ease-out` | Snappy, technical. |
| Brutal | 0.75× | `--ease-out` (sharper) | Fast, decisive. No spring. |
| Garden | 1.2× | `--ease-out` | Calm. Springs welcome. |
| Atelier | 1.3× | `--ease-out` (very gentle) | Generous; almost no movement. |
| Newsprint | 0× | none | Static. Print metaphor. |
| Terminal | 0× | none, except caret blink *inside* a typed command (N8 nav, install code) | Print + monospace metaphor. **No standalone blinking cursor** — see the Caret blink row above. The caret only blinks where the user would type. |
| Manifesto | 0.7× | `--ease-out` (sharp) | Snap into place. |
| Salon | 1.4× | `--ease-out` (very gentle) | Softest. |
| Linen | 1.2× | `--ease-out` | Calm. |
| Almanac | 0.85× | `--ease-out` | Functional, like a reference book. |
| Sport | 0.7× | `--ease-out` (sharp) | Quick, italic-energy. |

If the theme has duration scale `0×`, you do not animate. The page does not move. That is a deliberate design choice; it is not broken.

## Accessibility ground truth

Every recipe in this file must pass these checks before shipping.

- **`prefers-reduced-motion: reduce`** is honoured. Spatial motion collapses to opacity crossfade ≤ 150ms. Functional state changes (progress bars, spinners) slow but remain.
- **Focus rings** are 2–3 px, ≥ 3:1 contrast, never animated in/out, present on every interactive element via `:focus-visible`.
- **Hit targets** ≥ 44 × 44 CSS px on touch surfaces.
- **No reliance on colour alone** for state. Pair with icon, text, or pattern.
- **No flashing** above 3 Hz. Even subtle pulse animations need rate caps.
- **Keyboard equivalents** for every hover affordance. No exceptions.
- **`aria-live`** on async state updates, but `polite` not `assertive` unless safety-critical.

## When in doubt, cut

Most pages have too much motion, not too little. Before shipping, walk through every animation in your output and ask: *what would happen if this animation were instant?* If the answer is "nothing — the user wouldn't notice", remove the animation. If the answer is "the user would lose information about what changed", keep it.

Reaching for a static answer is a sign of taste. Reaching for more motion is the AI default.
