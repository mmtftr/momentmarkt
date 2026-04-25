# Mobile E2E Strategy

## Recommendation

Use **Maestro** for the first mobile smoke test after the visual demo is stable.

Why Maestro over Detox for this hackathon build:

- Works against an already-installed native dev client.
- Requires no test IDs for a first smoke pass if visible text is stable.
- Lower setup cost than Detox and less native project churn.
- Good enough for one recording-critical path: Home → Offer → QR → Success.

## What CI Runs Now

`.github/workflows/frontend-checks.yml` runs fast, deterministic checks:

- `pnpm mobile:typecheck`
- `pnpm merchant:typecheck`
- `pnpm merchant:build`

It does **not** run iOS simulator E2E. Native simulator CI is slower, more brittle,
and not needed for every push before the demo cut is visually stable.

## Manual Smoke Flow

After native dependencies are installed once with `pnpm mobile:ios`, normal app
edits can be checked with:

```bash
pnpm mobile:start -- --clear
```

Open the installed MomentMarkt dev client in the iOS Simulator, then walk:

1. Home/map opens without redbox.
2. Bottom sheet is visible and draggable.
3. Surface/offer path expands the sheet and shows the generated widget.
4. Redeem CTA opens QR/token flow.
5. Simulated girocard tap shows cashback success.
6. History/Verlauf shows the receipt-style list.

## Optional Maestro Smoke

The starter flow lives in `apps/mobile/e2e/maestro-smoke.yaml`.

Run it only after the simulator already has the native dev client installed and
Metro is serving the app:

```bash
pnpm mobile:start -- --clear
maestro test apps/mobile/e2e/maestro-smoke.yaml
```

Treat this as a manual helper until the UI text settles. Promote it to CI only
if it remains stable through the recording rehearsal.
