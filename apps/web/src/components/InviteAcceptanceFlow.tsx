// Invite acceptance page (C lane). The invitee lands here from the email link:
//
//   preview the invite → (account-mismatch guard) → accept → success page that
//   hands off to the desktop client via the continuation deeplink, with an
//   install fallback and open-retry when the client isn't there.
//
// Data is real: preview / accept hit B's `/api/v1/workspace-invites/*` routes.
// Registering the `opendesign://` scheme and the desktop-side continuation
// hand-off are NOT this lane — the page only builds/opens the deeplink, shows
// the launch button, and persists the pending continuation for retry.
//
// The component is self-contained and prop-driven (fetch, storage, deeplink
// opener, and the "enter workspace" hook are all injectable) so the shell can
// mount it at a route without this file reaching into navigation internals.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@open-design/components';
import type {
  LocalWorkspaceActivation,
  WorkspaceInviteAcceptRequest,
  WorkspaceInviteAcceptResponse,
  WorkspaceInviteErrorCode,
  WorkspaceInvitePreviewResponse,
  WorkspaceInviteRole,
} from '@open-design/contracts';
import { resolveWorkspaceInviteError } from '@open-design/contracts';
import { Icon } from './Icon';
import { useI18n } from '../i18n';
import type { Dict } from '../i18n/types';
import {
  clearPendingInviteContinuation,
  defaultInviteStorage,
  deriveWorkspaceActivation,
  evaluateAccountMatch,
  markPendingInviteContinuation,
  pendingContinuationFromAccept,
  writePendingInviteContinuation,
  writeWorkspaceActivation,
  type KeyValueStorage,
} from '../collab/invite-continuation';
import styles from './InviteAcceptanceFlow.module.css';

type Phase = 'loading' | 'ready' | 'accepting' | 'accepted' | 'error';
type LaunchState = 'idle' | 'opening' | 'launched' | 'failed';

/** Error identity the UI switches copy on — B's codes plus a generic fallback. */
type InviteErrorKind = WorkspaceInviteErrorCode | 'invite_unavailable' | 'generic';

export interface InviteAcceptanceFlowProps {
  /** Raw invite token from the email link. Lives in the URL only; never persisted. */
  token: string;
  /** Signed-in account email, for the account-mismatch guard. Null when signed out. */
  currentAccountEmail?: string | null;
  /** API base; default '' (same origin as the daemon proxy). */
  baseUrl?: string;
  /** Injectable for tests; defaults to the global fetch. */
  fetch?: typeof fetch;
  /** Injectable storage; defaults to localStorage. */
  storage?: KeyValueStorage | null;
  /** Client hints reported to B at accept time. */
  client?: WorkspaceInviteAcceptRequest['client'];
  /** How to open the continuation deeplink; defaults to navigating the window. */
  openDeeplink?: (url: string) => void;
  /** Shell hook fired once the membership is activated (route into the workspace). */
  onEnterWorkspace?: (activation: LocalWorkspaceActivation) => void;
  /** Shell hook for the "switch account" action on an account mismatch. */
  onSwitchAccount?: () => void;
}

const LAUNCH_TIMEOUT_MS = 1_800;

const ERROR_COPY: Record<InviteErrorKind, keyof Dict> = {
  invite_expired: 'invite.error.invite_expired',
  invite_consumed: 'invite.error.invite_consumed',
  workspace_seat_limit_reached: 'invite.error.workspace_seat_limit_reached',
  workspace_subscription_locked: 'invite.error.workspace_subscription_locked',
  workspace_not_found: 'invite.error.workspace_not_found',
  workspace_forbidden: 'invite.error.workspace_forbidden',
  invite_unavailable: 'invite.error.invite_unavailable',
  generic: 'invite.error.generic',
};

// Terminal errors can't be fixed by retrying the same call; recoverable ones can.
const TERMINAL_ERRORS: ReadonlySet<InviteErrorKind> = new Set([
  'invite_expired',
  'invite_consumed',
  'workspace_not_found',
  'invite_unavailable',
]);

async function readErrorCode(res: Response): Promise<string | null> {
  try {
    const body = (await res.clone().json()) as { code?: unknown; error?: { code?: unknown } };
    const code = body?.error?.code ?? body?.code;
    return typeof code === 'string' ? code : null;
  } catch {
    return null;
  }
}

function roleLabelKey(role: WorkspaceInviteRole): keyof Dict {
  return role === 'admin' ? 'invite.role.admin' : 'invite.role.member';
}

function roleDescKey(role: WorkspaceInviteRole): keyof Dict {
  return role === 'admin' ? 'invite.role.admin.desc' : 'invite.role.member.desc';
}

export function InviteAcceptanceFlow({
  token,
  currentAccountEmail,
  baseUrl = '',
  fetch: fetchImpl,
  storage: storageProp,
  client,
  openDeeplink,
  onEnterWorkspace,
  onSwitchAccount,
}: InviteAcceptanceFlowProps) {
  const { t } = useI18n();
  const doFetch = useMemo(() => fetchImpl ?? globalThis.fetch.bind(globalThis), [fetchImpl]);
  const storage = useMemo(
    () => (storageProp === undefined ? defaultInviteStorage() : storageProp),
    [storageProp],
  );
  const openLink = useMemo(
    () => openDeeplink ?? ((url: string) => window.location.assign(url)),
    [openDeeplink],
  );

  const [phase, setPhase] = useState<Phase>('loading');
  const [preview, setPreview] = useState<WorkspaceInvitePreviewResponse | null>(null);
  const [accepted, setAccepted] = useState<WorkspaceInviteAcceptResponse | null>(null);
  const [errorKind, setErrorKind] = useState<InviteErrorKind>('generic');
  const [launch, setLaunch] = useState<LaunchState>('idle');
  const [mismatchAcknowledged, setMismatchAcknowledged] = useState(false);
  const launchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const inviteBase = `${baseUrl}/api/v1/workspace-invites/${encodeURIComponent(token)}`;
  const loadSeq = useRef(0);

  // —— Preview ——
  const loadPreview = useCallback(async () => {
    const seq = ++loadSeq.current;
    setErrorKind('generic');
    setPhase('loading');
    const stale = () => seq !== loadSeq.current;
    try {
      const res = await doFetch(inviteBase);
      if (stale()) return;
      if (!res.ok) {
        const code = await readErrorCode(res);
        if (stale()) return;
        setErrorKind(resolveWorkspaceInviteError({ status: res.status, code }) ?? 'generic');
        setPhase('error');
        return;
      }
      const body = (await res.json()) as WorkspaceInvitePreviewResponse;
      if (stale()) return;
      if (body.status !== 'pending') {
        setErrorKind(body.status === 'expired' ? 'invite_expired' : 'invite_unavailable');
        setPhase('error');
        return;
      }
      setPreview(body);
      setPhase('ready');
    } catch {
      if (!stale()) {
        setErrorKind('generic');
        setPhase('error');
      }
    }
  }, [doFetch, inviteBase]);

  useEffect(() => {
    void loadPreview();
    return () => {
      // Invalidate any in-flight preview when the token changes / unmounts.
      loadSeq.current++;
    };
  }, [loadPreview]);

  const accountMatch = useMemo(
    () => (preview ? evaluateAccountMatch(currentAccountEmail, preview.invitedEmailMasked) : 'unknown'),
    [preview, currentAccountEmail],
  );
  const showMismatch = accountMatch === 'mismatch' && !mismatchAcknowledged;

  const clearLaunchTimer = useCallback(() => {
    if (launchTimer.current) {
      clearTimeout(launchTimer.current);
      launchTimer.current = null;
    }
  }, []);

  const attemptOpen = useCallback(
    (deeplinkUrl: string) => {
      clearLaunchTimer();
      setLaunch('opening');
      markPendingInviteContinuation('opened', Date.now(), storage);
      try {
        openLink(deeplinkUrl);
      } catch {
        // Ignore — the timeout below surfaces the fallback.
      }
      launchTimer.current = setTimeout(() => {
        // Still here after the window → the OS handler never took over.
        setLaunch((prev) => {
          if (prev !== 'opening') return prev;
          markPendingInviteContinuation('failed', Date.now(), storage);
          return 'failed';
        });
      }, LAUNCH_TIMEOUT_MS);
    },
    [clearLaunchTimer, openLink, storage],
  );

  // If the tab is hidden mid-open, the desktop client almost certainly took
  // focus — treat that as a successful hand-off and stop holding the retry.
  useEffect(() => {
    if (launch !== 'opening') return;
    function onHidden() {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        clearLaunchTimer();
        clearPendingInviteContinuation(storage);
        setLaunch('launched');
      }
    }
    document.addEventListener('visibilitychange', onHidden);
    return () => document.removeEventListener('visibilitychange', onHidden);
  }, [launch, clearLaunchTimer, storage]);

  useEffect(() => () => clearLaunchTimer(), [clearLaunchTimer]);

  const runAccept = useCallback(
    async (continueWithCurrentAccount: boolean) => {
      setPhase('accepting');
      const requestBody: WorkspaceInviteAcceptRequest = {
        continueWithCurrentAccount,
        client: { canOpenDesktop: true, ...client },
      };
      try {
        const res = await doFetch(`${inviteBase}/accept`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(requestBody),
        });
        if (!res.ok) {
          const code = await readErrorCode(res);
          setErrorKind(resolveWorkspaceInviteError({ status: res.status, code }) ?? 'generic');
          setPhase('error');
          return;
        }
        const body = (await res.json()) as WorkspaceInviteAcceptResponse;
        // Persist the retryable continuation (nonce only) + the activation.
        writePendingInviteContinuation(pendingContinuationFromAccept(body), storage);
        writeWorkspaceActivation(deriveWorkspaceActivation(body.currentWorkspaceContext), storage);
        setAccepted(body);
        setPhase('accepted');
        attemptOpen(body.continuation.deeplinkUrl);
      } catch {
        setErrorKind('generic');
        setPhase('error');
      }
    },
    [attemptOpen, client, doFetch, inviteBase, storage],
  );

  const handleAccept = useCallback(() => {
    if (accountMatch === 'mismatch' && !mismatchAcknowledged) {
      setMismatchAcknowledged(true);
    }
    void runAccept(accountMatch === 'mismatch');
  }, [accountMatch, mismatchAcknowledged, runAccept]);

  const enterWorkspace = useCallback(() => {
    if (accepted) {
      onEnterWorkspace?.(deriveWorkspaceActivation(accepted.currentWorkspaceContext));
    }
  }, [accepted, onEnterWorkspace]);

  const errorRecoverable = !TERMINAL_ERRORS.has(errorKind);

  return (
    <section className={styles.page} aria-label={t('invite.header.eyebrow')}>
      <div className={styles.ambient} aria-hidden>
        <span />
        <span />
        <span />
      </div>

      <div className={styles.shell}>
        <header className={styles.brand}>
          <span className={styles.brandMark}>OD</span>
          <span>Open Design</span>
        </header>

        <div className={styles.card}>
          {preview && (phase === 'ready' || phase === 'accepting') ? (
            <div className={styles.cardHeader}>
              <div className={styles.workspaceMark} aria-hidden>
                {preview.workspaceName.trim().charAt(0).toUpperCase() || 'W'}
              </div>
              <div className={styles.workspaceCopy}>
                <span>{t('invite.header.eyebrow')}</span>
                <strong>{preview.workspaceName}</strong>
                <p>
                  {t('invite.landing.roleLabel')}: {t(roleLabelKey(preview.role))}
                </p>
              </div>
            </div>
          ) : null}

          {/* Loading the preview */}
          {phase === 'loading' ? (
            <div className={styles.stateBlock} role="status" aria-live="polite">
              <span className={styles.spinner}>
                <Icon name="spinner" size={24} />
              </span>
              <p>{t('invite.loading')}</p>
            </div>
          ) : null}

          {/* Preview ready → landing + optional account-mismatch guard */}
          {phase === 'ready' && preview ? (
            <div className={styles.landing}>
              <h1>{t('invite.landing.title')}</h1>
              <p className={styles.subtitle}>{t('invite.landing.subtitle')}</p>

              <div className={styles.roleBadge}>
                <Icon name="users" size={14} />
                {t(roleLabelKey(preview.role))}
              </div>
              <p className={styles.rolePerm}>{t(roleDescKey(preview.role))}</p>

              <dl className={styles.metaRow}>
                <div>
                  <dt>{t('invite.landing.invitedEmail')}</dt>
                  <dd>{preview.invitedEmailMasked}</dd>
                </div>
                <div>
                  <dt>{t('invite.landing.expires')}</dt>
                  <dd>{new Date(preview.expiresAt).toLocaleString()}</dd>
                </div>
              </dl>

              {showMismatch ? (
                <div className={styles.mismatch} role="alert">
                  <span className={styles.mismatchIcon} aria-hidden>
                    <Icon name="alert-triangle" size={18} />
                  </span>
                  <div className={styles.mismatchBody}>
                    <strong>{t('invite.accountMismatch.title')}</strong>
                    <p>{t('invite.accountMismatch.body')}</p>
                    <div className={styles.mismatchActions}>
                      <Button variant="primary" onClick={handleAccept}>
                        {t('invite.accountMismatch.continue')}
                      </Button>
                      <Button variant="ghost" onClick={() => onSwitchAccount?.()}>
                        {t('invite.accountMismatch.switch')}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={styles.actions}>
                  <Button variant="primary" className={styles.primaryAction} onClick={handleAccept}>
                    {t('invite.accept.cta')}
                    <Icon name="chevron-right" size={15} />
                  </Button>
                </div>
              )}
            </div>
          ) : null}

          {/* Accepting */}
          {phase === 'accepting' ? (
            <div className={styles.joining} role="status" aria-live="polite">
              <span className={styles.joiningSpinner}>
                <Icon name="spinner" size={25} />
              </span>
              <h1>{t('invite.accepting.title')}</h1>
              <p>{t('invite.accepting.body')}</p>
              <div className={styles.joiningTrack}>
                <span />
              </div>
            </div>
          ) : null}

          {/* Accepted → success + hand-off */}
          {phase === 'accepted' && accepted ? (
            <div className={styles.result}>
              <span className={`${styles.resultIcon} ${styles.resultIconSuccess}`} aria-hidden>
                <Icon name="check" size={26} />
              </span>
              <h1>{t('invite.success.title')}</h1>
              <p>{t('invite.success.body')}</p>
              <p className={styles.receipt}>
                {t('invite.success.roleReceipt')}: <strong>{t(roleLabelKey(preview?.role ?? 'member'))}</strong>
              </p>

              {launch === 'opening' ? (
                <div className={styles.launching} role="status">
                  <Icon name="spinner" size={17} />
                  {t('invite.open.opening')}
                </div>
              ) : null}

              {launch === 'launched' ? (
                <div className={styles.actions}>
                  <Button variant="primary" className={styles.primaryAction} onClick={enterWorkspace}>
                    {t('invite.success.enter')}
                    <Icon name="external-link" size={15} />
                  </Button>
                </div>
              ) : null}

              {launch === 'idle' || launch === 'failed' ? (
                <>
                  {launch === 'failed' ? (
                    <div className={styles.downloadPrompt}>
                      <span className={styles.downloadIcon} aria-hidden>
                        <Icon name="download" size={21} />
                      </span>
                      <div>
                        <strong>{t('invite.notInstalled.title')}</strong>
                        <p>{t('invite.notInstalled.body')}</p>
                      </div>
                      <Button
                        variant="primary"
                        className={styles.downloadButton}
                        onClick={() =>
                          openLink(
                            accepted.continuation.fallbackDownloadUrl ||
                              preview?.clientHints.downloadUrl ||
                              '',
                          )
                        }
                      >
                        {t('invite.notInstalled.download')}
                      </Button>
                      <button
                        type="button"
                        className={styles.retryButton}
                        onClick={() => attemptOpen(accepted.continuation.deeplinkUrl)}
                      >
                        {t('invite.open.retry')}
                      </button>
                    </div>
                  ) : (
                    <div className={styles.actions}>
                      <Button
                        variant="primary"
                        className={styles.primaryAction}
                        onClick={() => attemptOpen(accepted.continuation.deeplinkUrl)}
                      >
                        {t('invite.open.cta')}
                        <Icon name="external-link" size={15} />
                      </Button>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          ) : null}

          {/* Error */}
          {phase === 'error' ? (
            <div className={styles.result}>
              <span className={`${styles.resultIcon} ${styles.resultIconError}`} aria-hidden>
                <Icon name="alert-triangle" size={24} />
              </span>
              <h1>{t('invite.error.title')}</h1>
              <p>{t(ERROR_COPY[errorKind])}</p>
              {errorRecoverable ? (
                <div className={styles.actions}>
                  <Button
                    variant="primary"
                    className={styles.primaryAction}
                    onClick={() => void loadPreview()}
                  >
                    {t('invite.error.retry')}
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
