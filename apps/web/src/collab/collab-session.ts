import type { CollabPresenceMember } from '@open-design/contracts';

// The C-lane seam onto the B (workspace) + D (visibility) lanes. B owns the
// CurrentWorkspaceContext (identity token → workspaceMemberId + role + lifecycle);
// D owns whether a workspace/project is team-shared. Collab (presence + sync)
// should only run for an active member of a live team workspace.
//
// This is a faithful SUBSET of B's `CurrentWorkspaceContext`
// (packages/shared/src/workspace-context.ts in the vela repo) — the exact
// fields C needs — so wiring B's real context in is a direct field pass-through
// (replacing the demo's stubbed identity). The decision logic here is real; only
// the source of the context remains to be wired when B ships.

export type WorkspaceType = 'personal' | 'team';
export type WorkspaceRole = 'owner' | 'admin' | 'member';
export type WorkspaceMemberStatus = 'active' | 'removed';
export type WorkspaceLifecycleState =
  | 'active'
  | 'billing_past_due'
  | 'locked'
  | 'deleting'
  | 'deleted';

export interface WorkspaceCollabContext {
  workspaceType: WorkspaceType;
  workspaceMemberId: string;
  role: WorkspaceRole;
  memberStatus: WorkspaceMemberStatus;
  lifecycleState: WorkspaceLifecycleState;
  /** Display name for the presence overlay (optional; falls back to the id). */
  displayName?: string;
}

export interface CollabSessionDecision {
  /** Whether to start the presence heartbeat + sync poll. */
  enabled: boolean;
  /** Diagnostic reason when disabled (never user-facing copy). */
  reason: string;
  /** The presence identity, when enabled. */
  member: CollabPresenceMember | null;
}

// Lifecycle states in which the workspace is still functional enough to
// collaborate. `locked` (frozen after expiry) / `deleting` / `deleted` are not.
const LIVE_LIFECYCLE: ReadonlySet<WorkspaceLifecycleState> = new Set([
  'active',
  'billing_past_due',
]);

/**
 * Decide whether collab should run for the current workspace context, and who
 * the present member is. Gating (in order):
 *   - no context → off
 *   - personal workspace → off (D: only team workspaces are collaborative)
 *   - removed member → off
 *   - frozen/deleting/deleted lifecycle → off
 *   - otherwise → on, identity from workspaceMemberId
 */
export function resolveCollabSession(ctx: WorkspaceCollabContext | null): CollabSessionDecision {
  if (!ctx) return { enabled: false, reason: 'no-workspace-context', member: null };
  if (ctx.workspaceType !== 'team') {
    return { enabled: false, reason: 'personal-workspace', member: null };
  }
  if (ctx.memberStatus !== 'active') {
    return { enabled: false, reason: 'member-removed', member: null };
  }
  if (!LIVE_LIFECYCLE.has(ctx.lifecycleState)) {
    return { enabled: false, reason: `lifecycle-${ctx.lifecycleState}`, member: null };
  }
  const member: CollabPresenceMember = { memberId: ctx.workspaceMemberId, role: ctx.role };
  if (ctx.displayName && ctx.displayName.trim()) member.name = ctx.displayName.trim();
  return { enabled: true, reason: 'ok', member };
}
