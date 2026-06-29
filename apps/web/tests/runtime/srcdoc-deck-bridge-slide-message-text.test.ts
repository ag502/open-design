// @vitest-environment node

import { describe, expect, it, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { buildSrcdoc } from '../../src/runtime/srcdoc';

function extractDeckBridgeScript(srcdoc: string): string {
  const match = srcdoc.match(/<script data-od-deck-bridge>([\s\S]*?)<\/script>/);
  if (!match || !match[1]) {
    throw new Error('deck bridge script not found in srcdoc');
  }
  return match[1];
}

function setupDeckThatMentionsSlideMessages() {
  const bodyHtml = `
    <section class="slide" style="display:block">Slide One</section>
    <section class="slide" style="display:none">Slide Two</section>
    <p>Protocol token: od:slide</p>
  `;
  const srcdoc = buildSrcdoc(`<!doctype html><html><body>${bodyHtml}</body></html>`, {
    deck: true,
  });
  const script = extractDeckBridgeScript(srcdoc);
  const dom = new JSDOM(`<!doctype html><html><body>${bodyHtml}</body></html>`, {
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  const win = dom.window;
  Object.defineProperty(win, 'parent', {
    configurable: true,
    value: { postMessage: vi.fn() },
  });
  Object.defineProperty(win, 'setTimeout', {
    configurable: true,
    value: vi.fn(() => 0),
  });
  Object.defineProperty(win, 'clearTimeout', {
    configurable: true,
    value: vi.fn(),
  });

  const evaluate = new win.Function(script);
  evaluate.call(win);
  const slides = Array.from(win.document.querySelectorAll<HTMLElement>('.slide'));
  return { win, slides };
}

describe('deck bridge - slide message text', () => {
  it('keeps host navigation active when content mentions the od:slide protocol without handling it', () => {
    const { win, slides } = setupDeckThatMentionsSlideMessages();
    const [first, second] = slides;
    if (!first || !second) throw new Error('expected two slides');

    win.dispatchEvent(
      new win.MessageEvent('message', { data: { type: 'od:slide', action: 'next' } }),
    );

    expect(first.style.display).toBe('none');
    expect(second.style.display).toBe('');
    win.close();
  });
});
