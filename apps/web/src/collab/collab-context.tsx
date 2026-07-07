import { createContext, useContext, type ReactNode } from 'react';
import type { ProjectCollab } from './useProjectCollab';

// Shares the project's collab state (from useProjectCollab in ProjectView) down
// to deep descendants (FileViewer's comment overlay) without prop-threading
// through the big intermediate components, and without a second collab client.

const DISABLED: ProjectCollab = {
  enabled: false,
  member: null,
  present: [],
  publishedVersion: null,
  syncState: null,
  reportChange: () => {},
  requestPublish: () => {},
};

const CollabContext = createContext<ProjectCollab>(DISABLED);

export function CollabProvider({ value, children }: { value: ProjectCollab; children: ReactNode }) {
  return <CollabContext.Provider value={value}>{children}</CollabContext.Provider>;
}

/** The current project's collab state; disabled default outside a provider. */
export function useProjectCollabContext(): ProjectCollab {
  return useContext(CollabContext);
}
