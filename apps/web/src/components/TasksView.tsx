// Automations tab: one surface for scheduled routines, Orbit-style digests,
// and live artifact refreshers. The daemon still stores these as routines;
// the UI presents them as scheduled agent conversations.

import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  AutomationContentPacket,
  AutomationEvolutionProposal,
  AutomationEvolutionProposalListResponse,
  AutomationSourceIngestionResponse,
  AutomationSourceKind,
  AutomationSourcePacketListResponse,
  AutomationTemplate as ContractAutomationTemplate,
  AutomationTemplateListResponse,
  AutomationTokenCompressionMode,
  ConnectorDetail,
  Routine,
  RoutineRun,
  RoutineRunCrystallizeResponse,
} from '@open-design/contracts';

import { Icon, type IconName } from './Icon';
import { navigate } from '../router';
import type { SkillSummary } from '../types';
import { useI18n } from '../i18n';
import type { Locale } from '../i18n';
import {
  NewAutomationModal,
  describeScheduleSummary,
  type AutomationTemplate,
  type AutomationTemplateKind,
} from './NewAutomationModal';

type ProjectSummary = { id: string; name: string };
type TemplateFilter =
  | 'all'
  | AutomationTemplateKind
  | 'memory'
  | 'design-system'
  | 'skills'
  | 'connectors'
  | 'compression'
  | 'release'
  | 'quality';

type Modal =
  | { kind: 'create'; template?: AutomationTemplate }
  | { kind: 'edit'; routine: Routine }
  | null;

interface Props {
  projects?: ProjectSummary[];
  skills?: SkillSummary[];
  designTemplates?: SkillSummary[];
  connectors?: ConnectorDetail[];
  connectorsLoading?: boolean;
}

const STATIC_TEMPLATES: ReadonlyArray<AutomationTemplate> = [
  {
    id: 'memory-refresh',
    category: 'memory',
    kind: 'routine',
    icon: 'sparkles',
    title: 'Refresh project memory from recent work.',
    description: 'Turns repeated decisions, preferences, and feedback into reusable memory updates.',
    defaultName: 'Memory refresh',
    prompt:
      'Review recent chats, PR comments, design feedback, and project changes. Extract durable preferences, repeated decisions, and workflow lessons. Propose concise memory updates with source links and separate one-off notes from reusable guidance.',
  },
  {
    id: 'design-system-refresh',
    category: 'design-system',
    kind: 'routine',
    icon: 'sliders',
    title: 'Update design systems from shipped artifacts.',
    description: 'Finds reusable tokens, components, and rules across recent design work.',
    defaultName: 'Design system maintainer',
    prompt:
      'Inspect recent generated artifacts, review feedback, and accepted revisions. Identify patterns that should become design-system tokens, component rules, examples, or anti-patterns. Draft precise updates to DESIGN.md and call out anything that needs human approval.',
  },
  {
    id: 'live-artifact-registry',
    category: 'live-artifact',
    kind: 'routine',
    icon: 'file-code',
    title: 'Audit live artifacts and refresh stale versions.',
    description: 'Keeps persistent dashboards, reports, and previews current instead of duplicating them.',
    defaultName: 'Live artifact maintainer',
    prompt:
      'List live artifacts for this project, find stale or failed refreshes, and update the highest-value artifact in place. Preserve artifact ids, summarize what changed, and flag artifacts that need connector access or human review.',
  },
  {
    id: 'orbit-dashboard',
    category: 'orbit',
    kind: 'routine',
    icon: 'orbit',
    title: 'Build a connector activity dashboard.',
    description: 'Aggregates selected connectors into an Orbit-style live dashboard.',
    defaultName: 'Connector activity dashboard',
    prompt:
      'Use the selected connectors to build or refresh a live dashboard of recent activity. Group by people, projects, decisions, risks, and follow-ups. Prefer connected read-only tools, cite sources, and keep the dashboard refreshable.',
  },
  {
    id: 'release-notes',
    category: 'release',
    kind: 'routine',
    icon: 'present',
    title: 'Draft release notes from shipped design work.',
    description: 'Connects merged PRs, artifacts, and product-facing changes into release notes.',
    defaultName: 'Weekly release notes',
    prompt:
      "Draft user-facing release notes covering merged PRs, updated artifacts, and design-system changes from the last 7 days. Group by 'New', 'Improved', and 'Fixed'. Include links when available and keep the copy user-readable.",
  },
  {
    id: 'quality-regression-watch',
    category: 'quality',
    kind: 'routine',
    icon: 'bell',
    title: 'Watch for design and implementation regressions.',
    description: 'Compares recent changes against benchmarks, traces, and accepted references.',
    defaultName: 'Regression watch',
    prompt:
      'Compare recent project changes against accepted artifacts, design-system rules, benchmarks, and traces. Flag regressions in behavior, layout, accessibility, or product intent. Suggest the smallest fix and cite the evidence.',
  },
];

const FALLBACK_ORBIT_TEMPLATE: AutomationTemplate = {
  id: 'orbit-daily',
  category: 'orbit',
  kind: 'orbit',
  icon: 'orbit',
  title: 'Daily connector digest.',
  description: 'Refreshes a connector activity digest on a schedule.',
  defaultName: 'Daily connector digest',
  prompt:
    'Survey every connected integration and produce a daily digest of what changed in the last 24 hours. Group the result by people, projects, decisions, and follow-ups. Save the output as a live artifact named `daily_digest.md` and update it in place on each run.',
};

const FALLBACK_LIVE_TEMPLATE: AutomationTemplate = {
  id: 'live-status-board',
  category: 'live-artifact',
  kind: 'live-artifact',
  icon: 'file-code',
  title: 'Keep a live status artifact fresh.',
  description: 'Updates one persistent artifact instead of creating a new report each run.',
  defaultName: 'Live status board',
  prompt:
    "Maintain a single live artifact named `status_board.md`. On each run, update the sections for 'In flight', 'Shipped this week', 'Risks', and 'Decisions made'. Edit in place so the artifact stays stable.",
};

const TEMPLATE_FILTERS: ReadonlyArray<{ id: TemplateFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'orbit', label: 'Orbit' },
  { id: 'live-artifact', label: 'Live artifacts' },
  { id: 'memory', label: 'Memory' },
  { id: 'design-system', label: 'Design systems' },
  { id: 'skills', label: 'Skills' },
  { id: 'connectors', label: 'Connectors' },
  { id: 'compression', label: 'Compression' },
  { id: 'release', label: 'Release' },
  { id: 'quality', label: 'Quality' },
];

const SOURCE_KIND_OPTIONS: ReadonlyArray<{ id: AutomationSourceKind; label: string }> = [
  { id: 'connector', label: 'Connector' },
  { id: 'url', label: 'URL' },
  { id: 'repo', label: 'Repo' },
  { id: 'artifact', label: 'Artifact' },
  { id: 'chat', label: 'Chat' },
  { id: 'upload', label: 'Upload' },
];

const COMPRESSION_OPTIONS: ReadonlyArray<{ id: AutomationTokenCompressionMode; label: string }> = [
  { id: 'balanced', label: 'Balanced' },
  { id: 'aggressive', label: 'Aggressive' },
  { id: 'off', label: 'Off' },
];

type SourceIngestionForm = {
  templateId: string;
  sourceKind: AutomationSourceKind;
  sourceRef: string;
  title: string;
  bodyMarkdown: string;
  connectorId: string;
  tokenCompression: AutomationTokenCompressionMode;
};

const DEFAULT_SOURCE_FORM: SourceIngestionForm = {
  templateId: 'ingest-source-memory-tree',
  sourceKind: 'connector',
  sourceRef: '',
  title: '',
  bodyMarkdown: '',
  connectorId: '',
  tokenCompression: 'balanced',
};

function scheduleStatusLabel(routine: Routine, locale: Locale, pausedLabel: string): string {
  if (!routine.enabled) return pausedLabel;
  return describeScheduleSummary(routine.schedule, locale);
}

function nextRunLabel(routine: Routine, locale: Locale): string {
  if (!routine.enabled) return zhLabel(locale, '仅手动', '僅手動', 'Manual only');
  if (!routine.nextRunAt) return zhLabel(locale, '已计划', '已排程', 'Scheduled');
  const date = new Date(routine.nextRunAt);
  return `${zhLabel(locale, '下次', '下次', 'Next')} ${date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })}`;
}

function formatAutomationTimestamp(ts: number | null | undefined): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function formatRunDuration(run: RoutineRun, locale: Locale): string {
  if (!run.completedAt) return zhLabel(locale, '进行中', '進行中', 'In progress');
  const seconds = Math.max(1, Math.round((run.completedAt - run.startedAt) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder > 0 ? `${minutes}m ${remainder}s` : `${minutes}m`;
}

function statusLabel(status: RoutineRun['status'], locale: Locale): string {
  if (status === 'succeeded') return zhLabel(locale, '成功', '成功', 'Succeeded');
  if (status === 'failed') return zhLabel(locale, '失败', '失敗', 'Failed');
  if (status === 'running') return zhLabel(locale, '运行中', '執行中', 'Running');
  if (status === 'queued') return zhLabel(locale, '排队中', '排隊中', 'Queued');
  return zhLabel(locale, '已取消', '已取消', 'Canceled');
}

function StatusPill({ status }: { status: RoutineRun['status'] }) {
  const { locale } = useI18n();
  return <span className={`automation-status is-${status}`}>{statusLabel(status, locale)}</span>;
}

function templateFromSkill(skill: SkillSummary, kind: AutomationTemplateKind): AutomationTemplate {
  const category = kind === 'orbit' ? 'orbit' : 'live-artifact';
  return {
    id: `skill-${skill.id}`,
    category,
    kind,
    icon: kind === 'orbit' ? 'orbit' : 'file-code',
    title: skill.name,
    description: skill.description || skill.id,
    defaultName: skill.name,
    prompt: skill.examplePrompt || skill.description || `Run ${skill.name}.`,
    skillId: skill.id,
  };
}

function automationTemplateCategory(template: ContractAutomationTemplate): string {
  const tags = new Set(template.tags ?? []);
  if (template.outputSinks.includes('design-system') || tags.has('design-system')) {
    return 'design-system';
  }
  if (template.outputSinks.includes('skill') || tags.has('skills')) {
    return 'skills';
  }
  if (
    tags.has('connectors') ||
    (template.sourceKinds.length > 0 && template.sourceKinds.every((kind) => kind === 'connector'))
  ) {
    return 'connectors';
  }
  if (
    template.tokenCompression === 'aggressive' ||
    tags.has('compression') ||
    tags.has('tokens')
  ) {
    return 'compression';
  }
  if (template.outputSinks.includes('memory') || tags.has('memory')) {
    return 'memory';
  }
  return 'routine';
}

function automationTemplateIcon(category: string): IconName {
  if (category === 'design-system') return 'sliders';
  if (category === 'skills') return 'sparkles';
  if (category === 'connectors') return 'link';
  if (category === 'compression') return 'reload';
  if (category === 'memory') return 'history';
  return 'history';
}

function automationTemplatePrompt(template: ContractAutomationTemplate): string {
  const stages = template.stages.map((stage) => stage.title).join(' -> ');
  return [
    `Use Automation template "${template.id}".`,
    `Purpose: ${template.purpose}`,
    `Sources: ${template.sourceKinds.join(', ')}.`,
    `Trigger modes: ${template.triggerKinds.join(', ')}.`,
    `Pipeline: ${stages}.`,
    `Outputs: ${template.outputSinks.join(', ')}.`,
    `Review policy: ${template.reviewPolicy}. Token compression: ${template.tokenCompression}.`,
    'Produce reviewable proposals with provenance before applying durable memory, skill, automation, or design-system changes.',
  ].join('\n');
}

function templateFromAutomationCatalog(
  template: ContractAutomationTemplate,
): AutomationTemplate {
  const category = automationTemplateCategory(template);
  return {
    id: template.id,
    category,
    kind: 'routine',
    icon: automationTemplateIcon(category),
    title: template.title,
    description: template.description,
    defaultName: template.title,
    prompt: automationTemplatePrompt(template),
  };
}

function dedupeTemplates(templates: AutomationTemplate[]): AutomationTemplate[] {
  const seen = new Set<string>();
  return templates.filter((template) => {
    if (seen.has(template.id)) return false;
    seen.add(template.id);
    return true;
  });
}

function localizeTemplate(template: AutomationTemplate, locale: Locale): AutomationTemplate {
  const map: Record<string, Partial<AutomationTemplate>> = locale === 'zh-CN'
    ? {
        'memory-refresh': { title: '从近期工作刷新项目记忆。', description: '把重复决策、偏好和反馈整理成可复用的记忆更新。', defaultName: '记忆刷新' },
        'design-system-refresh': { title: '从已交付制品更新设计系统。', description: '从近期设计工作中提炼可复用的 token、组件和规则。', defaultName: '设计系统维护' },
        'live-artifact-registry': { title: '审计实时制品并刷新陈旧版本。', description: '让持久化仪表盘、报告和预览保持最新，而不是重复创建。', defaultName: '实时制品维护' },
        'orbit-dashboard': { title: '构建连接器活动仪表盘。', description: '把已选连接器汇总成 Orbit 风格的实时仪表盘。', defaultName: '连接器活动仪表盘' },
        'release-notes': { title: '从已交付设计工作起草发布说明。', description: '把已合并 PR、制品和面向用户的变更串成发布说明。', defaultName: '每周发布说明' },
        'quality-regression-watch': { title: '监控设计与实现回归。', description: '将近期变更与基准、追踪和已接受参考进行比较。', defaultName: '回归监控' },
        'orbit-daily': { title: '每日连接器摘要。', description: '按计划刷新连接器活动摘要。', defaultName: '每日连接器摘要' },
        'live-status-board': { title: '保持实时状态制品最新。', description: '每次运行都更新同一个持久制品，而不是新建报告。', defaultName: '实时状态看板' },
      }
    : locale === 'zh-TW'
      ? {
          'memory-refresh': { title: '從近期工作刷新專案記憶。', description: '把重複決策、偏好與回饋整理成可重用的記憶更新。', defaultName: '記憶刷新' },
          'design-system-refresh': { title: '從已交付制品更新設計系統。', description: '從近期設計工作中提煉可重用的 token、元件與規則。', defaultName: '設計系統維護' },
          'live-artifact-registry': { title: '稽核即時制品並刷新陳舊版本。', description: '讓持久儀表板、報告與預覽保持最新，而不是重複建立。', defaultName: '即時制品維護' },
          'orbit-dashboard': { title: '建立連接器活動儀表板。', description: '把已選連接器彙整成 Orbit 風格的即時儀表板。', defaultName: '連接器活動儀表板' },
          'release-notes': { title: '從已交付設計工作起草發佈說明。', description: '把已合併 PR、制品與面向使用者的變更串成發佈說明。', defaultName: '每週發佈說明' },
          'quality-regression-watch': { title: '監控設計與實作回歸。', description: '將近期變更與基準、追蹤和已接受參考進行比較。', defaultName: '回歸監控' },
          'orbit-daily': { title: '每日連接器摘要。', description: '依排程刷新連接器活動摘要。', defaultName: '每日連接器摘要' },
          'live-status-board': { title: '保持即時狀態制品最新。', description: '每次執行都更新同一個持久制品，而不是建立新報告。', defaultName: '即時狀態看板' },
        }
      : {};
  return map[template.id] ? { ...template, ...map[template.id] } : template;
}

function buildAutomationTemplates(
  designTemplates: SkillSummary[],
  automationCatalog: ContractAutomationTemplate[],
  locale: Locale,
): AutomationTemplate[] {
  const orbit = designTemplates
    .filter((skill) => skill.scenario === 'orbit')
    .map((skill) => templateFromSkill(skill, 'orbit'));
  const live = designTemplates
    .filter((skill) => skill.scenario === 'live')
    .map((skill) => templateFromSkill(skill, 'live-artifact'));

  return dedupeTemplates([
    ...automationCatalog.map(templateFromAutomationCatalog),
    ...(orbit.length > 0 ? orbit : [FALLBACK_ORBIT_TEMPLATE]),
    ...(live.length > 0 ? live : [FALLBACK_LIVE_TEMPLATE]),
    ...STATIC_TEMPLATES,
  ]).map((template) => localizeTemplate(template, locale));
}

function filterTemplates(templates: AutomationTemplate[], filter: TemplateFilter) {
  if (filter === 'all') return templates;
  if (filter === 'orbit' || filter === 'live-artifact') {
    return templates.filter((template) => template.kind === filter);
  }
  return templates.filter((template) => template.category === filter);
}

function kindLabel(kind: AutomationTemplateKind): string {
  if (kind === 'orbit') return 'Orbit';
  if (kind === 'live-artifact') return 'Live artifact';
  return 'Automation';
}

function kindIcon(kind: AutomationTemplateKind): IconName {
  if (kind === 'orbit') return 'orbit';
  if (kind === 'live-artifact') return 'file-code';
  return 'history';
}

function proposalTargetLabel(target: AutomationEvolutionProposal['targetKind']): string {
  if (target === 'memory-node') return 'Memory';
  if (target === 'design-system') return 'Design system';
  if (target === 'skill') return 'Skill';
  return 'Automation template';
}

function proposalActionLabel(action: AutomationEvolutionProposal['action']): string {
  if (action === 'create') return 'Create';
  if (action === 'update') return 'Update';
  if (action === 'merge') return 'Merge';
  if (action === 'move') return 'Move';
  if (action === 'delete') return 'Delete';
  return 'Promote';
}

function zhLabel(locale: Locale, simplified: string, traditional: string, fallback: string): string {
  if (locale === 'zh-CN') return simplified;
  if (locale === 'zh-TW') return traditional;
  return fallback;
}

export function TasksView({ skills = [], designTemplates = [], connectors = [] }: Props) {
  const { locale } = useI18n();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [templateFilter, setTemplateFilter] = useState<TemplateFilter>('all');
  const [automationCatalog, setAutomationCatalog] = useState<ContractAutomationTemplate[]>([]);
  const [proposals, setProposals] = useState<AutomationEvolutionProposal[]>([]);
  const [sourcePackets, setSourcePackets] = useState<AutomationContentPacket[]>([]);
  const [sourceForm, setSourceForm] = useState<SourceIngestionForm>(DEFAULT_SOURCE_FORM);
  const [proposalBusyId, setProposalBusyId] = useState<string | null>(null);
  const [ingestingSource, setIngestingSource] = useState(false);
  const [crystallizingRunId, setCrystallizingRunId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [historyTick, setHistoryTick] = useState(0);

  const templates = useMemo(
    () => buildAutomationTemplates(designTemplates, automationCatalog, locale),
    [automationCatalog, designTemplates, locale],
  );
  const filteredTemplates = useMemo(
    () => filterTemplates(templates, templateFilter),
    [templates, templateFilter],
  );
  const l = useMemo(
    () => ({
      scheduledAgentSessions: zhLabel(locale, '定时代理会话', '排程代理工作階段', 'Scheduled agent sessions'),
      automations: zhLabel(locale, '自动化', '自動化', 'Automations'),
      lede: zhLabel(locale, '为项目工作、Orbit 摘要和实时产物规划周期性对话。', '為專案工作、Orbit 摘要和即時產物規劃週期性對話。', 'Plan recurring conversations for project work, Orbit digests, and live artifacts.'),
      automationSummary: zhLabel(locale, '自动化摘要', '自動化摘要', 'Automation summary'),
      active: zhLabel(locale, '运行中', '運行中', 'Active'),
      paused: zhLabel(locale, '已暂停', '已暫停', 'Paused'),
      templates: zhLabel(locale, '模板', '範本', 'Templates'),
      newAutomation: zhLabel(locale, '新建自动化', '新增自動化', 'New automation'),
      yourAutomations: zhLabel(locale, '你的自动化', '你的自動化', 'Your automations'),
      noAutomationsYet: zhLabel(locale, '还没有自动化', '還沒有自動化', 'No automations yet'),
      createFromTemplate: zhLabel(locale, '从模板创建，或从空白计划开始。', '從範本建立，或從空白排程開始。', 'Create one from a template or start with a blank schedule.'),
      newProjectEachRun: zhLabel(locale, '每次运行都创建新项目', '每次執行都建立新專案', 'New project each run'),
      lastRun: zhLabel(locale, '上次运行', '上次執行', 'Last run'),
      openResult: zhLabel(locale, '打开结果', '開啟結果', 'Open result'),
      runNowTitle: zhLabel(locale, '立即运行并打开对话', '立即執行並開啟對話', 'Run now and open the conversation'),
      run: zhLabel(locale, '运行', '執行', 'Run'),
      hideHistory: zhLabel(locale, '隐藏历史', '隱藏歷史', 'Hide history'),
      history: zhLabel(locale, '历史', '歷史', 'History'),
      edit: zhLabel(locale, '编辑', '編輯', 'Edit'),
      pause: zhLabel(locale, '暂停', '暫停', 'Pause'),
      resume: zhLabel(locale, '恢复', '恢復', 'Resume'),
      deleteAutomation: zhLabel(locale, '删除自动化', '刪除自動化', 'Delete automation'),
      deleteAutomationTitle: zhLabel(locale, '删除此自动化', '刪除此自動化', 'Delete this automation'),
      deleteConfirm: zhLabel(locale, '删除这个自动化？过去的运行和对应项目会保留。', '刪除這個自動化？過去的執行和對應專案會保留。', 'Delete this automation? Past runs and their projects are kept.'),
      ingestSource: zhLabel(locale, '导入来源', '匯入來源', 'Ingest source'),
      ingestSourceSub: zhLabel(locale, '将连接器、仓库、产物或聊天上下文转成可审查的演进提案。', '將連接器、儲存庫、產物或聊天脈絡轉成可審查的演進提案。', 'Turn connector, repo, artifact, or chat context into reviewable evolution proposals.'),
      recent: zhLabel(locale, '最近', '最近', 'recent'),
      template: zhLabel(locale, '模板', '範本', 'Template'),
      source: zhLabel(locale, '来源', '來源', 'Source'),
      compression: zhLabel(locale, '压缩', '壓縮', 'Compression'),
      connector: zhLabel(locale, '连接器', '連接器', 'Connector'),
      anyConnectedSource: zhLabel(locale, '任意已连接来源', '任何已連線來源', 'Any connected source'),
      title: zhLabel(locale, '标题', '標題', 'Title'),
      titlePlaceholder: zhLabel(locale, '决策、品牌备注、工作流模式……', '決策、品牌備註、工作流程模式……', 'Decision, brand notes, workflow pattern...'),
      sourceRef: zhLabel(locale, '来源引用', '來源參照', 'Source ref'),
      sourceRefPlaceholder: zhLabel(locale, 'URL、仓库路径、连接器事件 ID、产物 ID……', 'URL、儲存庫路徑、連接器事件 ID、產物 ID……', 'URL, repo path, connector event id, artifact id...'),
      content: zhLabel(locale, '内容', '內容', 'Content'),
      contentPlaceholder: zhLabel(locale, '粘贴要规范化为来源包和提案的内容。', '貼上要標準化為來源封包和提案的內容。', 'Paste the content to canonicalize into a source packet and proposals.'),
      recentSourcePackets: zhLabel(locale, '最近来源包', '最近來源封包', 'Recent source packets'),
      noSourcePacketsYet: zhLabel(locale, '还没有来源包。', '還沒有來源封包。', 'No source packets yet.'),
      ingesting: zhLabel(locale, '导入中', '匯入中', 'Ingesting'),
      ingest: zhLabel(locale, '导入', '匯入', 'Ingest'),
      evolutionProposals: zhLabel(locale, '演进提案', '演進提案', 'Evolution proposals'),
      evolutionProposalsSub: zhLabel(locale, '在变更记忆、技能或设计系统之前先审查自动化输出。', '在變更記憶、技能或設計系統之前先審查自動化輸出。', 'Review automation output before it changes memory, skills, or design systems.'),
      pending: zhLabel(locale, '待处理', '待處理', 'pending'),
      apply: zhLabel(locale, '应用', '套用', 'Apply'),
      reject: zhLabel(locale, '拒绝', '拒絕', 'Reject'),
      loading: zhLabel(locale, '加载中', '載入中', 'Loading'),
      memory: zhLabel(locale, '记忆', '記憶', 'Memory'),
      designSystem: zhLabel(locale, '设计系统', '設計系統', 'Design system'),
      skill: zhLabel(locale, '技能', '技能', 'Skill'),
      automationTemplate: zhLabel(locale, '自动化模板', '自動化範本', 'Automation template'),
      create: zhLabel(locale, '创建', '建立', 'Create'),
      update: zhLabel(locale, '更新', '更新', 'Update'),
      merge: zhLabel(locale, '合并', '合併', 'Merge'),
      move: zhLabel(locale, '移动', '移動', 'Move'),
      delete: zhLabel(locale, '删除', '刪除', 'Delete'),
      promote: zhLabel(locale, '提升', '提升', 'Promote'),
      orbit: 'Orbit',
      liveArtifact: zhLabel(locale, '实时产物', '即時產物', 'Live artifact'),
      automation: zhLabel(locale, '自动化', '自動化', 'Automation'),
      templatesSub: zhLabel(locale, 'Orbit 和实时产物都是同一自动化流程中的模板。', 'Orbit 和即時產物都是同一自動化流程中的範本。', 'Orbit and live artifacts are templates inside the same automation flow.'),
      templateFilters: zhLabel(locale, '模板筛选', '範本篩選', 'Template filters'),
      useTemplate: zhLabel(locale, '使用模板', '使用範本', 'Use template'),
      all: zhLabel(locale, '全部', '全部', 'All'),
      designSystems: zhLabel(locale, '设计系统', '設計系統', 'Design systems'),
      skills: zhLabel(locale, '技能', '技能', 'Skills'),
      connectorsPlural: zhLabel(locale, '连接器', '連接器', 'Connectors'),
      compressionPlural: zhLabel(locale, '压缩', '壓縮', 'Compression'),
      release: zhLabel(locale, '发布', '發佈', 'Release'),
      quality: zhLabel(locale, '质量', '品質', 'Quality'),
      repo: zhLabel(locale, '仓库', '儲存庫', 'Repo'),
      artifact: zhLabel(locale, '产物', '產物', 'Artifact'),
      chat: zhLabel(locale, '聊天', '聊天', 'Chat'),
      upload: zhLabel(locale, '上传', '上傳', 'Upload'),
      balanced: zhLabel(locale, '平衡', '平衡', 'Balanced'),
      aggressive: zhLabel(locale, '激进', '積極', 'Aggressive'),
      off: zhLabel(locale, '关闭', '關閉', 'Off'),
      pasteSourceFirst: zhLabel(locale, '请先粘贴来源内容再导入。', '請先貼上來源內容再匯入。', 'Paste source content before ingesting it.'),
    }),
    [locale],
  );
  const templateFilters = useMemo(
    () =>
      TEMPLATE_FILTERS.map((filter) => ({
        ...filter,
        label:
          filter.id === 'all'
            ? l.all
            : filter.id === 'orbit'
              ? l.orbit
              : filter.id === 'live-artifact'
                ? l.liveArtifact
                : filter.id === 'memory'
                  ? l.memory
                  : filter.id === 'design-system'
                    ? l.designSystems
                    : filter.id === 'skills'
                      ? l.skills
                      : filter.id === 'connectors'
                        ? l.connectorsPlural
                        : filter.id === 'compression'
                          ? l.compressionPlural
                          : filter.id === 'release'
                            ? l.release
                            : l.quality,
      })),
    [l],
  );
  const sourceKindOptions = useMemo(
    () =>
      SOURCE_KIND_OPTIONS.map((option) => ({
        ...option,
        label:
          option.id === 'connector'
            ? l.connector
            : option.id === 'repo'
              ? l.repo
              : option.id === 'artifact'
                ? l.artifact
                : option.id === 'chat'
                  ? l.chat
                  : option.id === 'upload'
                    ? l.upload
                    : option.label,
      })),
    [l],
  );
  const compressionOptions = useMemo(
    () =>
      COMPRESSION_OPTIONS.map((option) => ({
        ...option,
        label:
          option.id === 'balanced'
            ? l.balanced
            : option.id === 'aggressive'
              ? l.aggressive
              : l.off,
      })),
    [l],
  );

  const refresh = useCallback(async () => {
    try {
      const templateRequest = fetch('/api/automation-templates')
        .then(async (res) => {
          if (!res.ok) return null;
          return (await res.json()) as AutomationTemplateListResponse;
        })
        .catch(() => null);
      const proposalRequest = fetch('/api/automation-proposals?status=pending-review')
        .then(async (res) => {
          if (!res.ok) return null;
          return (await res.json()) as AutomationEvolutionProposalListResponse;
        })
        .catch(() => null);
      const sourcePacketRequest = fetch('/api/automation-source-packets?limit=3')
        .then(async (res) => {
          if (!res.ok) return null;
          return (await res.json()) as AutomationSourcePacketListResponse;
        })
        .catch(() => null);
      const [rRes, pRes, tJson, proposalJson, sourcePacketJson] = await Promise.all([
        fetch('/api/routines'),
        fetch('/api/projects'),
        templateRequest,
        proposalRequest,
        sourcePacketRequest,
      ]);
      if (!rRes.ok) throw new Error(`routines: ${rRes.status}`);
      const rJson = await rRes.json();
      setRoutines(rJson.routines ?? []);
      if (pRes.ok) {
        const pJson = await pRes.json();
        setProjects(
          (pJson.projects ?? []).map((p: ProjectSummary) => ({
            id: p.id,
            name: p.name,
          })),
        );
      }
      if (tJson) {
        setAutomationCatalog(Array.isArray(tJson.templates) ? tJson.templates : []);
      }
      if (proposalJson) {
        setProposals(Array.isArray(proposalJson.proposals) ? proposalJson.proposals : []);
      }
      if (sourcePacketJson) {
        setSourcePackets(Array.isArray(sourcePacketJson.packets) ? sourcePacketJson.packets : []);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const projectsById = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of projects) map.set(p.id, p.name);
    return map;
  }, [projects]);

  const activeCount = routines.filter((routine) => routine.enabled).length;
  const pausedCount = routines.length - activeCount;
  const sourceIngestionTemplates = useMemo(
    () =>
      automationCatalog.filter((template) =>
        template.stages.some((stage) => stage.kind === 'ingest' || stage.kind === 'propose'),
      ),
    [automationCatalog],
  );

  const patchSourceForm = (patch: Partial<SourceIngestionForm>) => {
    setSourceForm((current) => ({ ...current, ...patch }));
  };

  const submitSourceIngestion = async () => {
    if (!sourceForm.bodyMarkdown.trim()) {
      setError(l.pasteSourceFirst);
      return;
    }
    setIngestingSource(true);
    setError(null);
    try {
      const res = await fetch('/api/automation-ingestions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          templateId: sourceForm.templateId || undefined,
          sourceKind: sourceForm.sourceKind,
          sourceRef: sourceForm.sourceRef || undefined,
          title: sourceForm.title || undefined,
          bodyMarkdown: sourceForm.bodyMarkdown,
          connectorId:
            sourceForm.sourceKind === 'connector' && sourceForm.connectorId
              ? sourceForm.connectorId
              : undefined,
          tokenCompression: sourceForm.tokenCompression,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `ingestion failed: ${res.status}`);
      }
      const json = (await res.json()) as AutomationSourceIngestionResponse;
      setSourcePackets((current) => [json.packet, ...current].slice(0, 3));
      setSourceForm((current) => ({
        ...current,
        title: '',
        sourceRef: '',
        bodyMarkdown: '',
      }));
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIngestingSource(false);
    }
  };

  const reviewProposal = async (id: string, action: 'apply' | 'reject') => {
    setProposalBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/automation-proposals/${id}/${action}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: action === 'reject' ? JSON.stringify({ reason: 'Dismissed in Automations' }) : '{}',
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `${action} failed: ${res.status}`);
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setProposalBusyId(null);
    }
  };

  const runNow = async (id: string) => {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/routines/${id}/run`, { method: 'POST' });
      if (!res.ok && res.status !== 202) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `run failed: ${res.status}`);
      }
      const j = await res.json().catch(() => null);
      if (j?.projectId) {
        navigate({
          kind: 'project',
          projectId: j.projectId,
          conversationId: j.conversationId ?? null,
          fileName: null,
        });
        return;
      }
      void refresh();
      setExpandedId(id);
      setHistoryTick((tick) => tick + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyId(null);
    }
  };

  const crystallizeRun = async (routineId: string, runId: string) => {
    setCrystallizingRunId(runId);
    setError(null);
    try {
      const res = await fetch(`/api/routines/${routineId}/runs/${runId}/crystallize`, {
        method: 'POST',
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `crystallize failed: ${res.status}`);
      }
      const json = (await res.json()) as RoutineRunCrystallizeResponse;
      setSourcePackets((current) => [json.packet, ...current].slice(0, 3));
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCrystallizingRunId(null);
    }
  };

  const togglePaused = async (routine: Routine) => {
    setBusyId(routine.id);
    try {
      const res = await fetch(`/api/routines/${routine.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ enabled: !routine.enabled }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `update failed: ${res.status}`);
      }
      void refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm(l.deleteConfirm))
      return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/routines/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `delete failed: ${res.status}`);
      }
      if (expandedId === id) setExpandedId(null);
      void refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="automations-view" aria-labelledby="automations-title" data-testid="tasks-view">
      <header className="automations-hero">
        <div className="automations-hero__copy">
          <span className="automations-hero__eyebrow">{l.scheduledAgentSessions}</span>
          <h1 id="automations-title" className="automations-hero__title">
            {l.automations}
          </h1>
          <p className="automations-hero__lede">
            {l.lede}
          </p>
        </div>
        <div className="automations-hero__actions">
          <div className="automations-metrics" aria-label={l.automationSummary}>
            <Metric label={l.active} value={activeCount} />
            <Metric label={l.paused} value={pausedCount} />
            <Metric label={l.templates} value={templates.length} />
          </div>
          <button
            type="button"
            className="automations-view__new"
            onClick={() => setModal({ kind: 'create' })}
            data-testid="automations-new"
          >
            <Icon name="plus" size={14} />
            <span>{l.newAutomation}</span>
          </button>
        </div>
      </header>

      {error ? (
        <div className="automations-view__error" role="alert">
          {error}
        </div>
      ) : null}

      <section className="automations-saved" aria-label={l.yourAutomations}>
        <div className="automations-section-head">
          <h2 className="automations-section__label">{l.yourAutomations}</h2>
          {loading ? <span className="automations-section__meta">{l.loading}</span> : null}
        </div>
        {!loading && routines.length === 0 ? (
          <button
            type="button"
            className="automation-empty"
            onClick={() => setModal({ kind: 'create' })}
          >
            <span className="automation-empty__icon">
              <Icon name="plus" size={16} />
            </span>
            <span className="automation-empty__body">
              <strong>{l.noAutomationsYet}</strong>
              <span>{l.createFromTemplate}</span>
            </span>
          </button>
        ) : null}
        {routines.length > 0 ? (
          <ul className="automations-saved__list">
            {routines.map((r) => {
              const isBusy = busyId === r.id;
              const targetLabel =
                r.target.mode === 'reuse'
                  ? projectsById.get(r.target.projectId) ?? r.target.projectId
                  : l.newProjectEachRun;
              const isExpanded = expandedId === r.id;
              return (
                <li
                  key={r.id}
                  className={`automation-row${r.enabled ? '' : ' is-paused'}`}
                >
                  <div className="automation-row__main">
                    <span className="automation-row__icon">
                      <Icon name={r.skillId ? 'sparkles' : 'history'} size={15} />
                    </span>
                    <span className="automation-row__content">
                      <span className="automation-row__title">{r.name}</span>
                      <span className="automation-row__meta">
                        <span>{scheduleStatusLabel(r, locale, l.paused)}</span>
                        <span aria-hidden="true">·</span>
                        <span>{targetLabel}</span>
                        <span aria-hidden="true">·</span>
                        <span>{nextRunLabel(r, locale)}</span>
                      </span>
                      {r.prompt ? (
                        <span className="automation-row__prompt">{r.prompt}</span>
                      ) : null}
                      {r.lastRun ? (
                        <span className="automation-row__last-run">
                          <StatusPill status={r.lastRun.status} />
                          <span>{l.lastRun} {formatAutomationTimestamp(r.lastRun.startedAt)}</span>
                          <span aria-hidden="true">·</span>
                          <button
                            type="button"
                            className="automation-inline-link"
                            onClick={() =>
                              navigate({
                                kind: 'project',
                                projectId: r.lastRun!.projectId,
                                conversationId: r.lastRun!.conversationId,
                                fileName: null,
                              })
                            }
                          >
                            {l.openResult}
                          </button>
                        </span>
                      ) : null}
                    </span>
                  </div>
                  <div className="automation-row__actions">
                    <button
                      type="button"
                      className="automation-row__btn"
                      onClick={() => runNow(r.id)}
                      disabled={isBusy}
                      title={l.runNowTitle}
                    >
                      <Icon name="play" size={12} />
                      <span>{l.run}</span>
                    </button>
                    <button
                      type="button"
                      className="automation-row__btn"
                      onClick={() => {
                        setExpandedId(isExpanded ? null : r.id);
                        if (!isExpanded) setHistoryTick((tick) => tick + 1);
                      }}
                      aria-expanded={isExpanded}
                    >
                      <Icon name="history" size={12} />
                      <span>{isExpanded ? l.hideHistory : l.history}</span>
                    </button>
                    <button
                      type="button"
                      className="automation-row__btn"
                      onClick={() => setModal({ kind: 'edit', routine: r })}
                      disabled={isBusy}
                    >
                      <Icon name="edit" size={12} />
                      <span>{l.edit}</span>
                    </button>
                    <button
                      type="button"
                      className="automation-row__btn"
                      onClick={() => togglePaused(r)}
                      disabled={isBusy}
                    >
                      {r.enabled ? l.pause : l.resume}
                    </button>
                    <button
                      type="button"
                      className="automation-row__btn automation-row__btn--danger"
                      onClick={() => remove(r.id)}
                      disabled={isBusy}
                      aria-label={l.deleteAutomation}
                      title={l.deleteAutomationTitle}
                    >
                      <Icon name="trash" size={12} />
                    </button>
                  </div>
                  {isExpanded ? (
                    <AutomationRunHistory
                      routineId={r.id}
                      refreshKey={historyTick}
                      crystallizingRunId={crystallizingRunId}
                      onCrystallizeRun={crystallizeRun}
                    />
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>

      <section className="automations-ingest" aria-label={l.ingestSource}>
        <div className="automations-section-head">
          <div>
            <h2 className="automations-section__label">{l.ingestSource}</h2>
            <p className="automations-section__sub">
              {l.ingestSourceSub}
            </p>
          </div>
          <span className="automations-section__meta">{sourcePackets.length} {l.recent}</span>
        </div>
        <div className="automation-ingest-panel">
          <div className="automation-ingest-controls">
            <label className="automation-ingest-field">
              <span>{l.template}</span>
              <select
                value={sourceForm.templateId}
                onChange={(event) => patchSourceForm({ templateId: event.currentTarget.value })}
              >
                {sourceIngestionTemplates.length === 0 ? (
                  <option value={sourceForm.templateId}>{sourceForm.templateId}</option>
                ) : null}
                {sourceIngestionTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="automation-ingest-field">
              <span>{l.source}</span>
              <select
                value={sourceForm.sourceKind}
                onChange={(event) =>
                  patchSourceForm({ sourceKind: event.currentTarget.value as AutomationSourceKind })
                }
              >
                {sourceKindOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="automation-ingest-field">
              <span>{l.compression}</span>
              <select
                value={sourceForm.tokenCompression}
                onChange={(event) =>
                  patchSourceForm({
                    tokenCompression: event.currentTarget.value as AutomationTokenCompressionMode,
                  })
                }
              >
                {compressionOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            {sourceForm.sourceKind === 'connector' ? (
              <label className="automation-ingest-field">
                <span>{l.connector}</span>
                <select
                  value={sourceForm.connectorId}
                  onChange={(event) => patchSourceForm({ connectorId: event.currentTarget.value })}
                >
                  <option value="">{l.anyConnectedSource}</option>
                  {connectors.map((connector) => (
                    <option key={connector.id} value={connector.id}>
                      {connector.name}
                      {connector.accountLabel ? ` · ${connector.accountLabel}` : ''}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
          <div className="automation-ingest-fields">
            <label className="automation-ingest-field">
              <span>{l.title}</span>
              <input
                value={sourceForm.title}
                onChange={(event) => patchSourceForm({ title: event.currentTarget.value })}
                placeholder={l.titlePlaceholder}
              />
            </label>
            <label className="automation-ingest-field">
              <span>{l.sourceRef}</span>
              <input
                value={sourceForm.sourceRef}
                onChange={(event) => patchSourceForm({ sourceRef: event.currentTarget.value })}
                placeholder={l.sourceRefPlaceholder}
              />
            </label>
          </div>
          <label className="automation-ingest-field automation-ingest-field--body">
            <span>{l.content}</span>
            <textarea
              value={sourceForm.bodyMarkdown}
              onChange={(event) => patchSourceForm({ bodyMarkdown: event.currentTarget.value })}
              placeholder={l.contentPlaceholder}
            />
          </label>
          <div className="automation-ingest-footer">
            {sourcePackets.length > 0 ? (
              <ul className="automation-ingest-recent" aria-label={l.recentSourcePackets}>
                {sourcePackets.map((packet) => (
                  <li key={packet.id}>
                    <span>{packet.title}</span>
                    <small>
                      {packet.sourceKind} · {packet.tokenStats.originalTokens} tokens
                    </small>
                  </li>
                ))}
              </ul>
            ) : (
              <span className="automation-ingest-empty">{l.noSourcePacketsYet}</span>
            )}
            <button
              type="button"
              className="automations-view__new"
              onClick={submitSourceIngestion}
              disabled={ingestingSource}
            >
              <Icon name="sparkles" size={14} />
              <span>{ingestingSource ? l.ingesting : l.ingest}</span>
            </button>
          </div>
        </div>
      </section>

      {proposals.length > 0 ? (
        <section className="automations-saved" aria-label={l.evolutionProposals}>
          <div className="automations-section-head">
            <div>
              <h2 className="automations-section__label">{l.evolutionProposals}</h2>
              <p className="automations-section__sub">
                {l.evolutionProposalsSub}
              </p>
            </div>
            <span className="automations-section__meta">{proposals.length} {l.pending}</span>
          </div>
          <ul className="automations-saved__list">
            {proposals.map((proposal) => {
              const isBusy = proposalBusyId === proposal.id;
              return (
                <li key={proposal.id} className="automation-row">
                  <div className="automation-row__main">
                    <span className="automation-row__icon">
                      <Icon
                        name={proposal.targetKind === 'design-system' ? 'sliders' : 'sparkles'}
                        size={15}
                      />
                    </span>
                    <span className="automation-row__content">
                      <span className="automation-row__title">{proposal.title}</span>
                      <span className="automation-row__meta">
                        <span>
                          {proposal.targetKind === 'memory-node'
                            ? l.memory
                            : proposal.targetKind === 'design-system'
                              ? l.designSystem
                              : proposal.targetKind === 'skill'
                                ? l.skill
                                : l.automationTemplate}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {proposal.action === 'create'
                            ? l.create
                            : proposal.action === 'update'
                              ? l.update
                              : proposal.action === 'merge'
                                ? l.merge
                                : proposal.action === 'move'
                                  ? l.move
                                  : proposal.action === 'delete'
                                    ? l.delete
                                    : l.promote}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{proposal.reviewPolicy}</span>
                      </span>
                      <span className="automation-row__prompt">{proposal.summary}</span>
                      {proposal.patch.diffSummary ? (
                        <span className="automation-row__last-run">
                          {proposal.patch.diffSummary}
                        </span>
                      ) : null}
                    </span>
                  </div>
                  <div className="automation-row__actions">
                    <button
                      type="button"
                      className="automation-row__btn"
                      onClick={() => reviewProposal(proposal.id, 'apply')}
                      disabled={isBusy}
                    >
                      <Icon name="check" size={12} />
                      <span>{l.apply}</span>
                    </button>
                    <button
                      type="button"
                      className="automation-row__btn automation-row__btn--danger"
                      onClick={() => reviewProposal(proposal.id, 'reject')}
                      disabled={isBusy}
                    >
                      {l.reject}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section className="automations-templates" aria-label={l.templates}>
        <div className="automations-section-head">
          <div>
            <h2 className="automations-section__label">{l.templates}</h2>
            <p className="automations-section__sub">
              {l.templatesSub}
            </p>
          </div>
          <div className="automations-template-tabs" role="tablist" aria-label={l.templateFilters}>
            {templateFilters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                role="tab"
                aria-selected={templateFilter === filter.id}
                className={`automations-template-tab${templateFilter === filter.id ? ' is-active' : ''}`}
                onClick={() => setTemplateFilter(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="automations-templates__grid">
          {filteredTemplates.map((template) => (
            <button
              key={template.id}
              type="button"
              className={`automation-template-card is-${template.kind}`}
              onClick={() => setModal({ kind: 'create', template })}
            >
              <span className="automation-template-card__icon" aria-hidden="true">
                <Icon name={template.icon} size={16} />
              </span>
              <span className="automation-template-card__body">
                <span className="automation-template-card__kicker">
                  <Icon name={kindIcon(template.kind)} size={11} />
                  {template.kind === 'orbit' ? l.orbit : template.kind === 'live-artifact' ? l.liveArtifact : l.automation}
                </span>
                <span className="automation-template-card__title">{template.title}</span>
                <span className="automation-template-card__desc">{template.description}</span>
                <span className="automation-template-card__cta">
                  {l.useTemplate}
                  <Icon name="chevron-right" size={12} />
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <NewAutomationModal
        open={modal !== null}
        initial={
          modal?.kind === 'edit'
            ? { routine: modal.routine }
            : modal?.kind === 'create' && modal.template
              ? { template: modal.template }
              : null
        }
        templates={templates}
        projects={projects}
        skills={skills}
        connectors={connectors}
        onClose={() => setModal(null)}
        onSaved={() => {
          void refresh();
        }}
      />
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="automations-metric">
      <span className="automations-metric__value">{value}</span>
      <span className="automations-metric__label">{label}</span>
    </div>
  );
}

function AutomationRunHistory({
  routineId,
  refreshKey,
  crystallizingRunId,
  onCrystallizeRun,
}: {
  routineId: string;
  refreshKey: number;
  crystallizingRunId: string | null;
  onCrystallizeRun: (routineId: string, runId: string) => void;
}) {
  const { locale } = useI18n();
  const l = useMemo(
    () => ({
      loading: zhLabel(locale, '正在加载运行历史……', '正在載入執行歷史……', 'Loading run history...'),
      empty: zhLabel(locale, '还没有运行记录。', '還沒有執行記錄。', 'No runs yet.'),
      aria: zhLabel(locale, '自动化运行历史', '自動化執行歷史', 'Automation run history'),
      title: zhLabel(locale, '运行历史', '執行歷史', 'Run history'),
      latest10: zhLabel(locale, '最新 10 条', '最新 10 筆', 'Latest 10'),
      crystallizeTitle: zhLabel(locale, '根据这次运行起草技能和记忆提案', '根據這次執行起草技能與記憶提案', 'Draft skill and memory proposals from this run'),
      crystallizing: zhLabel(locale, '结晶中', '結晶中', 'Crystallizing'),
      crystallize: zhLabel(locale, '结晶化', '結晶化', 'Crystallize'),
      openConversation: zhLabel(locale, '打开对话', '開啟對話', 'Open conversation'),
    }),
    [locale],
  );
  const [runs, setRuns] = useState<RoutineRun[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setRuns(null);
    void (async () => {
      try {
        const res = await fetch(`/api/routines/${routineId}/runs?limit=10`);
        if (!res.ok) throw new Error(`runs: ${res.status}`);
        const json = await res.json();
        if (!cancelled) setRuns(json.runs ?? []);
      } catch {
        if (!cancelled) setRuns([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshKey, routineId]);

  if (runs === null) {
    return <div className="automation-history automation-history--empty">{l.loading}</div>;
  }

  if (runs.length === 0) {
    return <div className="automation-history automation-history--empty">{l.empty}</div>;
  }

  return (
    <div className="automation-history" aria-label={l.aria}>
      <div className="automation-history__head">
        <span>{l.title}</span>
        <span>{l.latest10}</span>
      </div>
      <ul className="automation-history__list">
        {runs.map((run) => (
          <li key={run.id} className="automation-history__row">
            <div className="automation-history__status">
              <StatusPill status={run.status} />
              <span>{run.trigger}</span>
            </div>
            <div className="automation-history__meta">
              <span>{formatAutomationTimestamp(run.startedAt)}</span>
              <span aria-hidden="true">·</span>
              <span>{formatRunDuration(run)}</span>
              <span aria-hidden="true">·</span>
              <span>{run.agentRunId}</span>
            </div>
            {run.summary || run.error ? (
              <div className={`automation-history__message${run.error ? ' is-error' : ''}`}>
                {run.error ?? run.summary}
              </div>
            ) : null}
            <div className="automation-history__actions">
              {run.status === 'succeeded' ? (
                <button
                  type="button"
                  className="automation-history__open"
                  onClick={() => onCrystallizeRun(routineId, run.id)}
                  disabled={crystallizingRunId === run.id}
                  title={l.crystallizeTitle}
                >
                  <Icon name="sparkles" size={12} />
                  <span>{crystallizingRunId === run.id ? l.crystallizing : l.crystallize}</span>
                </button>
              ) : null}
              <button
                type="button"
                className="automation-history__open"
                onClick={() =>
                  navigate({
                    kind: 'project',
                    projectId: run.projectId,
                    conversationId: run.conversationId,
                    fileName: null,
                  })
                }
              >
                {l.openConversation}
                <Icon name="chevron-right" size={12} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
