// Package state is the launcher's local disk truth: the on-disk layout, atomic
// JSON read/write, and the crash-safe A/B selection shared by both axes. It is
// pure mechanism over the contract kernel and never touches the network.
package state

import (
	"path/filepath"
	"runtime"

	"github.com/nexu-io/open-design/launcher/internal/contract"
)

// launcherBinaryName is the filename of a versioned delegated-launcher (L1)
// binary inside versions/<v>/.
var launcherBinaryName = func() string {
	if runtime.GOOS == "windows" {
		return "launcher.exe"
	}
	return "launcher"
}()

// Paths resolves the on-disk launcher layout for one (channel, namespace). It
// mirrors @open-design/launcher-proto so the payload runtime.json stays
// forward-compatible with the existing TypeScript readers/writers; the launcher
// axis adds files without changing the shared ones.
type Paths struct {
	Root            string // <dataRoot>/launcher/channels/<ch>/namespaces/<ns>
	PayloadRuntime  string // runtime.json — payload axis (L1), launcher-proto compatible
	LauncherRuntime string // launcher-runtime.json — launcher axis (L0), additive
	PayloadAttempt  string // state/attempt.json — payload boot attempt (L1)
	LauncherAttempt string // state/launcher-attempt.json — launcher handoff attempt (L0)
	StateDir        string
	VersionsDir     string
	LockDir         string
}

// Resolve derives the layout under a resolved data root (OD_DATA_DIR-derived).
func Resolve(dataRoot string, c contract.Config) Paths {
	root := filepath.Join(dataRoot, "launcher", "channels", c.Channel, "namespaces", c.Namespace)
	stateDir := filepath.Join(root, "state")
	return Paths{
		Root:            root,
		PayloadRuntime:  filepath.Join(root, "runtime.json"),
		LauncherRuntime: filepath.Join(root, "launcher-runtime.json"),
		PayloadAttempt:  filepath.Join(stateDir, "attempt.json"),
		LauncherAttempt: filepath.Join(stateDir, "launcher-attempt.json"),
		StateDir:        stateDir,
		VersionsDir:     filepath.Join(root, "versions"),
		LockDir:         filepath.Join(stateDir, "lock"),
	}
}

// VersionDir is versions/<v>/.
func (p Paths) VersionDir(version string) string {
	return filepath.Join(p.VersionsDir, version)
}

// ManifestPath is versions/<v>/manifest.json.
func (p Paths) ManifestPath(version string) string {
	return filepath.Join(p.VersionDir(version), "manifest.json")
}

// PayloadRoot is versions/<v>/payload — the Electron payload L1 points at.
func (p Paths) PayloadRoot(version string) string {
	return filepath.Join(p.VersionDir(version), "payload")
}

// LauncherBinary is versions/<v>/launcher(.exe) — the delegated L1 binary that L0
// hands off to.
func (p Paths) LauncherBinary(version string) string {
	return filepath.Join(p.VersionDir(version), launcherBinaryName)
}
