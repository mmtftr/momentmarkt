# Demo recording runthrough (cue card)

> Read this 30 min before recording. Practice the tap sequence twice end-to-end
> before pressing record. Hard cap: 60s. Target: ≤55s.
>
> The IA shipped in the last 24h is the **2-view IA refactor (#152)**:
> a custom JS bottom navbar with two tabs — **Discover** (DEFAULT,
> full-screen swipe + lens chips, no map) and **Browse** (the existing
> wallet area: full-bleed Apple Map + bottom drawer + top-LEFT weather
> pill + top-RIGHT clock/gear icons). The demo opens on Discover (the
> Tinder-essence swipe), pivots to Browse for the merchant-tap commit
> path + city swap, and the bottom navbar is the surface switch the
> judge sees.
>
> If anything below diverges from what's on screen, trust the screen and
> see `recovery.md`.
>
> **See also**: `context/USER_FLOW_AND_MERCHANT_DASHBOARD.md` — the
> definitive synthesis of the recording flow, merchant pitch, and the
> "3 things that win us the prize" voiceover lines. This cue card is
> downstream of that doc: the beat numbering here matches the
> implementation as-shipped; that doc holds the *why* + the
> opinionated calls (Discover-first opening, Best-deals lens for the
> chip cutaway, Browse → tap merchant → focused offer for commit).

---

## Pre-flight (do this once, in order)

- [ ] On `main`, clean tree: `git status` clean, `git pull --rebase origin main`.
- [ ] iOS Simulator open and booted (iPhone 16 Pro recommended; portrait).
- [ ] Backend running: `pnpm backend:start` (FastAPI on `http://localhost:8000`,
      check `/health`). Verify `/merchants/berlin` returns ~39 merchants and
      `/signals/berlin` returns a temp + label string. Both views
      degrade gracefully if the backend is down (Discover renders an
      empty-state with a lens prompt; Browse falls back to the
      offline list of 4 + pre-baked weather), but the recording wants
      the real catalog.
- [ ] Mobile dev client built and installed on the simulator:
      `pnpm mobile:ios` first time, `pnpm mobile:start` for subsequent
      sessions. Do NOT use Expo Go — `react-native-maps@1.27.2` requires
      the dev client.
- [ ] App on the **Discover** view (DEFAULT). Lens chip row visible
      with **For you** active. Top swipe card visible with photo +
      headline overlay + spark discount badge top-right. Heart/X
      buttons under the stack. BottomNavBar at the bottom (Discover
      tab active with the spark dot under the icon).
- [ ] Mic test. QuickTime new screen recording (`Cmd+Shift+5`), target
      the simulator window only. Or Loom.
- [ ] (Optional) Merchant inbox at `http://localhost:5173` open in a second
      tab — only needed if you decide to add the merchant-side callback.
      The 60s consumer cut below does NOT require it.

---

## Demo cut (≤55s) — 9 beats

The on-screen state machine is `silent → alternatives → offer →
redeeming → success → silent` (the focused-overlay states all live
inside the Browse view's BottomSheet — Discover stays at silent
throughout). The view layer is `viewMode: discover | browse`,
switched by the BottomNavBar.

Each beat: **ACTION** (what Doruk does) + **VOICEOVER** (what to say, ≤1
sentence) + **WATCH FOR** (verify on screen) + **IF IT BREAKS** (one-line
recovery).

### Beat 1 (0:00–0:05) — "Tinder for offers, lens-driven."

**ACTION:** Nothing. Hold for 4 seconds on the Discover view at app launch.
**VOICEOVER:** "Mia opens the wallet — Discover is the home screen, a
Tinder-essence swipe stack. Lens chips at the top tell the LLM which
strategy to use."
**WATCH FOR:** Cream background. "MomentMarkt · Discover" eyebrow +
title top-left. Lens chip row (For you / Best deals / Right now /
Nearby) with **For you** spark-tinted active. Large card centred with
a full-bleed photo, spark **−15%** (or similar) badge top-right,
headline + subhead overlay at the bottom. Heart/X buttons below the
card. BottomNavBar at the bottom: Discover active.
**IF IT BREAKS:** If the card is empty ("No For you picks right
now"), the backend's `/offers/alternatives` is unreachable. Tap
**Nearby** — that lens is the deterministic fallback and almost
always renders. If still empty, tap Browse and run the alt-cut
through the merchant list.

### Beat 2 (0:05–0:10) — "Tap Best deals — mechanism switch."

**ACTION:** Tap the **Best deals** lens chip.
**VOICEOVER:** "Tap Best deals — pure deterministic discount sort,
no LLM. The new top card has the steepest discount in the city."
**WATCH FOR:** Stack cross-fades; new top card has the highest
discount badge. Active chip flips spark orange.
**IF IT BREAKS:** If the stack doesn't refresh, the lens swap fetch
is in flight — wait 1s. If it stays stale, tap For you then Best
deals again.

### Beat 3 (0:10–0:15) — "Tap For you, swipe right."

**ACTION:** Tap **For you** then swipe right on the top card (or tap
the heart button under the stack — same path).
**VOICEOVER:** "Right-swipe — the LLM preference agent re-ranks the
next pull cross-merchant. Dwell time + direction is the signal."
**WATCH FOR:** Card flies right; next card snaps forward; subhead
under the new headline reads as a fresh tone+emotion line (Agent
21's contextual subheads).
**IF IT BREAKS:** If the right-swipe doesn't commit, the threshold
wasn't reached — use the heart button instead (it fires the same
flingOff path).

### Beat 4 (0:15–0:18) — "Tap Browse in the navbar."

**ACTION:** Tap the **Browse** tab in the BottomNavBar.
**VOICEOVER:** "Tap Browse — same data, different surface. Map +
list + the unfiltered ground truth, never hidden behind a lens."
**WATCH FOR:** 250ms cross-fade. The cream Discover surface fades out;
the Apple Map + cream drawer fade in. Top-LEFT frosted weather pill
("Berlin · 16° · Mitte") + clock + gear icons appear top-RIGHT.
Drawer at 25% snap showing the brand chip + search bar + first
merchant cards. BottomNavBar: Browse active now.
**IF IT BREAKS:** If the navbar tap doesn't register, the cross-fade
is mid-flight — tap again.

### Beat 5 (0:18–0:25) — "Drag drawer up, tap Cafe Bondi."

**ACTION:** Drag the drawer handle up (to the 80% snap) and tap the
**Cafe Bondi** card (cafe SF Symbol avatar, "Cafe · 82 m · Mitte"
subtitle, **−20%** spark badge).
**VOICEOVER:** "Drag the drawer up to the full list. Tap a merchant
— the wallet pivots into a focused alternatives stack."
**WATCH FOR:** Drawer expands; weather pill + top-right icons fade
out and slide off-screen as the drawer expands (Apple-Maps-style).
On Cafe Bondi tap, the drawer body switches to the focused
alternatives stack with three escalating-discount cards.
**IF IT BREAKS:** If Cafe Bondi isn't at the top, scroll the list —
39 merchants, sorted by distance. Tap any with a coloured badge
(Cafe Bondi, Bäckerei Rosenthal, Mein Haus am See, Zeit für Brot,
St. Oberholz, etc.).

### Beat 6 (0:25–0:30) — "Right-swipe the keeper → focused offer."

**ACTION:** Right-swipe (or tap the heart) on the keeper variant
inside the alternatives stack.
**VOICEOVER:** "Pick the variant — the wallet renders the GenUI
widget from the LLM-emitted JSON spec at runtime."
**WATCH FOR:** The alternatives stack hands off to the focused
offer view (small chevron-back top-left in spark orange,
"MOMENTMARKT" eyebrow, then the **rainHero** widget). The widget
is the LLM-emitted JSON spec rendered through six React Native
primitives, with a "Redeem" CTA at the bottom.
**IF IT BREAKS:** If the focused view doesn't render, back out
(chevron-left) and re-tap a merchant with an active offer.

### Beat 7 (0:30–0:38) — "Redeem → QR → girocard tap."

**ACTION:** Tap **Redeem** on the focused offer, then tap **Simulate
girocard tap** on the QR screen.
**VOICEOVER:** "Redeem opens a QR. Tap simulates the checkout — same
rail the bank already operates."
**WATCH FOR:** Drawer body swaps to QR screen → "Simulate girocard
tap" CTA → brief loader → `CheckoutSuccessScreen` with confetti and
**+€1,85 (12 %)** count-up in German format.
**IF IT BREAKS:** If the QR doesn't appear, the widget JSON's
`onPress` binding is misnamed — back out and tap "Redeem" again.

### Beat 8 (0:38–0:42) — "Done → back to silent Browse."

**ACTION:** Tap **Done**.
**VOICEOVER:** "Back to silent. The wallet only spoke when the
moment was right."
**WATCH FOR:** Drawer collapses back to 25% snap. BottomNavBar
reappears (Browse active). Weather pill + clock/gear icons fade
back in over the map.
**IF IT BREAKS:** If the drawer stays expanded, tap the chevron-
back or drag the drawer down to the lowest snap.

### Beat 9 (0:42–0:55) — "Tap weather pill → fly to Zurich."

**ACTION:** Tap the frosted weather pill top-LEFT (it has a tiny
`arrow.2.squarepath` swap glyph hinting at the action). Hold 2-3
seconds on the silent Zurich wallet so the city-swap punchline
lands. Stop recording.
**VOICEOVER:** "One config swap. Tap the weather pill — the map
flies to Zurich, the catalog re-fetches, the same engine runs on a
new city."
**WATCH FOR:** Map **animates** (animateToRegion 600ms) from Berlin
Mitte to Zurich HB. Weather pill flips to **"Zurich · 22° · HB"**
with the clear-sky SF Symbol. The list re-fetches from
`/merchants/zurich`. (Optional: tap the Discover navbar tab to show
the swipe surface picked up the new city's catalog — only if you're
under target.)
**IF IT BREAKS:** If the map snaps without animating, the pill flip
is the actual proof of the swap, focus the camera there. If
`/merchants/zurich` is down, the search list shows empty — restart
`pnpm backend:start` and re-take.

---

## Beats cut from the previous script (record-them-elsewhere)

The pre-#152 script was drawer-first (Discover lived inside the
drawer as a swipe-vs-list mode toggle, plus an Apple-Music-style
full-screen overlay for the swipe). Both are gone:

- The **swipe + lens chips** moved to their own Discover view —
  full-screen by default. The drawer is browse-only.
- The **`SwipeFullScreenOverlay`** (issue #145) was deleted; Discover
  view is the cinematic surface now.
- The **DevPanel** is reachable through Settings (gear icon top-right
  of the Browse view → "Demo & Debug" section). Use the tech video,
  not the demo cut, to show it.
- The **High-intent boost** chip + the "Run Surfacing Agent" button
  are still inside DevPanel, scoped to the tech video.
- The **merchant inbox** at `http://localhost:5173` is its own thing.
  The redeem POST in Beat 7 still increments that counter; if you
  want the counter beat for a different deliverable, cut to the
  browser tab after Beat 7.
- The **Surfacing notification banner** has been fully replaced by
  the in-drawer focused offer view — there is no separate notification
  overlay any more.

---

## RESET CHECKLIST (between takes)

Run this in ≤10s between recording attempts so each take starts from
the same canonical state:

1. **Force-quit and reopen the app** (Cmd+Shift+H twice in the simulator
   → swipe up on the MomentMarkt card → re-tap the app icon). This is
   the single most reliable reset — clears viewMode, lens, sheet
   state, focused offer, keyboard, and any in-flight fetches.
2. Verify the app launches into the **Discover** view with the **For
   you** lens active and the swipe stack rendering.
3. If you're on Browse instead, tap the Discover navbar tab. If
   you're on Discover with a different lens, tap For you.
4. Confirm the keyboard isn't up. If it is, tap anywhere outside the
   search bar.
5. Mic check, count down, record.

If a take goes sideways mid-recording, do NOT try to recover in-frame —
just stop the recording, run steps 1-4 above, and re-take from Beat 1.
Cuts in post are cheaper than chained workarounds on camera.

---

## Order-of-operations cheat (one card)

```
PRE-FLIGHT: backend up, app on Discover view, For you lens, swipe stack rendering

RECORD START

Beat 1  (5s) — hold on Discover view (For you lens, top card visible)
Beat 2  (5s) — tap Best deals lens → stack cross-fades to steepest-discount card
Beat 3  (5s) — tap For you → right-swipe top card (or heart button)
Beat 4  (3s) — tap Browse navbar tab → cross-fade to map + drawer
Beat 5  (7s) — drag drawer to 80%, tap Cafe Bondi → alternatives stack
Beat 6  (5s) — right-swipe the keeper → focused offer view (rainHero widget)
Beat 7  (8s) — tap Redeem → QR → tap Simulate girocard tap → success + cashback
Beat 8  (4s) — tap Done → silent Browse
Beat 9 (13s) — tap weather pill → fly-to-Zurich → hold on silent Zurich

RECORD STOP

RESET: force-quit + relaunch → verify Discover For you → ready for re-take
```

---

## Failure recovery (one-liners; full text in `recovery.md`)

- Discover view empty ("No For you picks right now") → tap Nearby
  (deterministic fallback). If still empty, tap Browse and route the
  cut through the merchant list.
- Lens chip tap doesn't refresh stack → wait 1s; in-flight fetch
  hasn't resolved. If still stale, toggle to a different lens then
  back.
- BottomNavBar tap doesn't register → another tap is the cheap fix;
  the cross-fade was probably mid-flight.
- Drawer frozen at 25% on Browse, won't expand → drag the handle
  up; if still stuck, force-quit the app.
- "Offers for you" list empty → backend isn't reachable; the offline
  fallback (4 cards) should auto-engage within ~1s — wait, then re-take.
- Cafe Bondi not at top → drag the merchant list; the API returns 39
  cards and Cafe Bondi is one of the closer entries but not pinned to
  index 0.
- Search keyboard won't dismiss → tap any merchant card or the chevron-
  back; never leave the keyboard up across a beat boundary.
- Weather pill stuck on "Loading…" → fallback kicks in within ~1s; if
  not, kill backend and force-quit app, the deterministic fallback runs
  even with no network.
- Map didn't animate on city swap → camera flip still happened; the
  pill text changing Berlin → Zurich is the verifiable proof.
- Zurich shows zero merchants → `/merchants/zurich` is down; restart
  `pnpm backend:start` and re-take.
