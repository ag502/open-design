# OD Figma Import (Figma plugin)

Rebuilds an **OD Figma capture** — the JSON node-tree the OD Clipper produces from a live
web page — into editable Figma layers (frames, text, images, fills, strokes, corner radii,
shadows).

This is a **standalone subproject** — intentionally *not* part of the pnpm workspace and
with **no build step**. The files load directly as a Figma development plugin.

> A native binary `.fig` can't be generated outside Figma, so the high-fidelity export is
> this importable JSON node-tree (see `IR.md`) that the plugin reconstructs via
> the Figma Plugin API — the same model as web-to-figma / html.to.design.

## Get a capture file

Produce an `.od-figma.json` either way:

- **OD Clipper** popup → *Download Figma (.json)* — captures the current page and downloads
  the file directly.
- **OD Library** → open an `html` asset captured with the clipper → *Download Figma JSON*
  (or the CLI: `od library figma <assetId> --out page.od-figma.json`).

## Load the plugin

1. In the Figma **desktop** app, open any file.
2. Menu → **Plugins → Development → Import plugin from manifest…**
3. Select this folder's `manifest.json`.
4. Run it from **Plugins → Development → OD Figma Import**.

## Import

In the plugin window, drop (or choose) the `.od-figma.json` file — or paste the JSON — then
click **Import**. The capture is rebuilt as a single frame named after the page, selected and
zoomed into view.

## Fidelity notes

- Layout uses the page's live geometry, so positions/sizes match what was captured.
- Fonts are loaded when available and otherwise fall back to **Inter Regular**.
- Best-effort: complex CSS (gradients beyond the first layer, blend modes, transforms,
  pseudo-elements, SVG internals) is simplified; tainted/cross-origin images that the
  clipper couldn't inline are dropped.

The capture schema is documented in [`IR.md`](./IR.md) and must stay in sync with
`clipper/capture.js`.
