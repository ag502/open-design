package contract

import (
	_ "embed"
	"encoding/json"
	"errors"
	"fmt"
	"os"
)

//go:embed default.json
var embeddedDefault []byte

// LoadConfig resolves the field-scoped layered merge — embedded default.json
// (baked) < env overrides. This is the launcher's non-empty floor: the
// interpreter always has coordinates to obey, even at genesis. Remote content
// never reaches these identity fields.
//
// The launcher is the authority for namespace/channel/data-dir resolution and
// injects OD_DATA_DIR downward (aligns with the AGENTS.md rule that packaged code
// resolves the final data root before spawning the daemon).
func LoadConfig(env func(string) string) (Config, error) {
	if env == nil {
		env = os.Getenv
	}
	var c Config
	if err := json.Unmarshal(embeddedDefault, &c); err != nil {
		return c, fmt.Errorf("embedded default.json: %w", err)
	}
	override(&c.Namespace, env(EnvNamespace))
	override(&c.Channel, env(EnvChannel))
	override(&c.DataDir, env(EnvDataDir))
	if c.DataDir == "" {
		home, _ := os.UserHomeDir()
		c.DataDir = home
	}
	if c.Namespace == "" || c.Channel == "" {
		return c, errors.New("cold-start floor incomplete: need namespace and channel")
	}
	return c, nil
}

func override(dst *string, value string) {
	if value != "" {
		*dst = value
	}
}
