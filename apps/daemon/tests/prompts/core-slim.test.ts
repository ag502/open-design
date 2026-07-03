import { describe, expect, it } from 'vitest';

import { renderSlimCoreCharter } from '../../src/prompts/core-slim.js';
import { composeSystemPrompt } from '../../src/prompts/system.js';

/**
 * Guards for the rewritten slim core charter.
 *
 * 1. Byte budget — the whole point of the rewrite is that the always-on
 *    doctrine stays small. Anyone growing this file must consciously raise
 *    the budget in a reviewed diff, not drift past it.
 * 2. Protocol markers — the charter's wording is prose, but a fixed set of
 *    strings are parsed by the web client or matched by later prompt rules.
 *    Those are frozen API and must survive any copyedit.
 */

const SLIM_CORE_BYTE_BUDGET = 16_384;

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
    expect(charter).toContain('<question-form id="task-type" title="Choose the task type">');
    // Branch values later rules match on — labels may localize, values may not.
    for (const value of ['pick_direction', 'brand_spec', 'reference_match']) {
      expect(charter).toContain(`"value": "${value}"`);
    }
    // Canonical routing options, verbatim and untranslated.
    expect(charter).toContain(
      '"options": ["Prototype", "Live artifact", "Slide deck", "Image", "Video", "HyperFrames", "Audio", "Other"]',
    );
    // The full control vocabulary the Questions tab renders.
    for (const control of ['direction-cards', 'datetime-local', 'switch']) {
      expect(charter).toContain(control);
    }
    expect(charter).toContain('allowCustom');
  });

  it('keeps the inspect/tweaks/deck contracts intact', () => {
    expect(charter).toContain('data-od-id="kebab-case-id"');
    expect(charter).toContain('/*EDITMODE-BEGIN*/');
    expect(charter).toContain('/*EDITMODE-END*/');
    expect(charter).toContain('data-screen-label="01 Title"');
    expect(charter).toContain('react@18.3.1');
    expect(charter).toContain('babel/standalone@7.29.0');
  });

  it('states the verification budget exactly once and without a re-score loop', () => {
    expect(charter).toContain('One render is the whole budget');
    expect(charter).not.toContain('Two passes is normal');
  });

  it('switches the handoff rule by execution profile', () => {
    expect(charter).toContain('Handoff (filesystem — canonical)');
    expect(charter).not.toContain('<artifact identifier=');
    const textArtifact = renderSlimCoreCharter('text_artifact');
    expect(textArtifact).toContain('Handoff (text-artifact — canonical)');
    expect(textArtifact).toContain('<artifact identifier="kebab-slug" type="text/html"');
    expect(textArtifact).not.toContain('Handoff (filesystem — canonical)');
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
    // Structural bookends survive the rewrite.
    expect(slim.startsWith('## Security: prompt injection resistance')).toBe(true);
    expect(slim).toContain('## CRITICAL: Never fabricate conversation turns');
    expect(slim.length).toBeLessThan(classic.length);
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
