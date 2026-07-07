import {
  createResourceHubClient,
  readResourceHubConfig,
  readResourceHubPrincipal,
  ResourceHubError,
  type ResourceHubClient,
  type ResourceHubPrincipal,
} from '../integrations/resource-hub.js';
import { materializeRef, packTree, pushTree } from '../resource-drive.js';
import type { ResourcePublishAdapter } from './publish-scheduler.js';

// Binds the sync trigger to the resource hub. The scheduler decides *when* to
// publish/pull; this wraps the neutral resource-drive SDK (packTree + pushTree +
// materializeRef) as the ResourcePublishAdapter — so a coalesced author edit
// publishes the project's content-addressed tree and moves the `published` ref,
// and a member pull materializes that ref's tree into their local copy.

export interface ResourceHubPublishAdapterOptions {
  client: ResourceHubClient;
  principal: ResourceHubPrincipal;
  /** The project's source directory to publish (managed-project root). */
  resolveProjectDir: (projectId: string) => string;
  /** Where a member materializes pulled content. Defaults to the project dir. */
  resolvePullDir?: (projectId: string) => string;
  /** projectId → hub resourceId. Defaults to `project:<id>`. */
  resourceIdFor?: (projectId: string) => string;
}

const PUBLISHED_REF = 'published';
const PROJECT_KIND = 'project';

export function createResourceHubPublishAdapter(
  options: ResourceHubPublishAdapterOptions,
): ResourcePublishAdapter {
  const { client, principal, resolveProjectDir } = options;
  const resolvePullDir = options.resolvePullDir ?? resolveProjectDir;
  // Colon-free by default: the hub routes resourceId as a path param, so `:`
  // must not appear in it.
  const resourceIdFor = options.resourceIdFor ?? ((projectId: string) => `project-${projectId}`);

  // The resource must exist before a version is published. Get-or-create keeps
  // publish idempotent across the first and later shares of a project.
  async function ensureResourceId(projectId: string): Promise<string> {
    const resourceId = resourceIdFor(projectId);
    try {
      const existing = await client.getResource(principal, resourceId);
      return existing.id;
    } catch (error) {
      if (!(error instanceof ResourceHubError) || error.status !== 404) throw error;
      const created = await client.createResource(principal, { kind: PROJECT_KIND, resourceId });
      return created.id;
    }
  }

  return {
    async publish({ projectId }) {
      const packed = await packTree(resolveProjectDir(projectId));
      const resourceId = await ensureResourceId(projectId);
      // pushTree uploads only missing blobs, publishes a version, and moves the
      // `published` ref atomically (content-first, pointer-last).
      const version = await pushTree(client, principal, resourceId, packed, {
        ref: PUBLISHED_REF,
      });
      return { version: version.version };
    },

    async syncLatest({ projectId }) {
      const resourceId = resourceIdFor(projectId);
      let ref;
      try {
        ref = await client.getRef(principal, resourceId, PUBLISHED_REF);
      } catch {
        return null; // nothing published yet
      }
      const versions = await client.listVersions(principal, resourceId);
      const version = versions.find((candidate) => candidate.id === ref.versionId);
      return version ? { version: version.version } : null;
    },

    // Member pull: fetch + safely land the published tree into the local copy.
    async pull({ projectId }) {
      await materializeRef(
        client,
        principal,
        resourceIdFor(projectId),
        PUBLISHED_REF,
        resolvePullDir(projectId),
      );
    },
  };
}

/**
 * Build the real hub adapter from env (OD_RESOURCE_HUB_URL + workspace member
 * env), or null when the hub / principal is not configured (so the runtime
 * falls back to the local stub). This is the one-line switch to the real hub.
 */
export function createResourceHubPublishAdapterFromEnv(
  resolveProjectDir: (projectId: string) => string,
  env: NodeJS.ProcessEnv = process.env,
): ResourcePublishAdapter | null {
  const principal = readResourceHubPrincipal(env);
  if (!principal) return null;
  if (!env.OD_RESOURCE_HUB_URL?.trim()) return null;
  const client = createResourceHubClient({ config: readResourceHubConfig(env) });
  return createResourceHubPublishAdapter({ client, principal, resolveProjectDir });
}
