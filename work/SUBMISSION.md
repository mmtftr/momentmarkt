ARTIFACT_ID: submission-v05
ARTIFACT_TYPE: submission
PARENT_IDS: spec-v04, agent-io-v01, submission-v04
STATUS: ready-to-paste (videos + cover image still pending)

# Devpost submission — MomentMarkt

> Devpost form fields are reproduced verbatim from `context/HACKATHON.md`
> (case + asterisk-required-marker preserved). Each structured field is
> drafted from `work/SPEC.md` (`spec-v04`) + `context/AGENT_IO.md` +
> `context/PARTNER_DISCUSSION.md`, and reflects the as-built system: Pydantic
> AI agents, Azure OpenAI provider, FastAPI service hosted on Hugging Face
> Spaces. Vocabulary aligned to spec-v04 (two-agent split,
> AI-proposes-merchant-approves, high-intent surfacing, GenUI as JSON layout
> spec, intent-token + H3 privacy boundary, Berlin primary + Zürich config
> swap, simulated girocard checkout). No Sparkassen branding in product UI;
> DSV-Gruppe / Sparkassen context lives only in pitch narrative.

## Project title

**MomentMarkt — the marketing department small merchants don't have**

## Short Description *

The marketing department small merchants don't have, generated for the moment, redeemed through the rail the bank already operates.

## Structured Project Description

### 1. Problem & Challenge *

Small city merchants — independent cafés, bakeries, bookstores, Eisdielen — don't have a marketing department. Static loyalty coupons are noise to users and a chore for shop owners; they fire on the wrong days, in the wrong weather, against the wrong demand curves. The CITY WALLET brief asks for an AI-powered city wallet that detects the most relevant local offer for a user in real time, generates it dynamically, and makes it redeemable through a simulated checkout — serving end users first while letting merchants participate with minimal effort. The hard challenge is twofold. On the user side: surface offers only when they genuinely fit (a weather shift, an event ending nearby, a real-time demand gap at a specific merchant) and stay silent otherwise — UX, not technology, decides whether the offer is accepted or ignored. On the merchant side: independent owners must stay in control without writing copy, designing widgets, or learning a tool. Today's coupon apps fail at both ends.

### 2. Target Audience *

Two-sided, with the consumer at the centre of the demo cut.

- **End users in dense European city centres** — commuters, lunch-break walkers, weekend wanderers, tourists. Reference persona is **Mia, 28**, on a cold Berlin lunch break near Alexanderplatz, browsing without a goal. She is the lead beat in the demo: silent wallet, weather flips, demand at Café Bondi runs below typical for a Saturday 13:30, one well-timed in-app surface fires.
- **Local merchants** — independent shop owners on a Sparkassen terminal. Sole interaction is an inbox: Approve / Edit / Skip / **Always auto-approve like this**, plus a per-merchant demand-curve view that points at the gap moment that triggered each draft.
- **Sponsor stakeholder — DSV-Gruppe** — central service provider for Germany's Sparkassen, with Payone as the acquirer and S-Markt & Mehrwert as the existing loyalty stack. The simulated girocard checkout maps onto the rail Sparkassen already operate; the synthetic transaction-density fixture is a stand-in for the real Payone signal.

### 3. Solution & Core Features *

Two cooperating agents, one neutral wallet UI, three live triggers.

- **Opportunity Agent** (periodic, merchant-side). Reads weather (Open-Meteo), the OSM merchant catalog, an events stub, and a per-merchant transaction-density fixture; fires when **any** of *weather*, *event-end*, or *demand-gap* (live curve below the typical day-of-week / time-of-day curve) trips. Drafts an offer **and** a matching GenUI widget layout spec, routes both to the merchant inbox.
- **Surfacing Agent** (real-time, user-side). Deterministically scores already-approved offers against the wrapped user context, applies the **high-intent boost** (active screen time, map-app foreground, in-app coupon browsing), respects a silence threshold by default, picks top-1, and calls the LLM exactly once — to rewrite only the headline of the card that fires.
- **GenUI on React Native.** LLM emits a JSON layout spec composing 6 RN primitives (`View`, `Text`, `Image`, `Pressable`, `ScrollView`, plus one composed widget primitive); schema-validated, with a known-good fallback render. Live on iOS Simulator via Expo.
- **Merchant inbox** with a per-merchant demand-curve view, one live-toggleable auto-approve rule on stage, and the trust gradient ("always auto-approve like this") visible.
- **Visible privacy boundary** `{intent_token, h3_cell_r8}` rendered in an on-screen dev panel; **high-intent dev-panel toggle** re-skins the same offer with a lower threshold and a more aggressive headline; **simulated girocard checkout** with cashback budget decrement; **`cities/berlin.json` ↔ `cities/zurich.json`** config swap on stage (CHF + Swiss-German copy).

### 4. Unique Selling Proposition (USP) *

**We invert the brief.** The standard pattern is *"merchant sets a goal, AI generates an offer."* MomentMarkt does the opposite: **AI proposes, merchant approves, trust grows by default** — one tap promotes any draft to *"always auto-approve offers like this,"* turning the wallet from an inbox into an autopilot the merchant still understands. Three things make this defensible against generic coupon-AI submissions.

1. **Real GenUI on React Native** — the LLM emits a JSON layout spec composed of 6 RN primitives, schema-validated, rendered live on iOS Simulator. Not template fill, not a static `<OfferCard />`. Three structurally different widgets for the same merchant in three contexts (rain / quiet / pre-event) prove the engine is real.
2. **High-intent surfacing as the user-side dial** — the Surfacing Agent composes an in-market boost from device-side intent proxies, so the same offer fires earlier and reads more aggressively when conversion probability is higher. The boost arrow is drawn into the architecture, not slideware.
3. **A visible `{intent_token, h3_cell_r8}` privacy boundary** logged on screen, paired with three OpenAI-demo-style "production swap" callouts (push, SLM, Payone) that map cleanly onto the rail DSV-Gruppe already operates for Germany's Sparkassen — a credible production path no consumer-AI startup can replicate.

### 5. Implementation & Technology *

**Stack.** Consumer app: React Native + Expo + TypeScript on iOS Simulator (Expo Go on a real device is the documented fallback). Merchant inbox: small static React + Vite web app — partner-facing UI does not need RN. Backend: FastAPI + SQLite for offers, merchants, approvals, and demo state, deployed publicly on Hugging Face Spaces (https://peaktwilight-momentmarkt-api.hf.space/, see `/health` and `/docs`). LLM: **Pydantic AI** agents with a provider-swappable model string; in the demo we run on **Azure OpenAI** (gpt-5.5 via the rapidata-hackathon-resource), and any LLM failure falls back to validated fixture JSON so the demo never breaks. Geo: H3 resolution-8 coarse cells (~1 km) for the privacy boundary. Datasets actually used in the demo: **Open-Meteo** (live weather, no auth); **OpenStreetMap via Overpass** — 937 POIs in Berlin Mitte and 2096 around Zürich HB; **VBB GTFS** — 403 stops within 1 km of Alexanderplatz, used for walk-time copy; an events stub gating the event-end trigger; and a hand-authored `data/transactions/berlin-density.json` for 4 demo merchants standing in for Payone transaction density.

**Architecture.** Opportunity Agent runs on a tick (in production: Helm chart / scheduled worker — called out on the architecture slide), pulls signals, computes which of the three triggers fired, drafts `{offer, widget_spec}` per merchant, and writes to the inbox. Merchant approves, edits, skips, or promotes the draft to an auto-approve rule. Surfacing Agent receives a context update wrapped as `{intent_token, h3_cell_r8, weather_state, t, high_intent}`, deterministically scores candidates over the walk-ring (user h3 + 1 ring), applies the silence threshold, and either fires one in-app card or stays quiet. On fire, the LLM rewrites only the headline (cache key `(offer_id, weather_state, intent_state)` for demo determinism); the React Native widget tree is rendered from the validated layout spec. Tap CTA → QR → simulated girocard checkout → cashback budget decrement.

**Three OpenAI-demo-style "production swap" callouts** on the architecture slide, consistent visual language: (1) **push path** — in-app surface (demo) → push notification server, e.g. Expo Push / FCM / APNs (prod); (2) **SLM extractor** — `extract_intent_token()` server-side stub (demo) → on-device Phi-3-mini / Gemma-2B (prod); (3) **Payone signal** — synthetic `berlin-density.json` (demo) → real Payone aggregation across Sparkassen (prod). **Honest scope** (deliberately deferred): no live on-device SLM, no real Web Push, no real on-device collection of high-intent signals, no real-time image generation (pre-bucketed mood library keyed by `(trigger × category × weather)`), no real POS, no native build pipelines, no Tavily, no Foursquare, no CH GTFS bind on the Zürich swap.

### 6. Results & Impact *

**Built and demonstrable in the 1-min demo on iOS Simulator.** One Mia spine end-to-end: silent open → walk → **weather + demand-gap** fire → in-app surface → runtime-generated **GenUI widget** → **high-intent toggle** mutates the same offer (lower threshold, sharper copy) → QR redeem → simulated girocard checkout with cashback budget decrement → merchant inbox showing the same offer auto-approved 3h earlier under one rain rule, anchored to the demand-curve gap moment that triggered it → live `cities/zurich.json` swap to CHF and Swiss-German copy. Three structurally different GenUI widgets (rain / quiet / pre-event) generated for the same merchant prove the layout-spec engine is real. An on-screen dev panel logs the actual `{intent_token, h3_cell_r8}` payload entering the Surfacing Agent, with a visible high-intent boost arrow. The FastAPI backend is publicly deployed on Hugging Face Spaces so judges can hit `/cities`, `/signals/berlin`, and `/opportunity/generate` without running anything locally.

**Why it matters.** Merchants get marketing they did not have to write, and stay in control by default. Three triggers — weather, events, demand — cover the situations where a static coupon would have been wrong. Users get one well-timed nudge, not a feed of dead coupons; silence is treated as a product feature, and high-intent surfacing earns the right to be more aggressive only when conversion probability is higher. For DSV-Gruppe, the simulated checkout maps cleanly onto the existing Sparkassen payment rail; the synthetic transaction-density fixture is a stand-in for the real Payone signal that already aggregates across thousands of merchants — replacing it is a config change, not an architecture change.

**Roadmap.** Real Payone density replaces the fixture (zero merchant onboarding cost). On-device SLM moves intent extraction off the server. Real on-device high-intent collection replaces the dev-panel toggle. Cross-merchant aggregate intelligence — defensible because DSV already aggregates across the Sparkassen network.

---

## Additional Information

- **Branding stance.** Product UI is intentionally neutral — no Sparkassen-Rot, no S-logomark, no "Mit Sparkasse bezahlt" copy in chrome. DSV-Gruppe / Sparkassen context lives in pitch narrative + architecture slide. Rationale: portability across partners, product feel over fan-project feel.
- **Persona relocation.** The brief's reference persona Mia is in Stuttgart; we relocated her to **Berlin** (with **Zürich** as the config-swap proof) because that is where our open-data signals are richest. Acknowledged on stage in one line.
- **Stack note.** Consumer is React Native + Expo (not Next.js / a web phone-frame mock); merchant inbox stays web (small static React + Vite). GenUI primitives are React Native primitives. Backend agents are Pydantic AI with an Azure OpenAI provider; the model string is env-swappable.
- **Recordable fallback** past hour 5 of the build: hand-authored offer + pre-rendered RN widget + hard-coded trigger + static checkout. Loses live GenUI generation, signal-driven offers, and the high-intent toggle; preserves the Mia spine + visible dataset use.
- **Dataset honesty.** Events are a hand-curated stub, labelled as fixtures; transaction-density JSON is hand-authored for 4 demo merchants; high-intent signals are simulated via a dev-panel toggle; Foursquare data is gated and not used; Tavily live events are out of scope.

## Demo truth boundary

Three "production swap" callouts, drawn explicitly on the architecture slide and reproduced verbatim in `README.md` and `CLAUDE.md`:

| Capability | Demo (today) | Production (architectural roadmap) |
|---|---|---|
| **Surface path** | In-app card slides into the RN wallet on trigger fire | Opportunity Agent → push notification server (Expo Push / FCM / APNs) → device |
| **SLM extractor** | `extract_intent_token()` server-side stub returning a hand-coded enum | On-device Phi-3-mini / Gemma-2B; only the wrapper `{intent_token, h3_cell_r8}` leaves the device |
| **Payone signal** | Hand-authored `data/transactions/berlin-density.json` (4 merchants) | Real Payone aggregation across Sparkassen — already flowing for any merchant on a Sparkassen terminal |

Other deliberate scope cuts kept out of the demo: no real Web Push, no live on-device collection of high-intent signals (dev-panel toggle simulates), no real-time image generation (pre-bucketed mood library keyed by `(trigger × category × weather)`), no real POS, no native iOS/Android build pipelines, no Tavily, no Foursquare, no CH GTFS bind on the Zürich swap.

## Live Project URL

**Backend (FastAPI on Hugging Face Spaces):** https://peaktwilight-momentmarkt-api.hf.space/

Quick judge probes:
- `https://peaktwilight-momentmarkt-api.hf.space/health` → `{"status":"ok"}`
- `https://peaktwilight-momentmarkt-api.hf.space/docs` → interactive OpenAPI schema
- `https://peaktwilight-momentmarkt-api.hf.space/cities` → Berlin + Zürich configs
- `https://peaktwilight-momentmarkt-api.hf.space/signals/berlin` → live trigger evaluation, demand-gap, privacy envelope

The mobile demo itself runs on iOS Simulator against this backend — there is no public consumer URL because the wallet is a native RN app, not a web page. The merchant inbox is a small Vite app run locally during the demo.

## GitHub Repository URL

https://github.com/mmtftr/momentmarkt

## Demo video URL

_pending_ (recorded in build phase 5; ≤55s on iOS Simulator)

## Tech video URL

_pending_ (recorded in build phase 5; ≤55s; architecture slide → live editor → live phone)

## Project cover image

`assets/cover.png` (16:9; rendered from `assets/cover.html`). Concept: a single iPhone-style phone frame (three-quarters left) showing the Mia rain-trigger GenUI widget mid-render on iOS Simulator chrome — `ImageBleedHero`-style composition, rainy-window mood image, headline "Es regnet bald. 80 m bis zum heißen Kakao.", a € price line, and a single primary CTA. Behind the phone: a desaturated Berlin Mitte map fragment (Alexanderplatz visible) with three subtle H3 hex cells highlighted in the wallet's accent colour. Top-right corner: a small monospace dev-panel chip rendering `{intent_token: "lunch_break.cold", h3_cell_r8: "881f1d489dfffff"}` with a tiny "high-intent: on" pill below it. Neutral palette (off-white background, deep navy, one warm accent for the CTA). No Sparkassen branding, no stock-photo people, no logo soup. Title lockup bottom-left: *"MomentMarkt — AI proposes. Merchants approve. The wallet stays quiet until it shouldn't."*

## Technologies / Tags

React Native, Expo, TypeScript, NativeWind, React, Vite, FastAPI, Python, SQLite, Pydantic AI, Azure OpenAI, Hugging Face Spaces, GenUI, H3, OpenStreetMap, Overpass API, Open-Meteo, GTFS

## Additional Tags

City Wallet, DSV-Gruppe, Sparkassen, Payone, Berlin, Zürich, two-agent system, weather trigger, event trigger, demand-gap trigger, high-intent surfacing, in-market signal, context-aware recommendations, merchant inbox, auto-approve, simulated checkout, simulated girocard, privacy boundary, intent token, schema-validated LLM output, iOS Simulator

---

## Demo video script (≤60s hard cap; target 55s)

iOS Simulator phone on the left, Berlin map behind, dev panel beside. Live screen recording, no slides.

| t | Shot | Narration (VO) |
|---|------|----------------|
| 0:00–0:05 | iOS Simulator opens to the wallet home — empty, calm. Map behind it, Mia avatar near Alexanderplatz. No pop-ups. | "This is Mia's wallet. By default, it stays quiet." |
| 0:05–0:14 | Time-lapse of Mia walking ~80 m. Weather state in the dev panel flips from cloudy to "rain incoming"; the live transaction-density curve for Café Bondi dips below typical for Saturday 13:30. Both triggers fire. Still no notification. | "Open-Meteo flips. Demand at Café Bondi runs below typical for a Saturday lunch — both triggers fire on a rule the merchant auto-approved this morning." |
| 0:14–0:21 | An in-app card slides up into the RN phone: "Es regnet bald. 80 m bis zum heißen Kakao." Mia taps. Dev panel logs `{intent_token, h3_cell_r8}` entering the Surfacing Agent. | "One in-app surface — the only one she'll see this hour. Surfacing input: an intent token and a coarse H3 cell. That's the privacy boundary." |
| 0:21–0:30 | Card expands into a full GenUI widget — `ImageBleedHero`, rainy-window mood, walk-time chip, single CTA — composed at runtime from a JSON layout spec the LLM just emitted, rendered through 6 RN primitives. | "Generated at runtime. The LLM emitted this layout as JSON, schema-validated, six React Native primitives." |
| 0:30–0:36 | Presenter flips the dev-panel **high-intent** toggle to on. Same offer re-surfaces with a lower threshold and a more aggressive headline variant. | "High-intent on. Same offer, lower bar, sharper copy — the in-market dial." |
| 0:36–0:44 | Tap CTA → QR appears → simulated girocard checkout → success screen, cashback budget decrements. | "QR redeems through the rail the bank already operates. Simulated checkout, real flow." |
| 0:44–0:51 | Cut to merchant inbox (web): per-merchant demand-curve view — typical Saturday curve faint behind, today's live curve dipping below it, gap highlighted. Same offer card sits next to the dip, marked "Auto-approved 3h ago — demand-gap rule." Toggle a second rule on. | "The merchant sees the dip. AI drafted an offer to fill it. They tapped one rule — auto-approved every time the curve drops like this." |
| 0:51–0:55 | Drop down to a config selector: `berlin.json` → `zurich.json`. Map re-skins to Zürich HB, weather repulls, prices flip to CHF, copy to Swiss-German. | "One config swap — same engine, new city. That's the product." |

## Tech video script (≤60s hard cap; target 55s)

Architecture slide → live editor → live phone frame.

| t | Shot | Narration (VO) |
|---|------|----------------|
| 0:00–0:08 | Architecture diagram: iOS Simulator phone (RN + Expo + TypeScript) ↔ FastAPI on Hugging Face Spaces ↔ SQLite. Two agent boxes labelled **Opportunity Agent** and **Surfacing Agent** branching off, both Pydantic AI agents calling Azure OpenAI. | "React Native and Expo on the phone, FastAPI on Hugging Face Spaces, SQLite, Pydantic AI agents on Azure OpenAI. Two agents." |
| 0:08–0:20 | Zoom into Opportunity Agent box, annotated *"periodic job — Helm chart / scheduled worker in prod."* Three input arrows: Open-Meteo, events stub, `transactions/berlin-density.json` (with **OSM POIs** feeding the merchant catalog). Output: `{offer, widget_spec}` → merchant inbox. | "The Opportunity Agent is a periodic job. Three triggers — weather, events, demand-gap on a Payone-style fixture — drafts an offer and a JSON widget spec, routes them to the inbox." |
| 0:20–0:30 | Editor view: actual JSON layout spec on screen — `{ "type": "ImageBleedHero", "children": [...] }` — composing 6 React Native primitives. Schema validator passes; fallback render path highlighted. | "GenUI is real. The LLM emits a layout spec, six RN primitives, schema-validated, with a known-good fallback render." |
| 0:30–0:42 | Zoom into Surfacing Agent box: input wrapped as `{intent_token, h3_cell_r8}`, deterministic scoring, silence threshold, **high-intent boost arrow** feeding in. Side panel logs the exact payload. | "The Surfacing Agent scores deterministically. Intent token plus H3 coarse cell — boundary logged on screen. High-intent signals compose as a boost: lower threshold, sharper headline. The LLM only rewrites the headline of the one card that fires." |
| 0:42–0:52 | Three "production swap" callouts surface on the slide: (1) in-app surface → push server, (2) SLM server-side → on-device, (3) synthetic JSON → real Payone aggregation. | "Three production swaps, drawn explicitly: push server replaces the in-app surface, SLM moves on-device, synthetic transaction density becomes real Payone aggregation across Sparkassen." |
| 0:52–0:55 | Roadmap card: one line. | "The rail already exists. Cross-merchant intelligence is the next aggregation." |

---

## Submission checklist

- [x] Short Description finalized (1 sentence, tagline)
- [x] Problem & Challenge finalized
- [x] Target Audience finalized
- [x] Solution & Core Features finalized
- [x] Unique Selling Proposition (USP) finalized
- [x] Implementation & Technology finalized — Pydantic AI + Azure + HF Space reflected
- [x] Results & Impact finalized
- [x] GitHub repo URL filled
- [x] Live Project URL filled (Hugging Face Space backend; mobile is iOS Simulator)
- [ ] Demo video URL — recording remains user's last-mile
- [ ] Tech video URL — recording remains user's last-mile
- [x] 16:9 cover image — `assets/cover.png` exported (concept locked, render committed)
- [x] Branding honesty preserved (no Sparkassen UI chrome)
- [x] Dataset honesty preserved (events stub, hand-authored density, simulated high-intent)
- [x] Demo truth boundary table consistent with README.md and CLAUDE.md
- [x] All referenced URLs verified live (HF `/health` 200, `/docs` 200, GitHub 200)
