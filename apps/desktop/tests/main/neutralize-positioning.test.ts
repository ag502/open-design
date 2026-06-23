import { afterEach, describe, expect, test } from 'vitest';

import { neutralizeFixedAndStickyPositioning } from '../../src/main/deck-capture.js';

// Long-page export captures the viewport at successive scroll offsets and
// stitches them. A `position:fixed` / stuck `position:sticky` element is pinned to
// the viewport, so without neutralization it is copied into EVERY segment and
// duplicated down the output (the QA-reported "hero appears twice"). The helper
// drops such elements into document flow so they render once. It runs in the
// page; here we exercise its branching with a minimal DOM stub (desktop tests run
// in the node env, no jsdom).

interface FakeStyle {
  calls: Array<[string, string, string]>;
  setProperty(prop: string, value: string, priority: string): void;
}

interface FakeEl {
  position: string;
  throwOnRead: boolean;
  style: FakeStyle;
}

function makeEl(position: string, throwOnRead = false): FakeEl {
  return {
    position,
    throwOnRead,
    style: {
      calls: [],
      setProperty(prop, value, priority) {
        this.calls.push([prop, value, priority]);
      },
    },
  };
}

const origDocument = (globalThis as Record<string, unknown>).document;
const origWindow = (globalThis as Record<string, unknown>).window;

function install(els: FakeEl[]): void {
  (globalThis as Record<string, unknown>).document = {
    querySelectorAll: () => els,
  };
  (globalThis as Record<string, unknown>).window = {
    getComputedStyle: (el: FakeEl) => {
      if (el.throwOnRead) throw new Error('detached node');
      return { position: el.position };
    },
  };
}

afterEach(() => {
  (globalThis as Record<string, unknown>).document = origDocument;
  (globalThis as Record<string, unknown>).window = origWindow;
});

describe('neutralizeFixedAndStickyPositioning', () => {
  test('fixed -> absolute !important (so the hero is not repeated per segment)', () => {
    const el = makeEl('fixed');
    install([el]);
    neutralizeFixedAndStickyPositioning();
    expect(el.style.calls).toEqual([['position', 'absolute', 'important']]);
  });

  test('sticky -> static !important', () => {
    const el = makeEl('sticky');
    install([el]);
    neutralizeFixedAndStickyPositioning();
    expect(el.style.calls).toEqual([['position', 'static', 'important']]);
  });

  test('static / relative / absolute are left untouched', () => {
    const els = [makeEl('static'), makeEl('relative'), makeEl('absolute')];
    install(els);
    neutralizeFixedAndStickyPositioning();
    for (const el of els) expect(el.style.calls).toEqual([]);
  });

  test('an element whose computed style cannot be read is skipped, not fatal', () => {
    const bad = makeEl('fixed', true);
    const good = makeEl('fixed');
    install([bad, good]);
    expect(() => neutralizeFixedAndStickyPositioning()).not.toThrow();
    expect(bad.style.calls).toEqual([]);
    expect(good.style.calls).toEqual([['position', 'absolute', 'important']]);
  });
});
