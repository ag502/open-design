import { describe, expect, it } from 'vitest';
import { isAmrGuidanceErrorCode } from '../../src/runtime/amr-guidance';

describe('isAmrGuidanceErrorCode', () => {
  it('nudges non-AMR agents on model/auth/quota errors', () => {
    for (const code of [
      'AGENT_AUTH_REQUIRED',
      'UNAUTHORIZED',
      'RATE_LIMITED',
      'UPSTREAM_UNAVAILABLE',
    ]) {
      expect(isAmrGuidanceErrorCode(code, 'claude')).toBe(true);
    }
  });

  it('treats a null agentId (API-protocol mode) as non-AMR', () => {
    expect(isAmrGuidanceErrorCode('UNAUTHORIZED', null)).toBe(true);
  });

  it('never nudges the AMR agent toward itself', () => {
    expect(isAmrGuidanceErrorCode('AGENT_AUTH_REQUIRED', 'amr')).toBe(false);
    expect(isAmrGuidanceErrorCode('UPSTREAM_UNAVAILABLE', 'amr')).toBe(false);
  });

  it('stays quiet on generic process failures and missing binaries', () => {
    expect(isAmrGuidanceErrorCode('AGENT_EXECUTION_FAILED', 'claude')).toBe(false);
    expect(isAmrGuidanceErrorCode('AGENT_UNAVAILABLE', 'codex')).toBe(false);
  });

  it('stays quiet when there is no code (transport/abort errors)', () => {
    expect(isAmrGuidanceErrorCode(undefined, 'claude')).toBe(false);
    expect(isAmrGuidanceErrorCode(null, 'claude')).toBe(false);
  });
});
