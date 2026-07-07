import {
  ResourceHubError,
  createResourceHubClient,
  readResourceHubPrincipal,
} from './integrations/resource-hub.js';

// `od resource …` — team resource sharing CLI (Spec E, daemon side). Tier-1
// skeleton: `list` is wired to the hub index for real; `share`/`pull` are stubs
// pending the blob transport decision and the local wrap logic. Kept in its own
// module so cli.ts only gains one import + one SUBCOMMAND_MAP entry.

const USAGE = `Usage:
  od resource list                 List team resources from the hub
  od resource share <kind> <id>    Share a local resource to the team (not yet implemented)
  od resource pull <kind> <id>     Pull a shared team resource locally (not yet implemented)

Environment (dev/local, provisional until link B lands the member table):
  OD_RESOURCE_HUB_URL              Hub base URL (default http://127.0.0.1:18082)
  OD_RESOURCE_HUB_TOKEN            Internal token the hub trusts
  OD_WORKSPACE_MEMBER_ID / OD_WORKSPACE_TEAM_ID / OD_WORKSPACE_ROLE
`;

function printUsage(): void {
  console.log(USAGE);
}

async function runList(): Promise<void> {
  const principal = readResourceHubPrincipal();
  if (!principal) {
    console.error(
      'workspace principal unavailable; set OD_WORKSPACE_MEMBER_ID and OD_WORKSPACE_TEAM_ID',
    );
    process.exitCode = 1;
    return;
  }
  const client = createResourceHubClient();
  try {
    const resources = await client.listResources(principal);
    if (resources.length === 0) {
      console.log('no team resources');
      return;
    }
    for (const resource of resources) {
      console.log(`${resource.kind}\t${resource.id}\t${resource.ownerMemberId}`);
    }
  } catch (error) {
    if (error instanceof ResourceHubError) {
      console.error(`resource hub error (${error.status} ${error.code})`);
    } else {
      console.error('resource hub unreachable');
    }
    process.exitCode = 1;
  }
}

export async function runResource(args: string[]): Promise<void> {
  const sub = args[0];
  switch (sub) {
    case 'list':
      await runList();
      return;
    case 'share':
    case 'pull':
      console.error(
        `od resource ${sub}: not yet implemented (pending blob transport decision and local wrap logic)`,
      );
      process.exitCode = 1;
      return;
    case undefined:
    case 'help':
    case '--help':
    case '-h':
      printUsage();
      return;
    default:
      console.error(`unknown subcommand: od resource ${sub}`);
      printUsage();
      process.exitCode = 1;
  }
}
