import { DEFAULT_MODEL_OPTION } from './shared.js';
import type { RuntimeAgentDef } from '../types.js';

// Google Antigravity — agentic dev platform launched 2025-11 with Gemini 3.
// `agy` is the terminal CLI surface; the IDE (Antigravity 2.0) shares the
// same agent engine and OAuth credentials via the system keyring, so a
// signed-in user is authenticated on first run with no extra work.
//
// As of v1.0.3 the CLI is TUI-first and minimally headless:
//   - `agy -p "<prompt>"` runs a single non-interactive turn and prints
//     the assistant reply as plain text to stdout, then exits.
//   - There is no JSON / stream-json / ACP output mode yet (open upstream
//     issues #119, #31), and no `--model` flag yet (open issue #35).
//   - The prompt MUST go on argv as the value of `-p`; stdin piping is
//     not supported (`-p` is a value flag, not a boolean).
//
// Until upstream ships a structured output mode, we expose Antigravity as
// a `plain` runtime — single-turn text reply with no tool_use streaming
// and no model picker. When `--output-format stream-json` lands we will
// upgrade buildArgs + add a dedicated event parser.
export const antigravityAgentDef = {
  id: 'antigravity',
  name: 'Antigravity',
  bin: 'agy',
  versionArgs: ['--version'],
  // Only `default` for now: `agy` has no `--model` flag (upstream issue
  // #35). Showing concrete model ids in the picker would mislead users
  // into thinking the choice is wired through. Upgrade this list when
  // upstream adds model selection.
  fallbackModels: [DEFAULT_MODEL_OPTION],
  buildArgs: (prompt, _imagePaths, _extra = [], _options = {}) => {
    return ['-p', prompt];
  },
  // Guard against prompts that would blow Windows' ~32 KB CreateProcess
  // limit. Prompt rides on argv because `agy -p` is a value flag with
  // no stdin sentinel; 30_000 bytes mirrors the deepseek budget and
  // leaves ~2.7 KB of argv headroom for `-p` plus quoting.
  maxPromptArgBytes: 30_000,
  streamFormat: 'plain',
  installUrl: 'https://antigravity.google/cli',
  docsUrl: 'https://antigravity.google/docs/cli-overview',
} satisfies RuntimeAgentDef;
