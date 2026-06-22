import type { Dict } from '../i18n/types';
import type { ConnectionTestResponse } from '../types';

type TranslateFn = (key: keyof Dict, vars?: Record<string, string | number>) => string;

export function renderConnectionTestFailureMessage(
  t: TranslateFn,
  result: ConnectionTestResponse,
  options: {
    testedModel: string;
    agentName: string;
    ms: number;
  },
): string {
  switch (result.kind) {
    case 'auth_failed':
      return t('settings.testAuthFailed');
    case 'forbidden':
      return t('settings.testForbidden');
    case 'not_found_model':
      return t('settings.testNotFoundModel', { model: options.testedModel });
    case 'invalid_model_id':
      return t('settings.testInvalidModelId', { model: options.testedModel });
    case 'invalid_base_url':
      return t('settings.testInvalidBaseUrl');
    case 'rate_limited':
      return result.detail?.trim()
        ? `${t('settings.testRateLimited')} ${result.detail.trim()}`
        : t('settings.testRateLimited');
    case 'upstream_unavailable':
      return result.detail?.trim()
        ? result.detail.trim()
        : t('settings.testUpstream', { status: result.status ?? 0 });
    case 'timeout':
      return t('settings.testTimeout', { ms: options.ms });
    case 'agent_not_installed':
      return t('settings.testAgentMissing', { agentName: options.agentName });
    case 'agent_auth_required':
      return result.detail || 'Agent authentication is required.';
    case 'agent_spawn_failed':
      return t('settings.testAgentSpawn', {
        agentName: options.agentName,
        detail: result.detail ?? '',
      });
    default:
      return t('settings.testUnknown', { detail: result.detail ?? '' });
  }
}
