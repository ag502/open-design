package contract

import "testing"

func TestCmpVersion(t *testing.T) {
	cases := []struct {
		a, b string
		want int
	}{
		{"1.0.1", "1.0.0", 1},
		{"1.0.0", "1.0.1", -1},
		{"1.0.0", "1.0.0", 0},
		{"2.0.0", "1.9.9", 1},
		{"v1.0.1", "1.0.0", 1},           // leading v stripped
		{"1.0.0+build", "1.0.0", 0},      // build metadata ignored
		{"1.0.0", "1.0.0-beta.1", 1},     // release beats prerelease
		{"1.0.0-beta.1", "1.0.0", -1},    // and the reverse
		{"1.0.0-beta.1", "1.0.0-beta.2", -1},
		{"1.0.0-beta.2", "1.0.0-beta.10", -1}, // numeric identifier order
		{"1.0.0-alpha", "1.0.0-beta", -1},     // lexical identifier order
		{"1.0.0-beta.1", "1.0.0-beta", 1},     // longer prerelease sorts after
		{"1.0.0-1", "1.0.0-alpha", -1},        // numeric identifier below alnum
		{"1.2.3.nightly.5", "1.2.3.nightly.4", 1},
		{"1.2.3.nightly.5", "1.2.3", -1}, // nightly is a prerelease
	}
	for _, c := range cases {
		if got := CmpVersion(c.a, c.b); got != c.want {
			t.Errorf("CmpVersion(%q, %q) = %d, want %d", c.a, c.b, got, c.want)
		}
		// Antisymmetry: reversing arguments negates the result.
		if got := CmpVersion(c.b, c.a); got != -c.want {
			t.Errorf("CmpVersion(%q, %q) = %d, want %d (antisymmetry)", c.b, c.a, got, -c.want)
		}
	}
}

func TestLoadConfig(t *testing.T) {
	env := func(m map[string]string) func(string) string {
		return func(k string) string { return m[k] }
	}

	c, err := LoadConfig(env(map[string]string{
		EnvNamespace: "release-beta-win",
		EnvChannel:   "beta",
		EnvDataDir:   "/tmp/od-data",
	}))
	if err != nil {
		t.Fatalf("LoadConfig: unexpected error %v", err)
	}
	if c.Namespace != "release-beta-win" || c.Channel != "beta" || c.DataDir != "/tmp/od-data" {
		t.Fatalf("LoadConfig merged unexpected config: %+v", c)
	}

	if _, err := LoadConfig(env(map[string]string{EnvChannel: "beta"})); err == nil {
		t.Fatal("LoadConfig: expected cold-start floor error when namespace is empty")
	}
}

func TestStampRoundTrip(t *testing.T) {
	in := Stamp{Hop: 1, AfterQuitPID: 4242, AfterQuitTimeout: 8000, Choice: ChoiceUse}
	args := in.Args()
	if len(args) != 2 || args[0] != ArgStamp {
		t.Fatalf("Args() shape wrong: %v", args)
	}
	got := ParseStamp(append([]string{"--other", "x"}, args...))
	if got.Hop != 1 || got.AfterQuitPID != 4242 || got.AfterQuitTimeout != 8000 || got.Choice != ChoiceUse {
		t.Fatalf("round-trip mismatch: %+v", got)
	}
	if got.Version != StampVersion {
		t.Fatalf("Args() must stamp the schema version, got %d", got.Version)
	}
}

func TestParseStampAbsentOrMalformed(t *testing.T) {
	if s := ParseStamp([]string{"--foo", "bar"}); s.Hop != 0 || s.Version != 0 {
		t.Fatalf("absent stamp must be the zero value (hop 0), got %+v", s)
	}
	if s := ParseStamp([]string{ArgStamp, "{not json"}); s.Hop != 0 {
		t.Fatalf("malformed stamp must be the zero value, got %+v", s)
	}
}

func TestManifestSchemaSupported(t *testing.T) {
	supported := Manifest{}
	supported.Launcher.Schema = SupportedLauncherSchema
	if !supported.SchemaSupported() {
		t.Fatal("manifest at the supported schema must be adoptable")
	}

	tooNew := Manifest{}
	tooNew.Launcher.Schema = SupportedLauncherSchema + 1
	if tooNew.SchemaSupported() {
		t.Fatal("manifest above the supported launcher schema must trip the local floor")
	}
}
