# Project Status — techcon_activity_graph

> **IMPORTANT**: This file is loaded at the start of every agent session.
> Keep it accurate. It is the repo-local truth surface for current work.

---

## Business Goal

Support repo for the TechCon GitHub/org activity graph surface. It is not a core product API; it exists to keep the public/team GitHub presentation layer working with a stable deploy target.

---

## Current Phase

- [x] Support repo imported into TechCon monitored fleet
- [x] Repo-local access truth added (`TECHCON_ACCESS.md`)
- [x] Hub contract path present (`.hub/incoming/*`, `.hub/outgoing/*`)
- [x] CI → hub freshness dispatch added (`Node.js CI` → `knowledge-sync-requested`)
- [ ] Optional future normalization of inherited upstream README / package metadata

**Active phase**: SUPPORT NORMALIZATION COMPLETE — low-touch monitored repo

---

## Verified Facts

- Runtime/deploy shape: Node.js + TypeScript + Express, Vercel target via `vercel.json` → `src/main.ts`.
- CI workflow: `.github/workflows/node.js.yml`.
- Hub-facing freshness contract: successful `main` push or manual workflow run now dispatches `knowledge-sync-requested` to `techcon_hub`.
- Repo still contains inherited upstream OSS presentation (`README.md`, package metadata), so product truth should be read from this file + hub overview, not from upstream branding text.

---

## Backlog

### P1
- [ ] Replace inherited upstream-facing README/package identity with TechCon-specific wording if the repo becomes higher-touch.

### P2
- [ ] Add lightweight smoke/build signal if we need stronger deployment confidence than test-only CI.

---

## Next Session Plan

1. Re-check whether `notify-hub` dispatch appears in hub after the next successful `main` CI run.
2. Leave repo otherwise low-touch unless the org/profile graph surface changes.
3. If a product-facing use appears, normalize README/package metadata first.

---

## Evidence

- `.github/workflows/node.js.yml`
- `vercel.json`
- `src/main.ts`
- `.hub/outgoing/hub-report-activity-graph-s1.md`

---

**Last updated:** 2026-05-07
