Analytics Dashboard — Query & Confidence Analytics (Admin)

Based on Specification v1.1

1. Objective

Implement a tenant-driven Analytics Dashboard for the AI AGENT platform that provides:

Summary metrics (total, failed, failure rate, avg confidence)

Confidence bucket distribution

Per-user metrics with pagination

Counts-only drilldown per user

Strict multi-tenant enforcement

Server-side aggregation

The system must expose exactly three REST endpoints and integrate with the React frontend dashboard.

2. Implementation Strategy

Implementation will be divided into three major tracks:

Backend Data Layer

Backend API Layer

Frontend Integration

Each layer will be built incrementally and validated independently.

3. Backend Implementation Plan
3.1 Data Layer
3.1.1 Query Events Table

Ensure the query_events table exists with:

query_id (PK)

tenant_id (indexed)

user_id (indexed)

created_at (indexed)

status

confidence_score

failure_reason

3.1.2 Required Indexes

Indexes required for performance:

(tenant_id, created_at)

(tenant_id, user_id, created_at)

(tenant_id, status, created_at)

(tenant_id, confidence_score)

Goal:
Support efficient range scans and group-by operations.

3.2 Aggregation Layer

All aggregations must be implemented in reusable service functions.

3.2.1 Summary Aggregation Service

Responsible for computing:

total_queries

failed_queries

success_rate_pct

avg_confidence

confidence buckets

active_users

min_queries_per_user

max_queries_per_user

Must:

Filter by tenant_id

Filter by start_date and end_date

Exclude failed queries from averages

Strictly enforce confidence boundaries

3.2.2 Per-User Aggregation Service

Responsible for:

Paginated per-user results

total_queries per user

failed_queries per user

failure_rate

avg_confidence per user

Global min/max query counts

Must support:

Sorting

Pagination

Server-side filtering

3.2.3 Drilldown Aggregation Service

Responsible for:

total_queries for user

success_rate_pct

breakdown counts:

High

Medium

Low

Failed

No query-level data returned.

4. API Layer Plan
4.1 Authentication Middleware

Validate JWT

Extract:

sub

tenant_id

role

Reject invalid tokens (401)

Reject cross-tenant access (403)

Tenant scoping must be applied to every query.

4.2 Endpoint 1: GET /api/v1/tenants
Implementation Steps

Validate authentication

If Tenant Admin:

Return only their tenant

If Super Admin:

Return tenants ordered by total_queries

Apply optional date filters

Return metadata + window + tenants array

4.3 Endpoint 2: GET /api/v1/analytics/dashboard
Implementation Steps

Validate tenant scope

Validate date range

Call Summary Aggregation Service

Call Per-User Aggregation Service (page 1 default)

Build timeseries aggregation grouped by day

Construct response payload exactly as defined in spec

Return metadata wrapper

Performance target: < 2 seconds

4.4 Endpoint 3: GET /api/v1/analytics/users/{user_id}/drilldown
Implementation Steps

Validate authentication

Validate tenant scope

Validate date range

Call Drilldown Aggregation Service

Construct breakdown[]

Return counts-only payload

Performance target: < 1 second

5. Frontend Implementation Plan
5.1 Remove Mock Data

Remove generateMockData()

Introduce API client layer

5.2 Create API Layer

Create:

src/api/client.ts
src/api/analytics.ts
src/types/analytics.ts


All responses must be strongly typed (no any).

5.3 Dashboard Integration Flow
On Tenant Change

Fetch dashboard bundle

On Date Change

Fetch dashboard bundle

On User Filter Change

Filter table

If specific user:

Call drilldown endpoint

5.4 Loading & Error States

Implement:

Loading skeleton for KPI cards

Loading state for charts

Toast error messages

Retry mechanism

6. Validation & Testing Plan
6.1 Unit Tests

Test:

Confidence bucket boundaries (70, 90)

Failure rate formula

Average confidence excludes failed

Min/max per-user calculation

Tenant scoping enforcement

6.2 Integration Tests

Dashboard endpoint returns correct summary

Per-user pagination works

Drilldown returns correct counts

Cross-tenant access blocked

Invalid date range returns 400

6.3 Manual Verification

Use controlled test dataset:

Create known distribution of queries

Validate dashboard output manually

Confirm percentages sum to 100%

7. Performance Plan

To meet SLA:

Ensure indexes exist

Avoid N+1 queries

Use grouped aggregation queries

Avoid scanning entire dataset without tenant filter

If needed:

Introduce pre-aggregated rollups later (not required for v1)

8. Deployment Plan

Deploy database migrations

Deploy backend endpoints

Deploy frontend integration

Enable feature flag

Monitor:

API latency

Error rate

Data correctness

9. Risks & Mitigations
Risk	Mitigation
Slow aggregation on large dataset	Add composite indexes
Incorrect bucket boundary logic	Unit tests for 69,70,90,91
Tenant leakage	Mandatory tenant filter in DB layer
Percentage rounding errors	Round at final calculation stage
10. Definition of Done

Feature is complete when:

All 3 endpoints implemented

Dashboard renders API-driven data

Drilldown works

Multi-tenant isolation verified

Unit tests passing

Integration tests passing

Performance targets met

Mock data removed

No TypeScript any in analytics path