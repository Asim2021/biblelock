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
- In the end or very last run directly at root `code-review-graph update`.

---

# Documentation System

This repository tracks project context across 4 files in `docs/`:

- `docs/CHARTER.md`: Baseline requirements, scope limits, and core architecture.
- `docs/STATUS.md`: Current sprint tasks, blockers, and handoff state. Update at end of session.
- `docs/DECISIONS.md`: Architectural decisions, plan pivots, and proof of improvement.
- `docs/CHANGELOG.md`: Chronological log of shipped features, fixes, and outcomes.

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

- [ ] Verify changes with tests/typecheck (`npm test`, `npx tsc --noEmit`).
- [ ] Update `docs/STATUS.md` with progress and next handoff notes.
- [ ] Record any architectural decisions or pivots in `docs/DECISIONS.md`.
- [ ] Append entry to `docs/CHANGELOG.md`.

## 4. Truth & Traceability

- **Status States:** `Planned`, `In Progress`, `Implemented (Unverified)`, `Validated`, `Blocked`, `Superseded`.
- **Identifiers:** `DEC-XXX` (decisions), `TASK-XXX` (tasks in `STATUS.md`), `BENCH-XXX` (benchmarks).
- Never claim progress without verification.
