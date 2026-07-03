// @vitest-environment jsdom
//
// Web-clone example-card analytics (埋点文档 row 116 element=example_prompt, and
// element=example_open_project for the one-click "Remix"). Picking a Website
// clone example card (Clone Nexu / …) must fire a home chat_composer ui_click
// with the site's plugin attribution, and remixing it must fire the
// open-as-project variant. Both let the dashboard break the site-clone funnel
// down per example, complementing the created project's `project_kind=web_clone`
// on project_create_result.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { HomeView } from '../../src/components/HomeView';
import { I18nProvider } from '../../src/i18n';
import { writeHomeGuideStage } from '../../src/components/home-hero/firstRunGuide';

const analyticsMocks = vi.hoisted(() => ({ track: vi.fn() }));

// `send()` forwards a trailing request-id arg, so match on (event, props) and
// ignore any extra positional args rather than asserting exact arity.
function lastClickProps(element: string): Record<string, unknown> | undefined {
  const call = [...analyticsMocks.track.mock.calls]
    .reverse()
    .find((args) => args[0] === 'ui_click' && (args[1] as { element?: string })?.element === element);
  return call?.[1] as Record<string, unknown> | undefined;
}

vi.mock('../../src/analytics/provider', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/analytics/provider')>();
  return {
    ...actual,
    useAnalytics: () => ({
      track: analyticsMocks.track,
      newRequestId: () => 'request-1',
      setConfigureGlobals: vi.fn(),
      setConsent: vi.fn(),
      setIdentity: vi.fn(),
    }),
  };
});

// The Website-clone chip's own base scenario (its action.pluginId). It stays a
// normal visible plugin so clicking the chip binds; the preset rail hides it via
// EXAMPLE_PRESET_HIDDEN_PLUGIN_IDS (not od.hidden), leaving only the site cards.
const WEB_CLONE_BASE = {
  id: 'example-web-clone',
  title: 'Website clone',
  version: '0.1.0',
  trust: 'bundled' as const,
  sourceKind: 'bundled' as const,
  source: '/tmp/web-clone',
  capabilitiesGranted: ['prompt:inject'],
  fsPath: '/tmp/web-clone',
  installedAt: 0,
  updatedAt: 0,
  manifest: {
    name: 'example-web-clone',
    title: 'Website clone',
    version: '0.1.0',
    description: 'Recreate an existing website.',
    tags: ['web-clone', 'website-clone'],
    od: {
      kind: 'scenario',
      taskKind: 'new-generation',
      useCase: { query: 'Recreate the website at {{targetUrl}}.' },
    },
  },
};

// A concrete site-clone example card (the Clone Nexu tile). `preview.entry`
// makes the Remix action available; `targetUrl` seeds the composer.
const CLONE_NEXU = {
  ...WEB_CLONE_BASE,
  id: 'example-clone-nexu',
  title: 'Clone Nexu',
  source: '/tmp/clone-nexu',
  fsPath: '/tmp/clone-nexu',
  manifest: {
    name: 'example-clone-nexu',
    title: 'Clone Nexu',
    version: '0.1.0',
    description: 'Reproduce nexu.io.',
    tags: ['web-clone', 'website-clone'],
    od: {
      kind: 'scenario',
      taskKind: 'new-generation',
      useCase: { query: 'Clone the website at {{targetUrl}}.' },
      inputs: [{ name: 'targetUrl', default: 'https://nexu.io' }],
      preview: { entry: './example.html' },
    },
  },
};

function stubPlugins() {
  vi.stubGlobal('fetch', vi.fn(async (url: RequestInfo | URL) => {
    const href = typeof url === 'string' ? url : url.toString();
    if (href === '/api/plugins') {
      return new Response(JSON.stringify({ plugins: [WEB_CLONE_BASE, CLONE_NEXU] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    // Everything else (recent-dirs, media providers, duplicate, …) is irrelevant
    // to the click-time track calls, which fire before any await.
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }));
}

function renderHome() {
  return render(
    <I18nProvider initial="en">
      <HomeView
        projects={[]}
        onSubmit={() => undefined}
        onOpenProject={() => undefined}
        onViewAllProjects={() => undefined}
      />
    </I18nProvider>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  analyticsMocks.track.mockClear();
  cleanup();
  window.localStorage.clear();
});

describe('web-clone example-card tracking', () => {
  it('fires element=example_prompt when a site-clone example card is picked', async () => {
    writeHomeGuideStage('done');
    stubPlugins();
    renderHome();

    fireEvent.click(await screen.findByTestId('home-hero-rail-web-clone'));
    const card = await screen.findByTestId('home-hero-plugin-preset-use-example-clone-nexu');
    analyticsMocks.track.mockClear(); // ignore chip-pick ui_click; assert the card event
    fireEvent.click(card);

    await waitFor(() => {
      expect(lastClickProps('example_prompt')).toMatchObject({
        page_name: 'home',
        area: 'chat_composer',
        element: 'example_prompt',
        chip_id: 'web-clone',
        plugin_id: 'example-clone-nexu',
        plugin_type: 'official',
      });
    });
  });

  it('fires element=example_open_project when a site-clone example is remixed', async () => {
    writeHomeGuideStage('done');
    stubPlugins();
    renderHome();

    fireEvent.click(await screen.findByTestId('home-hero-rail-web-clone'));
    const remix = await screen.findByTestId('home-hero-plugin-preset-duplicate-example-clone-nexu');
    analyticsMocks.track.mockClear();
    fireEvent.click(remix);

    await waitFor(() => {
      expect(lastClickProps('example_open_project')).toMatchObject({
        page_name: 'home',
        area: 'chat_composer',
        element: 'example_open_project',
        chip_id: 'web-clone',
        plugin_id: 'example-clone-nexu',
        plugin_type: 'official',
      });
    });
  });
});

