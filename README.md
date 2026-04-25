# hack-workflow

A file-driven multi-agent workflow for hackathon planning with a data-exploration
front stage. Designed to run via subagents (Claude Code's Task tool) with a
coordinator Claude Code instance as the dispatcher.

## Shape

```
    stage 00: EXPLORE                      stage 01: PLAN
┌──────────────────────────┐           ┌──────────────────┐
│ ideator → explorer*      │ ────▶     │ planner          │
│ (loop until budget or    │           │ writes SPEC.md   │
│  empty queue)            │           └────────┬─────────┘
└──────────────────────────┘                    │
         ▲                                      ▼
         │                             stage 02: CRITIQUE + REFINE
         │                             ┌──────────────────────────┐
         │ EXPLORATION_REQUEST.md ◀────│ critic                   │
         │                             │ writes CRITIQUE.md       │
         │                             │ optional: request more   │
         │                             │ exploration              │
         │                             └────────┬─────────────────┘
         │                                      │
         │                                      ▼
         │                             planner refines SPEC.md
         │                                      │
         │                                      ▼
         │                             stage 03: JUDGE
         │                             ┌──────────────────┐
         └─ or loop again              │ judge → YES/NO   │
                                       └──────────────────┘
```

## Files you fill in before first run

- `context/HACKATHON.md` — rules, tracks, judging criteria, sponsor stack, timeline
- `context/IDEA_SEED.md` — your raw pitch (keep it short; 5–10 min of freehand)
- `context/DATASET.md` — where the data lives, format, known docs, access notes

(Start from the `.template` files next to each.)

## How to run

Feed `ORCHESTRATOR.md` to your top-level Claude Code session. It dispatches
every stage by spawning subagents with the role files in `roles/` and the
stage files in `stages/`. It never does agent work itself — it only reads
artifacts from `work/` and routes.

See `examples/README.md` for invocation sketches.

## The invariant

Every role file starts with `OUTPUT:` specifying the single file that role
writes. Agents never output into the coordinator's context — only into their
assigned artifact. The coordinator reads artifacts, never agent stdout. This is
load-bearing; if you relax it, context pollution returns.
