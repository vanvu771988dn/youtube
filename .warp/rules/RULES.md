# Engineering Rules

This repository follows these mandatory rules across frontend (FE) and backend (BE).

Rule 1 — FE and BE must be updated together
- Any change that affects data, behavior, or UI must be checked and updated in BOTH FE and BE as needed.
- Examples:
  - Filter schema changes → update FE types, UI bindings, and BE parsing/validation.
  - Sorting/ordering changes → update BE implementation and FE options/labels.
  - Added/removed fields → update BE response and FE renderers.
- Acceptance checklist:
  - [ ] BE API contract updated (request/response, defaults, validation)
  - [ ] FE types, hooks, and components updated accordingly
  - [ ] End-to-end test or manual verification performed

Rule 2 — Always use multi-filter semantics for filter updates
- “Multi filter” means requests support combining multiple filter fields in a single API call.
- The FE must always send the complete filter payload (all active fields), not piecemeal calls.
- The BE must accept and evaluate multiple filters together.
- Composition guidance:
  - Combine different filter dimensions with AND semantics by default (e.g., date AND viewCount AND duration).
  - Within a single multi-select dimension (e.g., duration brackets), OR is acceptable, evaluated within that dimension before AND across dimensions.
- Acceptance checklist:
  - [ ] Single API request carries all current filter conditions
  - [ ] BE applies all provided filters together
  - [ ] Response validated against combined criteria

Rule 3 — Filtering logic lives in the backend
- FE must NOT determine result sets. FE collects/validates inputs and renders results only.
- All filtering, sorting, and pagination that affects which items are included MUST be performed in the BE.
- FE-side filtering is limited to display-only concerns (e.g., local highlighting), never to include/exclude results.
- Acceptance checklist:
  - [ ] No FE-only filtering logic changes which items are included
  - [ ] BE implements authoritative filtering and sorting

Rule 4 — Always apply for YouTube
- YouTube is the base (default) supported platform for filtering and must always be handled by the BE endpoints.
- Other platforms may be optional, but YouTube must remain fully supported and covered by tests/verification.
- Acceptance checklist:
  - [ ] YouTube path covered by integration tests or manual verification
  - [ ] Default platform behavior works end-to-end

Implementation Notes
- API Contract: Keep a single, stable filter payload structure. Unknown/empty fields should be safely ignored by BE.
- Versioning: When changing filter schema, bump an internal API version or document the change clearly and migrate FE in lock-step.
- Observability: Log applied filter payloads on the BE (with PII-safe practices) to aid troubleshooting.

PR Readiness Checklist (must be included in every change touching filters or data)
- [ ] FE updated (types, UI, hooks) and tested
- [ ] BE updated (validation, filtering, sorting) and tested
- [ ] Multi-filter request verified (single API call with all filters)
- [ ] BE-only filtering confirmed (no FE-only inclusion/exclusion)
- [ ] YouTube flow verified end-to-end