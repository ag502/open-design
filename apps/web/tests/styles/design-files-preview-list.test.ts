import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const designFilesCss = readFileSync(
  new URL('../../src/styles/workspace/design-files.css', import.meta.url),
  'utf8',
);
const routinesCss = readFileSync(
  new URL('../../src/styles/viewer/routines.css', import.meta.url),
  'utf8',
);

function cssDeclarations(css: string, selector: string): string {
  const blocks: string[] = [];
  const rulePattern = /([^{}]+)\{([^}]*)\}/g;
  const cssWithoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  let match: RegExpExecArray | null;
  while ((match = rulePattern.exec(cssWithoutComments)) !== null) {
    const selectors = (match[1] ?? '').split(',').map((item) => item.trim());
    if (selectors.includes(selector)) blocks.push(match[2] ?? '');
  }
  if (blocks.length === 0) throw new Error(`Missing CSS block for ${selector}`);
  return blocks.join('\n');
}

function ruleValue(block: string, property: string): string {
  const matches = [...block.matchAll(new RegExp(`(?:^|[;\\n])\\s*${property}:\\s*([^;]+);`, 'g'))];
  const match = matches.at(-1);
  if (!match) throw new Error(`Missing CSS property ${property}`);
  return match[1]!.trim();
}

describe('Design Files preview list styles', () => {
  it('keeps preview-mode rows readable instead of collapsing the name cell', () => {
    const previewNameCell = cssDeclarations(
      routinesCss,
      '.app .df-panel:not(.no-preview) .df-cell-name',
    );
    const rowSub = cssDeclarations(designFilesCss, '.df-row-sub');
    const rowSubPart = cssDeclarations(designFilesCss, '.df-row-sub > span');

    expect(ruleValue(previewNameCell, 'max-width')).toBe('none');
    expect(ruleValue(rowSub, 'flex-wrap')).toBe('nowrap');
    expect(ruleValue(rowSub, 'overflow')).toBe('hidden');
    expect(ruleValue(rowSubPart, 'text-overflow')).toBe('ellipsis');
  });

  it('wraps narrow file-list toolbar actions instead of overlapping breadcrumbs', () => {
    const topbar = cssDeclarations(designFilesCss, '.df-topbar');
    const topbarRight = cssDeclarations(designFilesCss, '.df-topbar-right');
    const actions = cssDeclarations(designFilesCss, '.df-actions');
    const breadcrumbs = cssDeclarations(designFilesCss, '.df-topbar-left .df-breadcrumbs');
    const breadcrumbCurrent = cssDeclarations(designFilesCss, '.df-breadcrumb-current');

    expect(ruleValue(topbar, 'flex-wrap')).toBe('wrap');
    expect(ruleValue(topbar, 'row-gap')).toBe('6px');
    expect(ruleValue(topbarRight, 'min-width')).toBe('0');
    expect(ruleValue(actions, 'flex-wrap')).toBe('wrap');
    expect(ruleValue(actions, 'min-width')).toBe('0');
    expect(ruleValue(breadcrumbs, 'overflow')).toBe('hidden');
    expect(ruleValue(breadcrumbCurrent, 'text-overflow')).toBe('ellipsis');
  });
});
