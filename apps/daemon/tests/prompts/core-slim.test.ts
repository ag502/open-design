import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  PLATFORM_CONTRACTS_BLOCK,
  renderSlimCoreCharter,
} from '../../src/prompts/core-slim.js';
import { composeSystemPrompt } from '../../src/prompts/system.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../../..');

/**
 * Guards for the rewritten slim core charter.
 *
 * 1. Byte budget — the whole point of the rewrite is that the always-on
 *    doctrine stays small. Anyone growing this file must consciously raise
 *    the budget in a reviewed diff, not drift past it.
 * 2. Protocol markers — a fixed set of strings are parsed by the web client
 *    or matched by later prompt rules. Frozen API; must survive copyedits.
 * 3. Ownership — content deliberately moved OUT of the charter (task-type
 *    router form, platform contracts) must stay out, and keep living where
 *    it moved to.
 */

// 10KB: the 8KB doctrine budget, plus the ~1KB security section the charter
// absorbed from the standalone injection-resistance block (composed total
// unchanged), plus ~0.7KB from the structure-review fixes — chiefly restoring
// the full `output` question to the form example so it reads in forward
// order (which also shores up few-shot density for weaker fleet models).
const SLIM_CORE_BYTE_BUDGET = 10_240;

describe('renderSlimCoreCharter — byte budget', () => {
  it('stays under the byte budget in both execution profiles', () => {
    for (const profile of ['filesystem', 'text_artifact'] as const) {
      const bytes = Buffer.byteLength(renderSlimCoreCharter(profile), 'utf8');
      expect(bytes, `${profile} charter must stay under ${SLIM_CORE_BYTE_BUDGET}B`).toBeLessThanOrEqual(
        SLIM_CORE_BYTE_BUDGET,
      );
    }
  });
});

describe('renderSlimCoreCharter — frozen protocol markers', () => {
  const charter = renderSlimCoreCharter('filesystem');

  it('keeps the question-form protocol intact', () => {
    expect(charter).toContain('<question-form id="discovery" title="Quick brief — 30 seconds">');
    // Branch values later rules match on — labels may localize, values may not.
    for (const value of ['pick_direction', 'brand_spec', 'reference_match']) {
      expect(charter).toContain(`"value": "${value}"`);
    }
    // The full control vocabulary the Questions tab renders.
    for (const control of ['direction-cards', 'datetime-local', 'switch']) {
      expect(charter).toContain(control);
    }
    expect(charter).toContain('allowCustom');
  });

  it('keeps the inspect/tweaks contracts intact', () => {
    expect(charter).toContain('data-od-id="kebab-case-id"');
    expect(charter).toContain('/*EDITMODE-BEGIN*/');
    expect(charter).toContain('/*EDITMODE-END*/');
    expect(charter).toContain('react@18.3.1');
    expect(charter).toContain('babel/standalone@7.29.0');
  });

  it('states the verification budget once and without a re-score loop', () => {
    expect(charter).toContain('one render is the whole budget');
    expect(charter).not.toContain('Two passes is normal');
  });

  it('switches the handoff rule by execution profile', () => {
    expect(charter).not.toContain('<artifact identifier=');
    const textArtifact = renderSlimCoreCharter('text_artifact');
    expect(textArtifact).toContain('<artifact identifier="kebab-slug" type="text/html"');
    expect(textArtifact).not.toContain('Project files are the source of truth');
  });
});

describe('slim core — moved-out content stays out (ownership)', () => {
  it('carries no task-type router form; od-default SKILL.md owns it', () => {
    const charter = renderSlimCoreCharter('filesystem');
    expect(charter).not.toContain('<question-form id="task-type"');
    // The single source of truth ships with the router skill and reaches the
    // prompt via the `## Active skill` section when od-default is active.
    const routerSkill = readFileSync(
      path.join(repoRoot, 'plugins/_official/scenarios/od-default/SKILL.md'),
      'utf8',
    );
    expect(routerSkill).toContain('<question-form id="task-type"');
    expect(routerSkill).toContain('"HyperFrames"');
    // The charter still defers to skill-owned turn-1 forms generically.
    expect(charter).toContain('If the active skill defines its own turn-1 form');
  });

  it('carries no per-platform delivery contracts; the conditional block owns them', () => {
    const charter = renderSlimCoreCharter('filesystem');
    expect(charter).not.toContain('mobile-ios.html');
    expect(charter).not.toContain('1024/1366/1440/1920');
    expect(PLATFORM_CONTRACTS_BLOCK).toContain('mobile-ios.html');
    expect(PLATFORM_CONTRACTS_BLOCK).toContain('360/390/430/600/768/820/1024/1366/1440/1920px');
  });

  it('carries no deck framework rules; the deck-gated directive owns them', () => {
    const charter = renderSlimCoreCharter('filesystem');
    expect(charter).not.toContain('scale-to-fit');
    expect(charter).not.toContain('data-screen-label');
  });
});

describe('composeSystemPrompt — promptCoreVariant switch', () => {
  const base = {
    metadata: { kind: 'prototype' as const },
    executionProfile: 'filesystem' as const,
  };

  it('defaults to the classic layered stack', () => {
    const out = composeSystemPrompt(base);
    expect(out).toContain('# OD core directives (read first');
    expect(out).toContain('# Identity and workflow charter (background)');
    expect(out).not.toContain('# Open Design charter');
  });

  it('slim replaces discovery + charter and drops the absorbed tail overrides', () => {
    const classic = composeSystemPrompt({ ...base, designSystemBody: '# Brand' });
    const slim = composeSystemPrompt({
      ...base,
      designSystemBody: '# Brand',
      promptCoreVariant: 'slim',
    });
    expect(slim).toContain('# Open Design charter');
    expect(slim).not.toContain('# OD core directives (read first');
    expect(slim).not.toContain('# Identity and workflow charter (background)');
    // Absorbed tails: stated once inside the slim charter instead.
    expect(slim).not.toContain('## Filesystem handoff\n');
    expect(slim).not.toContain('## Active design system visual direction');
    expect(slim).not.toContain('## Clarifying questions mid-conversation');
    // Still present in classic for the same inputs.
    expect(classic).toContain('## Filesystem handoff');
    expect(classic).toContain('## Active design system visual direction');
    expect(classic).toContain('## Clarifying questions mid-conversation');
    // Structural bookends: slim opens with the static charter (cache-stable
    // prefix); the security section lives inside it; the guard still closes.
    expect(slim.startsWith('# Open Design charter')).toBe(true);
    expect(slim).toContain('## Security: prompt injection resistance');
    expect(slim).toContain('## CRITICAL: Never fabricate conversation turns');
    expect(slim.length).toBeLessThan(classic.length);
  });

  it('injects platform contracts only for platform-explicit projects', () => {
    const noSignal = composeSystemPrompt({ ...base, promptCoreVariant: 'slim' });
    expect(noSignal).not.toContain('## Platform delivery contracts');
    const responsive = composeSystemPrompt({
      metadata: { kind: 'prototype', platform: 'responsive' },
      executionProfile: 'filesystem',
      promptCoreVariant: 'slim',
    });
    expect(responsive).toContain('## Platform delivery contracts');
    // Classic keeps its own in-discovery platform contracts; no double block.
    const classicResponsive = composeSystemPrompt({
      metadata: { kind: 'prototype', platform: 'responsive' },
      executionProfile: 'filesystem',
    });
    expect(classicResponsive).not.toContain('## Platform delivery contracts');
  });

  it('ask mode keeps the clarifying-questions tail under slim (no core charter to cover it)', () => {
    const out = composeSystemPrompt({
      ...base,
      sessionMode: 'chat',
      promptCoreVariant: 'slim',
    });
    expect(out).not.toContain('# Open Design charter');
    expect(out).toContain('## Clarifying questions mid-conversation');
  });

  it('slim keeps the dynamic sections (DS, skill, deck framework, media hint) composing as before', () => {
    const out = composeSystemPrompt({
      metadata: { kind: 'deck' as const },
      executionProfile: 'filesystem',
      designSystemBody: '# Brand',
      designSystemTitle: 'Brand',
      skillBody: 'Do the workflow.',
      skillName: 'test-skill',
      promptCoreVariant: 'slim',
    });
    expect(out).toContain('## Active design system — Brand');
    expect(out).toContain('## Active skill — test-skill');
    expect(out).toContain('# Slide deck — fixed framework');
    expect(out).toContain('## Media generation (if asked)');
  });
});

describe('composeSystemPrompt — slim payload gates (metadata facts / memory / locale / media hint)', () => {
  const base = {
    metadata: { kind: 'other' as const },
    executionProfile: 'filesystem' as const,
    promptCoreVariant: 'slim' as const,
  };

  it('renders the metadata block as a fact sheet under slim', () => {
    const slim = composeSystemPrompt(base);
    expect(slim).toContain('## Project metadata');
    expect(slim).toContain('- **screen files**:');
    expect(slim).toContain('- **product depth**:');
    // Classic doctrine bullets stay out of the facts variant…
    for (const rule of [
      'screen-file-first rule',
      'product-realism rule',
      'visual-system rule',
      'CJX-ready UX rule',
      'interaction-fidelity rule',
      'artifact-output rule',
      'responsive web contract',
    ]) {
      expect(slim, `${rule} must not render under slim`).not.toContain(rule);
    }
    // …and stay present in classic for the same inputs.
    const classic = composeSystemPrompt({ ...base, promptCoreVariant: undefined });
    expect(classic).toContain('screen-file-first rule');
    expect(classic).toContain('product-realism rule');
  });

  it('keeps media-kind metadata facts intact under slim', () => {
    const slim = composeSystemPrompt({
      metadata: { kind: 'image', imageModel: 'gpt-image-2', imageAspect: '1:1' },
      executionProfile: 'filesystem',
      promptCoreVariant: 'slim',
    });
    expect(slim).toContain('- **imageModel**: gpt-image-2');
    expect(slim).toContain('- **aspectRatio**: 1:1');
  });

  it('compresses the memory scaffolding under slim while keeping headings and card shapes', () => {
    const memoryInput = {
      ...base,
      memoryBody: '### Profile\n\nDense layouts.\n\n### Verified rules\n\n- No pure black.',
    };
    const slim = composeSystemPrompt(memoryInput);
    const classic = composeSystemPrompt({ ...memoryInput, promptCoreVariant: undefined });
    for (const marker of [
      '## Personal memory (auto-extracted from past chats)',
      '## Intent gateway — turn short asks into a brief',
      '## Self-verify against your verified rules',
      '## Propose new verified rules from corrections',
      '<od-card type="task-brief">',
      '<od-card type="memory-applied">',
      '<od-card type="verify-scorecard">',
      '<od-card type="rule-proposal">',
      '"status": "pass|partial|fail"',
    ]) {
      expect(slim, `slim memory must keep ${marker}`).toContain(marker);
      expect(classic, `classic memory must keep ${marker}`).toContain(marker);
    }
    const sectionSpan = (out: string) =>
      out.length - out.indexOf('## Personal memory');
    expect(sectionSpan(slim)).toBeLessThan(sectionSpan(classic));
  });

  it('drops the zh-CN quick-brief sample copy under slim but keeps the locale rule', () => {
    const slim = composeSystemPrompt({ ...base, locale: 'zh-CN' });
    expect(slim).toContain('# UI locale override');
    expect(slim).not.toContain('快速简报 — 30 秒');
    const classic = composeSystemPrompt({ ...base, locale: 'zh-CN', promptCoreVariant: undefined });
    expect(classic).toContain('快速简报 — 30 秒');
  });

  it('gates the media dispatch hint on the media-intent signal', () => {
    expect(composeSystemPrompt(base)).toContain('## Media generation (if asked)');
    expect(
      composeSystemPrompt({ ...base, mediaHintSignal: false }),
    ).not.toContain('## Media generation (if asked)');
    // Media surfaces keep the full contract regardless of the signal.
    const media = composeSystemPrompt({
      metadata: { kind: 'image' },
      executionProfile: 'filesystem',
      mediaHintSignal: false,
    });
    expect(media).toContain('## Media generation contract');
  });
});

describe('detectMediaIntentSignal', () => {
  it('fires on media vocabulary across languages and stays quiet otherwise', async () => {
    const { detectMediaIntentSignal } = await import('../../src/prompts/system.js');
    expect(detectMediaIntentSignal('generate a hero image for the landing')).toBe(true);
    expect(detectMediaIntentSignal('帮我配一段背景音乐')).toBe(true);
    expect(detectMediaIntentSignal('给产品页生成图')).toBe(true);
    expect(detectMediaIntentSignal('build a pricing page with three tiers')).toBe(false);
    expect(detectMediaIntentSignal('做一个电商后台')).toBe(false);
    expect(detectMediaIntentSignal('tweak the nav', '## user\n加个宣传视频')).toBe(true);
  });
});

describe('slim core — direction library becomes a pull layer', () => {
  it('slim composes the compact index; classic keeps the full inline library', async () => {
    const input = { metadata: { kind: 'prototype' as const }, executionProfile: 'filesystem' as const };
    const slim = composeSystemPrompt({ ...input, promptCoreVariant: 'slim' });
    expect(slim).toContain('## Direction library — index (pull the chosen one on demand)');
    expect(slim).toContain('tools directions --id <id>');
    expect(slim).toContain('- `editorial-monocle` — Editorial — Monocle / FT magazine');
    // No inline palette data under slim — that's the pull payload.
    expect(slim).not.toContain('**Palette (drop into `:root`):**');
    const classic = composeSystemPrompt(input);
    expect(classic).toContain('## Direction library — bind into `:root`');
    expect(classic).toContain('**Palette (drop into `:root`):**');
    expect(classic).not.toContain('## Direction library — index');
    // An active design system suppresses both variants.
    const withDs = composeSystemPrompt({
      ...input,
      promptCoreVariant: 'slim',
      designSystemBody: '# Brand',
    });
    expect(withDs).not.toContain('## Direction library');
  });

  it('formatDirectionSpecText resolves by id or label and returns the bindable spec', async () => {
    const { formatDirectionSpecText, DESIGN_DIRECTIONS } = await import(
      '../../src/prompts/directions.js'
    );
    const byId = formatDirectionSpecText('editorial-monocle');
    expect(byId).toContain('--font-display:');
    expect(byId).toContain('**Posture:**');
    const first = DESIGN_DIRECTIONS[0]!;
    expect(formatDirectionSpecText(first.label)).toContain(`(id: ${first.id})`);
    expect(formatDirectionSpecText('no-such-direction')).toBeNull();
  });

  it('keeps the index an order of magnitude smaller than the full library', async () => {
    const { renderDirectionIndexBlock, renderDirectionSpecBlock } = await import(
      '../../src/prompts/directions.js'
    );
    expect(renderDirectionIndexBlock().length).toBeLessThan(2000);
    expect(renderDirectionSpecBlock().length).toBeGreaterThan(5000);
  });
});

describe('composeSystemPrompt — slim layered ordering (cache-stable prefix)', () => {
  it('orders static charter → conversation → project → turn-variable → guard', () => {
    const out = composeSystemPrompt({
      designSystemBody: '# Brand',
      designSystemTitle: 'Brand',
      memoryBody: '### Profile\n\nx\n\n### Verified rules\n\n- y',
      metadata: { kind: 'other' },
      sessionMode: 'plan',
      locale: 'zh-CN',
      executionProfile: 'filesystem',
      promptCoreVariant: 'slim',
      freeformDeckSignal: true,
      mediaHintSignal: true,
      connectedExternalMcp: [{ id: 'vela' }],
    });
    // Line-anchored: the charter QUOTES some headings in prose (e.g.
    // \`## Project metadata\` in the turn-1 tailoring rule), so a bare
    // indexOf would match inside the charter instead of the real section.
    const at = (marker: string) => {
      const i = out.indexOf(`\n${marker}`);
      expect(i, `missing: ${marker}`).toBeGreaterThan(-1);
      return i;
    };
    // Static core opens the document.
    expect(out.startsWith('# Open Design charter')).toBe(true);
    const security = at('## Security: prompt injection resistance');
    const conduct = at('## Conduct');
    // Conversation-stable overrides come after the full static charter.
    const mode = at('# Plan mode — editable document first');
    const localeAt = at('# UI locale override');
    // Project-stable context after that.
    const memory = at('## Personal memory');
    const ds = at('## Active design system — Brand');
    const metadataAt = at('## Project metadata');
    const mcp = at('## External MCP servers — already authenticated');
    // Turn-variable blocks last, before the recency-pinned guard.
    const maybeDeck = at('## If this brief is a slide deck');
    const mediaHint = at('## Media generation (if asked)');
    const guard = at('## CRITICAL: Never fabricate conversation turns');
    expect(security).toBeLessThan(conduct);
    expect(conduct).toBeLessThan(mode);
    expect(mode).toBeLessThan(localeAt);
    expect(localeAt).toBeLessThan(memory);
    expect(memory).toBeLessThan(ds);
    expect(ds).toBeLessThan(metadataAt);
    expect(metadataAt).toBeLessThan(mcp);
    expect(mcp).toBeLessThan(maybeDeck);
    expect(maybeDeck).toBeLessThan(mediaHint);
    expect(mediaHint).toBeLessThan(guard);
  });

  it('classic head ordering is untouched (injection resistance still first)', () => {
    const classic = composeSystemPrompt({
      metadata: { kind: 'prototype' },
      sessionMode: 'plan',
      executionProfile: 'filesystem',
    });
    expect(classic.startsWith('## Security: prompt injection resistance')).toBe(true);
    expect(classic.indexOf('# Plan mode')).toBeLessThan(classic.indexOf('# OD core directives'));
  });
});
