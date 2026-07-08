import { useState } from 'react';
import {
  isWorkspaceLifecycleWritable,
  type WorkspaceCollabContext,
} from '@open-design/contracts';
import { Button } from '@open-design/components';
import { Icon, type IconName } from './Icon';
import { TeamSlotPlaceholder } from './TeamSlotPlaceholder';
import {
  visibleWorkspaceSettingsEntries,
  isWorkspaceSettingsEntryWriteAction,
  canShowWorkspaceSettings,
  type WorkspaceSettingsEntryId,
} from '../collab/settings-access';
import { useT } from '../i18n';
import type { Dict } from '../i18n/types';
import styles from './SettingsWorkspaceSection.module.css';

// Settings > Workspace region (E-frontend, D4.3). This component is the SHELL
// only: it renders a role-gated list of entry points to other lanes' workspace
// destinations (members = B, billing/auto-recharge = A, team space = D). Opening
// an entry shows the neutral `TeamSlotPlaceholder` — this lane never renders those
// lanes' business views. All visibility keys off the folded permission bits on the
// workspace context (see `../collab/settings-access`), never a role re-derivation.

interface EntryMeta {
  icon: IconName;
  titleKey: keyof Dict;
  hintKey: keyof Dict;
}

const ENTRY_META: Record<WorkspaceSettingsEntryId, EntryMeta> = {
  members: {
    icon: 'users',
    titleKey: 'settings.workspaceMembers',
    hintKey: 'settings.workspaceMembersHint',
  },
  billing: {
    icon: 'sparkles',
    titleKey: 'settings.workspaceBilling',
    hintKey: 'settings.workspaceBillingHint',
  },
  autoRecharge: {
    icon: 'refresh',
    titleKey: 'settings.workspaceAutoRecharge',
    hintKey: 'settings.workspaceAutoRechargeHint',
  },
  teamSpace: {
    icon: 'folder-filled',
    titleKey: 'settings.workspaceTeamSpace',
    hintKey: 'settings.workspaceTeamSpaceHint',
  },
};

export function SettingsWorkspaceSection({
  context,
}: {
  context: WorkspaceCollabContext | null;
}) {
  const t = useT();
  const [selected, setSelected] = useState<WorkspaceSettingsEntryId | null>(null);

  // Shell-level guard: the Workspace region only exists for a team workspace whose
  // viewer may see workspace settings. Gate on the folded permission bit directly.
  if (!canShowWorkspaceSettings(context) || !context) {
    return null;
  }

  const writable = isWorkspaceLifecycleWritable(context.lifecycleState);
  const locked = context.lifecycleState === 'locked';
  const recovery = context.billingRecovery;
  const entries = visibleWorkspaceSettingsEntries(context);

  if (selected) {
    const meta = ENTRY_META[selected];
    return (
      <section className="settings-section" data-testid="settings-workspace-entry">
        <div className={styles.entryBack}>
          <Button variant="ghost" onClick={() => setSelected(null)}>
            <Icon name="arrow-left" size={14} />
            {t('settings.workspaceBack')}
          </Button>
        </div>
        <TeamSlotPlaceholder icon={meta.icon} title={t(meta.titleKey)} />
      </section>
    );
  }

  return (
    <section className="settings-section" data-testid="settings-workspace-section">
      {locked ? (
        <div className={styles.locked} data-testid="settings-workspace-locked">
          <div className={styles.lockedHead}>
            <Icon name="alert-triangle" size={14} />
            {t('entry.workspaceLockedNote')}
          </div>
          {recovery?.canEnterBillingRecovery && recovery.recoveryUrl ? (
            <a
              className={styles.lockedAction}
              href={recovery.recoveryUrl}
              target="_blank"
              rel="noreferrer noopener"
              data-testid="settings-workspace-recover"
            >
              {t('entry.workspaceLockedRecover')}
            </a>
          ) : null}
        </div>
      ) : null}
      <p className="hint">{t('settings.workspaceLede')}</p>
      <ul className={styles.entryList}>
        {entries.map((id) => {
          const meta = ENTRY_META[id];
          const disabled = isWorkspaceSettingsEntryWriteAction(id) && !writable;
          return (
            <li key={id}>
              <button
                type="button"
                className={styles.entry}
                onClick={() => setSelected(id)}
                disabled={disabled}
                data-testid={`settings-workspace-entry-${id}`}
              >
                <span className={styles.entryIcon} aria-hidden>
                  <Icon name={meta.icon} size={18} />
                </span>
                <span className={styles.entryText}>
                  <strong>{t(meta.titleKey)}</strong>
                  <small>{t(meta.hintKey)}</small>
                </span>
                <Icon name="chevron-right" size={16} />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
