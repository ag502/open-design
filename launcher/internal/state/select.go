package state

import "github.com/nexu-io/open-design/launcher/internal/contract"

// Reason explains why Select chose a target.
type Reason string

const (
	ReasonActive         Reason = "active"
	ReasonLastSuccessful Reason = "last-successful"
	ReasonNone           Reason = "none"
)

// Selection is the outcome of the crash-safe A/B decision.
type Selection struct {
	Pointer  *contract.Pointer
	Reason   Reason
	Selected bool
}

// Select applies the crash-safe A/B rollback shared by BOTH axes (L0's launcher
// axis and L1's payload axis), mirroring @open-design/launcher-proto's
// selectLauncherRuntimeTarget:
//
//   - no active → fall back to lastSuccessful (ReasonNone at genesis with neither);
//   - a stale attempt still matching active (version+generation) with a
//     lastSuccessful present means a prior boot of active crashed before
//     confirming → roll back to lastSuccessful;
//   - otherwise run active, and the caller (re)writes the attempt before booting.
//
// rollbackThreshold implements the CS2 crash-loop tolerance: roll back only after
// that many consecutive unconfirmed boots. A stale attempt carries FailCount =
// prior consecutive failures, so this boot is failure FailCount+1; threshold<=1
// rolls back on the first failure (the PoC default), higher tolerates transient
// boot failures before demoting a good new version.
func Select(rt contract.Runtime, attempt *contract.Attempt, rollbackThreshold int) Selection {
	if rt.Active == nil {
		if rt.LastSuccessful == nil {
			return Selection{Reason: ReasonNone}
		}
		return Selection{Pointer: rt.LastSuccessful, Reason: ReasonLastSuccessful, Selected: true}
	}
	if attempt != nil &&
		attempt.Version == rt.Active.Version &&
		attempt.Generation == rt.Active.Generation &&
		rt.LastSuccessful != nil {
		threshold := rollbackThreshold
		if threshold < 1 {
			threshold = 1
		}
		if attempt.FailCount+1 >= threshold {
			return Selection{Pointer: rt.LastSuccessful, Reason: ReasonLastSuccessful, Selected: true}
		}
	}
	return Selection{Pointer: rt.Active, Reason: ReasonActive, Selected: true}
}
