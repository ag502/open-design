import { useEffect, useRef, useState } from 'react';
import { useT } from '../i18n';
import { useAnalytics } from '../analytics/provider';
import {
  trackHomeRecommendationClick,
  trackHomeRecommendationSurfaceView,
} from '../analytics/events';
import type { TrackingOnboardingProductType } from '@open-design/contracts/analytics';
import type { ProjectMetadata } from '../types';
import {
  nextStarter,
  type ProductType,
  type Recommendation,
} from '../onboarding/recommendation';
import { stashPendingOnboardingEntry } from '../onboarding/onboarding-entry';
import { Icon } from './Icon';
import styles from './RecommendedStartRegion.module.css';

type DictKey = Parameters<ReturnType<typeof useT>>[0];

// Per-starter copy. Keys are literal `DictKey`s (validated against the i18n
// Dict), so a missing translation is a typecheck error rather than a runtime
// blank. Keyed by the stable starter id from the recommendation mapping.
const STARTER_COPY = {
  product_ui_prototype: {
    title: 'home.starter.product_ui_prototype.title',
    desc: 'home.starter.product_ui_prototype.desc',
    firstPrompt: 'home.starter.product_ui_prototype.firstPrompt',
  },
  product_ui_component: {
    title: 'home.starter.product_ui_component.title',
    desc: 'home.starter.product_ui_component.desc',
    firstPrompt: 'home.starter.product_ui_component.firstPrompt',
  },
  product_ui_lowfi: {
    title: 'home.starter.product_ui_lowfi.title',
    desc: 'home.starter.product_ui_lowfi.desc',
    firstPrompt: 'home.starter.product_ui_lowfi.firstPrompt',
  },
  marketing_landing: {
    title: 'home.starter.marketing_landing.title',
    desc: 'home.starter.marketing_landing.desc',
    firstPrompt: 'home.starter.marketing_landing.firstPrompt',
  },
  marketing_multivariant: {
    title: 'home.starter.marketing_multivariant.title',
    desc: 'home.starter.marketing_multivariant.desc',
    firstPrompt: 'home.starter.marketing_multivariant.firstPrompt',
  },
  internal_dashboard: {
    title: 'home.starter.internal_dashboard.title',
    desc: 'home.starter.internal_dashboard.desc',
    firstPrompt: 'home.starter.internal_dashboard.firstPrompt',
  },
  internal_report: {
    title: 'home.starter.internal_report.title',
    desc: 'home.starter.internal_report.desc',
    firstPrompt: 'home.starter.internal_report.firstPrompt',
  },
  general_menu: {
    title: 'home.starter.general_menu.title',
    desc: 'home.starter.general_menu.desc',
    firstPrompt: 'home.starter.general_menu.firstPrompt',
  },
} satisfies Record<string, { title: DictKey; desc: DictKey; firstPrompt: DictKey }>;

// Product bucket → the project kind used at creation. Concrete paths seed a web
// prototype pipeline; the general fallback uses `other`, which routes through
// the default agent that asks the user to pin down the task (spec §6.3
// "完整菜单 + 通用起点").
const PRODUCT_KIND: Record<ProductType, ProjectMetadata['kind']> = {
  product_ui: 'prototype',
  marketing: 'prototype',
  internal_tool: 'prototype',
  general: 'other',
};

interface Props {
  recommendation: Recommendation;
  // Open Studio with the recommended first request pre-filled (not auto-sent).
  onStart: (input: { name: string; prompt: string; metadata: ProjectMetadata }) => void;
  // Abandon the recommendation for the generic entry ("浏览全部类型").
  onDismiss: () => void;
}

// Derive a short project name from the first request, mirroring the Home
// composer submit path (`handlePluginLoopSubmit`). Falls back to the localized
// default when the prompt has no usable head.
function projectNameFromPrompt(prompt: string, fallback: string): string {
  const head = prompt.trim().split(/\s+/).slice(0, 8).join(' ');
  return head.length > 0 ? head : fallback;
}

export function RecommendedStartRegion({ recommendation, onStart, onDismiss }: Props) {
  const t = useT();
  const analytics = useAnalytics();

  // Currently surfaced starter within this path. Seeded from the primary and
  // resynced if the recommendation itself changes (e.g. a fresh session).
  const [currentId, setCurrentId] = useState(recommendation.primary.id);
  useEffect(() => {
    setCurrentId(recommendation.primary.id);
  }, [recommendation.primary.id]);

  const current =
    recommendation.options.find((option) => option.id === currentId) ?? recommendation.primary;
  const productType = recommendation.productType as TrackingOnboardingProductType;
  const canChange = recommendation.options.length > 1;

  // Fire the impression once per exposure so the funnel can divide the three
  // actions by how often the card was actually seen.
  const shownRef = useRef(false);
  useEffect(() => {
    if (shownRef.current) return;
    shownRef.current = true;
    trackHomeRecommendationSurfaceView(analytics.track, {
      page_name: 'home',
      area: 'onboarding_recommendation',
      product_type: productType,
      recommendation_id: recommendation.primary.id,
      ...(recommendation.role ? { role: recommendation.role } : {}),
      ...(recommendation.useCases.length > 0 ? { use_cases: recommendation.useCases } : {}),
    });
  }, [analytics.track, productType, recommendation.primary.id, recommendation.role, recommendation.useCases]);

  const copy =
    STARTER_COPY[current.id as keyof typeof STARTER_COPY] ?? STARTER_COPY.general_menu;
  const firstPrompt = t(copy.firstPrompt);

  function fireClick(element: 'enter_studio' | 'change' | 'browse_all', recommendationId: string) {
    trackHomeRecommendationClick(analytics.track, {
      page_name: 'home',
      area: 'onboarding_recommendation',
      element,
      product_type: productType,
      recommendation_id: recommendationId,
      ...(recommendation.role ? { role: recommendation.role } : {}),
      ...(recommendation.useCases.length > 0 ? { use_cases: recommendation.useCases } : {}),
    });
  }

  function handleEnter() {
    fireClick('enter_studio', current.id);
    // Hand the entry context across to Studio (session-only) so the
    // first-prompt / first-generation funnel events can attribute back to this
    // recommendation without persisting anything.
    stashPendingOnboardingEntry({
      source: 'home_recommendation',
      productType: current.productType,
      recommendationId: current.id,
      ...(recommendation.role ? { role: recommendation.role } : {}),
      ...(recommendation.useCases.length > 0 ? { useCases: recommendation.useCases } : {}),
    });
    onStart({
      name: projectNameFromPrompt(firstPrompt, t('home.recommendation.defaultProjectName')),
      prompt: firstPrompt,
      metadata: { kind: PRODUCT_KIND[current.productType], nameSource: 'prompt' },
    });
  }

  function handleChange() {
    const next = nextStarter(recommendation.options, current.id);
    fireClick('change', next.id);
    setCurrentId(next.id);
  }

  function handleBrowseAll() {
    fireClick('browse_all', current.id);
    onDismiss();
  }

  return (
    <section
      className={styles.root}
      data-testid="home-recommendation"
      aria-label={t('home.recommendation.eyebrow')}
    >
      <span className={styles.icon} aria-hidden>
        <Icon name="sparkles" size={18} />
      </span>
      <span className={styles.body}>
        <span className={styles.title}>{t(copy.title)}</span>
        <span className={styles.desc}>{t(copy.desc)}</span>
      </span>
      <button
        type="button"
        className={styles.primary}
        onClick={handleEnter}
        data-testid="home-recommendation-start"
      >
        {t('home.recommendation.primaryCta')}
        <Icon name="chevron-right" size={14} />
      </button>
      {canChange ? (
        <button
          type="button"
          className={styles.change}
          onClick={handleChange}
          data-testid="home-recommendation-change"
        >
          {t('home.recommendation.change')}
        </button>
      ) : null}
      <button
        type="button"
        className={styles.tertiary}
        onClick={handleBrowseAll}
        data-testid="home-recommendation-browse-all"
      >
        {t('home.recommendation.browseAll')}
      </button>
    </section>
  );
}
