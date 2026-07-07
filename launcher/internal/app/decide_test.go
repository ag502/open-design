package app

import (
	"testing"

	"github.com/nexu-io/open-design/launcher/internal/contract"
	"github.com/nexu-io/open-design/launcher/internal/state"
)

func TestModeForHop(t *testing.T) {
	if ModeForHop(0) != ModeStub {
		t.Fatal("hop 0 must be the L0 stub")
	}
	if ModeForHop(1) != ModeAuthority {
		t.Fatal("hop 1 must be the L1 authority")
	}
}

func TestDecideHandoff(t *testing.T) {
	self := "1.0.0"
	sel := func(v string) state.Selection {
		return state.Selection{Pointer: &contract.Pointer{Version: v}, Reason: state.ReasonActive, Selected: true}
	}

	if got := DecideHandoff(state.Selection{Reason: state.ReasonNone}, self, false); got != ActionNothingRunnable {
		t.Fatalf("no selection → ActionNothingRunnable, got %v", got)
	}
	// Newer delegated launcher present → hand off.
	if got := DecideHandoff(sel("1.1.0"), self, true); got != ActionHandoff {
		t.Fatalf("newer delegated + binary present → ActionHandoff, got %v", got)
	}
	// Newer version selected but its binary is missing → run authority inline.
	if got := DecideHandoff(sel("1.1.0"), self, false); got != ActionRunAuthorityInline {
		t.Fatalf("newer but no binary → run inline, got %v", got)
	}
	// Selected version equals this baked build (genesis) → run authority inline.
	if got := DecideHandoff(sel("1.0.0"), self, true); got != ActionRunAuthorityInline {
		t.Fatalf("same version → run inline, got %v", got)
	}
	// Selected version older than this baked build → this build is newest, run inline.
	if got := DecideHandoff(sel("0.9.0"), self, true); got != ActionRunAuthorityInline {
		t.Fatalf("older selected → run inline, got %v", got)
	}
}
