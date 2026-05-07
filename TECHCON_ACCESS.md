# TechCon access truth (no secrets)

## Canonical source

Canonical no-secrets SSH / cloud access truth lives in:
- `techcon_hub/knowledge/ecosystem/ssh-access-guide.md`

If TechCon access, aliases, jump paths, key names, or recovery status change, update the hub guide first and then reflect the change here if this repo needs repo-local emphasis.

## Stable local key names

Operators/agents should expect these stable OS-local names:
- primary: `~/.ssh/techcon_pyramidheadshark_ed25519`
- fallback: `~/.ssh/techcon_chaber_ed25519`

These names are intentionally stable so key contents may be rotated later without rewriting config.

## Current short aliases

- `yc-dev-stand-01`
- `yc-cpu-worker-01`
- `yc-ops-01`
- `yc-gpu-t4-01`
- `yc-gpu-t4-02`
- `yc-gpu-t4-03`
- `yc-gpu-t4-04`
- `yc-gpu-v100-01`
- `yc-cpu-research-01`

## Current access model

- direct public entry surface:
  - `yc-dev-stand-01`
  - `yc-cpu-worker-01`
- internal `10.128.*` paths currently route via `yc-dev-stand-01`
- internal `192.168.*` paths currently route via `yc-ops-01`
- not every VM is currently equally healthy; see hub guide for current proven vs unresolved subset

## Agent rules

- Do not store private keys, raw cloud tokens, VPN configs, or secret access blobs in git.
- Do not auto-inject secrets into prompts/docs.
- Use repo-visible no-secrets access truth plus OS-local secret carriers.
- If access is required but unresolved, post findings to `.hub/outgoing/*` and point to the hub SSH guide instead of guessing topology from memory.
