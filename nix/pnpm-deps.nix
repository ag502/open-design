{
  # Vendored pnpm store hashes for the workspace packages built by the flake.
  #
  # The daemon and web derivations now build from different filtered source
  # trees, so each fetchPnpmDeps invocation needs its own fixed-output hash.
  # Refresh a hash whenever pnpm-lock.yaml or that derivation's source filter
  # changes:
  # 1. Temporarily set the consuming `hash = lib.fakeHash;`
  # 2. Run the relevant nix build/flake check
  # 3. Copy the expected hash printed by Nix into the matching field below
  daemonHash = "sha256-i6XNgRFR4TW6yPAueq7T0ytJmc2br8Gn74gAFvrR3Uo=";
  webHash = "sha256-dXwwYl8eoLLAyI2BsOjQTjP4TRWLS3ZDlvJdKw2yVqE=";
}
