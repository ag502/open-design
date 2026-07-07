package contract

import "encoding/json"

// StampVersion is the in-band additive schema of the launcher→launcher handoff
// stamp. The stamp is the ONLY launcher→launcher channel and carries the single
// allowed handoff (L0 baked stub → L1 delegated authority): the hop counter, the
// after-quit wait to honour, and the deferred adopt choice. It is non-secret and
// human-readable in `ps` (opacity is not a goal).
const StampVersion = 1

// Choice is the deferred adopt decision the payload's updater passes down through
// L0 to L1: use (adopt the available version) or skip. Empty = defer (re-offer
// next boot). L0 only forwards it; L1 consumes it.
type Choice string

const (
	ChoiceUse  Choice = "use"
	ChoiceSkip Choice = "skip"
)

// Stamp is the handoff token. Hop selects the mode of the single Go binary: hop 0
// = the baked bundle copy running as the L0 stub; hop 1 = the delegated payload
// copy running as the L1 authority. Only ONE handoff is allowed, so a valid Hop
// is 0 or 1 — L1 never hands off again.
type Stamp struct {
	Version          int    `json:"v"`
	Hop              int    `json:"hop"`
	AfterQuitPID     int    `json:"aqPid,omitempty"`
	AfterQuitTimeout int    `json:"aqTimeoutMs,omitempty"`
	Choice           Choice `json:"choice,omitempty"`
}

// Args renders the stamp as ["--od-stamp", "<json>"], stamping the current
// schema version.
func (s Stamp) Args() []string {
	s.Version = StampVersion
	b, _ := json.Marshal(s)
	return []string{ArgStamp, string(b)}
}

// ParseStamp scans argv for the stamp token and returns the decoded stamp; the
// zero value (Hop 0) is returned when the stamp is absent or malformed, so the
// baked stub with no stamp naturally reads as hop 0.
func ParseStamp(args []string) Stamp {
	for i := 0; i < len(args); i++ {
		if args[i] == ArgStamp && i+1 < len(args) {
			var s Stamp
			if json.Unmarshal([]byte(args[i+1]), &s) == nil {
				return s
			}
			return Stamp{}
		}
	}
	return Stamp{}
}
