import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  consumePendingOnboardingEntry,
  stashPendingOnboardingEntry,
} from '../src/onboarding/onboarding-entry';

function createStorageStub() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => { store.set(key, value); },
    removeItem: (key: string) => { store.delete(key); },
    clear: () => { store.clear(); },
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    get length() { return store.size; },
  };
}

describe('pending onboarding entry (session hand-off)', () => {
  beforeEach(() => {
    (globalThis as unknown as { window: unknown }).window = {
      sessionStorage: createStorageStub(),
    };
  });
  afterEach(() => {
    delete (globalThis as unknown as { window?: unknown }).window;
  });

  it('round-trips a stashed entry', () => {
    stashPendingOnboardingEntry({
      source: 'home_recommendation',
      productType: 'product_ui',
      recommendationId: 'product_ui_prototype',
    });
    expect(consumePendingOnboardingEntry()).toEqual({
      source: 'home_recommendation',
      productType: 'product_ui',
      recommendationId: 'product_ui_prototype',
    });
  });

  it('carries the survey answers when present', () => {
    stashPendingOnboardingEntry({
      source: 'home_recommendation',
      productType: 'marketing',
      recommendationId: 'marketing_landing',
      role: 'growth',
      useCases: ['landing', 'ads'],
    });
    expect(consumePendingOnboardingEntry()).toEqual({
      source: 'home_recommendation',
      productType: 'marketing',
      recommendationId: 'marketing_landing',
      role: 'growth',
      useCases: ['landing', 'ads'],
    });
  });

  it('is read-once — a second consume returns null', () => {
    stashPendingOnboardingEntry({
      source: 'home_recommendation',
      productType: 'marketing',
      recommendationId: 'marketing_landing',
    });
    expect(consumePendingOnboardingEntry()).not.toBeNull();
    expect(consumePendingOnboardingEntry()).toBeNull();
  });

  it('returns null when nothing was stashed', () => {
    expect(consumePendingOnboardingEntry()).toBeNull();
  });

  it('ignores a malformed stored value', () => {
    window.sessionStorage.setItem('open-design:pending-onboarding-entry', '{"source":"nope"}');
    expect(consumePendingOnboardingEntry()).toBeNull();
  });
});
