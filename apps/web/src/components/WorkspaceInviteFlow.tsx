import { useState } from 'react';
import { Button, Input } from '@open-design/components';
import { Icon } from './Icon';
import type { DemoScenario } from './DemoControlBar';

type InviteStage = 'auth' | 'confirm' | 'joining' | 'success';
type LocalLaunchState = 'idle' | 'opening' | 'download' | 'downloaded';

const INVITE_ROLES: Record<
  Extract<DemoScenario, 'invite-editor'>,
  { label: string; description: string }
> = {
  'invite-editor': {
    label: 'Editor',
    description: '可创建、编辑和共享团队项目',
  },
};

const styles = {
  activeStatus: 'workspace-invite-activeStatus',
  ambient: 'workspace-invite-ambient',
  back: 'workspace-invite-back',
  brand: 'workspace-invite-brand',
  brandMark: 'workspace-invite-brandMark',
  card: 'workspace-invite-card',
  cardHeader: 'workspace-invite-cardHeader',
  divider: 'workspace-invite-divider',
  downloadButton: 'workspace-invite-downloadButton',
  downloadIcon: 'workspace-invite-downloadIcon',
  downloadPrompt: 'workspace-invite-downloadPrompt',
  emailAction: 'workspace-invite-emailAction',
  eyebrow: 'workspace-invite-eyebrow',
  form: 'workspace-invite-form',
  googleMark: 'workspace-invite-googleMark',
  heading: 'workspace-invite-heading',
  inviterAvatar: 'workspace-invite-inviterAvatar',
  inviterBadge: 'workspace-invite-inviterBadge',
  joining: 'workspace-invite-joining',
  joiningSpinner: 'workspace-invite-joiningSpinner',
  joiningTrack: 'workspace-invite-joiningTrack',
  launching: 'workspace-invite-launching',
  page: 'workspace-invite-page',
  pendingHint: 'workspace-invite-pendingHint',
  primaryAction: 'workspace-invite-primaryAction',
  result: 'workspace-invite-result',
  resultIcon: 'workspace-invite-resultIcon',
  resultIconSuccess: 'workspace-invite-resultIconSuccess',
  retryButton: 'workspace-invite-retryButton',
  seatReceipt: 'workspace-invite-seatReceipt',
  securityNote: 'workspace-invite-securityNote',
  shell: 'workspace-invite-shell',
  socialAuth: 'workspace-invite-socialAuth',
  socialButton: 'workspace-invite-socialButton',
  workspaceCopy: 'workspace-invite-workspaceCopy',
  workspaceIdentity: 'workspace-invite-workspaceIdentity',
  workspaceMark: 'workspace-invite-workspaceMark',
} as const;

interface Props {
  scenario: Extract<DemoScenario, 'invite-editor'>;
  initiallySignedIn?: boolean;
}

export function WorkspaceInviteFlow({ scenario, initiallySignedIn = false }: Props) {
  const [stage, setStage] = useState<InviteStage>(initiallySignedIn ? 'confirm' : 'auth');
  const [emailLoginOpen, setEmailLoginOpen] = useState(false);
  const [email, setEmail] = useState('you@example.com');
  const [password, setPassword] = useState('');
  const [localLaunchState, setLocalLaunchState] = useState<LocalLaunchState>('idle');
  const role = INVITE_ROLES[scenario];

  function completeWebSignIn() {
    setStage('confirm');
  }

  function confirmJoinTeam() {
    setStage('joining');
    window.setTimeout(() => {
      setStage('success');
      tryOpenLocalWorkspace();
    }, 720);
  }

  function tryOpenLocalWorkspace() {
    setLocalLaunchState('opening');
    window.setTimeout(() => setLocalLaunchState('download'), 1100);
  }

  return (
    <section className={styles.page} aria-label="Workspace 邀请 Web 流程">
      <div className={styles.ambient} aria-hidden>
        <span />
        <span />
        <span />
      </div>

      <div className={styles.shell}>
        <header className={styles.brand}>
          <span>
            <span className={styles.brandMark}>OD</span>
            <span>Open Design Web</span>
          </span>
        </header>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.workspaceIdentity}>
              <div className={styles.workspaceMark}>N</div>
              <div className={styles.inviterAvatar}>
                <img src="/team-avatars/a1.png" alt="" aria-hidden />
                <span className={styles.inviterBadge}>
                  <Icon name="send" size={11} />
                </span>
              </div>
            </div>
            <div className={styles.workspaceCopy}>
              <span>Nexu 团队邀请</span>
              <strong>加入团队协作</strong>
              <p>角色：{role.label}</p>
            </div>
          </div>

          {stage === 'auth' ? (
            <>
              <div className={styles.heading}>
                <h1>加入 Nexu 团队</h1>
                <p>登录后即可加入团队，并在本地 Open Design 中继续协作。</p>
              </div>

              <div className={styles.socialAuth}>
                <button type="button" className={styles.socialButton} onClick={completeWebSignIn}>
                  <span className={styles.googleMark}>G</span>
                  使用 Google 继续
                </button>
                <button type="button" className={styles.socialButton} onClick={completeWebSignIn}>
                  <Icon name="github-filled" size={19} />
                  使用 GitHub 继续
                </button>
              </div>

              <div className={styles.divider}>
                <span>或使用邮箱</span>
              </div>

              {emailLoginOpen ? (
                <form
                  className={styles.form}
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (!email.trim() || !password.trim()) return;
                    completeWebSignIn();
                  }}
                >
                  <label>
                    <span>邮箱</span>
                    <Input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      autoFocus
                    />
                  </label>
                  <label>
                    <span>密码</span>
                    <Input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="输入密码"
                      autoComplete="current-password"
                    />
                  </label>
                  <Button
                    type="submit"
                    variant="primary"
                    className={styles.primaryAction}
                    disabled={!email.trim() || !password.trim()}
                  >
                    继续
                    <Icon name="chevron-right" size={15} />
                  </Button>
                </form>
              ) : (
                <Button
                  variant="ghost"
                  className={styles.emailAction}
                  onClick={() => setEmailLoginOpen(true)}
                >
                  <Icon name="link" size={15} />
                  使用邮箱登录
                </Button>
              )}
            </>
          ) : null}

          {stage === 'confirm' ? (
            <div className={styles.result}>
              <span className={`${styles.resultIcon} ${styles.resultIconSuccess}`}>
                <Icon name="check" size={28} />
              </span>
              <h1>加入团队，开始协作</h1>
              <p>确认加入后，将尝试打开本地 Open Design。</p>

              <Button
                variant="primary"
                className={styles.primaryAction}
                onClick={confirmJoinTeam}
              >
                加入团队，开始协作
                <Icon name="external-link" size={15} />
              </Button>
            </div>
          ) : null}

          {stage === 'joining' ? (
            <div className={styles.joining} role="status" aria-live="polite">
              <span className={styles.joiningSpinner}>
                <Icon name="spinner" size={25} />
              </span>
              <h1>正在加入 Nexu 团队</h1>
              <p>正在为你打开协作空间…</p>
              <div className={styles.joiningTrack}>
                <span />
              </div>
            </div>
          ) : null}

          {stage === 'success' ? (
            <div className={styles.result}>
              <span className={`${styles.resultIcon} ${styles.resultIconSuccess}`}>
                <Icon name="check" size={28} />
              </span>
              <h1>开始协作</h1>
              <p>你已加入 Nexu 团队，正在打开本地 Open Design。</p>

              {localLaunchState === 'idle' ? (
                <Button
                  variant="primary"
                  className={styles.primaryAction}
                  onClick={tryOpenLocalWorkspace}
                >
                  开始协作
                  <Icon name="external-link" size={15} />
                </Button>
              ) : null}

              {localLaunchState === 'opening' ? (
                <div className={styles.launching} role="status">
                  <Icon name="spinner" size={17} />
                  正在尝试打开本地 Open Design…
                </div>
              ) : null}

              {localLaunchState === 'download' || localLaunchState === 'downloaded' ? (
                <div className={styles.downloadPrompt}>
                  <span className={styles.downloadIcon}>
                    <Icon name="download" size={21} />
                  </span>
                  <div>
                    <strong>没有自动打开？</strong>
                    <p>你的设备可能还没有安装 Open Design。安装后会自动回到 Nexu Workspace。</p>
                  </div>
                  <Button
                    variant="primary"
                    className={styles.downloadButton}
                    onClick={() => setLocalLaunchState('downloaded')}
                  >
                    {localLaunchState === 'downloaded' ? '下载已开始（Demo）' : '下载 Open Design'}
                  </Button>
                  <button
                    type="button"
                    className={styles.retryButton}
                    onClick={() => {
                      tryOpenLocalWorkspace();
                    }}
                  >
                    已安装？再次尝试打开
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <p className={styles.securityNote}>
          <Icon name="info" size={13} />
          如果无法打开客户端，将显示下载入口
        </p>
      </div>
    </section>
  );
}
