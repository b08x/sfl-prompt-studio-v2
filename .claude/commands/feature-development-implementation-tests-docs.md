---
name: feature-development-implementation-tests-docs
description: Workflow command scaffold for feature-development-implementation-tests-docs in sfl-prompt-studio-v2.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /feature-development-implementation-tests-docs

Use this workflow when working on **feature-development-implementation-tests-docs** in `sfl-prompt-studio-v2`.

## Goal

Implements a new feature, including code changes, updates to state/store, and sometimes documentation or UI components.

## Common Files

- `src/services/*.ts`
- `src/components/**/*.tsx`
- `src/store/useStore.ts`
- `src/utils/*.ts`
- `README.md`
- `CHANGELOG.md`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Implement feature logic in one or more service or component files
- Update or create related UI components (e.g., in src/components/ or src/components/lab/)
- Update global state/store logic (src/store/useStore.ts)
- Update or create utility functions (src/utils/)
- Optionally update documentation (README.md, CHANGELOG.md, or in-code docs)

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.