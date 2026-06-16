// Transient, in-memory hand-offs from the Library multi-select bar to other
// surfaces. The router navigates by URL only, so anything that can't ride a URL
// (File objects, pre-built composer attachments) is parked here for exactly one
// consumer to pick up right after navigation, then cleared.
//
// Both slots are single-shot: the producer sets, the consumer takes. Nothing
// here is persisted — a refresh drops the hand-off, which is the desired
// behaviour (a stale seed should never resurface).

import type { ChatAttachment } from '@open-design/contracts';

// --- Path A: seed the "Create design system" flow ---------------------------
// Selected Library assets, fetched into File objects, to pre-fill the design
// system creation flow's source material (assetFiles / assetFileObjects).

export interface DesignSystemAssetSeed {
  files: File[];
}

let dsSeed: DesignSystemAssetSeed | null = null;

export function setDesignSystemAssetSeed(seed: DesignSystemAssetSeed | null): void {
  dsSeed = seed;
}

/** Consume the design-system seed (single-shot). */
export function takeDesignSystemAssetSeed(): DesignSystemAssetSeed | null {
  const seed = dsSeed;
  dsSeed = null;
  return seed;
}

// --- Path B: seed an existing project's composer ----------------------------
// A query + the assets just copied into the project, to pre-fill the chat
// composer of the target design system's project so the user can review + Send.

export interface ComposerSeed {
  projectId: string;
  text: string;
  attachments: ChatAttachment[];
}

let composerSeed: ComposerSeed | null = null;

export function setComposerSeed(seed: ComposerSeed | null): void {
  composerSeed = seed;
}

/** Consume the composer seed iff it targets `projectId` (single-shot). */
export function takeComposerSeedFor(projectId: string): ComposerSeed | null {
  if (composerSeed && composerSeed.projectId === projectId) {
    const seed = composerSeed;
    composerSeed = null;
    return seed;
  }
  return null;
}
