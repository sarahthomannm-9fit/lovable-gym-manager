

# Fix: useSmartAlerts crashing on undefined metrics

## Problem
`useSmartAlerts(metrics)` is called inside `DataIntegrationProvider` where `metrics` from `useCrossMetrics` can be undefined during initial render (before data loads). The hook immediately accesses `metrics.totalInadimplente` without a guard.

## Solution
Add a guard at the top of the `useMemo` in `useSmartAlerts.ts`: if `metrics` is undefined/null, return empty array.

### File: `src/hooks/useSmartAlerts.ts`
- Change line 15-16: add `if (!metrics) return [];` as the first line inside `useMemo`
- Update function signature to accept `metrics: CrossMetrics | undefined`

One-line fix, immediate resolution.

