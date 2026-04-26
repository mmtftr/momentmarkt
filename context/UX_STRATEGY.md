# MomentMarkt — UX Strategy

A design memo capturing the main-UX framing reached after the cross-merchant
swipe stack landed (commit `d1212e5`). Written so the team's design thinking
is recoverable from the repo, not just from chat history. Cross-referenced
from `work/SPEC.md` and `README.md`. Sits alongside `context/DESIGN_PRINCIPLES.md`
(the invariants this strategy must respect).

## The four surfaces

The wallet now ships four genuine surfaces, each with a distinct role:

| Surface     | Component             | Role                                         |
| ----------- | --------------------- | -------------------------------------------- |
| Map         | `CityMap` (Apple Maps) | Spatial context — where am I                 |
| Drawer      | `BottomSheet` (cream)  | The persistent wallet metaphor               |
| List        | `MerchantSearchList`   | Browse mode — what's here                    |
| Swipe stack | `SwipeOfferStack`      | Recommend mode — what fits this moment       |

These are not redundant. The map answers *where*; the drawer is the *vessel*
that holds saved value; the list is *unfiltered ground truth*; the swipe is
*active curation*. Removing any one collapses a real user need.

## Three framings of "what is the app FOR"

The same four surfaces compose into three legitimate product framings.
Picking one for v1 is a scope decision, not an architecture decision.

**(a) City wallet that surfaces offers when the moment is right.** The map
and the drawer carry the headline. The swipe and list decorate the
surfacing moment. This matches the brief's Mia scenario directly: silent
by default, one well-timed nudge, redeemable through the rail the bank
already operates. *This is the v1 framing — what we ship today.*

**(b) Tinder for local offers.** The swipe stack becomes the home surface;
lens chips ("For you" / "Best deals" / "Right now" / "Nearby") expose the
LLM's role transparently; the map and drawer recede. *This is the v2 framing
— issue #137.* It's a bigger product play long-term because it gives the LLM
a continuous job and the user continuous agency.

**(c) Live-curated marketplace.** The drawer becomes one continuous feed
of agent-generated moments across all the merchants in the city. Most
ambitious; documented but explicitly off the immediate roadmap. The
Negotiation Agent + Bounds Manager from issue #138 are the structural
prerequisites.

## Why a → b → c is the right progression

(a) is what the brief asked for; (b) is the wedge we developed once the
cross-merchant swipe stack made it obvious that swipe could carry the
primary surface; (c) is the integration point where merchant bounds
(issue #138) close the loop.

The cross-merchant swipe stack that just landed (`d1212e5`) is the
*bridge*. It telegraphs v2 inside v1 — judges see the swipe-as-curation
mechanic in the demo without us having to swap the primary surface.

Each step preserves the previous step's surfaces. The list never goes
away (per principle 1). The map never goes away. The drawer never goes
away. Nothing gets removed; the *home* moves.

The honest scope-cut: v1 is today's demo. v2 (lens-based swipe-as-home)
is issue #137. v3 (Negotiation Agent + merchant portal) is issue #138.

## Why this UX serves the wedge

The wedge (per issue #138) is *generative offers within merchant-set
bounds*. The UX has to make that wedge legible without saying it out loud:

- **The map** keeps the spatial framing honest — these offers are about
  THIS PLACE.
- **The drawer** keeps the wallet metaphor honest — these are SAVED
  ASSETS, not advertisements.
- **The list** is the unfiltered ground truth — the LLM never hides
  anything (principle 1).
- **The swipe** is the LLM's stage — the LLM has real work to do
  (cross-merchant relevance, preference inference) and the user has
  agency over how much they engage.

Tap the weather pill → the city swaps → all four surfaces update
simultaneously. That single gesture proves the architecture is
data-driven, not hardcoded. It is the cheapest credible "this is
generative, not template fill" demonstration we have.

## Open questions for v2+

- Should the swipe stack become the home surface? (Issue #137 says yes.)
- How do lens chips expose the LLM's role transparently without
  becoming jargon? (Issue #137 — the chip names are themselves the
  user-facing mental model for swappable curation strategies.)
- Where does the Negotiation Agent (issue #138) live in the UX?
  Probably invisible — only its outputs surface, as fresh offers at
  fresh discount tiers within the merchant's bounds.
- Does the merchant get a companion app, or stays as the existing
  inbox? (Issue #138's Bounds Manager implies a real merchant portal
  eventually.)

These are not blockers for v1. They are the design decisions v2 has
to land — captured here so the team doesn't have to rediscover the
framing from scratch.
