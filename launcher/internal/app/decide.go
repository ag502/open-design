// Package app is the launcher orchestration. This file holds the pure decision
// logic (no process/OS side effects) so the crash-safe control flow is unit
// testable; the process spawning, health handshake, lock, and control endpoint
// are layered on top elsewhere.
package app

import (
	"github.com/nexu-io/open-design/launcher/internal/contract"
	"github.com/nexu-io/open-design/launcher/internal/state"
)

// Mode is the role this single binary plays, selected by the handoff hop: the
// baked bundle copy runs as the L0 stub (hop 0); the delegated payload copy runs
// as the L1 authority (hop 1). Only one handoff is allowed, so hop never exceeds 1.
type Mode int

const (
	ModeStub      Mode = iota // L0: min identity + find-newest + one handoff + fallback
	ModeAuthority             // L1: payload select + confirm/rollback + supervise Electron
)

// ModeForHop maps a stamp hop to the binary's role.
func ModeForHop(hop int) Mode {
	if hop >= 1 {
		return ModeAuthority
	}
	return ModeStub
}

// HandoffAction is what the L0 stub does after selecting the launcher axis.
type HandoffAction int

const (
	// ActionNothingRunnable: genesis with no selectable launcher — L0 shows the
	// native reinstall dialog + download link (CS4).
	ActionNothingRunnable HandoffAction = iota
	// ActionRunAuthorityInline: the selected launcher version IS this baked build
	// (genesis / same-version), so run the L1 authority in-process — no handoff.
	ActionRunAuthorityInline
	// ActionHandoff: a delegated launcher binary newer than this baked build is on
	// disk, so hand off to it once (spawn it at hop 1).
	ActionHandoff
)

// DecideHandoff applies the single-handoff rule. sel is the launcher-axis A/B
// selection (state.Select over launcher-runtime.json); selfVersion is this baked
// build's contract.SelfVersion; delegatedBinExists reports whether
// versions/<selected>/launcher(.exe) is present on disk.
//
// Hand off only when the selected launcher version is strictly newer than this
// build AND its binary exists; otherwise this build is already the newest usable
// launcher and runs the authority itself. This mirrors the PoC's "terminal
// launcher = whichever no longer trampolines", bounded to exactly one hop.
func DecideHandoff(sel state.Selection, selfVersion string, delegatedBinExists bool) HandoffAction {
	if !sel.Selected || sel.Pointer == nil {
		return ActionNothingRunnable
	}
	if delegatedBinExists && contract.CmpVersion(sel.Pointer.Version, selfVersion) > 0 {
		return ActionHandoff
	}
	return ActionRunAuthorityInline
}
