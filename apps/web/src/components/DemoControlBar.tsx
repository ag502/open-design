// Demo-only floating control bar.
// Renders globally (portal to document.body) so it's visible on every route,
// including the onboarding flow.

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export type DemoScenario =
  | 'home'
  | 'onboarding-new'
  | 'invite-editor'
  | 'invite-admin'
  | 'invite-viewer';

export function isInviteScenario(s: DemoScenario): boolean {
  return s === 'invite-editor' || s === 'invite-admin' || s === 'invite-viewer';
}

// Membership tier — an axis independent of the scenario. Free + the three
// personal tiers (Plus / Pro / Max) are single-seat (solo); team unlocks
// multi-seat collaboration. Upgrade paths: Plus → Pro/Max/Team, Pro → Max/Team,
// Max → Team (and Free → any paid tier).
export type DemoPlan = 'free' | 'plus' | 'pro' | 'max' | 'team';

export function isSoloPlan(p: DemoPlan): boolean {
  return p !== 'team';
}

export type InviteRole = 'editor' | 'admin' | 'viewer';

interface Props {
  scenario: DemoScenario;
  onScenario: (s: DemoScenario) => void;
  plan: DemoPlan;
  onPlan: (p: DemoPlan) => void;
  /** Fires the "积分不足" upgrade/top-up flow. */
  onLowCredits: () => void;
  /** Launches the invitee acceptance flow (email link → join workspace). */
  onAcceptInvite: (role: InviteRole) => void;
}

const MAIN_CHIPS: Array<{ id: DemoScenario; label: string }> = [
  { id: 'home',           label: '🏠 主页' },
  { id: 'onboarding-new', label: '🎉 新注册' },
];

const INVITE_CHIPS: Array<{ role: InviteRole; label: string }> = [
  { role: 'editor', label: 'Editor' },
  { role: 'admin',  label: '管理者' },
  { role: 'viewer', label: 'Viewer' },
];

const PLAN_CHIPS: Array<{ id: DemoPlan; label: string }> = [
  { id: 'free', label: '免费版' },
  { id: 'plus', label: 'Plus' },
  { id: 'pro',  label: 'Pro' },
  { id: 'max',  label: 'Max' },
  { id: 'team', label: '团队版' },
];

function Bar({ scenario, onScenario, plan, onPlan, onLowCredits, onAcceptInvite }: Props) {
  return (
    <div className="demo-bar">

      {/* ── 主场景 ── */}
      <div className="demo-bar__section">
        <span className="demo-bar__label">场景</span>
        <div className="demo-bar__chips">
          {MAIN_CHIPS.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`demo-bar__chip${scenario === c.id ? ' is-active' : ''}`}
              onClick={() => onScenario(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="demo-bar__divider" />

      {/* ── 被邀请：接受邀请落地流程（角色 = 邀请时设定） ── */}
      <div className="demo-bar__section">
        <span className="demo-bar__label">接受邀请</span>
        <div className="demo-bar__chips">
          {INVITE_CHIPS.map((c) => (
            <button
              key={c.role}
              type="button"
              className="demo-bar__chip"
              onClick={() => onAcceptInvite(c.role)}
            >
              📧 {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="demo-bar__divider" />

      {/* ── 会员版本 ── */}
      <div className="demo-bar__section">
        <span className="demo-bar__label">版本</span>
        <div className="demo-bar__chips">
          {PLAN_CHIPS.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`demo-bar__chip${plan === c.id ? ' is-active' : ''}`}
              onClick={() => onPlan(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="demo-bar__divider" />

      {/* ── 积分状态 ── */}
      <div className="demo-bar__section">
        <span className="demo-bar__label">积分</span>
        <div className="demo-bar__chips">
          <button type="button" className="demo-bar__chip" onClick={onLowCredits}>
            ⚡ 积分不足
          </button>
        </div>
      </div>

    </div>
  );
}

export function DemoControlBar(props: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  if (!containerRef.current) {
    const div = document.createElement('div');
    div.className = 'demo-bar-portal';
    containerRef.current = div;
  }

  useEffect(() => {
    const el = containerRef.current!;
    document.body.appendChild(el);
    return () => { document.body.removeChild(el); };
  }, []);

  return createPortal(<Bar {...props} />, containerRef.current);
}
