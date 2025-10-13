# Frontend Rules (FE)

Scope: React app, hooks, UI components.

1) FE and BE in lock-step
- Reflect any BE contract changes (request/response) in FE types and UI.
- Coordinate with BE for simultaneous release or guarded rollouts.

2) Always use multi-filter
- Maintain a single source of truth for the filter state.
- Send the full filter payload when applying filters (do not send partial, piecemeal updates).
- Preserve unset fields as defaults; do not fabricate client-only filters.

3) No FE-result filtering
- Do not include/exclude results on the client to change the dataset.
- Allowed FE logic: input validation, UI toggles, formatting, local highlighting.
- Sorting that changes dataset order must be performed by BE.

4) Always apply for YouTube by default
- Default platform selection should include YouTube.
- Ensure the YouTube path is verified during QA for every relevant change.

UI/State Guidelines
- Filter state represents the full set of conditions; applying filters must trigger one API call containing all conditions.
- Do not run additional client-side filtering after results arrive.
- Display server-returned results as-is (except presentation-only transforms).

FE Checklist for Changes
- [ ] Types updated for request/response
- [ ] UI components reflect all active filters
- [ ] Single apply action sends a complete multi-filter payload
- [ ] No FE-only filtering (verified by code review)
- [ ] YouTube flow tested end-to-end