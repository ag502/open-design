// Shared logic for the hosted-AMR nudge surfaced under a failed run's error
// toast. Kept in its own module so both ProjectView (which threads the error
// code onto the chat message) and AssistantMessage (which renders the nudge)
// can import it without a circular dependency.

// Landing page for Open Design's hosted AMR model gateway.
export const AMR_GUIDANCE_URL = 'https://open-design.ai/amr';

// Error codes that mean "the model service rejected or could not serve the
// run" — auth missing/invalid, quota/rate exhausted, or the upstream model
// endpoint was unavailable. These are exactly the failures the hosted AMR
// service sidesteps. Generic process failures (AGENT_EXECUTION_FAILED), a
// missing binary (AGENT_UNAVAILABLE), or transport errors are excluded.
const AMR_GUIDANCE_ERROR_CODES = new Set<string>([
  'AGENT_AUTH_REQUIRED',
  'UNAUTHORIZED',
  'RATE_LIMITED',
  'UPSTREAM_UNAVAILABLE',
]);

// True when a failed run should carry the "try Open Design's hosted AMR
// service" nudge: the agent is NOT AMR itself, and the failure is a model /
// auth / quota error. AMR's own runs are excluded — they get the dedicated
// sign-in / recharge affordances instead.
export function isAmrGuidanceErrorCode(
  code: string | null | undefined,
  agentId: string | null | undefined,
): boolean {
  if (agentId === 'amr') return false;
  return typeof code === 'string' && AMR_GUIDANCE_ERROR_CODES.has(code);
}
