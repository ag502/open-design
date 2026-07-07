package contract

// Config is the baked/merged identity + coordinates (the genome). Remote content
// may never contribute to these fields. Network-free by design: there is no base
// URL — the launcher never fetches anything.
type Config struct {
	Namespace string `json:"namespace"`
	Channel   string `json:"channel"`
	DataDir   string `json:"dataDir"`
}

// Pointer names a version + generation. JSON tags mirror
// @open-design/launcher-proto's LauncherVersionPointer so runtime.json is shared.
type Pointer struct {
	Generation int    `json:"generation"`
	Version    string `json:"version"`
}

// Runtime is a version-selection state document: active (want) and lastSuccessful
// (last confirmed healthy). ONE shape serves BOTH axes as two separate files: the
// payload axis (runtime.json, L1's domain — kept byte-compatible with
// launcher-proto's LauncherRuntimeDescriptor so existing TypeScript readers keep
// working) and the launcher axis (launcher-runtime.json, L0's domain — which
// versioned launcher binary to hand off to).
//
// There is deliberately no available/skipped field: the launcher never downloads,
// so "adopt this newer version" arrives as a stamp Choice from the payload's
// updater, not as runtime state.
type Runtime struct {
	SchemaVersion  int      `json:"schemaVersion"`
	Channel        string   `json:"channel"`
	Namespace      string   `json:"namespace"`
	Active         *Pointer `json:"active"`
	LastSuccessful *Pointer `json:"lastSuccessful"`
	UpdatedAt      string   `json:"updatedAt,omitempty"`
}

// Attempt marks an in-flight boot of active; a stale one on next boot feeds the
// rollback decision. FailCount is the crash-loop counter (CS2): the launcher
// rolls back to lastSuccessful only after FailCount reaches the contract
// threshold, so a single transient boot failure does not demote a good version.
type Attempt struct {
	SchemaVersion int    `json:"schemaVersion"`
	Channel       string `json:"channel"`
	Namespace     string `json:"namespace"`
	Version       string `json:"version"`
	Generation    int    `json:"generation"`
	FailCount     int    `json:"failCount,omitempty"`
	StartedAt     string `json:"startedAt,omitempty"`
}

// LayerSchema is one arm of the hierarchical schema declaration a release feed or
// on-disk version manifest carries, e.g. `"launcher": { "schema": 2 }`.
type LayerSchema struct {
	Schema int `json:"schema"`
}

// Manifest is the per-version payload descriptor written into versions/<v>/ when
// the Electron updater extracts a payload. The launcher reads it to enforce its
// LOCAL schema floor: never adopt/run a version whose Launcher.Schema exceeds
// SupportedLauncherSchema. WatchdogMs opts a payload into heartbeat supervision
// (0 = liveness-only).
type Manifest struct {
	Launcher   LayerSchema `json:"launcher"`
	Payload    LayerSchema `json:"payload"`
	Version    string      `json:"version"`
	Channel    string      `json:"channel"`
	Namespace  string      `json:"namespace"`
	WatchdogMs int         `json:"watchdogMs"`
	Entry      struct {
		Cwd  string `json:"cwd"`
		Exec string `json:"executable"`
	} `json:"entry"`
}

// SchemaSupported reports whether this build can interpret the given version
// manifest — the launcher's local reseed floor (the on-disk counterpart of the
// feed-facing guardrail the TypeScript updater applies).
func (m Manifest) SchemaSupported() bool {
	return m.Launcher.Schema <= SupportedLauncherSchema
}
