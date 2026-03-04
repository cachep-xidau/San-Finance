# Phase 5 Plan Proposal — S Group CEO Dashboard

## Context Used
- Existing phased plan (Phase 1-4) in `/Users/lucasbraci/Desktop/Antigravity/plans/260303-0618-sgroup-ceo-dashboard/`
- Current dashboard code in `/Users/lucasbraci/Desktop/Antigravity/projects/S Group/Dashboard_CEO/dashboard`
- Latest review report: `/Users/lucasbraci/Desktop/Antigravity/projects/S Group/plans/reports/code-reviewer-260303-0935-sgroup-dashboard-phase4-review.md`

## Inferred Next Phase
**Phase 5: Production Hardening & Release Readiness**

Why now:
- Core feature phases are mostly done.
- Remaining value is reliability, test safety net, observability, and release confidence.
- Known gaps remain in PWA wiring and quality coverage.

## Recommended Order (Implementation-Ready Tasks)

1. **Stabilize navigation active-state logic (route + hash aware).**
   - Target files: `src/components/layout/sidebar.tsx`, `src/components/layout/mobile-nav.tsx`
   - Verify: only one nav item active per current route/section.

2. **Complete PWA runtime wiring (service worker registration + lifecycle handling).**
   - Target files: `src/app/layout.tsx` (or app shell client bridge), `public/sw.js`, `public/manifest.json`
   - Verify: app registers SW in production build; offline page reachable during network loss.

3. **Define and implement clear all-clinics behavior for budget variance.**
   - Target files: `src/app/(dashboard)/budget/page.tsx`, `src/components/charts/budget-variance-chart.tsx`, `src/lib/queries/budgets.ts`
   - Verify: all-clinics mode shows explicit aggregate data or explicit guided empty state.

4. **Harden filter URL state updates for rapid interactions.**
   - Target files: `src/components/filters/dashboard-filters.tsx`
   - Verify: no stale params, no noisy history stack growth, deterministic final URL.

5. **Add minimum automated test baseline (unit + integration).**
   - Target files: `package.json`, `src/**/__tests__/*` (new), test setup file(s)
   - Cover first: KPI query math, budget variance behavior, filter param parser.
   - Verify: repeatable local run + CI-compatible command.

6. **Add smoke E2E flow for critical user paths.**
   - Target files: `playwright.config.ts` (new), `e2e/dashboard-smoke.spec.ts` (new)
   - Flows: login, dashboard load, filter update, budget page load.
   - Verify: smoke suite green against preview/prod-like env.

7. **Add runtime observability hooks (errors + basic product events).**
   - Target files: `src/app/error.tsx`, `src/app/(dashboard)/layout.tsx`, optional `src/lib/telemetry/*`
   - Verify: captured error IDs/logs, key page events emitted, no sensitive payload leak.

8. **Run performance + bundle pass focused on current bottlenecks.**
   - Target files: chart components, heavy dashboard sections, Next config if needed
   - Verify: Lighthouse/Core Web Vitals meet agreed threshold in production build.

9. **Create release checklist + rollback checklist tied to real commands.**
   - Target files: `README.md` (deploy section) or `docs/deployment.md` if docs folder added
   - Verify: one operator can execute deploy + rollback without tribal knowledge.

10. **Execute final release gate (lint, build, tests, smoke, manual UAT).**
    - Target: CI pipeline + release PR template/checklist
    - Verify: all gates pass before prod promotion.

## Not In Scope (YAGNI)
- New major dashboard features.
- New data domains/tables.
- Broad redesign.

## Key Risks
1. **Ambiguous product intent on all-clinics variance** delays budget page completion.
2. **PWA assumptions** may fail if SW registration is dev/prod inconsistent.
3. **No existing test harness** can increase setup time before meaningful coverage.
4. **Supabase/RLS regressions** can appear once E2E paths broaden.
5. **Late perf surprises** if charts and queries are not profiled on production data.

## Suggested First Task (Execute Immediately)
**Task 1: Stabilize navigation active-state logic** (sidebar + mobile-nav).

Why first:
- Small, low-risk, user-visible defect.
- Fast win before heavier hardening tasks.
- Removes misleading UX signal during validation and UAT.

## Done Criteria for Phase 5
- PWA truly works in production context.
- Navigation/filter/budget states are deterministic.
- Baseline test suite exists and runs in CI.
- Smoke E2E covers login + dashboard + budget.
- Release checklist and rollback runbook validated.

## Unresolved Questions
1. In all-clinics mode, should budget variance be aggregate across clinics or require clinic selection?
2. Is section-level hash navigation expected to show active state by scroll position, or route-only active state is enough?
3. What exact release gate thresholds are mandatory (Lighthouse score, test coverage %, p95 response target)?
