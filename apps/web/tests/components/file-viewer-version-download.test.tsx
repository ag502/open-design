// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ProjectFile } from '../../src/types';

const {
  exportArtifactAsPdfMock,
  exportAsPdfMock,
} = vi.hoisted(() => ({
  exportArtifactAsPdfMock: vi.fn(),
  exportAsPdfMock: vi.fn(),
}));

vi.mock('../../src/runtime/exports', async () => {
  const actual = await vi.importActual<typeof import('../../src/runtime/exports')>(
    '../../src/runtime/exports',
  );
  return {
    ...actual,
    exportArtifactAsPdf: exportArtifactAsPdfMock,
    exportAsPdf: exportAsPdfMock,
  };
});

import { FileViewer } from '../../src/components/FileViewer';

function htmlFile(): ProjectFile {
  return {
    name: 'index.html',
    path: 'index.html',
    type: 'file',
    size: 1024,
    mtime: 1710000000,
    kind: 'html',
    mime: 'text/html',
    artifactManifest: {
      version: 1,
      kind: 'html',
      title: 'Index',
      entry: 'index.html',
      renderer: 'html',
      exports: ['html'],
    },
  };
}

describe('FileViewer version download actions', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('exports version PDFs through the artifact screenshot PDF path', async () => {
    exportArtifactAsPdfMock.mockResolvedValueOnce(undefined);
    const file = htmlFile();
    const currentVersion = {
      id: 'v2',
      fileName: 'index.html',
      version: 2,
      label: 'Current checkpoint',
      createdAt: 1_725_000_000_000,
      source: 'manual',
      prompt: 'Current prompt',
      size: 42,
      mime: 'text/html',
      kind: 'html',
      current: true,
    };
    const priorVersion = {
      ...currentVersion,
      id: 'v1',
      version: 1,
      label: 'Prior checkpoint',
      prompt: 'Prior prompt',
      current: false,
    };
    const priorContent =
      '<html><body><main style="background:#d16646;color:white">Prior colored version</main></body></html>';
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);
      const method = init?.method ?? 'GET';
      if (url === '/api/projects/project-1/files/index.html/versions' && method === 'GET') {
        return new Response(JSON.stringify({ file, versions: [currentVersion, priorVersion] }), { status: 200 });
      }
      if (url === '/api/projects/project-1/files/index.html/versions/v1' && method === 'GET') {
        return new Response(JSON.stringify({ version: priorVersion, content: priorContent }), { status: 200 });
      }
      return new Response(JSON.stringify({}), { status: 404 });
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <FileViewer
        projectId="project-1"
        projectKind="prototype"
        file={file}
        liveHtml="<html><body><h1>Current</h1></body></html>"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Versions' }));
    const versionDialog = await screen.findByRole('dialog', { name: 'Versions' });
    fireEvent.click(within(versionDialog).getByRole('option', { name: /Prior prompt/ }));
    await waitFor(() => {
      expect(within(versionDialog).getByRole('button', { name: 'Download Version 1' })).toBeTruthy();
    });

    fireEvent.click(within(versionDialog).getByRole('button', { name: 'Download Version 1' }));
    fireEvent.click(within(versionDialog).getByRole('menuitem', { name: 'Export as PDF' }));

    await waitFor(() => {
      expect(exportArtifactAsPdfMock).toHaveBeenCalledWith(
        priorContent,
        'index-v1',
        expect.objectContaining({
          deck: false,
          onProgress: expect.any(Function),
        }),
      );
    });
    expect(exportAsPdfMock).not.toHaveBeenCalled();
  });
});
