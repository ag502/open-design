// Invite-acceptance flow (demo-only).
//
// Models the invitee journey from the email link to collaborating:
//   收到邀请邮件 → 点击链接 → Web 落地页 → 账号校验(登录/注册)
//     → 确认加入 Workspace? → 角色=邀请时设定 → 加入成功占 1 席 → 开始协作
//   (拒绝/忽略 → 邀请保持待定 pending)
//
// Rendered as a full-viewport portal overlay above the whole app so it reads
// as a standalone landing page reached from an external email link, not an
// in-app modal. Demo-only: no real auth / backend writes.

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';
import { Confetti } from './Confetti';
import type { DemoScenario } from './DemoControlBar';

export type InviteRole = 'editor' | 'admin' | 'viewer';

interface RoleMeta {
  label: string;
  en: string;
  perm: string;
  scenario: DemoScenario;
}

const ROLE_META: Record<InviteRole, RoleMeta> = {
  editor: {
    label: '编辑者',
    en: 'Editor',
    perm: '可创建、编辑设计与方案，参与团队协作',
    scenario: 'invite-editor',
  },
  admin: {
    label: '管理者',
    en: 'Admin',
    perm: '可管理成员、席位与全部项目设置',
    scenario: 'invite-admin',
  },
  viewer: {
    label: '只读成员',
    en: 'Viewer',
    perm: '可查看与评论，不能编辑设计',
    scenario: 'invite-viewer',
  },
};

// Demo workspace the invite points at.
const WORKSPACE = {
  name: 'Nexu 设计团队',
  logo: 'N',
  inviter: '张伟',
  inviterInitial: '张',
  members: 12,
  projects: 8,
  invitedEmail: 'you@company.com',
};

type Step = 'landing' | 'auth' | 'confirm' | 'joined' | 'declined';

interface Props {
  open: boolean;
  role: InviteRole;
  onClose: () => void;
  /** Confirmed join → enter the workspace as the invited role. */
  onJoined: (scenario: DemoScenario) => void;
  /** Declined / ignored → invite stays pending. */
  onDeclined: () => void;
}

const STEP_ORDER: Step[] = ['landing', 'auth', 'confirm', 'joined'];
const STEP_LABELS: Record<Step, string> = {
  landing: '邀请',
  auth: '账号校验',
  confirm: '确认加入',
  joined: '开始协作',
  declined: '已忽略',
};

export function InviteAcceptanceFlow({ open, role, onClose, onJoined, onDeclined }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  if (!containerRef.current && typeof document !== 'undefined') {
    const div = document.createElement('div');
    div.className = 'invite-accept-portal';
    containerRef.current = div;
  }

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    document.body.appendChild(el);
    return () => {
      if (el.parentNode) el.parentNode.removeChild(el);
    };
  }, []);

  const [step, setStep] = useState<Step>('landing');
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');

  // Reset to the landing page each time the flow is (re)opened.
  useEffect(() => {
    if (open) {
      setStep('landing');
      setAuthTab('login');
    }
  }, [open, role]);

  if (!open || !containerRef.current) return null;

  const meta = ROLE_META[role];
  const activeIndex = STEP_ORDER.indexOf(step);

  function renderStepper() {
    if (step === 'declined') return null;
    return (
      <ol className="invite-accept__steps" aria-label="加入进度">
        {STEP_ORDER.map((s, i) => {
          const state = i < activeIndex ? 'done' : i === activeIndex ? 'active' : 'todo';
          return (
            <li key={s} className={`invite-accept__step is-${state}`}>
              <span className="invite-accept__step-dot">
                {state === 'done' ? <Icon name="check" size={12} /> : i + 1}
              </span>
              <span className="invite-accept__step-label">{STEP_LABELS[s]}</span>
            </li>
          );
        })}
      </ol>
    );
  }

  return createPortal(
    <div className="invite-accept" role="dialog" aria-modal="true" aria-label="接受团队邀请">
      <div className="invite-accept__bg" aria-hidden />
      <button type="button" className="invite-accept__dismiss" onClick={onClose} aria-label="关闭">
        <Icon name="close" size={18} />
      </button>

      <div className="invite-accept__stage">
        {renderStepper()}

        {/* ── 1. 邮件落地页 ── */}
        {step === 'landing' ? (
          <div className="invite-accept__card invite-accept__card--landing">
            <p className="invite-accept__from-mail">
              <Icon name="info" size={13} /> 来自邀请邮件 · 点击链接已为你打开此页面
            </p>
            <div className="invite-accept__hero">
              <span className="invite-accept__ws-logo">{WORKSPACE.logo}</span>
              <div className="invite-accept__inviter">
                <span className="invite-accept__inviter-avatar">{WORKSPACE.inviterInitial}</span>
                <span>
                  <strong>{WORKSPACE.inviter}</strong> 邀请你加入
                </span>
              </div>
              <h1 className="invite-accept__ws-name">{WORKSPACE.name}</h1>
              <div className="invite-accept__role-badge">
                以 <strong>{meta.label}</strong>（{meta.en}）身份加入
              </div>
              <p className="invite-accept__role-perm">{meta.perm}</p>
            </div>
            <div className="invite-accept__ws-meta">
              <span>{WORKSPACE.members} 位成员</span>
              <span className="invite-accept__meta-sep" aria-hidden>·</span>
              <span><Icon name="folder" size={13} /> {WORKSPACE.projects} 个共享项目</span>
            </div>
            <div className="invite-accept__actions">
              <button type="button" className="invite-accept__btn is-primary" onClick={() => setStep('auth')}>
                接受邀请
              </button>
              <button type="button" className="invite-accept__btn is-ghost" onClick={() => setStep('declined')}>
                拒绝邀请
              </button>
            </div>
          </div>
        ) : null}

        {/* ── 2. 账号校验：登录 / 注册 ── */}
        {step === 'auth' ? (
          <div className="invite-accept__card">
            <h2 className="invite-accept__title">登录以继续</h2>
            <p className="invite-accept__subtitle">
              邀请发送至 <strong>{WORKSPACE.invitedEmail}</strong>，登录或注册后即可加入工作空间。
            </p>
            <div className="invite-accept__tabs" role="tablist" aria-label="账号校验">
              <button
                type="button"
                role="tab"
                aria-selected={authTab === 'login'}
                className={`invite-accept__tab${authTab === 'login' ? ' is-active' : ''}`}
                onClick={() => setAuthTab('login')}
              >
                已有账号 · 登录
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={authTab === 'register'}
                className={`invite-accept__tab${authTab === 'register' ? ' is-active' : ''}`}
                onClick={() => setAuthTab('register')}
              >
                无账号 · 注册
              </button>
            </div>
            <div className="invite-accept__form">
              {authTab === 'register' ? (
                <label className="invite-accept__field">
                  <span>昵称</span>
                  <input type="text" placeholder="你的名字" defaultValue="" />
                </label>
              ) : null}
              <label className="invite-accept__field">
                <span>邮箱</span>
                <input type="email" value={WORKSPACE.invitedEmail} readOnly />
              </label>
              <label className="invite-accept__field">
                <span>密码</span>
                <input type="password" placeholder={authTab === 'register' ? '设置登录密码' : '输入密码'} defaultValue="" />
              </label>
            </div>
            <div className="invite-accept__actions">
              <button type="button" className="invite-accept__btn is-primary" onClick={() => setStep('confirm')}>
                {authTab === 'register' ? '注册并继续' : '登录并继续'}
              </button>
              <button type="button" className="invite-accept__btn is-text" onClick={() => setStep('landing')}>
                返回
              </button>
            </div>
          </div>
        ) : null}

        {/* ── 3. 确认是否加入该 Workspace ── */}
        {step === 'confirm' ? (
          <div className="invite-accept__card">
            <h2 className="invite-accept__title">确认加入该工作空间？</h2>
            <div className="invite-accept__confirm-row">
              <span className="invite-accept__ws-logo invite-accept__ws-logo--sm">{WORKSPACE.logo}</span>
              <div>
                <div className="invite-accept__confirm-ws">{WORKSPACE.name}</div>
                <div className="invite-accept__confirm-role">
                  角色：<strong>{meta.label}</strong>（邀请时设定）
                </div>
              </div>
            </div>
            <p className="invite-accept__confirm-perm">{meta.perm}</p>
            <p className="invite-accept__seat-note">
              <Icon name="info" size={13} /> 加入后将占用该团队的 1 个席位。
            </p>
            <div className="invite-accept__actions">
              <button type="button" className="invite-accept__btn is-primary" onClick={() => setStep('joined')}>
                确定加入
              </button>
              <button type="button" className="invite-accept__btn is-ghost" onClick={() => setStep('declined')}>
                拒绝 / 忽略
              </button>
            </div>
          </div>
        ) : null}

        {/* ── 4. 加入成功 → 开始协作 ── */}
        {step === 'joined' ? (
          <div className="invite-accept__card invite-accept__card--success">
            <div className="invite-accept__success-badge" aria-hidden>
              <Icon name="check" size={26} />
            </div>
            <h2 className="invite-accept__title">已加入 {WORKSPACE.name} 🎉</h2>
            <p className="invite-accept__subtitle">
              你已占用 1 个席位 · 角色：<strong>{meta.label}</strong>（{meta.en}）
            </p>
            <div className="invite-accept__actions">
              <button
                type="button"
                className="invite-accept__btn is-primary"
                onClick={() => onJoined(meta.scenario)}
              >
                开始协作
              </button>
            </div>
          </div>
        ) : null}

        {/* ── 拒绝 / 忽略 → 待定 pending ── */}
        {step === 'declined' ? (
          <div className="invite-accept__card invite-accept__card--declined">
            <div className="invite-accept__declined-badge" aria-hidden>
              <Icon name="info" size={24} />
            </div>
            <h2 className="invite-accept__title">邀请已忽略</h2>
            <p className="invite-accept__subtitle">
              该邀请将保持<strong>待定（pending）</strong>状态，你可以稍后通过邮件链接重新加入。
            </p>
            <div className="invite-accept__actions">
              <button type="button" className="invite-accept__btn is-ghost" onClick={() => setStep('landing')}>
                重新考虑
              </button>
              <button
                type="button"
                className="invite-accept__btn is-text"
                onClick={() => {
                  onDeclined();
                  onClose();
                }}
              >
                关闭
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {step === 'joined' ? <Confetti /> : null}
    </div>,
    containerRef.current,
  );
}
