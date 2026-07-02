import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { getSessionId, isFirstSession } from '../src/analytics/identity';

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

describe('isFirstSession', () => {
  beforeEach(() => {
    (globalThis as unknown as { window: unknown }).window = {
      localStorage: createStorageStub(),
      sessionStorage: createStorageStub(),
    };
  });
  afterEach(() => {
    delete (globalThis as unknown as { window?: unknown }).window;
  });

  it('is true for the whole first session (idempotent within it)', () => {
    expect(isFirstSession()).toBe(true);
    // Repeat calls in the same tab session keep reporting true — the pin
    // matches the live session id, it is not a one-shot read.
    expect(isFirstSession()).toBe(true);
  });

  it('is false for a later session (new session id, same install)', () => {
    expect(isFirstSession()).toBe(true);
    const firstSessionId = getSessionId();
    // Simulate the tab session ending: sessionStorage resets, localStorage
    // (the install-scoped pin) survives.
    (window as unknown as { sessionStorage: Storage }).sessionStorage =
      createStorageStub() as unknown as Storage;
    expect(getSessionId()).not.toBe(firstSessionId);
    expect(isFirstSession()).toBe(false);
  });

  it('reports false without throwing when storage is denied', () => {
    (globalThis as unknown as { window: unknown }).window = {
      get localStorage(): Storage {
        throw new Error('storage denied');
      },
      get sessionStorage(): Storage {
        throw new Error('storage denied');
      },
    };
    expect(isFirstSession()).toBe(false);
  });
});
