import path from 'node:path';
import url from 'node:url';
import { readFile, stat } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(__dirname, '../../../plugins/_official/examples/diagram');

describe('bundled Diagram plugin', () => {
  it('ships a valid manifest, skill, templates, and referenced context assets', async () => {
    const manifestPath = path.join(pluginRoot, 'open-design.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

    expect(manifest.name).toBe('example-diagram');
    expect(manifest.od.kind).toBe('scenario');
    expect(manifest.od.taskKind).toBe('new-generation');
    expect(manifest.od.mode).toBe('prototype');
    expect(manifest.od.surface).toBe('web');
    expect(manifest.od.capabilities).toEqual(expect.arrayContaining(['prompt:inject', 'fs:write']));
    expect(manifest.od.pipeline.stages.map((stage: { id: string }) => stage.id)).toEqual([
      'discovery',
      'generate',
    ]);

    await expect(stat(path.join(pluginRoot, 'SKILL.md'))).resolves.toMatchObject({});
    await expect(stat(path.join(pluginRoot, 'example.html'))).resolves.toMatchObject({});
    for (const asset of manifest.od.context.assets as string[]) {
      await expect(stat(path.join(pluginRoot, asset))).resolves.toMatchObject({});
    }
  });

  it('keeps diagram generation constrained to a 16:9 preview artboard', async () => {
    const skill = await readFile(path.join(pluginRoot, 'SKILL.md'), 'utf8');
    expect(skill).toContain('16:9 artboard');
    expect(skill).toContain('100% preview');

    for (const template of ['template.html', 'template-dark.html', 'template-full.html']) {
      const body = await readFile(path.join(pluginRoot, 'assets', template), 'utf8');
      expect(body).toContain('aspect-ratio: 16 / 9');
      expect(body).toContain('viewBox="0 0 1600 900"');
      expect(body).not.toContain('min-width: 900px');
    }
  });
});
