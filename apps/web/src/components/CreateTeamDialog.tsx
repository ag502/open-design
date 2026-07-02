// Reusable "create team" dialog.
//
// Opened from the team dropdown in the left rail ("新建团队"). Demo-only:
// collects a team name + a logo (uploaded image or a colored letter avatar),
// no backend persistence.

import { useRef, useState } from 'react';
import { Icon } from './Icon';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate?: (team: { name: string; logo: string | null; color: string }) => void;
}

const LOGO_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];

export function CreateTeamDialog({ open, onClose, onCreate }: Props) {
  const [name, setName] = useState('');
  const [logoData, setLogoData] = useState<string | null>(null);
  const [colorIdx, setColorIdx] = useState(0);
  const fileRef = useRef<HTMLInputElement | null>(null);

  if (!open) return null;

  const initial = name.trim().charAt(0).toUpperCase() || 'T';

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogoData(typeof reader.result === 'string' ? reader.result : null);
    reader.readAsDataURL(file);
  }

  function submit() {
    onCreate?.({
      name: name.trim() || '我的团队',
      logo: logoData,
      color: LOGO_COLORS[colorIdx] ?? LOGO_COLORS[0]!,
    });
    onClose();
  }

  return (
    <div className="entry-invite" role="dialog" aria-modal="true" aria-label="新建团队">
      <div className="entry-invite__backdrop" onClick={onClose} />
      <div className="entry-invite__panel">
        <div className="entry-invite__head">
          <button
            type="button"
            className="create-team__logo"
            style={logoData ? undefined : { background: LOGO_COLORS[colorIdx] }}
            onClick={() => fileRef.current?.click()}
            aria-label="上传团队 Logo"
          >
            {logoData ? (
              <img src={logoData} alt="" className="create-team__logo-img" />
            ) : (
              <span className="create-team__logo-initial">{initial}</span>
            )}
            <span className="create-team__logo-edit" aria-hidden>
              <Icon name="image" size={13} />
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={pickFile}
          />
          <div className="entry-invite__head-text">
            <h2 className="entry-invite__title">新建团队</h2>
            <p className="entry-invite__subtitle">为团队取个名字，上传 Logo 即可创建</p>
          </div>
        </div>

        <label className="entry-invite__label" htmlFor="create-team-name">团队名称</label>
        <input
          id="create-team-name"
          className="entry-invite__input"
          placeholder="例如：设计部、增长组…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />

        {logoData ? null : (
          <>
            <span className="entry-invite__label">选择 Logo 颜色</span>
            <div className="create-team__colors">
              {LOGO_COLORS.map((c, i) => (
                <button
                  key={c}
                  type="button"
                  className={`create-team__color${i === colorIdx ? ' is-active' : ''}`}
                  style={{ background: c }}
                  onClick={() => setColorIdx(i)}
                  aria-label={`颜色 ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}

        <div className="entry-invite__foot">
          <button type="button" className="entry-invite__btn" onClick={onClose}>
            取消
          </button>
          <button type="button" className="entry-invite__btn is-primary" onClick={submit}>
            <Icon name="plus" size={14} /> 创建团队
          </button>
        </div>
      </div>
    </div>
  );
}
