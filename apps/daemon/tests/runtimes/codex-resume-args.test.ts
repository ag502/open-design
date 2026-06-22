import { describe, expect, it } from 'vitest';
import { codexAgentDef } from '../../src/runtimes/defs/codex.js';

// codex is capture-style: it mints its own thread id (reported on the stream's
// `thread.started` event) rather than accepting a daemon-minted one. So a
// create turn passes NO id (plain `exec`) and a resume turn replays the stored
// thread id as `exec resume <id>`. The id daemon-side `newSessionId` is ignored
// by codex on purpose.
describe('codex buildArgs session resume', () => {
  const THREAD = '019eef4f-7409-7c82-bebe-30504eed3959';

  it('uses plain `exec` (no resume, no id) on a create turn', () => {
    const args = codexAgentDef.buildArgs('prompt', [], [], {}, {
      newSessionId: '11111111-1111-4111-8111-111111111111',
      resumeSessionId: null,
    });
    expect(args[0]).toBe('exec');
    expect(args).not.toContain('resume');
    // The minted daemon id must NOT leak into argv — codex would reject/ignore.
    expect(args).not.toContain('11111111-1111-4111-8111-111111111111');
    // Create turn keeps the `--sandbox` flag form.
    expect(args).toContain('--sandbox');
  });

  it('uses `exec resume <thread_id>` with the stored id on a resume turn', () => {
    const args = codexAgentDef.buildArgs('prompt', [], [], {}, {
      newSessionId: '22222222-2222-4222-8222-222222222222',
      resumeSessionId: THREAD,
    });
    expect(args.slice(0, 2)).toEqual(['exec', 'resume']);
    // The thread id is the trailing positional SESSION_ID arg.
    expect(args[args.length - 1]).toBe(THREAD);
  });

  it('passes sandbox via `-c sandbox_mode` on resume (never `--sandbox`, which resume rejects)', () => {
    const args = codexAgentDef.buildArgs('prompt', [], [], {}, {
      resumeSessionId: THREAD,
    });
    expect(args).not.toContain('--sandbox');
    expect(args.some((a) => a.startsWith('sandbox_mode='))).toBe(true);
    // The `-c key=value` override carries the value (workspace-write default).
    expect(args).toContain('-c');
    expect(args.some((a) => a.includes('sandbox_mode="workspace-write"'))).toBe(true);
  });

  it('keeps model + reasoning overrides ahead of the trailing thread id on resume', () => {
    const args = codexAgentDef.buildArgs(
      'prompt',
      [],
      [],
      { model: 'gpt-5.1-codex', reasoning: 'high' },
      { resumeSessionId: THREAD },
    );
    const idIndex = args.indexOf(THREAD);
    expect(idIndex).toBe(args.length - 1);
    const modelIndex = args.indexOf('--model');
    expect(modelIndex).toBeGreaterThan(-1);
    // Flags precede the positional session id.
    expect(modelIndex).toBeLessThan(idIndex);
  });

  it('uses plain `exec` when no session context is supplied (back-compat)', () => {
    const args = codexAgentDef.buildArgs('prompt', [], [], {}, {});
    expect(args[0]).toBe('exec');
    expect(args).not.toContain('resume');
  });

  it('declares CLI-managed, capture-style session resume', () => {
    expect(codexAgentDef.resumesSessionViaCli).toBe(true);
    expect(codexAgentDef.capturesSessionIdFromStream).toBe(true);
  });
});
