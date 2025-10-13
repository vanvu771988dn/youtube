# Backend Rules (BE)

Scope: API endpoints, filter parsing/validation, data sources.

1) FE and BE in lock-step
- Communicate contract changes (schema, defaults, validation) and coordinate FE updates.
- Provide backward compatibility or a clear migration path when possible.

2) Always support multi-filter
- Accept a full filter payload combining multiple conditions.
- Parse and validate all fields; ignore unknown/empty fields safely.
- Apply AND semantics across dimensions; allow OR within a multi-select dimension.

3) Authoritative filtering
- All inclusion/exclusion of results must be computed on the server.
- Sorting and pagination that affect the dataset must be server-side.
- Return only items that match the combined filter conditions.

4) Always apply for YouTube
- Ensure YouTube is fully supported and covered by tests.
- Other platforms are optional; must not degrade the YouTube path.

Implementation Guidelines
- Validation: Reject invalid ranges; normalize values (dates, enums, ranges).
- Observability: Log applied filters and timing (avoid sensitive data leakage).
- Performance: Index/filter efficiently; avoid N+1 queries; support pagination.
- Contract Stability: Prefer additive changes; document breaking changes and coordinate with FE.

BE Checklist for Changes
- [ ] Request schema updated and documented
- [ ] Multi-filter parsing/validation implemented
- [ ] Server-side filtering and sorting applied
- [ ] YouTube flow covered by tests/verification
- [ ] Performance and logs reviewed
