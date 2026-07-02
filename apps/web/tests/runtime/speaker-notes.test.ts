import { describe, expect, it } from 'vitest';

import {
  buildSpeakerNotesPresenterHtml,
  extractSpeakerNotesFromHtml,
  upsertSpeakerNotesInHtml,
} from '../../src/runtime/speaker-notes';

describe('speaker notes HTML helpers', () => {
  it('reads the shared #speaker-notes JSON array format', () => {
    const html = [
      '<!doctype html><html><body>',
      '<section class="slide">One</section>',
      '<script type="application/json" id="speaker-notes">',
      '["Intro", "Details"]',
      '</script>',
      '</body></html>',
    ].join('');

    expect(extractSpeakerNotesFromHtml(html, 3)).toEqual(['Intro', 'Details']);
  });

  it('falls back to per-slide .notes blocks', () => {
    const html = [
      '<section class="slide"><h1>One</h1><aside class="notes">Open<br>strong.</aside></section>',
      '<section class="slide"><h1>Two</h1><div class="notes"><p>Close &amp; transition.</p></div></section>',
    ].join('');

    expect(extractSpeakerNotesFromHtml(html, 2)).toEqual([
      'Open\nstrong.',
      'Close & transition.',
    ]);
  });

  it('upserts notes without mutating visible slide content', () => {
    const source = '<!doctype html><html><body><section class="slide">Visible</section></body></html>';
    const next = upsertSpeakerNotesInHtml(source, ['Private note']);

    expect(next).toContain('<section class="slide">Visible</section>');
    expect(next).toContain('id="speaker-notes"');
    expect(extractSpeakerNotesFromHtml(next)).toEqual(['Private note']);
  });

  it('replaces an existing speaker notes script', () => {
    const source = '<script type="application/json" id="speaker-notes">["Old"]</script>';
    const next = upsertSpeakerNotesInHtml(source, ['New']);

    expect(next).not.toContain('Old');
    expect(extractSpeakerNotesFromHtml(next)).toEqual(['New']);
  });

  it('escapes script-closing text inside presenter data', () => {
    const html = buildSpeakerNotesPresenterHtml({
      previewHtml: '<script>console.log("</script>")</script>',
      title: 'Deck',
      projectId: 'project-1',
      fileName: 'deck.html',
      notes: ['Do not close </script>'],
      initialSlideIndex: 0,
      slideCount: 1,
      labels: {
        title: 'Speaker notes',
        edit: 'Edit',
        save: 'Save notes',
        pause: 'Pause',
        resume: 'Resume',
        reset: 'Reset',
        previous: 'Previous',
        next: 'Next',
        empty: 'Empty',
        slide: 'Slide {current} / {total}',
      },
    });

    expect(html).toContain('id="od-presenter-data"');
    expect(html).not.toContain('Do not close </script>');
    expect(html).toContain('\\u003c/script>');
  });

  it('hides deck chrome inside presenter slide frames', () => {
    const html = buildSpeakerNotesPresenterHtml({
      previewHtml: '<!doctype html><html><head></head><body><nav class="deck-counter"></nav></body></html>',
      title: 'Deck',
      projectId: 'project-1',
      fileName: 'deck.html',
      notes: ['Intro'],
      initialSlideIndex: 0,
      slideCount: 1,
      labels: {
        title: 'Speaker notes',
        edit: 'Edit',
        save: 'Save notes',
        pause: 'Pause',
        resume: 'Resume',
        reset: 'Reset',
        previous: 'Previous',
        next: 'Next',
        empty: 'Empty',
        slide: 'Slide {current} / {total}',
      },
    });

    const match = /<script type="application\/json" id="od-presenter-data">([\s\S]*?)<\/script>/.exec(html);
    expect(match).not.toBeNull();
    const data = JSON.parse(match![1] ?? '{}') as { previewHtml?: string };
    expect(data.previewHtml).toContain('data-od-presenter-frame-chrome');
    expect(data.previewHtml).toContain('.deck-counter,');
    expect(data.previewHtml).toContain('display: none !important');
  });

  it('can carry per-slide presenter frame HTML so previous and next previews stay in sync', () => {
    const html = buildSpeakerNotesPresenterHtml({
      previewHtml: '<!doctype html><html><head></head><body>fallback</body></html>',
      previewHtmlBySlide: [
        '<!doctype html><html><head></head><body>slide one</body></html>',
        '<!doctype html><html><head></head><body>slide two</body></html>',
      ],
      title: 'Deck',
      projectId: 'project-1',
      fileName: 'deck.html',
      notes: ['Intro', 'Second'],
      initialSlideIndex: 0,
      slideCount: 2,
      labels: {
        title: 'Speaker notes',
        edit: 'Edit',
        save: 'Save notes',
        pause: 'Pause',
        resume: 'Resume',
        reset: 'Reset',
        previous: 'Previous',
        next: 'Next',
        empty: 'Empty',
        slide: 'Slide {current} / {total}',
      },
    });

    const match = /<script type="application\/json" id="od-presenter-data">([\s\S]*?)<\/script>/.exec(html);
    expect(match).not.toBeNull();
    const data = JSON.parse(match![1] ?? '{}') as { previewHtmlBySlide?: string[] };
    expect(data.previewHtmlBySlide).toHaveLength(2);
    expect(data.previewHtmlBySlide?.[0]).toContain('slide one');
    expect(data.previewHtmlBySlide?.[1]).toContain('slide two');
    expect(data.previewHtmlBySlide?.[0]).toContain('data-od-presenter-frame-chrome');
    expect(html).toContain('data.previewHtmlBySlide[target]');
  });

  it('renders presenter edit as one switch button instead of a label-wrapped input', () => {
    const html = buildSpeakerNotesPresenterHtml({
      previewHtml: '<!doctype html><html><head></head><body>slide</body></html>',
      title: 'Deck',
      projectId: 'project-1',
      fileName: 'deck.html',
      notes: ['Intro'],
      initialSlideIndex: 0,
      slideCount: 1,
      labels: {
        title: 'Speaker notes',
        edit: 'Edit',
        save: 'Save notes',
        pause: 'Pause',
        resume: 'Resume',
        reset: 'Reset',
        previous: 'Previous',
        next: 'Next',
        empty: 'Empty',
        slide: 'Slide {current} / {total}',
      },
    });

    expect(html).toContain('class="edit-toggle" id="edit" role="switch"');
    expect(html).not.toContain('<label class="edit-toggle"');
    expect(html).not.toContain('type="checkbox" id="edit"');
  });
});
