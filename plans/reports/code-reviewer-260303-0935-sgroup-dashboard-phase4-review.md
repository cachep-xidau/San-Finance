## Code Review Summary

### Scope
- Files: 20 files from commit `72fcb05070055a1085fef8b92faa18ca776fb61c` in `/Users/lucasbraci/Desktop/Antigravity/projects/S Group/Dashboard_CEO/dashboard`
- LOC: `+401 / -117`
- Focus: Phase 4 + adjacent impact checks
- Validation: `npm run lint` and `npm run build` both passed

### Overall Assessment
Phase 4 improves UX structure (loading/error/offline screens, URL-driven filters, real variance data). No critical security/runtime blockers found in reviewed changes. Main gaps are navigation state correctness and incomplete PWA resilience wiring.

### Critical Issues
- No blocking issues.

### High Priority
1. **PWA offline flow not wired (service worker never registered).**
   - File added: `/Users/lucasbraci/Desktop/Antigravity/projects/S Group/Dashboard_CEO/dashboard/public/sw.js`
   - Evidence: no `navigator.serviceWorker.register('/sw.js')` usage in project search.
   - Impact: Offline fallback page is effectively dead code for normal users; resilience claim is not achieved.

2. **Sidebar/mobile active state logic marks multiple items active on `/`.**
   - Files:
     - `/Users/lucasbraci/Desktop/Antigravity/projects/S Group/Dashboard_CEO/dashboard/src/components/layout/sidebar.tsx`
     - `/Users/lucasbraci/Desktop/Antigravity/projects/S Group/Dashboard_CEO/dashboard/src/components/layout/mobile-nav.tsx`
   - Evidence:
     ```ts
     const baseHref = item.href.split('#')[0]
     const isActive = pathname === baseHref
     ```
     Items `"/"`, `"/#clinic-comparison"`, and `"/#revenue-trend"` all resolve to `/`, so all become active on home.
   - Impact: misleading nav state and degraded usability.

### Medium Priority
1. **Budget variance chart now silently empty when no clinic is selected.**
   - File: `/Users/lucasbraci/Desktop/Antigravity/projects/S Group/Dashboard_CEO/dashboard/src/app/(dashboard)/budget/page.tsx`
   - Evidence:
     ```ts
     clinicId ? getBudgetVariance(clinicId, year, month) : Promise.resolve([])
     ```
   - Impact: users viewing all clinics may interpret this as data-loss/bug instead of filter requirement.

2. **Filter query updates are push-only and non-atomic across rapid changes.**
   - File: `/Users/lucasbraci/Desktop/Antigravity/projects/S Group/Dashboard_CEO/dashboard/src/components/filters/dashboard-filters.tsx`
   - Evidence:
     ```ts
     const params = new URLSearchParams(searchParams.toString())
     router.push(query ? `${pathname}?${query}` : pathname)
     ```
   - Impact: fast consecutive filter interactions can cause URL churn and potentially stale param merges.

### Edge Cases Found by Scout
- Invalid/partial URL params flow through both server parsing and client parsing boundaries.
- Anchor-based nav has dependent behavior across two components (`sidebar`, `mobile-nav`) and shares same base-path collision.
- Dashboard filter state is URL-source-of-truth; rapid updates can race navigation state.
- Budget variance data path has branch on `clinicId` that changes chart semantics for "all clinics" mode.

### Positive Observations
- Removed random/simulated variance logic; now uses query-based actuals (`BudgetVariance`) in chart path.
- Added robust invalid-date fallback in dashboard page parsing.
- Added explicit `error.tsx`, `not-found.tsx`, `loading.tsx`, and `offline/page.tsx` with coherent UI patterns.
- Build/lint clean after changes.

### Recommended Actions
1. Register service worker from app shell so offline route can be served in real usage.
2. Fix active-nav logic to account for hash target (or maintain one active item based on pathname + hash).
3. Clarify all-clinics behavior for variance chart (aggregate or explicit empty-state messaging tied to clinic filter).
4. Consider debouncing/replace-navigation for filter changes to reduce URL churn.

### Metrics
- Type Coverage: Not measured in repo
- Test Coverage: Not measured in repo
- Linting Issues: 0 (from current lint run)

### Unresolved Questions
- Should `Ngân sách vs Thực tế` support aggregated "all clinics" mode, or require a clinic selection by product intent?
- Is hash-based in-page navigation expected to show active state per section (scroll-aware), or only per route?
