## Core Execution Directives

Assign the following constraint block to the agent's system prompt to enforce strict output boundaries, prevent scope creep, and trigger internal logic verification:

```text
Provide concise, lucid, actionable outputs without conversational fluff. Make zero assumptions, introduce no out-of-scope changes, and strictly avoid over-engineering, but do not forget edge cases reasoning. Retain all critical technical details in your solution. Briefly outline your reasoning to verify accuracy before providing the final answer.
```

<!-- code-review-graph MCP tools -->

## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes_tool` or `query_graph_tool` instead of Grep
- **Understanding impact**: `get_impact_radius_tool` instead of manually tracing imports
- **Code review**: `detect_changes_tool` + `get_review_context_tool` instead of reading entire files
- **Finding relationships**: `query_graph_tool` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview_tool` + `list_communities_tool`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool                             | Use when                                               |
| -------------------------------- | ------------------------------------------------------ |
| `detect_changes_tool`            | Reviewing code changes — gives risk-scored analysis    |
| `get_review_context_tool`        | Need source snippets for review — token-efficient      |
| `get_impact_radius_tool`         | Understanding blast radius of a change                 |
| `get_affected_flows_tool`        | Finding which execution paths are impacted             |
| `query_graph_tool`               | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes_tool`     | Finding functions/classes by name or keyword           |
| `get_architecture_overview_tool` | Understanding high-level codebase structure            |
| `refactor_tool`                  | Planning renames, finding dead code                    |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes_tool` for code review.
3. Use `get_affected_flows_tool` to understand impact.
4. Use `query_graph_tool` pattern="tests_for" to check coverage.

---

### Mandatory Implementation Steps for New Features:

1. **Declare in Shared Types (`packages/types/src/featureFlags.ts`)**:
    - Add the new flag key constant to `FEATURE_FLAGS` (e.g. `NEW_FEATURE: 'feature_new_feature'`).
    - Add its type definition and set its baseline default value to `false` in `TIER_FEATURE_DEFAULTS.free` (and other tiers as appropriate).
2. **Backend Route Protection (`apps/api`)**:
    - Guard all associated REST routes or actions using the `requireFeature(FEATURE_FLAGS.<NAME>)` pre-handler middleware (`apps/api/src/middleware/featureGuard.ts`).
    - If disabled, the API must return `403 Forbidden` (`FEATURE_DISABLED`).
3. **Frontend UI Gating (`apps/web` & `apps/extension`)**:
    - Wrap all related UI controls, action buttons, modals, or pages in `<FeatureGate flag={FEATURE_FLAGS.<NAME>}>` or evaluate with `useFeatureFlag(FEATURE_FLAGS.<NAME>)`.
4. **Superadmin Metadata**:
    - Register the new flag's label and description in `AdminFeatureFlags.tsx` so root administrators can toggle and override it for any tenant or in bulk.
5. **Zero Ungated Features**:
    - No agent may merge, commit, or deliver a new feature without verifying feature flag protection and default `false` state.

---
