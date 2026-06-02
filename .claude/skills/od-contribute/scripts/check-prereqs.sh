#!/usr/bin/env bash
# Verify required tools + gh auth before the skill starts.
# Exit 0  = ready (prints GH_USER=... and READY=1 to stdout)
# Exit 2  = missing prereq, hint printed to stderr; skill should surface it verbatim.

set -uo pipefail

# shellcheck disable=SC1091
source "$(dirname "$0")/config.sh"

# config.sh runs with `set -e` for its own callers, but this script wants the
# OPPOSITE behavior: continue checking all prereqs even when one fails so we
# can surface the full diagnostic in one shot rather than aborting at the
# first miss. Restore -uo pipefail without -e after sourcing.
set +e
set -uo pipefail

# Skill root, used in the auth-failure hint below to tell the user where to
# drop a .gh-token file if they're stuck in a sandboxed agent.
_OD_SKILL_DIR_HINT="$(cd "$(dirname "$0")/.." && pwd)"

STATUS=0
MISSING=()
HINTS=()

check_bin() {
  local bin="$1" install_hint="$2"
  if command -v "$bin" >/dev/null 2>&1; then
    printf '  ✓ %s\n' "$bin" >&2
  else
    printf '  ✗ %s (not installed)\n' "$bin" >&2
    MISSING+=("$bin")
    HINTS+=("$install_hint")
    STATUS=2
  fi
}

printf '[od-contrib] checking prerequisites...\n' >&2

OS="$(uname -s)"
case "$OS" in
  Darwin) GH_HINT="brew install gh" ;;
  Linux)  GH_HINT="see https://github.com/cli/cli#installation (e.g. 'sudo apt install gh' or 'brew install gh')" ;;
  *)      GH_HINT="see https://github.com/cli/cli#installation" ;;
esac

check_bin gh   "$GH_HINT"
check_bin git  "install git for your OS"
check_bin jq   "$( [[ $OS == Darwin ]] && echo 'brew install jq' || echo 'sudo apt install jq  (or brew install jq)' )"

if ((${#MISSING[@]} > 0)); then
  printf '\n[od-contrib][error] missing required tools: %s\n' "${MISSING[*]}" >&2
  printf '\nInstall hints:\n' >&2
  for i in "${!MISSING[@]}"; do
    printf '  - %s: %s\n' "${MISSING[$i]}" "${HINTS[$i]}" >&2
  done
  exit 2
fi

# Resolve the authenticated GitHub login.
#
# Two paths, in order of preference when GH_TOKEN is set:
#   1. curl directly against api.github.com  ← preferred when GH_TOKEN is set
#   2. `gh api user`                          ← fallback / no-token case
#
# Why curl first when we already have a token: sandboxed agent runtimes
# (Codex.app, Cursor, certain AI desktop apps) often have a working gh
# binary BUT the gh CLI fails to talk to api.github.com from inside the
# sandbox — usually because gh tries to read ~/.config/gh/hosts.yml or
# the macOS keychain and the sandbox blocks it. curl bypasses that whole
# layer: we already have the bearer token, we just hit the REST endpoint.
# The user's contribution flow uses curl elsewhere (install.sh, validate-
# markdown, etc.) so we know it works in their environment.

od_resolve_login() {
  if [[ -n "${GH_TOKEN:-}" ]]; then
    curl --fail --silent --show-error --max-time 10 \
      -H "Authorization: Bearer $GH_TOKEN" \
      -H "User-Agent: od-contribute" \
      -H "Accept: application/vnd.github+json" \
      https://api.github.com/user 2>/dev/null \
      | jq -r '.login // empty' 2>/dev/null
  else
    gh api user --jq .login 2>/dev/null
  fi
}

if [[ -n "${GH_TOKEN:-}" ]]; then
  # Verify the token works.
  GH_USER="$(od_resolve_login)"
  if [[ -z "$GH_USER" ]]; then
    cat >&2 <<EOF

[od-contrib][error] GH_TOKEN is set but the GitHub API call failed.

Tried both:
  1. curl https://api.github.com/user with Bearer \$GH_TOKEN
  2. (skipped — fell back to direct curl since gh CLI fails in some sandboxed runtimes)

Common causes:
  - The token has expired or been revoked.
  - The token is missing the 'repo' scope.
  - This shell can't reach api.github.com (corporate proxy / firewall / sandbox network policy).

Refresh the token from a non-sandboxed terminal:
  gh auth refresh -s repo
  gh auth token > "$_OD_SKILL_DIR_HINT/.gh-token"
  chmod 600 "$_OD_SKILL_DIR_HINT/.gh-token"

Then re-run this skill.
EOF
    exit 2
  fi
elif ! gh auth status >/dev/null 2>&1; then
  cat >&2 <<EOF

[od-contrib][error] No GitHub credentials available.

Two ways to fix this:

  Option A (one-time, works for any agent):
    From a regular terminal, run:
      gh auth login
    Pick GitHub.com → HTTPS → browser login. Need 'repo' scope.

  Option B (for sandboxed agents like Codex.app / Cursor that can't reach
  the macOS keychain):
    From a regular terminal where gh IS authenticated, run:
      gh auth token > "$_OD_SKILL_DIR_HINT/.gh-token"
      chmod 600 "$_OD_SKILL_DIR_HINT/.gh-token"
    The skill will pick up the token automatically next run.
EOF
  exit 2
else
  # No GH_TOKEN, but `gh auth status` is green — use gh-based resolution.
  GH_USER="$(od_resolve_login)"
fi
if [[ -z "$GH_USER" ]]; then
  cat >&2 <<'EOF'

[od-contrib][error] gh auth check passed but `gh api user` could not resolve a login.

Common causes:
  - The token has insufficient scopes (need at least 'repo')
  - The token has been revoked or expired since the session started
  - GitHub API is unreachable

Refresh the token with the right scopes and retry:

  gh auth refresh -s repo
EOF
  exit 2
fi

printf '  ✓ gh authed as %s\n' "$GH_USER" >&2
printf '  ✓ target locked to %s\n' "$OD_TARGET_REPO" >&2

printf 'GH_USER=%s\n' "$GH_USER"
printf 'READY=1\n'
