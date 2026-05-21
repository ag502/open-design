import { useMemo, useState } from 'react';
import { useI18n, useT, type Locale } from '../i18n';
import type { DirectionCard, FormOption, QuestionForm } from '../artifacts/question-form';
import { formatFormAnswers, formOptionValueForLabel } from '../artifacts/question-form';

interface Props {
  form: QuestionForm;
  // Whether the user can still submit answers. The owning AssistantMessage
  // disables the form when the assistant turn is no longer the most recent
  // one (i.e. the user has already moved past it).
  interactive: boolean;
  // Pre-existing answers — when we detect a follow-up user message that
  // begins with "[form answers — <id>]", we parse it back out and pass it
  // here so the rendered form reflects what was sent.
  submittedAnswers?: Record<string, string | string[]>;
  onSubmit?: (text: string, answers: Record<string, string | string[]>) => void;
}

type QuestionFormCopy = {
  strings: Record<string, string>;
  patterns?: Array<{ pattern: RegExp; replace: (match: RegExpMatchArray) => string }>;
};

const ZH_CN_QUESTION_FORM_COPY: QuestionFormCopy = {
  strings: {
    'Quick brief': '快速简报',
    'Quick brief — 30 seconds': '快速简报 - 30 秒',
    'Choose the task type': '选择任务类型',
    "I'll route this through the right Open Design workflow and lock the brief in one shot. Skip what doesn't apply — I'll fill defaults.":
      '我会把它路由到合适的 Open Design 工作流，并一次性锁定简报。不适用的可跳过，我会补默认值。',
    "I'll route the free-form prompt through the right Open Design workflow.":
      '我会把自由输入的需求路由到合适的 Open Design 工作流。',
    "I'll lock these in before building. Skip what doesn't apply — I'll fill defaults.":
      '开始构建前我会先锁定这些信息。不适用的可跳过，我会补默认值。',
    'What should I build?': '要构建什么？',
    'What are we making?': '我们要做什么？',
    'Target platform': '目标平台',
    'Target user': '目标用户',
    'Who is this for?': '面向谁？',
    'Visual tone': '视觉调性',
    'Brand context': '品牌背景',
    'Roughly how much?': '大致规模？',
    'Any important constraints?': '有什么重要限制？',
    'Anything else I should know?': '还有什么需要我知道？',
    "What's the angle / hook of this dating app?": '这个约会应用的切入点 / 亮点是什么？',
    'Prototype': '原型',
    'Live artifact': '实时产物',
    'Slide deck': '演示文稿',
    'Image': '图片',
    'Video': '视频',
    'HyperFrames': 'HyperFrames',
    'Audio': '音频',
    'Other': '其他',
    'Slide deck / pitch': '演示文稿 / 路演',
    'Single web prototype / landing': '单页网页原型 / 落地页',
    'Multi-screen app prototype': '多屏应用原型',
    'Dashboard / tool UI': '仪表盘 / 工具界面',
    'Editorial / marketing page': '编辑式 / 营销页面',
    "Other — I'll describe": '其他 - 我来描述',
    'Responsive web': '响应式网页',
    'Desktop web': '桌面网页',
    'iOS app': 'iOS 应用',
    'Android app': 'Android 应用',
    'Tablet': '平板',
    'Tablet app': '平板应用',
    'Desktop app': '桌面应用',
    'Fixed canvas (1920×1080)': '固定画布 (1920×1080)',
    'Editorial / magazine': '编辑 / 杂志感',
    'Modern minimal': '现代极简',
    'Playful / illustrative': '活泼 / 插画感',
    'Tech / utility': '科技 / 工具感',
    'Luxury / refined': '奢华 / 精致',
    'Brutalist / experimental': '粗野主义 / 实验性',
    'Human / approachable': '亲和 / 易接近',
    'Pick a direction for me': '帮我选一个方向',
    "I have a brand spec — I'll share it": '我有品牌规范 - 稍后分享',
    "Match a reference site / screenshot — I'll attach it": '匹配参考网站 / 截图 - 稍后上传',
    'Audience, brand, format, length, aspect ratio, references, things to avoid...':
      '受众、品牌、格式、长度、宽高比、参考资料、需要避免的内容...',
    'e.g. early-stage investors, dev-tools buyers, internal exec review':
      '例如：早期投资人、开发者工具买家、内部高管评审',
    'e.g. 8 slides, 1 landing + 3 sub-pages, 4 mobile screens, 30s video':
      '例如：8 页幻灯片、1 个落地页 + 3 个子页面、4 个移动端界面、30 秒视频',
    'e.g. 8 slides, 1 landing + 3 sub-pages, 4 mobile screens':
      '例如：8 页幻灯片、1 个落地页 + 3 个子页面、4 个移动端界面',
    'Real copy, fonts you must use, things to avoid, deadline…':
      '真实文案、必须使用的字体、需要避免的内容、截止时间等...',
  },
  patterns: [
    {
      pattern: /^What's the angle \/ hook of this (.+)\?$/i,
      replace: (match) => `这个${match[1] ?? '项目'}的切入点 / 亮点是什么？`,
    },
  ],
};

const ZH_TW_QUESTION_FORM_COPY: QuestionFormCopy = {
  strings: {
    ...ZH_CN_QUESTION_FORM_COPY.strings,
    'Quick brief': '快速簡報',
    'Quick brief — 30 seconds': '快速簡報 - 30 秒',
    'Choose the task type': '選擇任務類型',
    "I'll route this through the right Open Design workflow and lock the brief in one shot. Skip what doesn't apply — I'll fill defaults.":
      '我會把它路由到合適的 Open Design 工作流程，並一次性鎖定簡報。不適用的可跳過，我會補預設值。',
    "I'll route the free-form prompt through the right Open Design workflow.":
      '我會把自由輸入的需求路由到合適的 Open Design 工作流程。',
    "I'll lock these in before building. Skip what doesn't apply — I'll fill defaults.":
      '開始建構前我會先鎖定這些資訊。不適用的可跳過，我會補預設值。',
    'What should I build?': '要建構什麼？',
    'What are we making?': '我們要做什麼？',
    'Target platform': '目標平台',
    'Target user': '目標使用者',
    'Who is this for?': '面向誰？',
    'Visual tone': '視覺調性',
    'Brand context': '品牌背景',
    'Roughly how much?': '大致規模？',
    'Any important constraints?': '有什麼重要限制？',
    'Anything else I should know?': '還有什麼需要我知道？',
    "What's the angle / hook of this dating app?": '這個約會應用的切入點 / 亮點是什麼？',
    'Slide deck': '簡報',
    'Image': '圖片',
    'Video': '影片',
    'Audio': '音訊',
    'Other': '其他',
    'Slide deck / pitch': '簡報 / 路演',
    'Single web prototype / landing': '單頁網頁原型 / 落地頁',
    'Multi-screen app prototype': '多螢幕應用原型',
    'Dashboard / tool UI': '儀表板 / 工具介面',
    'Editorial / marketing page': '編輯式 / 行銷頁面',
    "Other — I'll describe": '其他 - 我來描述',
    'Responsive web': '響應式網頁',
    'Desktop web': '桌面網頁',
    'iOS app': 'iOS 應用',
    'Android app': 'Android 應用',
    'Tablet': '平板',
    'Tablet app': '平板應用',
    'Desktop app': '桌面應用',
    'Fixed canvas (1920×1080)': '固定畫布 (1920×1080)',
    'Editorial / magazine': '編輯 / 雜誌感',
    'Modern minimal': '現代極簡',
    'Playful / illustrative': '活潑 / 插畫感',
    'Tech / utility': '科技 / 工具感',
    'Luxury / refined': '奢華 / 精緻',
    'Brutalist / experimental': '粗野主義 / 實驗性',
    'Human / approachable': '親和 / 易接近',
    'Pick a direction for me': '幫我選一個方向',
    "I have a brand spec — I'll share it": '我有品牌規範 - 稍後分享',
    "Match a reference site / screenshot — I'll attach it": '匹配參考網站 / 截圖 - 稍後上傳',
    'Audience, brand, format, length, aspect ratio, references, things to avoid...':
      '受眾、品牌、格式、長度、長寬比、參考資料、需要避免的內容...',
    'e.g. early-stage investors, dev-tools buyers, internal exec review':
      '例如：早期投資人、開發者工具買家、內部高層評審',
    'e.g. 8 slides, 1 landing + 3 sub-pages, 4 mobile screens, 30s video':
      '例如：8 頁簡報、1 個落地頁 + 3 個子頁面、4 個行動端畫面、30 秒影片',
    'e.g. 8 slides, 1 landing + 3 sub-pages, 4 mobile screens':
      '例如：8 頁簡報、1 個落地頁 + 3 個子頁面、4 個行動端畫面',
    'Real copy, fonts you must use, things to avoid, deadline…':
      '真實文案、必須使用的字體、需要避免的內容、截止時間等...',
  },
  patterns: [
    {
      pattern: /^What's the angle \/ hook of this (.+)\?$/i,
      replace: (match) => `這個${match[1] ?? '專案'}的切入點 / 亮點是什麼？`,
    },
  ],
};

const QUESTION_FORM_COPY_BY_LOCALE: Partial<Record<Locale, QuestionFormCopy>> = {
  'zh-CN': ZH_CN_QUESTION_FORM_COPY,
  'zh-TW': ZH_TW_QUESTION_FORM_COPY,
};

export function localizeQuestionForm(form: QuestionForm, locale: Locale): QuestionForm {
  const copy = QUESTION_FORM_COPY_BY_LOCALE[locale];
  if (!copy) return form;
  const tr = (value: string | undefined): string | undefined => {
    if (value === undefined) return undefined;
    const exact = copy.strings[value];
    if (exact !== undefined) return exact;
    for (const entry of copy.patterns ?? []) {
      const match = value.match(entry.pattern);
      if (match) return entry.replace(match);
    }
    return value;
  };
  return {
    ...form,
    title: tr(form.title) ?? form.title,
    ...(form.description ? { description: tr(form.description) ?? form.description } : {}),
    ...(form.submitLabel ? { submitLabel: tr(form.submitLabel) ?? form.submitLabel } : {}),
    questions: form.questions.map((question) => ({
      ...question,
      label: tr(question.label) ?? question.label,
      ...(question.placeholder ? { placeholder: tr(question.placeholder) ?? question.placeholder } : {}),
      ...(question.help ? { help: tr(question.help) ?? question.help } : {}),
      ...(question.options
        ? {
            options: question.options.map((option) => ({
              ...option,
              label: tr(option.label) ?? option.label,
              ...(option.description ? { description: tr(option.description) ?? option.description } : {}),
            })),
          }
        : {}),
    })),
  };
}

export function QuestionFormView({ form, interactive, submittedAnswers, onSubmit }: Props) {
  const { locale, t } = useI18n();
  const visibleForm = useMemo(() => localizeQuestionForm(form, locale), [form, locale]);
  const initial = useMemo(
    () => buildInitialState(visibleForm, submittedAnswers),
    [visibleForm, submittedAnswers],
  );
  const [answers, setAnswers] = useState<Record<string, string | string[]>>(initial);
  const locked = !interactive || !onSubmit || submittedAnswers !== undefined;
  const currentAnswers = submittedAnswers ?? answers;

  function update(id: string, value: string | string[]) {
    if (locked) return;
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function toggleCheckbox(id: string, option: string, maxSelections?: number) {
    if (locked) return;
    setAnswers((prev) => {
      const current = Array.isArray(prev[id]) ? (prev[id] as string[]) : [];
      const has = current.includes(option);
      if (!has && maxSelections !== undefined && current.length >= maxSelections) {
        return prev;
      }
      const next = has ? current.filter((v) => v !== option) : [...current, option];
      return { ...prev, [id]: next };
    });
  }

  function missingRequired(): string | null {
    for (const q of visibleForm.questions) {
      if (!q.required) continue;
      const v = currentAnswers[q.id];
      if (Array.isArray(v) ? v.length === 0 : !(typeof v === 'string' && v.trim().length > 0)) {
        return q.label;
      }
    }
    return null;
  }

  function handleSubmit() {
    if (locked || !onSubmit) return;
    if (!withinSelectionLimits) return;
    const missing = missingRequired();
    if (missing) {
      // Soft inline guard — surface via aria but don't alert; the disabled
      // state of the submit button covers most cases.
      return;
    }
    onSubmit(formatFormAnswers(visibleForm, answers), answers);
  }

  const required = visibleForm.questions.filter((q) => q.required);
  const withinSelectionLimits = visibleForm.questions.every((q) => {
    if (q.type !== 'checkbox' || q.maxSelections === undefined) return true;
    const v = currentAnswers[q.id];
    return !Array.isArray(v) || v.length <= q.maxSelections;
  });
  const ready = withinSelectionLimits && required.every((q) => {
    const v = currentAnswers[q.id];
    return Array.isArray(v) ? v.length > 0 : typeof v === 'string' && v.trim().length > 0;
  });

  return (
    <div className={`question-form${locked ? ' question-form-locked' : ''}`} data-form-id={visibleForm.id}>
      <div className="question-form-head">
        <span className="question-form-icon" aria-hidden>?</span>
        <div className="question-form-titles">
          <div className="question-form-title">{visibleForm.title}</div>
          {visibleForm.description ? (
            <div className="question-form-desc">{visibleForm.description}</div>
          ) : null}
        </div>
        {locked ? <span className="question-form-pill">{t('qf.answered')}</span> : null}
      </div>
      <div className="question-form-body">
        {visibleForm.questions.map((q) => {
          const value = currentAnswers[q.id];
          return (
            <div key={q.id} className="qf-field">
              <label className="qf-label">
                <span>{q.label}</span>
                {q.required ? (
                  <span className="qf-required" aria-label={t('qf.required')}>*</span>
                ) : null}
              </label>
              {q.help ? <div className="qf-help">{q.help}</div> : null}
              {q.type === 'radio' && q.options ? (
                <div className="qf-options">
                  {q.options.map((opt) => (
                    <label
                      key={opt.value}
                      className={`qf-chip${value === opt.value ? ' qf-chip-on' : ''}`}
                      title={opt.description}
                    >
                      <input
                        type="radio"
                        name={`${visibleForm.id}-${q.id}`}
                        value={opt.value}
                        checked={value === opt.value}
                        disabled={locked}
                        aria-label={opt.label}
                        onChange={() => update(q.id, opt.value)}
                      />
                      <OptionCopy option={opt} />
                    </label>
                  ))}
                </div>
              ) : null}
              {q.type === 'checkbox' && q.options ? (
                <div className="qf-options">
                  {q.options.map((opt) => {
                    const arr = Array.isArray(value) ? value : [];
                    const on = arr.includes(opt.value);
                    const maxed =
                      q.maxSelections !== undefined && !on && arr.length >= q.maxSelections;
                    return (
                      <label
                        key={opt.value}
                        title={opt.description}
                        className={`qf-chip${on ? ' qf-chip-on' : ''}${maxed ? ' qf-chip-disabled' : ''}`}
                      >
                        <input
                          type="checkbox"
                          value={opt.value}
                          checked={on}
                          disabled={locked || maxed}
                          aria-label={opt.label}
                          onChange={() => toggleCheckbox(q.id, opt.value, q.maxSelections)}
                        />
                        <OptionCopy option={opt} />
                      </label>
                    );
                  })}
                </div>
              ) : null}
              {q.type === 'select' && q.options ? (
                <select
                  className="qf-select"
                  value={typeof value === 'string' ? value : ''}
                  disabled={locked}
                  onChange={(e) => update(q.id, e.target.value)}
                >
                  <option value="" disabled>
                    {q.placeholder ?? t('qf.choose')}
                  </option>
                  {q.options.map((opt) => (
                    <option key={opt.value} value={opt.value} title={opt.description}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : null}
              {q.type === 'text' ? (
                <input
                  type="text"
                  className="qf-input"
                  value={typeof value === 'string' ? value : ''}
                  placeholder={q.placeholder}
                  disabled={locked}
                  onChange={(e) => update(q.id, e.target.value)}
                />
              ) : null}
              {q.type === 'textarea' ? (
                <textarea
                  className="qf-textarea"
                  value={typeof value === 'string' ? value : ''}
                  placeholder={q.placeholder}
                  disabled={locked}
                  rows={3}
                  onChange={(e) => update(q.id, e.target.value)}
                />
              ) : null}
              {q.type === 'direction-cards' && q.cards && q.cards.length > 0 ? (
                <div className="qf-direction-cards">
                  {q.cards.map((card) => (
                    <DirectionCardView
                      key={card.id}
                      card={card}
                      formId={visibleForm.id}
                      questionId={q.id}
                      selected={value === card.id || value === card.label}
                      disabled={locked}
                      onSelect={() => update(q.id, card.id)}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="question-form-foot">
        {locked ? (
          <span className="qf-locked-note">
            {submittedAnswers ? t('qf.lockedSubmitted') : t('qf.lockedPrev')}
          </span>
        ) : (
          <span className="qf-hint">{t('qf.hint')}</span>
        )}
        {!locked ? (
          <button
            type="button"
            className="primary"
            onClick={handleSubmit}
            disabled={!ready}
            title={ready ? t('qf.submitTitle') : t('qf.submitDisabledTitle')}
          >
            {visibleForm.submitLabel ?? t('qf.submitDefault')}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function OptionCopy({ option }: { option: FormOption }) {
  return (
    <span className="qf-chip-copy">
      <span>{option.label}</span>
      {option.description ? <span className="qf-chip-desc">{option.description}</span> : null}
    </span>
  );
}

function DirectionCardView({
  card,
  formId,
  questionId,
  selected,
  disabled,
  onSelect,
}: {
  card: DirectionCard;
  formId: string;
  questionId: string;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  const t = useT();
  return (
    <label
      className={`qf-card${selected ? ' qf-card-on' : ''}${disabled ? ' qf-card-disabled' : ''}`}
    >
      <input
        type="radio"
        name={`${formId}-${questionId}`}
        value={card.id}
        checked={selected}
        disabled={disabled}
        onChange={() => onSelect()}
      />
      <div className="qf-card-head">
        <div className="qf-card-title">{card.label}</div>
        {selected ? <span className="qf-card-pill">{t('qf.cardSelected')}</span> : null}
      </div>
      {card.palette.length > 0 ? (
        <div className="qf-card-swatches" aria-hidden>
          {card.palette.slice(0, 6).map((c, i) => (
            <span
              key={i}
              className="qf-card-swatch"
              style={{ background: c }}
              title={c}
            />
          ))}
        </div>
      ) : null}
      <div className="qf-card-types" aria-hidden>
        <span className="qf-card-type-display" style={{ fontFamily: card.displayFont }}>
          Aa
        </span>
        <span className="qf-card-type-body" style={{ fontFamily: card.bodyFont }}>
          {t('qf.cardSampleText')}
        </span>
      </div>
      {card.mood ? <p className="qf-card-mood">{card.mood}</p> : null}
      {card.references.length > 0 ? (
        <p className="qf-card-refs">
          <span className="qf-card-refs-label">{t('qf.cardRefs')}</span>{' '}
          {card.references.slice(0, 4).join(' · ')}
        </p>
      ) : null}
    </label>
  );
}

function buildInitialState(
  form: QuestionForm,
  submitted: Record<string, string | string[]> | undefined,
): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const q of form.questions) {
    if (submitted && submitted[q.id] !== undefined) {
      out[q.id] = canonicalizeQuestionValue(q, submitted[q.id]!);
      continue;
    }
    if (q.defaultValue !== undefined) {
      out[q.id] = canonicalizeQuestionValue(q, q.defaultValue);
      continue;
    }
    if (q.type === 'checkbox') {
      out[q.id] = [];
    } else {
      out[q.id] = '';
    }
  }
  return out;
}

function canonicalizeQuestionValue(
  q: QuestionForm['questions'][number],
  value: string | string[],
): string | string[] {
  if (Array.isArray(value)) {
    return value.map((entry) => formOptionValueForLabel(q, entry));
  }
  return formOptionValueForLabel(q, value);
}

/**
 * Reverse of formatFormAnswers — when we render an old assistant message
 * that contained a form, look at the next user message in the conversation
 * to see if the form was already answered. If so, return the answers map
 * so the form renders in the locked "answered" state with the user's
 * picks visible.
 */
export function parseSubmittedAnswers(
  form: QuestionForm,
  userMessageContent: string,
): Record<string, string | string[]> | null {
  const lines = userMessageContent.split('\n').map((l) => l.trim());
  if (lines.length === 0) return null;
  const header = lines[0] ?? '';
  // We accept any "form answers" header so the agent can paraphrase.
  if (!/^\[form answers/i.test(header)) return null;
  const answers: Record<string, string | string[]> = {};
  const labelToId = new Map<string, string>();
  for (const q of form.questions) labelToId.set(q.label.toLowerCase(), q.id);
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i] ?? '';
    const m = /^[-*]\s*([^:]+):\s*(.*)$/.exec(line);
    if (!m) continue;
    const labelKey = m[1]!.trim().toLowerCase();
    const value = m[2]!.trim();
    const id = labelToId.get(labelKey);
    if (!id) continue;
    const q = form.questions.find((x) => x.id === id);
    if (!q) continue;
    if (q.type === 'checkbox') {
      answers[id] = value
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && s.toLowerCase() !== '(skipped)')
        .map((s) => formOptionValueForLabel(q, parseSubmittedOptionToken(s)));
    } else {
      answers[id] = value.toLowerCase() === '(skipped)' ? '' : formOptionValueForLabel(q, parseSubmittedOptionToken(value));
    }
  }
  return Object.keys(answers).length > 0 ? answers : null;
}

function parseSubmittedOptionToken(raw: string): string {
  const match = /\s+\[value:\s*([^\]]+)\]\s*$/i.exec(raw);
  if (!match) return raw.trim();
  return match[1]!.trim();
}
