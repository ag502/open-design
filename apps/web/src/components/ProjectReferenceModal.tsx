import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Project } from '../types';
import { useT } from '../i18n';
import { getProjectDetail, listProjects } from '../state/projects';
import { Icon } from './Icon';
import styles from './ProjectReferenceModal.module.css';

interface Props {
  currentProjectId?: string | null;
  onClose: () => void;
  onSelect: (project: Project, resolvedDir: string) => void;
}

function projectSearchText(project: Project): string {
  return [
    project.id,
    project.name,
    project.metadata?.kind ?? '',
    project.metadata?.baseDir ?? '',
    project.metadata?.entryFile ?? '',
    ...(project.metadata?.linkedDirs ?? []),
  ].join(' ');
}

function projectMeta(project: Project): string {
  return project.metadata?.baseDir || project.metadata?.entryFile || project.metadata?.kind || project.id;
}

export function ProjectReferenceModal({ currentProjectId, onClose, onSelect }: Props) {
  const t = useT();
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void listProjects().then((rows) => {
      if (cancelled) return;
      const filtered = rows.filter((project) => project.id !== currentProjectId);
      setProjects(filtered);
      setSelectedId((current) => current ?? filtered[0]?.id ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [currentProjectId]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && !pending) onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, pending]);

  const visibleProjects = useMemo(() => {
    if (!projects) return [];
    const needle = query.trim().toLowerCase();
    if (!needle) return projects;
    return projects.filter((project) => projectSearchText(project).toLowerCase().includes(needle));
  }, [projects, query]);

  const selectedProject =
    visibleProjects.find((project) => project.id === selectedId) ??
    visibleProjects[0] ??
    null;

  async function confirm() {
    if (!selectedProject || pending) return;
    setPending(true);
    setError(null);
    try {
      const detail = await getProjectDetail(selectedProject.id);
      const resolvedDir = detail?.resolvedDir.trim() ?? '';
      if (!detail || !resolvedDir) {
        setError(t('homeWorkingDir.applyFailed'));
        return;
      }
      onSelect(detail.project, resolvedDir);
    } finally {
      setPending(false);
    }
  }

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className={styles.backdrop} role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !pending) onClose();
    }}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="project-reference-title">
        <header className={styles.head}>
          <h2 id="project-reference-title" className={styles.title}>
            {t('chat.referenceProject.title')}
          </h2>
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label={t('common.close')}
            disabled={pending}
          >
            <Icon name="close" size={17} />
          </button>
        </header>
        <div className={styles.body}>
          <label className={styles.search}>
            <Icon name="search" size={14} />
            <input
              autoFocus
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('chat.referenceProject.search')}
            />
          </label>
          <div className={styles.list} role="listbox" aria-label={t('chat.referenceProject.title')}>
            {projects === null ? (
              <div className={styles.empty}>{t('common.loading')}</div>
            ) : visibleProjects.length === 0 ? (
              <div className={styles.empty}>
                {query.trim()
                  ? t('chat.referenceProject.empty', { query })
                  : t('chat.referenceProject.emptyAll')}
              </div>
            ) : (
              visibleProjects.map((project) => {
                const selected = project.id === selectedProject?.id;
                return (
                  <button
                    key={project.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={`${styles.item}${selected ? ` ${styles.itemSelected}` : ''}`}
                    onClick={() => setSelectedId(project.id)}
                    onDoubleClick={() => void confirm()}
                  >
                    <span className={styles.itemIcon} aria-hidden>
                      <Icon name="folder" size={15} />
                    </span>
                    <span className={styles.itemText}>
                      <span className={styles.itemTitle}>{project.name}</span>
                      <span className={styles.itemMeta}>{projectMeta(project)}</span>
                    </span>
                    {selected ? (
                      <span className={styles.currentTag}>{t('common.selected')}</span>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
          {error ? (
            <div className={styles.error} role="alert">
              {error}
            </div>
          ) : null}
        </div>
        <footer className={styles.footer}>
          <button type="button" className={styles.button} onClick={onClose} disabled={pending}>
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className={`${styles.button} ${styles.primary}`}
            onClick={() => void confirm()}
            disabled={!selectedProject || pending}
          >
            {pending ? t('common.loading') : t('chat.referenceProject.confirm')}
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
