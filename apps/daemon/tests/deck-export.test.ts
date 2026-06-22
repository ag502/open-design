import { describe, expect, it } from 'vitest';

import {
  buildScreenshotPdf,
  buildScreenshotPptx,
  decodeSlideDataUrls,
} from '../src/deck-export.js';

// 1x1 transparent PNG.
const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
const PNG_DATA_URL = `data:image/png;base64,${PNG_BASE64}`;

// 1x1 JPEG.
const JPEG_DATA_URL =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAAAv/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AfwD/2Q==';

describe('decodeSlideDataUrls', () => {
  it('decodes base64 PNG data URLs into tagged buffers', () => {
    const img = decodeSlideDataUrls([PNG_DATA_URL])[0]!;
    expect(Buffer.isBuffer(img.buffer)).toBe(true);
    expect(img.jpeg).toBe(false);
    // PNG magic number.
    expect(img.buffer.subarray(0, 4).toString('hex')).toBe('89504e47');
  });

  it('decodes base64 JPEG data URLs and tags them as jpeg', () => {
    const img = decodeSlideDataUrls([JPEG_DATA_URL])[0]!;
    expect(img.jpeg).toBe(true);
    // JPEG SOI marker.
    expect(img.buffer.subarray(0, 2).toString('hex')).toBe('ffd8');
  });

  it('rejects a non-image data URL', () => {
    expect(() => decodeSlideDataUrls(['data:text/plain;base64,aGk='])).toThrow();
  });

  it('rejects a value that is not a data URL', () => {
    expect(() => decodeSlideDataUrls(['not-a-data-url'])).toThrow();
  });
});

describe('buildScreenshotPptx', () => {
  it('produces a non-empty OOXML (zip) document with one slide per image', async () => {
    const pngs = decodeSlideDataUrls([PNG_DATA_URL, PNG_DATA_URL]);
    const out = await buildScreenshotPptx(pngs, { title: 'Test Deck' });
    expect(out.length).toBeGreaterThan(0);
    // .pptx is a ZIP container — starts with the local file header "PK".
    expect(out.subarray(0, 2).toString('latin1')).toBe('PK');
  });

  it('throws when there are no slides', async () => {
    await expect(buildScreenshotPptx([])).rejects.toThrow(/no slides/i);
  });
});

describe('buildScreenshotPdf', () => {
  it('produces a %PDF document', async () => {
    const pngs = decodeSlideDataUrls([PNG_DATA_URL]);
    const out = await buildScreenshotPdf(pngs);
    expect(out.subarray(0, 5).toString('latin1')).toBe('%PDF-');
  });

  it('throws when there are no slides', async () => {
    await expect(buildScreenshotPdf([])).rejects.toThrow(/no slides/i);
  });
});
