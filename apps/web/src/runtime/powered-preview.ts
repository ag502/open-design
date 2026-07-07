/**
 * "Powered preview" — render an HTML artifact in a cross-origin-isolated
 * iframe so it can use capabilities the default opaque-origin preview sandbox
 * blocks: same-origin Web Workers (incl. external-file workers), real Web
 * Storage, WASM, and — via `Document-Isolation-Policy` on the daemon response
 * — `SharedArrayBuffer`. This is what real WebGL sites (Gaussian-splat
 * viewers, ffmpeg.wasm, threaded physics/renderers) need. See issue #724.
 *
 * Isolation model: the daemon reports its own directly-reachable http origin
 * (`/api/preview/isolation`). We load the powered iframe from that origin —
 * host-swapped (127.0.0.1 <-> localhost) whenever it would collide with the
 * app origin — so the iframe is ALWAYS cross-origin to the app shell. That is
 * what makes granting `allow-same-origin` safe: the iframe becomes same-origin
 * with the daemon (its own Workers/storage work) but can never touch the app's
 * DOM, storage, or authenticated app-origin context.
 *
 * The daemon `/powered/*` route (apps/daemon/src/routes/project/index.ts)
 * stamps the isolation headers; this module is the browser half that decides
 * WHEN to use it and builds the URL.
 */

import { buildProjectPoweredFileUrl, type ProjectPreviewIsolationResponse } from '@open-design/contracts';

let isolationProbe: Promise<ProjectPreviewIsolationResponse | null> | null = null;

/** Fetch (once, cached) the daemon's powered-preview isolation info. */
export function fetchPreviewIsolation(): Promise<ProjectPreviewIsolationResponse | null> {
  if (isolationProbe) return isolationProbe;
  isolationProbe = (async () => {
    try {
      const resp = await fetch('/api/preview/isolation', { cache: 'no-store' });
      if (!resp.ok) return null;
      const data = (await resp.json()) as ProjectPreviewIsolationResponse;
      if (!data || typeof data.baseOrigin !== 'string' || !data.baseOrigin) return null;
      return data;
    } catch {
      return null;
    }
  })();
  return isolationProbe;
}

/** Test-only: drop the cached probe so a fresh fetch runs. */
export function __resetPreviewIsolationCache(): void {
  isolationProbe = null;
}

/**
 * Swap 127.0.0.1 <-> localhost so the returned origin resolves to the same
 * loopback server but is a DISTINCT browser origin. Any non-loopback host is
 * returned unchanged (no safe swap exists for a LAN IP or custom protocol).
 */
export function swapLoopbackHost(origin: string): string {
  try {
    const u = new URL(origin);
    if (u.hostname === '127.0.0.1') u.hostname = 'localhost';
    else if (u.hostname === 'localhost') u.hostname = '127.0.0.1';
    return u.origin;
  } catch {
    return origin;
  }
}

/**
 * Resolve the origin to load the powered iframe from, given the daemon's
 * reported base. Guarantees the result is cross-origin to the current app
 * origin (when a loopback host-swap can achieve that). Returns null when the
 * base cannot be made cross-origin (e.g. a LAN IP that equals the app origin),
 * so the caller can fall back to the opaque sandbox.
 */
export function resolvePoweredBaseOrigin(baseOrigin: string): string | null {
  const appOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  let normalized: string;
  try {
    normalized = new URL(baseOrigin).origin;
  } catch {
    return null;
  }
  if (normalized !== appOrigin) return normalized;
  const swapped = swapLoopbackHost(normalized);
  return swapped !== appOrigin ? swapped : null;
}

/**
 * Build the absolute powered-preview URL for a project file, or null if
 * powered mode is unavailable (isolation unsupported, or no cross-origin base
 * could be resolved). Async because it consults the (cached) daemon probe.
 */
export async function resolvePoweredPreviewUrl(
  projectId: string,
  filePath: string,
): Promise<string | null> {
  const info = await fetchPreviewIsolation();
  if (!info || !info.supported || !info.baseOrigin) return null;
  const base = resolvePoweredBaseOrigin(info.baseOrigin);
  if (!base) return null;
  return buildProjectPoweredFileUrl(base, projectId, filePath);
}
