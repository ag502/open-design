// @vitest-environment jsdom

/**
 * Analytics + render coverage for the hosted-AMR nudge under a failed run.
 * The nudge fires `surface_view` (element=run_failed_toast) on impression and
 * `ui_click` (element=go_amr) on the link, and only appears for a non-AMR
 * agent whose failure is a model/auth/quota error.
 */

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/analytics/events', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/analytics/events')>();
  return {
    ...actual,
    trackRunFailedToastSurfaceView: vi.fn(),
    trackRunFailedToastGoAmrClick: vi.fn(),
  };
});

import { AssistantMessage } from '../../src/components/AssistantMessage';
import {
  trackRunFailedToastGoAmrClick,
  trackRunFailedToastSurfaceView,
} from '../../src/analytics/events';
import type { ChatMessage } from '../../src/types';

beforeAll(() => {
  const store = new Map<string, string>();
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      clear: () => store.clear(),
      getItem: (key: string) => store.get(key) ?? null,
      removeItem: (key: string) => store.delete(key),
      setItem: (key: string, value: string) => store.set(key, value),
    },
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

beforeEach(() => {
  vi.clearAllMocks();
});

function failedMessage(code: string | undefined, agentId: string): ChatMessage {
  return {
    id: 'msg-amr',
    role: 'assistant',
    content: '',
    agentId,
    runId: 'run-9',
    runStatus: 'failed',
    startedAt: 1700000000,
    endedAt: 1700000005,
    events: [
      {
        kind: 'status',
        label: 'error',
        detail: 'boom',
        ...(code ? { code } : {}),
      },
    ] as ChatMessage['events'],
    producedFiles: [],
  } as ChatMessage;
}

function renderGuidance(code: string | undefined, agentId: string) {
  return render(
    <AssistantMessage
      message={failedMessage(code, agentId)}
      streaming={false}
      projectId="proj-1"
      projectKind="prototype"
      conversationId="conv-1"
      onFeedback={vi.fn()}
    />,
  );
}

describe('AssistantMessage hosted-AMR nudge', () => {
  it('renders and fires surface_view for a non-AMR auth/quota failure', () => {
    renderGuidance('AGENT_AUTH_REQUIRED', 'claude');
    expect(screen.getByTestId('amr-guidance')).toBeTruthy();
    expect(trackRunFailedToastSurfaceView).toHaveBeenCalledTimes(1);
    const props = vi.mocked(trackRunFailedToastSurfaceView).mock.calls[0]![1];
    expect(props).toMatchObject({
      page_name: 'chat_panel',
      area: 'chat_panel',
      element: 'run_failed_toast',
      error_code: 'AGENT_AUTH_REQUIRED',
      project_id: 'proj-1',
      project_kind: 'prototype',
      conversation_id: 'conv-1',
      assistant_message_id: 'msg-amr',
      run_id: 'run-9',
    });
  });

  it('fires ui_click go_amr when the link is followed', () => {
    renderGuidance('RATE_LIMITED', 'codex');
    fireEvent.click(screen.getByText(/AMR/i, { selector: 'a' }));
    expect(trackRunFailedToastGoAmrClick).toHaveBeenCalledTimes(1);
    expect(vi.mocked(trackRunFailedToastGoAmrClick).mock.calls[0]![1]).toMatchObject({
      page_name: 'chat_panel',
      area: 'chat_panel',
      element: 'go_amr',
    });
  });

  it('stays hidden for generic execution failures', () => {
    renderGuidance('AGENT_EXECUTION_FAILED', 'claude');
    expect(screen.queryByTestId('amr-guidance')).toBeNull();
    expect(trackRunFailedToastSurfaceView).not.toHaveBeenCalled();
  });

  it('stays hidden for the AMR agent itself', () => {
    renderGuidance('AGENT_AUTH_REQUIRED', 'amr');
    expect(screen.queryByTestId('amr-guidance')).toBeNull();
    expect(trackRunFailedToastSurfaceView).not.toHaveBeenCalled();
  });
});
