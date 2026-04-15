# TSX Second Pass: Why This Was Done

## What changed

This second pass removed `// @ts-nocheck` from all components in `src/components` that were converted from JSX to TSX.

## Why it was done

The first migration pass prioritized runtime safety and quick conversion by using `@ts-nocheck` as a temporary compatibility shield.  
This second pass was done to restore real TypeScript enforcement without changing UI logic or behavior.

Key reasons:

- **Catch real bugs earlier**: TypeScript can now report unsafe props, state usage, and handler signatures.
- **Improve maintainability**: Components now participate in normal project type checking.
- **Enable safer refactors**: Future edits in these files get compile-time feedback.
- **Reduce hidden risk**: `@ts-nocheck` suppresses all errors, which can hide regressions over time.

## Safety approach used

- Behavior-preserving changes only (no intentional logic/UI refactors).
- Removed `@ts-nocheck` in phased batches and validated after each phase.
- Confirmed diagnostics remained clean for `src/components`.
- Smoke-tested key routes after the pass.

## Validation summary

- `src/components`: no `@ts-nocheck` directives remain.
- Diagnostics: no linter/type errors introduced in `src/components`.
- Route checks: core pages still return successful responses (e.g., `/`, `/auth`).

## Outcome

The codebase now keeps the same runtime behavior while gaining strict TypeScript signal across all converted components.
