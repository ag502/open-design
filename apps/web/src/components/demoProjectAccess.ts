type DemoProjectAccessBadge = 'private' | 'shared';
type DemoProjectAccessSpace = 'recent' | 'drafts' | 'team';

export interface DemoProjectAccessContext {
  projectId: string;
  projectName?: string;
  ownerName: string;
  ownerInitial: string;
  ownerImg?: string;
  badge: DemoProjectAccessBadge;
  space: DemoProjectAccessSpace;
  viewerOnly: boolean;
  updatedAt: number;
}

const STORAGE_KEY = 'od.demoProjectAccess';
const MAX_AGE_MS = 30 * 60 * 1000;

export function rememberDemoProjectAccessContext(
  context: Omit<DemoProjectAccessContext, 'updatedAt'>,
): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...context, updatedAt: Date.now() }),
    );
  } catch {
    /* Demo hint only. */
  }
}

export function readDemoProjectAccessContext(
  projectId: string,
  projectName?: string,
): DemoProjectAccessContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DemoProjectAccessContext>;
    if (typeof parsed.updatedAt !== 'number' || Date.now() - parsed.updatedAt > MAX_AGE_MS) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    const parsedProjectName = typeof parsed.projectName === 'string' ? parsed.projectName.trim() : '';
    const requestedProjectName = typeof projectName === 'string' ? projectName.trim() : '';
    const matchesProject =
      parsed.projectId === projectId ||
      (requestedProjectName.length > 0 && parsedProjectName === requestedProjectName);
    if (!matchesProject) return null;
    if (typeof parsed.ownerName !== 'string' || typeof parsed.ownerInitial !== 'string') return null;
    if (parsed.badge !== 'private' && parsed.badge !== 'shared') return null;
    if (parsed.space !== 'recent' && parsed.space !== 'drafts' && parsed.space !== 'team') return null;
    return {
      projectId,
      ...(parsedProjectName ? { projectName: parsedProjectName } : {}),
      ownerName: parsed.ownerName,
      ownerInitial: parsed.ownerInitial,
      ...(typeof parsed.ownerImg === 'string' ? { ownerImg: parsed.ownerImg } : {}),
      badge: parsed.badge,
      space: parsed.space,
      viewerOnly: parsed.viewerOnly === true,
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return null;
  }
}
