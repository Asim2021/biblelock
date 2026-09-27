## Core Execution Directives

1. Assign the following constraint block to the agent's system prompt to enforce strict output boundaries, prevent scope creep, and trigger internal logic verification:

```text
Provide concise, Jargon-free, actionable outputs without conversational fluff. Make zero assumptions, introduce no out-of-scope changes, and strictly avoid over-engineering, but do not forget edge cases reasoning. Retain all critical technical details in your solution. Briefly outline your reasoning to verify accuracy before providing the final answer.
```

2. After finising provide a super concise git commit message for the changes.

<!-- code-review-graph MCP tools -->

## code-review-graph

if .code-review-grapg exists in the root, use code-review-graph tools before Grep/Glob/Read when available:

- **Symbol & Code Search:** `semantic_search_nodes_tool` or `query_graph_tool`
- **Blast Radius & Impact:** `get_impact_radius_tool` or `get_affected_flows_tool`
- **Code Review:** `detect_changes_tool` + `get_review_context_tool`
- **Coverage & Callers:** `query_graph_tool` with callers_of/callees_of/tests_for
- Fall back to Grep/Glob/Read only when the graph does not cover the query.
- Run `code-review-graph update` **once at feature close** (see Protocol 3) — not after every bug fix or follow-up turn within the same feature.

---

# Documentation System

This repository tracks project context across 4 files in `docs/`:

- `docs/CHARTER.md`: Baseline requirements, scope limits, and core architecture.
- `docs/STATUS.md`: Current sprint tasks, blockers, and handoff state. **Update once per feature at session close — not after every turn.**
- `docs/DECISIONS.md`: Architectural decisions, plan pivots, and proof of improvement. **One entry per architectural decision — not one per bug fix.**
- `docs/CHANGELOG.md`: Chronological log of shipped features, fixes, and outcomes. **One consolidated entry per feature — bug fixes found during the same feature session are appended to that entry, not added as separate entries.**

---

# Protocols

## 1. Start-of-Work Checklist

1. Read `AGENTS.md` and `docs/STATUS.md`.
2. Check `docs/CHARTER.md` when touching architecture or baseline requirements.
3. Verify codebase ground truth (`package.json`, types, schemas, and tests).
4. Verify task alignment with existing decisions in `docs/DECISIONS.md`.

## 2. Decision & Plan-Change Protocol (Impact-Loop)

Record any technical pivot, bottleneck fix, or architectural change in `docs/DECISIONS.md`:

- **Format:** `[DEC-XXX] Title` (Date, Status, Related Task).
- **Required Sections:**
    1. Problem / Trigger
    2. Alternatives Evaluated
    3. Decision & Trade-offs
    4. Implementation Details
    5. Proof of Improvement (metrics, test commands)
    6. Lessons & Downstream Impact

## 3. End-of-Work Checklist

**When to run:** Only once per feature/task at natural session close — NOT after every bug fix, follow-up question, or minor tweak within the same feature.

**Trigger signals:** You say "wrap it up", "feature done", "close this out", start an unrelated new topic, or end the session.

**Mid-feature rule:** If a bug fix or follow-up is clearly part of the same named feature already in `STATUS.md`, do NOT create a new entry — append it to the existing task description instead.

- [ ] Verify changes with tests/typecheck (`npm test`, `npx tsc --noEmit`).
- [ ] Update `docs/STATUS.md` with **one consolidated task entry** covering the full feature (including any bugs fixed during the session).
- [ ] Record architectural decisions in `docs/DECISIONS.md` — only if a genuine architectural pivot occurred; skip for bug fixes.
- [ ] Append **one consolidated entry** to `docs/CHANGELOG.md` covering the full feature and any fixes found during it.
- [ ] Run `code-review-graph update` once at root.

## 4. Truth & Traceability

- **Status States:** `Planned`, `In Progress`, `Implemented (Unverified)`, `Validated`, `Blocked`, `Superseded`.
- **Identifiers:** `DEC-XXX` (decisions), `TASK-XXX` (tasks in `STATUS.md`), `BENCH-XXX` (benchmarks).
- Never claim progress without verification.
