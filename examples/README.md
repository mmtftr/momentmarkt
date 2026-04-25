# Example invocations

Dispatch is via subagents (Claude Code's Task tool). The pattern: pass the role
file path, inputs, and output path inside the subagent's prompt — there are no
`--read`/`--write` flags, the subagent reads/writes via its own tools.

## Bootstrap

```bash
# 1. Copy templates
cp context/HACKATHON.md.template context/HACKATHON.md
cp context/IDEA_SEED.md.template  context/IDEA_SEED.md
cp context/DATASET.md.template    context/DATASET.md

# 2. Fill in the three context files by hand.
$EDITOR context/*.md

# 3. Hand ORCHESTRATOR.md to your top-level Claude Code session.
#    It will read stages/, roles/, ARTIFACTS.md, and dispatch.
claude-code --system-prompt "$(cat ORCHESTRATOR.md)" \
            --workspace .
```

## Manual stage execution (if running without the coordinator)

You can step through stages yourself, which is useful for debugging. Each step
spawns a subagent with the prompt shown.

### Stage 00: one exploration round

Ideator subagent — plans questions, synthesizes profile:

```
Run the role defined in roles/ideator.md. Read that file first.

Inputs (Read tool):
- context/HACKATHON.md
- context/IDEA_SEED.md
- context/DATASET.md
- work/explore/
- work/DATA_PROFILE.md   (if exists)

Outputs (Write tool):
- work/EXPLORATION_QUEUE.md
- work/DATA_PROFILE.md
```

Explorer subagents — one per question. Spawn Q01, Q02, … in a single message
(parallel tool calls). Each prompt:

```
Run the role defined in roles/explorer.md. Read that file first. Use uv for
any missing Python packages — never system Python.

Inputs (Read tool):
- context/HACKATHON.md
- context/DATASET.md
- scripts/semantic_map.py

Question:
question_id: Q01
question_text: <paste the Q01 block from work/EXPLORATION_QUEUE.md verbatim>
output_path: work/explore/01-<slug>.md

Output (Write tool): work/explore/01-<slug>.md
```

### Stage 01: plan v1

Planner subagent:

```
Run the role defined in roles/planner.md. Read that file first.

Inputs (Read tool):
- context/HACKATHON.md
- context/IDEA_SEED.md
- work/DATA_PROFILE.md

Output (Write tool):
- work/SPEC.md
```

### Stage 02: critique + refine

Critic subagent:

```
Run the role defined in roles/critic.md. Read that file first.

Inputs (Read tool):
- context/HACKATHON.md
- work/SPEC.md
- work/DATA_PROFILE.md
- work/explore/

Outputs (Write tool):
- work/CRITIQUE.md
- work/EXPLORATION_REQUEST.md  (only if the critic routes back)
```

If `EXPLORATION_REQUEST.md` was written, loop back to stage 00 first. Then
version and refine:

```bash
mkdir -p work/history
mv work/SPEC.md work/history/spec-v01.md
```

Refinement planner subagent:

```
Run the role defined in roles/planner.md in refinement mode. Read that file
first; every CRITIQUE bullet is a mandatory change request.

Inputs (Read tool):
- context/HACKATHON.md
- context/IDEA_SEED.md
- work/DATA_PROFILE.md
- work/history/spec-v01.md
- work/CRITIQUE.md

Output (Write tool):
- work/SPEC.md   (wholly replaces)
```

### Stage 03: judge

Judge subagent:

```
Run the role defined in roles/judge.md. Read that file first.

Inputs (Read tool):
- context/HACKATHON.md
- work/SPEC.md
- work/CRITIQUE.md
- work/SUBMISSION.md

Output (Write tool):
- work/JUDGE.md
```

The coordinator reads only the artifact, never the subagent's reply text — this
preserves the orchestrator invariant: no agent stdout in coordinator context.

## Parameter passing

The critical bit each explorer subagent needs is the specific question text.
Two patterns:

1. **Inline in the prompt** (shown above): paste the question block from
   `EXPLORATION_QUEUE.md` directly into the subagent prompt. Simplest; works
   for any number of parallel runs.
2. **File-based**: split `EXPLORATION_QUEUE.md` into `work/queue/QNN.md`
   files first, then point the prompt at the question file path. Useful if
   your shell quoting of multi-line questions gets fiddly.

For ≥3 concurrent explorers, both patterns work — spawn each subagent in the
same message and they run in parallel.

## Python env for the explorer

```bash
python -m venv .venv && . .venv/bin/activate
pip install openai pandas numpy
export OPENAI_API_KEY=sk-...
# then run explorer subagent; it will import scripts/semantic_map.py as needed
```
