Analytics Dashboard — Query & Confidence Analytics (Admin)

Plan Source of Truth: dashboard-plan.md
Specification Reference: specs/*.md (validation only — no scope expansion)
Document Version: 1.0
Status: Ready for Implementation
Prepared For: AI AGENT Engineering Team

 Scope Constraints (Non-Negotiable)

Exactly 3 REST endpoints:

GET /api/v1/tenants

GET /api/v1/analytics/dashboard

GET /api/v1/analytics/users/{user_id}/drilldown

Drilldown is counts-only (no query-level lists, no CSV export).

All aggregations are server-side only.

Strict multi-tenant isolation enforced via JWT.

Frontend must remove all mock data generation.


Phase 1 — Foundation
Task 1.1 — Shared Response Envelope + Strict Typing

Estimate: 1h
Goal: Standardize API response structure and enable strict typing.

Files

Backend:

app/schemas/common.py

Frontend:

src/types/common.ts

Implementation Steps

Define backend Pydantic models:

Status { code, key, message }

Metadata { request_id, timestamp, schema_version, status }

Window { start_date, end_date }

Mirror types in TypeScript.

Ensure no any usage.

Verification

Backend runs without import errors.

Frontend compiles with strict TS settings.

Rollback

Remove schema/type files.

Task 1.2 — JWT Auth Context + Tenant Enforcement

Estimate: 2h
Goal: Centralize authentication and enforce 401 vs 403 behavior.

Files

app/auth/context.py

app/auth/deps.py

app/auth/errors.py

app/main.py

Implementation Steps

Extract from JWT:

sub

tenant_id

role

401 → missing/invalid token

403 → cross-tenant access attempt

Tenant Admin auto-scoped to JWT tenant.

Verification

Missing token → 401

Tenant admin accessing other tenant → 403

Rollback

Remove dependency injection and restore previous behavior.

Task 1.3 — Date Validation Utilities (YYYY-MM-DD)

Estimate: 1h
Goal: Centralize date validation.

Files

app/utils/dates.py

app/constants.py

Implementation Steps

Parse strict YYYY-MM-DD

Validate:

start <= end

Optional 90-day cap

Raise HTTP 400 for invalid input.

Verification

Invalid format rejected

Reversed dates rejected

Rollback

Inline parsing temporarily.

Phase 2 — Backend Aggregation Services
Task 2.1 — Confidence Bucket Enforcement

Estimate: 1h

Files

app/services/confidence_buckets.py

Rules

High → > 90

Medium → 70–90 inclusive

Low → < 70

Must Test

69 → Low

70 → Medium

90 → Medium

91 → High

Task 2.2 — Summary Metrics Service

Estimate: 2h

Files

app/services/analytics_summary.py

app/schemas/analytics.py

Compute

total_queries

failed_queries

success_rate_pct

active_users

confidence_distribution

avg_confidence (answered only)

Verification

Percentages correct

Answered=0 handled

Task 2.3 — Daily Timeseries Aggregation

Estimate: 1–2h

Files

app/services/analytics_timeseries.py

Compute

Group by day

total_queries

failed_queries

Task 2.4 — Per-User Metrics + Global Min/Max

Estimate: 2h

Files

app/services/analytics_users.py

Compute

total_queries

failed_queries

success_rate_pct

avg_confidence_percent

min_queries_per_user

max_queries_per_user

Pagination (default 25)

Task 2.5 — Counts-Only User Drilldown

Estimate: 1–2h

Files

app/services/analytics_user_drilldown.py

Return

total_queries

success_rate_pct

breakdown:

High

Medium

Low

Failed

view_details_supported = false

Phase 3 — Backend Endpoints
Task 3.1 — GET /api/v1/tenants

Estimate: 1–2h

Files

app/routes/tenants.py

Behavior

Tenant Admin → own tenant only

Super Admin → filtered list

Returns metadata + window + tenants[]

Task 3.2 — GET /api/v1/analytics/dashboard

Estimate: 2h

Files

app/routes/analytics_dashboard.py

Must Include

summary

confidence_distribution

query_timeseries

user_query_stats

All server-side.

Task 3.3 — GET /api/v1/analytics/users/{user_id}/drilldown

Estimate: 1–2h

Files

app/routes/analytics_users.py

Counts-only. No query list.

Task 3.4 — Enable CORS for Local Dev

Estimate: 0.5–1h

File

app/main.py

Allow localhost origins only.

Phase 4 — Frontend API Layer
Task 4.1 — Typed API Client

Estimate: 1h

Files

src/api/client.ts

Generic apiGet<T>(), no any.

Task 4.2 — Analytics Types + Endpoint Wrappers

Estimate: 1–2h

Files

src/types/analytics.ts

src/api/analytics.ts

Functions:

fetchTenants

fetchDashboard

fetchUserDrilldown

Phase 5 — Frontend Integration
Task 5.1 — Replace Tenant Mock Data

Estimate: 1–2h

File

src/App.tsx

Remove hardcoded tenant list.

Task 5.2 — Replace generateMockData()

Estimate: 2h

File

src/App.tsx

Fetch /analytics/dashboard instead.

No mock generator allowed.

Task 5.3 — Implement Counts-Only Drilldown

Estimate: 1–2h

Trigger /analytics/users/{user_id}/drilldown.

Render breakdown only.

Task 5.4 — Loading & Error States

Estimate: 1–2h

Add:

Loading skeletons

Error toast (sonner)

Empty state

Phase 6 — Contract & Testing
Task 6.1 — Backend Contract Tests (3 Endpoints)

Estimate: 2h

Files

tests/test_contract_tenants.py

tests/test_contract_dashboard.py

tests/test_contract_user_drilldown.py

Assert:

Required keys exist

Response shapes stable

Task 6.2 — Optional MSW for Frontend

Estimate: 1–2h

Files

src/mocks/*

Dev-only mock mode.

Phase 7 — Final Cleanup
Task 7.1 — Remove All Mock Artifacts

Estimate: 0.5–1h

Delete generateMockData

Remove hardcoded tenants

Repo-wide search confirms no forbidden branding

 Definition of Done

All 3 endpoints implemented.

Strict JWT tenant isolation enforced.

Confidence boundaries verified.

Frontend fully API-driven.

No mock data remains.

Contract tests pass.

No forbidden branding present.

Performance targets met:

Dashboard < 2s

Drilldown < 1s