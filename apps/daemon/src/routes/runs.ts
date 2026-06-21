import type { Express, Request, Response } from 'express';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import {
  defaultScenarioPluginIdForProjectMetadata,
  RUN_RESULT_PACKAGE_SCHEMA,
} from '@open-design/contracts';
import {
  agentIdToTracking,
  deriveConfigureGlobals,
  modelIdForTracking,
  sessionModeToTracking,
} from '@open-design/contracts/analytics';
import { newInsertId, readAnalyticsContext } from '../analytics.js';
import { agentCliEnvForAgent, readAppConfig } from '../app-config.js';
import { getProject, listConversations, upsertMessage } from '../db.js';
import { readVelaLoginStatus } from '../integrations/vela.js';
import {
  deriveLangfuseDeliveryState,
  readTelemetrySinkConfig,
} from '../langfuse-trace.js';
import { parseMediaExecutionPolicyInput } from '../media/policy.js';
import { isManagedProjectCwd } from '../mcp-config.js';
import {
  buildConnectorProbe,
  getInstalledPlugin,
  resolvePluginSnapshot,
} from '../plugins/index.js';
import {
  assertSandboxProjectRootAvailable,
  isSafeId,
  listFiles,
  resolveProjectDir,
  SandboxImportedProjectError,
} from '../projects.js';
import {
  amrUserIdForRunAnalytics,
  hasExplicitRequestedModelForAnalytics,
  runtimeTypeForRunAnalytics,
  scanRunEventsForUsageAnalytics,
  summarizeRunTimingAnalytics,
} from '../run-analytics-observability.js';
import {
  diffRunArtifacts,
  snapshotProjectArtifacts,
} from '../run-artifact-fs.js';
import { summarizeRunDiagnosticsForAnalytics } from '../run-diagnostics.js';
import { classifyRunFailure } from '../run-failure-classification.js';
import { deriveRunErrorCode, runResultFromStatus } from '../run-result.js';
import {
  parseRunToolBundleForRequest,
  validateRunToolBundleForAgent,
} from '../run-tool-bundle.js';
import {
  countDesignSystemPreviewModules,
  countNewArtifacts,
  deriveActivationMilestones,
  didRunCreateDesignSystemFile,
  runAskedUserQuestion,
} from '../runtimes/run-artifacts.js';

export interface RegisterRunRoutesDeps {
  db: any;
  design: any;
  http: {
    createSseResponse: (...args: any[]) => any;
    sendApiError: (...args: any[]) => any;
  };
  paths: {
    PROJECTS_DIR: string;
    RUNTIME_DATA_DIR: string;
  };
  agents: {
    detectAgents: (...args: any[]) => Promise<any[]>;
    getAgentDef: (...args: any[]) => any;
  };
  chat: {
    startChatRun: (meta: any, run: any) => any;
  };
  lifecycle: {
    isDaemonShuttingDown: () => boolean;
  };
  plugins: {
    connectorService: any;
    detectSkillPluginCandidateOnRunSuccess: (...args: any[]) => void;
    firePipelineForRun: (...args: any[]) => void;
    loadPluginRegistryView: () => Promise<any>;
    renderPluginBriefTemplate: (template: string, inputs?: Record<string, unknown>) => string;
  };
  telemetry: {
    reportRunCompletionTelemetryFallback: (...args: any[]) => void;
    resolveRunProjectKindForAnalytics: (...args: any[]) => string;
    runArtifactBaselines: any;
    runRetryEventsForAnalytics: (...args: any[]) => any[];
  };
  messages: {
    pinAssistantMessageOnRunCreate: (...args: any[]) => void;
    reconcileAssistantMessageOnRunEnd: (...args: any[]) => void;
  };
}

type ApiRequest = Request<any, any, any, any>;
type ApiResponse = Response<any>;
type ProjectMetadata = Record<string, any> | null | undefined;
type RunStatus = {
  status: string;
  error?: string | null;
  errorCode?: string | null;
  exitCode?: number | null;
  signal?: string | null;
};
type AguiEventRecord = {
  id: number;
  event: string;
  data?: Record<string, unknown> | null;
};

export function registerRunRoutes(app: Express, ctx: RegisterRunRoutesDeps) {
  const { db, design } = ctx;
  const { createSseResponse, sendApiError } = ctx.http;
  const { PROJECTS_DIR, RUNTIME_DATA_DIR } = ctx.paths;
  const { detectAgents, getAgentDef } = ctx.agents;
  const { startChatRun } = ctx.chat;
  const {
    connectorService,
    detectSkillPluginCandidateOnRunSuccess,
    firePipelineForRun,
    loadPluginRegistryView,
    renderPluginBriefTemplate,
  } = ctx.plugins;
  const {
    reportRunCompletionTelemetryFallback,
    resolveRunProjectKindForAnalytics,
    runArtifactBaselines,
    runRetryEventsForAnalytics,
  } = ctx.telemetry;
  const {
    pinAssistantMessageOnRunCreate,
    reconcileAssistantMessageOnRunEnd,
  } = ctx.messages;

  function runToolBundleDeliveryTargetForProject(
    projectId: unknown,
    metadata: ProjectMetadata,
  ): 'managed-project' | 'external-project' | 'none' {
    if (typeof projectId !== 'string' || !projectId || !isSafeId(projectId)) {
      return 'none';
    }
    try {
      const cwd = resolveProjectDir(PROJECTS_DIR, projectId, metadata, {
        allowUnavailableSandboxImportedProject: true,
      });
      return isManagedProjectCwd(cwd, PROJECTS_DIR) ? 'managed-project' : 'external-project';
    } catch {
      return 'none';
    }
  }

  app.post('/api/runs', async (req: ApiRequest, res: ApiResponse) => {
    if (ctx.lifecycle.isDaemonShuttingDown()) {
      return sendApiError(res, 503, 'UPSTREAM_UNAVAILABLE', 'daemon is shutting down');
    }
    const requestBody = req.body && typeof req.body === 'object' ? req.body : {};
    const mediaExecution = parseMediaExecutionPolicyInput(requestBody.mediaExecution);
    if (!mediaExecution.ok) {
      return sendApiError(res, 400, 'BAD_REQUEST', mediaExecution.message);
    }
    const toolBundle = parseRunToolBundleForRequest(requestBody.toolBundle);
    if (!toolBundle.ok) {
      return sendApiError(res, 400, 'BAD_REQUEST', toolBundle.message);
    }
    let resolvedSnapshot = null;
    if (typeof requestBody.projectId === 'string' && requestBody.projectId) {
      let registryView;
      try {
        registryView = await loadPluginRegistryView();
      } catch (err) {
        return res.status(500).json({ error: String(err) });
      }
      const explicitPlugin =
        requestBody.pluginId || requestBody.appliedPluginSnapshotId;
      let runResolveBody = requestBody;
      if (!explicitPlugin) {
        const projectRow = getProject(db, requestBody.projectId);
        const hasPin =
          typeof projectRow?.appliedPluginSnapshotId === 'string'
          && projectRow.appliedPluginSnapshotId.length > 0;
        if (!hasPin) {
          const fallbackPluginId = defaultScenarioPluginIdForProjectMetadata(projectRow?.metadata);
          if (fallbackPluginId && getInstalledPlugin(db, fallbackPluginId)) {
            runResolveBody = { ...requestBody, pluginId: fallbackPluginId };
          }
        }
      }
      const resolved = resolvePluginSnapshot({
        db,
        body: runResolveBody,
        projectId: requestBody.projectId,
        conversationId: typeof requestBody.conversationId === 'string'
          ? requestBody.conversationId
          : null,
        registry: registryView,
        connectorProbe: buildConnectorProbe(connectorService),
      });
      if (resolved && !resolved.ok) {
        if (!explicitPlugin) {
          console.warn(
            `[plugins] default-scenario fallback skipped for run on project ${requestBody.projectId}: ${resolved.body?.error?.code ?? 'unknown'}`,
          );
        } else {
          return res.status(resolved.status).json(resolved.body);
        }
      } else {
        resolvedSnapshot = resolved;
      }
    }
    const meta = {
      ...requestBody,
      mediaExecution: mediaExecution.policy,
      toolBundle: toolBundle.bundle,
    };
    if (resolvedSnapshot?.ok) {
      meta.appliedPluginSnapshotId = resolvedSnapshot.snapshotId;
      if (!meta.pluginId) meta.pluginId = resolvedSnapshot.snapshot.pluginId;
      if (typeof meta.message !== 'string' || meta.message.trim().length === 0) {
        const renderedQuery = renderPluginBriefTemplate(
          resolvedSnapshot.snapshot.query ?? '',
          resolvedSnapshot.snapshot.inputs,
        ).trim();
        if (renderedQuery.length > 0) meta.message = renderedQuery;
      }
    }
    let runProject = null;
    if (typeof meta.projectId === 'string' && meta.projectId) {
      try {
        runProject = getProject(db, meta.projectId);
        assertSandboxProjectRootAvailable(runProject?.metadata);
      } catch (err) {
        if (err instanceof SandboxImportedProjectError) {
          return sendApiError(res, 400, 'BAD_REQUEST', err.message);
        }
        throw err;
      }
    }
    if (typeof meta.agentId !== 'string' || !meta.agentId) {
      try {
        const appCfg = await readAppConfig(RUNTIME_DATA_DIR);
        const cfgAgent = typeof appCfg.agentId === 'string' && appCfg.agentId
          ? appCfg.agentId
          : null;
        const agents = await detectAgents(appCfg.agentCliEnv ?? {}).catch((): any[] => []);
        const cfgAgentAvailable = cfgAgent
          ? agents.some((agent) => agent.id === cfgAgent && agent.available)
          : false;
        if (cfgAgent && cfgAgentAvailable) {
          meta.agentId = cfgAgent;
        } else {
          const firstAvailable = agents.find((a: any) => a.available)?.id ?? null;
          if (firstAvailable) meta.agentId = firstAvailable;
        }
      } catch (err) {
        console.warn('[runs] agent id fallback failed', err);
      }
    }
    const toolBundleSupport = validateRunToolBundleForAgent(
      toolBundle.bundle,
      typeof meta.agentId === 'string' ? getAgentDef(meta.agentId) : null,
      {
        deliveryTarget: runToolBundleDeliveryTargetForProject(
          meta.projectId,
          runProject?.metadata,
        ),
      },
    );
    if (!toolBundleSupport.ok) {
      return sendApiError(res, 400, 'BAD_REQUEST', toolBundleSupport.message);
    }
    if (runProject?.metadata) {
      meta.projectMetadata = runProject.metadata;
    }
    if (
      typeof meta.projectId === 'string' &&
      meta.projectId &&
      (typeof meta.conversationId !== 'string' || !meta.conversationId)
    ) {
      try {
        const convs = listConversations(db, meta.projectId);
        const defaultConv = Array.isArray(convs) && convs.length > 0
          ? [...convs].sort((a, b) => {
              const aCreated = Number(a?.createdAt);
              const bCreated = Number(b?.createdAt);
              if (Number.isFinite(aCreated) && Number.isFinite(bCreated) && aCreated !== bCreated) {
                return aCreated - bCreated;
              }
              return String(a?.id ?? '').localeCompare(String(b?.id ?? ''));
            })[0]
          : null;
        if (defaultConv && typeof defaultConv.id === 'string' && defaultConv.id) {
          meta.conversationId = defaultConv.id;
          if (typeof meta.assistantMessageId !== 'string' || !meta.assistantMessageId) {
            meta.assistantMessageId = randomUUID();
          }
          const promptForUserMessage =
            typeof meta.message === 'string' && meta.message.trim().length > 0
              ? meta.message
              : null;
          if (promptForUserMessage) {
            upsertMessage(db, defaultConv.id, {
              id: randomUUID(),
              role: 'user',
              content: promptForUserMessage,
              startedAt: Date.now(),
              endedAt: Date.now(),
            });
          }
        }
      } catch (err) {
        console.warn('[runs] mcp conversation fallback failed', err);
      }
    }
    const run = design.runs.create(meta);
    try {
      pinAssistantMessageOnRunCreate(db, run);
    } catch (err) {
      console.warn('[runs] message create pin failed', err);
    }
    const declaredClient = String(req.get('x-od-client') ?? '').toLowerCase();
    if (declaredClient === 'desktop' || declaredClient === 'web') {
      run.clientType = declaredClient;
    } else {
      const ua = String(req.get('user-agent') ?? '');
      run.clientType = ua.includes('Electron/') ? 'desktop' : 'web';
    }
    if (resolvedSnapshot?.ok) {
      try {
        const { linkSnapshotToRun } = await import('../plugins/snapshots.js');
        linkSnapshotToRun(db, resolvedSnapshot.snapshotId, run.id);
      } catch {
        // Linking is best-effort here; in-memory run still carries the id.
      }
    }
    const body = {
      runId: run.id,
      conversationId: run.conversationId ?? null,
      assistantMessageId: run.assistantMessageId ?? null,
      ...(resolvedSnapshot?.ok
        ? {
            appliedPluginSnapshotId: resolvedSnapshot.snapshotId,
            pluginId: resolvedSnapshot.snapshot.pluginId,
          }
        : {}),
    };
    res.status(202).json(body);
    if (resolvedSnapshot?.ok && resolvedSnapshot.snapshot.pipeline) {
      firePipelineForRun({
        run,
        snapshot: resolvedSnapshot.snapshot,
        runs: design.runs,
        db,
      });
    }
    reconcileAssistantMessageOnRunEnd(db, design.runs, run);
    if (run.projectId && run.conversationId) {
      try {
        const project = getProject(db, run.projectId);
        const projectRoot = resolveProjectDir(PROJECTS_DIR, run.projectId, project?.metadata);
        detectSkillPluginCandidateOnRunSuccess(db, design.runs, run, req.body || {}, projectRoot);
      } catch (err) {
        console.warn('[plugins] skill candidate hook setup failed', err);
      }
    }
    design.runs.start(run, () => startChatRun(meta, run));

    const analyticsContext = readAnalyticsContext(req);
    if (analyticsContext) {
      run.analyticsContext = analyticsContext;
    }
    design.runs.wait(run).then((status: { status: string }) => {
      reportRunCompletionTelemetryFallback({
        analyticsContext: analyticsContext ?? null,
        run,
        status: status.status,
      });
    }).catch(() => {});
    if (analyticsContext) {
      const reqBody = (req.body || {}) as Record<string, unknown>;
      const runInsertId = newInsertId();
      const appCfgForAnalytics = await readAppConfig(RUNTIME_DATA_DIR).catch(
        () => ({} as Record<string, unknown>),
      );
      const detectedAgentsForAnalytics = await detectAgents(
        (appCfgForAnalytics as { agentCliEnv?: Record<string, unknown> }).agentCliEnv ?? {},
      ).catch((): Array<{ id: string; available: boolean }> => []);
      const velaStatusForAnalytics = (() => {
        try {
          const configuredAmrEnv = agentCliEnvForAgent(
            (appCfgForAnalytics as {
              agentCliEnv?: Parameters<typeof agentCliEnvForAgent>[0];
            }).agentCliEnv,
            'amr',
          );
          return readVelaLoginStatus(process.env, configuredAmrEnv);
        } catch {
          return null;
        }
      })();
      const configureGlobals = deriveConfigureGlobals({
        mode: 'daemon',
        agentId: typeof reqBody.agentId === 'string' ? reqBody.agentId : null,
        agents: detectedAgentsForAnalytics,
        amrAuthorized: velaStatusForAnalytics?.loggedIn === true,
      });
      const promptText =
        typeof reqBody.currentPrompt === 'string'
          ? reqBody.currentPrompt
          : typeof reqBody.message === 'string'
            ? reqBody.message
            : '';
      const userQueryTokens = promptText.length > 0
        ? Math.ceil(promptText.length / 4)
        : 0;
      const analyticsHints =
        (reqBody as { analyticsHints?: Record<string, unknown> | null }).analyticsHints
          && typeof (reqBody as { analyticsHints?: unknown }).analyticsHints === 'object'
          ? ((reqBody as { analyticsHints?: Record<string, unknown> }).analyticsHints ?? {})
          : {};
      const hintEntryFrom = typeof analyticsHints.entryFrom === 'string'
        ? analyticsHints.entryFrom
        : undefined;
      const hintProjectKind = typeof analyticsHints.projectKind === 'string'
        ? analyticsHints.projectKind
        : null;
      const hintTurnIndex = typeof analyticsHints.turnIndex === 'number'
        ? analyticsHints.turnIndex
        : undefined;
      const hintIsFirstRun = typeof analyticsHints.isFirstRun === 'boolean'
        ? analyticsHints.isFirstRun
        : undefined;
      const hintHasExistingArtifact = typeof analyticsHints.hasExistingArtifact === 'boolean'
        ? analyticsHints.hasExistingArtifact
        : undefined;
      const sessionDimensionProps = {
        ...(hintTurnIndex !== undefined ? { turn_index: hintTurnIndex } : {}),
        ...(hintIsFirstRun !== undefined ? { is_first_run: hintIsFirstRun } : {}),
        ...(hintHasExistingArtifact !== undefined
          ? { has_existing_artifact: hintHasExistingArtifact }
          : {}),
      };
      const requestProjectId = typeof reqBody.projectId === 'string' ? reqBody.projectId : null;
      const runProjectForAnalytics = requestProjectId ? getProject(db, requestProjectId) : null;
      const runProjectKind = resolveRunProjectKindForAnalytics({
        hintProjectKind,
        projectMetadata: runProjectForAnalytics?.metadata,
      });
      const dsRunContext =
        analyticsHints.designSystemRunContext
          && typeof analyticsHints.designSystemRunContext === 'object'
          ? (analyticsHints.designSystemRunContext as Record<string, unknown>)
          : {};
      const isDesignSystemRun =
        runProjectKind === 'design_system'
        || hintEntryFrom === 'design_system_create'
        || hintEntryFrom === 'onboarding_design_system'
        || hintEntryFrom === 'regenerate_from_review';
      const reqContext =
        reqBody.context && typeof reqBody.context === 'object'
          ? (reqBody.context as Record<string, unknown>)
          : {};
      const runMcpServerIds = Array.isArray(reqContext.mcpServerIds)
        ? (reqContext.mcpServerIds as unknown[]).filter(
            (id): id is string => typeof id === 'string',
          )
        : [];
      const runTurnSkillIds = Array.isArray(reqBody.skillIds)
        ? (reqBody.skillIds as unknown[]).filter(
            (id): id is string => typeof id === 'string',
          )
        : [];
      const runSkillIds = [
        ...new Set(
          [reqBody.skillId, ...runTurnSkillIds].filter(
            (id): id is string => typeof id === 'string' && id.length > 0,
          ),
        ),
      ];
      const baseProps: Record<string, unknown> = {
        page_name: isDesignSystemRun ? 'design_system_project' : 'chat_panel',
        area: isDesignSystemRun ? 'design_system_generation' : 'chat_composer',
        ...configureGlobals,
        runtime_type: runtimeTypeForRunAnalytics({
          derived: configureGlobals.runtime_type,
          hint: analyticsHints.runtimeType,
        }),
        ...amrUserIdForRunAnalytics(velaStatusForAnalytics),
        project_id: requestProjectId,
        conversation_id:
          typeof reqBody.conversationId === 'string' ? reqBody.conversationId : null,
        run_id: run.id,
        project_kind: runProjectKind,
        ...(hintEntryFrom ? { entry_from: hintEntryFrom } : {}),
        ...sessionDimensionProps,
        design_system_id:
          typeof reqBody.designSystemId === 'string'
            ? reqBody.designSystemId
            : undefined,
        design_system_source:
          typeof reqBody.designSystemId === 'string' && reqBody.designSystemId
            ? 'unknown'
            : 'not_applicable',
        ...(isDesignSystemRun ? {
          ds_source_origin: typeof dsRunContext.origin === 'string'
            ? dsRunContext.origin
            : undefined,
          source_count: typeof dsRunContext.sourceCount === 'number'
            ? dsRunContext.sourceCount
            : undefined,
          has_brand_description: typeof dsRunContext.hasBrandDescription === 'boolean'
            ? dsRunContext.hasBrandDescription
            : undefined,
          brand_description_length_bucket:
            typeof dsRunContext.brandDescriptionLengthBucket === 'string'
              ? dsRunContext.brandDescriptionLengthBucket
              : undefined,
          github_repo_count: typeof dsRunContext.githubRepoCount === 'number'
            ? dsRunContext.githubRepoCount
            : undefined,
          local_folder_count: typeof dsRunContext.localFolderCount === 'number'
            ? dsRunContext.localFolderCount
            : undefined,
          fig_file_count: typeof dsRunContext.figFileCount === 'number'
            ? dsRunContext.figFileCount
            : undefined,
          asset_file_count: typeof dsRunContext.assetFileCount === 'number'
            ? dsRunContext.assetFileCount
            : undefined,
        } : {}),
        has_attachment: Array.isArray(reqBody.attachments)
          ? (reqBody.attachments as unknown[]).length > 0
          : false,
        user_query_tokens: userQueryTokens,
        model_id: modelIdForTracking(
          typeof reqBody.model === 'string' ? reqBody.model : null,
        ),
        agent_provider_id: agentIdToTracking(
          typeof reqBody.agentId === 'string' ? reqBody.agentId : null,
        ),
        skill_id: typeof reqBody.skillId === 'string' ? reqBody.skillId : null,
        ...(!isDesignSystemRun && typeof reqBody.sessionMode === 'string'
          ? { session_mode: sessionModeToTracking(reqBody.sessionMode) }
          : {}),
        plugin_id: resolvedSnapshot?.ok
          ? resolvedSnapshot.snapshot.pluginId
          : typeof reqBody.pluginId === 'string'
            ? reqBody.pluginId
            : null,
        mcp_ids: runMcpServerIds,
        mcp_id: runMcpServerIds[0] ?? null,
        skill_ids: runSkillIds,
        token_count_source: userQueryTokens > 0 ? 'estimated' : 'unknown',
      };
      design.analytics.capture({
        eventName: 'run_created',
        context: analyticsContext,
        appVersion: design.getAppVersion(),
        properties: baseProps,
        insertId: runInsertId,
      });
      design.runs.wait(run).then(async (status: RunStatus) => {
        const appCfgAtFinish = await readAppConfig(RUNTIME_DATA_DIR).catch(
          () => ({} as Record<string, unknown>),
        );
        const langfuseDeliveryForAnalytics = deriveLangfuseDeliveryState(
          (appCfgAtFinish as { telemetry?: Record<string, unknown> }).telemetry ?? {},
          readTelemetrySinkConfig(),
        );
        const result = runResultFromStatus(status.status);
        const errorCode = deriveRunErrorCode(status);
        const failure = classifyRunFailure({
          result,
          status,
          ...(errorCode ? { errorCode } : {}),
          agentId: run.agentId,
          events: run.events,
        });
        const usageAnalytics = scanRunEventsForUsageAnalytics(
          run.events,
          reqBody.model,
          userQueryTokens,
        );
        const analyticsCapturedAt = Date.now();
        const timingAnalytics = summarizeRunTimingAnalytics({
          runCreatedAt: run.createdAt,
          runUpdatedAt: run.updatedAt,
          analyticsCapturedAt,
          telemetry: run.analyticsTelemetry,
          events: run.events,
        });
        const toolStreamArtifactCount = (): number => countNewArtifacts(run.events);
        const toolStreamDesignSystemCreated = (): boolean =>
          didRunCreateDesignSystemFile(run.events);
        const toolStreamPreviewModuleCount = (): number =>
          countDesignSystemPreviewModules(run.events);
        const artifactBaseline = runArtifactBaselines.take(run.id);
        let artifactCount: number;
        let artifactsCreated: number | undefined;
        let artifactsModified: number | undefined;
        let designSystemCreated: boolean;
        let previewModuleCount: number;
        if (artifactBaseline && !artifactBaseline.contended) {
          let diff: ReturnType<typeof diffRunArtifacts> | null = null;
          try {
            diff = diffRunArtifacts(
              artifactBaseline.before,
              snapshotProjectArtifacts(artifactBaseline.cwd),
            );
          } catch {
            diff = null;
          }
          if (diff) {
            artifactCount = diff.touched;
            artifactsCreated = diff.created;
            artifactsModified = diff.modified;
            designSystemCreated = diff.designSystemCreated;
            previewModuleCount = diff.previewModuleCount;
          } else {
            artifactCount = toolStreamArtifactCount();
            designSystemCreated = toolStreamDesignSystemCreated();
            previewModuleCount = toolStreamPreviewModuleCount();
          }
        } else {
          artifactCount = toolStreamArtifactCount();
          designSystemCreated = toolStreamDesignSystemCreated();
          previewModuleCount = toolStreamPreviewModuleCount();
        }
        const activationMilestones = deriveActivationMilestones({
          result,
          artifactCount,
          designSystemCreated,
          isDesignSystemRun,
          capturedAtIso: new Date(analyticsCapturedAt).toISOString(),
        });
        const diagnosticsAnalytics = summarizeRunDiagnosticsForAnalytics({
          events: run.events,
          exitCode: status.exitCode ?? null,
          signal: status.signal ?? null,
          cancelRequested: !!run.cancelRequested,
          firstTokenSeen: Boolean(run.analyticsTelemetry?.firstTokenAt),
          artifactWriteSeen: artifactCount > 0 || designSystemCreated || previewModuleCount > 0,
        });
        const finishedModelId = hasExplicitRequestedModelForAnalytics(reqBody.model)
          ? modelIdForTracking(reqBody.model)
          : modelIdForTracking(usageAnalytics.agent_reported_model);
        for (const [index, retryEvent] of runRetryEventsForAnalytics(run.events).entries()) {
          design.analytics.capture({
            eventName: retryEvent.event,
            context: analyticsContext,
            appVersion: design.getAppVersion(),
            properties: retryEvent.data,
            insertId: `${runInsertId}-${retryEvent.event}-${index}`,
          });
        }
        design.analytics.capture({
          eventName: 'run_finished',
          context: analyticsContext,
          appVersion: design.getAppVersion(),
          properties: {
            ...baseProps,
            area: isDesignSystemRun ? 'design_system_generation' : 'chat_panel',
            result,
            ...(activationMilestones ? { $set_once: activationMilestones } : {}),
            model_id: finishedModelId,
            artifact_count: artifactCount,
            ...(artifactsCreated !== undefined ? { artifacts_created: artifactsCreated } : {}),
            ...(artifactsModified !== undefined ? { artifacts_modified: artifactsModified } : {}),
            asked_user_question: runAskedUserQuestion(run.events),
            retry_attempt_count: run.retryAttemptCount ?? 0,
            retry_final_result: run.retryFinalResult ?? 'not_attempted',
            ...(run.retrySuppressedReason
              ? { retry_suppressed_reason: run.retrySuppressedReason }
              : {}),
            ...(isDesignSystemRun ? {
              design_system_created: designSystemCreated,
              preview_module_count: previewModuleCount,
              missing_font_count: 0,
            } : {}),
            ...timingAnalytics,
            ...diagnosticsAnalytics,
            langfuse_trace_id: run.id,
            ...langfuseDeliveryForAnalytics,
            ...(errorCode ? { error_code: errorCode } : {}),
            ...(failure ?? {}),
            ...(usageAnalytics.input_tokens !== undefined
              ? { input_tokens: usageAnalytics.input_tokens }
              : {}),
            ...(usageAnalytics.input_tokens_provider !== undefined
              ? { input_tokens_provider: usageAnalytics.input_tokens_provider }
              : {}),
            ...(usageAnalytics.input_tokens_effective !== undefined
              ? { input_tokens_effective: usageAnalytics.input_tokens_effective }
              : {}),
            ...(usageAnalytics.output_tokens !== undefined
              ? { output_tokens: usageAnalytics.output_tokens }
              : {}),
            ...(usageAnalytics.total_tokens !== undefined
              ? { total_tokens: usageAnalytics.total_tokens }
              : {}),
            ...(usageAnalytics.cache_read_input_tokens !== undefined
              ? { cache_read_input_tokens: usageAnalytics.cache_read_input_tokens }
              : {}),
            ...(usageAnalytics.cache_creation_input_tokens !== undefined
              ? {
                  cache_creation_input_tokens:
                    usageAnalytics.cache_creation_input_tokens,
                }
              : {}),
            ...(usageAnalytics.uncached_input_tokens !== undefined
              ? { uncached_input_tokens: usageAnalytics.uncached_input_tokens }
              : {}),
            ...(usageAnalytics.estimated_context_tokens !== undefined
              ? { estimated_context_tokens: usageAnalytics.estimated_context_tokens }
              : {}),
            ...(usageAnalytics.cache_hit_ratio !== undefined
              ? { cache_hit_ratio: usageAnalytics.cache_hit_ratio }
              : {}),
            cache_token_source: usageAnalytics.cache_token_source,
            token_count_source: usageAnalytics.token_count_source,
          },
          insertId: `${runInsertId}-finish`,
        });
      }).catch(() => {});
    }
  });

  app.get('/api/runs', (req: ApiRequest, res: ApiResponse) => {
    const { projectId, conversationId, status } = req.query;
    const runs = design.runs.list({ projectId, conversationId, status });
    const body = { runs: runs.map(design.runs.statusBody) };
    res.json(body);
  });

  app.get('/api/runs/:id/result-package', async (req: ApiRequest, res: ApiResponse) => {
    const run = design.runs.get(req.params.id);
    if (!run) return sendApiError(res, 404, 'NOT_FOUND', 'run not found');
    const status = design.runs.statusBody(run);
    const project = run.projectId ? getProject(db, run.projectId) : null;
    let files: any[] = [];
    if (project) {
      const packageMetadata = run.projectMetadata ?? null;
      try {
        if (status.workspace?.storage?.kind === 'folder-backed') {
          const projectRoot = resolveProjectDir(PROJECTS_DIR, project.id, packageMetadata);
          const projectRootStat = await fs.promises.stat(projectRoot);
          if (!projectRootStat.isDirectory()) {
            throw new Error('workspace root is not a directory');
          }
        }
        files = await listFiles(PROJECTS_DIR, project.id, { metadata: packageMetadata });
      } catch (err) {
        return sendApiError(
          res,
          500,
          'WORKSPACE_ENUMERATION_FAILED',
          err instanceof Error ? err.message : String(err),
        );
      }
    }
    const artifacts = files
      .filter((file) => file?.artifactManifest && typeof file.artifactManifest === 'object')
      .map((file) => ({
        file: file.name,
        kind: typeof file.artifactManifest.kind === 'string'
          ? file.artifactManifest.kind
          : file.artifactKind ?? null,
        renderer: typeof file.artifactManifest.renderer === 'string'
          ? file.artifactManifest.renderer
          : null,
        title: typeof file.artifactManifest.title === 'string'
          ? file.artifactManifest.title
          : file.name,
        status: typeof file.artifactManifest.status === 'string'
          ? file.artifactManifest.status
          : null,
        manifest: file.artifactManifest,
      }));
    res.json({
      schema: RUN_RESULT_PACKAGE_SCHEMA,
      run: {
        id: status.id,
        status: status.status,
        projectId: status.projectId,
        conversationId: status.conversationId,
        assistantMessageId: status.assistantMessageId,
        agentId: status.agentId,
        createdAt: status.createdAt,
        updatedAt: status.updatedAt,
        cancelRequested: status.cancelRequested,
        exitCode: status.exitCode,
        signal: status.signal,
        error: status.error,
        errorCode: status.errorCode,
      },
      workspace: status.workspace,
      events: {
        logPath: status.eventsLogPath,
      },
      project: project
        ? {
            id: project.id,
            name: project.name,
            fileCount: files.length,
          }
        : null,
      artifacts,
    });
  });

  app.get('/api/runs/:id', (req: ApiRequest, res: ApiResponse) => {
    const run = design.runs.get(req.params.id);
    if (!run) return sendApiError(res, 404, 'NOT_FOUND', 'run not found');
    res.json(design.runs.statusBody(run));
  });

  app.get('/api/runs/:id/events', (req: ApiRequest, res: ApiResponse) => {
    const run = design.runs.get(req.params.id);
    if (!run) return sendApiError(res, 404, 'NOT_FOUND', 'run not found');
    design.runs.stream(run, req, res);
  });

  app.get('/api/runs/:id/agui', async (req: ApiRequest, res: ApiResponse) => {
    const run = design.runs.get(req.params.id);
    if (!run) return sendApiError(res, 404, 'NOT_FOUND', 'run not found');
    const { encodeOdEventForAgui } = await import('@open-design/agui-adapter');
    const sse = createSseResponse(res);
    const lastEventId = Number(req.get('Last-Event-ID') || req.query.after || 0);
    const emitMapped = (record: AguiEventRecord) => {
      const mapped = encodeOdEventForAgui(
        { kind: record.event, ...(record.data ?? {}) } as any,
        { runId: run.id, seq: record.id, now: Date.now() },
      );
      if (mapped) sse.send(mapped.kind, mapped, record.id);
    };
    for (const record of run.events as AguiEventRecord[]) {
      if (!Number.isFinite(lastEventId) || record.id > lastEventId) emitMapped(record);
    }
    if (design.runs.isTerminal(run.status)) {
      sse.end();
      return;
    }
    const adapterClient = {
      send: (event: string, data: Record<string, unknown> | null | undefined, id: number) => {
        const mapped = encodeOdEventForAgui(
          { kind: event, ...(data ?? {}) } as any,
          { runId: run.id, seq: id, now: Date.now() },
        );
        if (mapped) sse.send(mapped.kind, mapped, id);
      },
      end:     () => sse.end(),
      cleanup: () => sse.cleanup?.(),
    };
    run.clients.add(adapterClient);
    res.on('close', () => {
      run.clients.delete(adapterClient);
      sse.cleanup?.();
    });
  });

  app.post('/api/runs/:id/cancel', async (req: ApiRequest, res: ApiResponse) => {
    const run = design.runs.get(req.params.id);
    if (!run) return sendApiError(res, 404, 'NOT_FOUND', 'run not found');
    const status = await design.runs.cancel(run);
    const body = { ok: true, run: status };
    res.json(body);
  });

  app.post('/api/chat', (req: ApiRequest, res: ApiResponse) => {
    if (ctx.lifecycle.isDaemonShuttingDown()) {
      return sendApiError(res, 503, 'UPSTREAM_UNAVAILABLE', 'daemon is shutting down');
    }
    const requestBody = req.body && typeof req.body === 'object' ? req.body : {};
    const mediaExecution = parseMediaExecutionPolicyInput(requestBody.mediaExecution);
    if (!mediaExecution.ok) {
      return sendApiError(res, 400, 'BAD_REQUEST', mediaExecution.message);
    }
    const toolBundle = parseRunToolBundleForRequest(requestBody.toolBundle);
    if (!toolBundle.ok) {
      return sendApiError(res, 400, 'BAD_REQUEST', toolBundle.message);
    }
    let chatProject = null;
    if (typeof requestBody.projectId === 'string' && requestBody.projectId) {
      try {
        chatProject = getProject(db, requestBody.projectId);
        assertSandboxProjectRootAvailable(chatProject?.metadata);
      } catch (err) {
        if (err instanceof SandboxImportedProjectError) {
          return sendApiError(res, 400, 'BAD_REQUEST', err.message);
        }
        throw err;
      }
    }
    const toolBundleSupport = validateRunToolBundleForAgent(
      toolBundle.bundle,
      typeof requestBody.agentId === 'string' ? getAgentDef(requestBody.agentId) : null,
      {
        deliveryTarget: runToolBundleDeliveryTargetForProject(
          requestBody.projectId,
          chatProject?.metadata,
        ),
      },
    );
    if (!toolBundleSupport.ok) {
      return sendApiError(res, 400, 'BAD_REQUEST', toolBundleSupport.message);
    }
    const meta = {
      ...requestBody,
      mediaExecution: mediaExecution.policy,
      toolBundle: toolBundle.bundle,
      ...(chatProject?.metadata ? { projectMetadata: chatProject.metadata } : {}),
    };
    const run = design.runs.create(meta);
    design.runs.stream(run, req, res);
    design.runs.start(run, () => startChatRun(meta, run));
  });
}
