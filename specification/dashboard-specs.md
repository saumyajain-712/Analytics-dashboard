Feature Specification
Analytics Dashboard — Query & Confidence Analytics (Admin)

Document Version: 1.1
Last Updated: February 18, 2026
Status: Ready for Implementation
Prepared For: AI AGENT Product Team

1. Purpose

The Analytics Dashboard enables administrators of the AI AGENT multi-tenant SaaS platform to monitor AI query performance across tenants and users.

The dashboard provides:

Total query volume

Failed query counts and failure rate

Confidence distribution (High / Medium / Low)

Per-user query statistics

Counts-only drilldown for focused investigation

This feature is operational in nature and supports quality improvement, system health monitoring, and tenant-level performance analysis.

2. Scope
In Scope (v1)

Tenant-driven analytics

Time-range filtering

KPI summary metrics

Confidence bucket distribution

Per-user metrics table

Counts-only drilldown for selected user

Strict tenant isolation

Out of Scope (v1)

Query-level detail lists

CSV export

Real-time alerting

Predictive analytics

Audit log UI

Editing or mutating query data

SLA reporting

External BI integrations

3. System Overview

Analytics are derived from immutable query event records stored in a centralized event store.

Each query event represents one user query and contains:

status (answered | failed)

confidence_score (0–100, nullable if failed)

tenant_id

user_id

created_at timestamp

All aggregations are computed server-side.

4. User Roles
4.1 Super Admin

Can view global metrics across all tenants

Can filter by tenant

4.2 Tenant Admin

Can view only their tenant’s metrics

Cannot access other tenants' data

Tenant scoping is enforced server-side

5. Functional Requirements
5.1 Dashboard Filters

The dashboard MUST support:

Tenant selection (Super Admin only)

Date range selection (default: last 7 days)

User selection (All Users or specific user)

All filtering MUST be performed server-side.

5.2 Summary Metrics

The dashboard MUST display the following KPI cards:

FR-1: Total Queries

Definition: Count of all query events (answered + failed) in selected scope.

Formula:

COUNT(*)

FR-2: Failed Queries

Definition: Count of query events where status = "failed".

FR-3: Failure Rate (%)

Formula:

(Failed Queries / Total Queries) * 100


Rounded to 1 decimal place.

If Total Queries = 0 → display "N/A".

FR-4: Average Confidence (%)

Definition: Mean confidence_score across answered queries only.

Formula:

AVG(confidence_score WHERE status = 'answered')


Failed queries MUST be excluded.

If no answered queries → display "N/A".

5.3 Confidence Distribution

Confidence buckets are defined strictly as:

High: confidence_score > 90

Medium: 70 ≤ confidence_score ≤ 90

Low: confidence_score < 70

Percentages are calculated as:

(bucket_count / total_answered_queries) * 100


Rounded to 1 decimal place.

Failed queries excluded.

If no answered queries → percentages = "N/A".

Boundary correctness:

Score	Bucket
91	High
90	Medium
70	Medium
69	Low
5.4 Per-User Metrics

The dashboard MUST display a paginated per-user table including:

user_id

display_name (if available)

total_queries

failed_queries

failure_rate_percent

success_rate_percent

avg_confidence_percent

Default sort: total_queries descending.

Pagination:

Default page size: 25

Server-side pagination required

5.4.1 Global Per-User Statistics

The following MUST be computed across all users in scope:

min_queries_per_user

max_queries_per_user

These are global summary values and MUST NOT appear per-row.

5.5 Drilldown (Counts-Only)

Drilldown is supported via:

GET /api/v1/analytics/users/{user_id}/drilldown


Purpose:
Return aggregated counts for a selected user within the selected time range.

Response MUST include:

total_queries

success_rate_pct

breakdown:

High Confidence (>90%)

Medium Confidence (70–90%)

Low Confidence (<70%)

Failed Queries

view_details_supported = false

No query-level details are returned in v1.

6. API Design

The system exposes exactly 3 REST endpoints.

6.1 GET /api/v1/tenants

Purpose: Populate tenant selector.

Query Parameters:

start_date (optional)

end_date (optional)

limit (default 5)

sort (default queries_desc)

Response:

metadata

window

tenants[{ tenant_id, tenant_name, total_queries }]

Tenant Admin:

Returns only their tenant

Super Admin:

Returns all tenants (subject to limit)

6.2 GET /api/v1/analytics/dashboard

Purpose: Fetch full dashboard bundle.

Required:

tenant_id (Super Admin only)

start_date

end_date

Response MUST include:

summary:

total_queries

failed_queries

success_rate_pct

active_users

max_queries_per_user

min_queries_per_user

confidence_distribution:

high {count, pct_of_answered}

medium {count, pct_of_answered}

low {count, pct_of_answered}

query_timeseries:

granularity: "day"

series[{date, total_queries, failed_queries}]

user_query_stats:

pagination

users[]

All metrics computed server-side.

6.3 GET /api/v1/analytics/users/{user_id}/drilldown

Purpose:
Return counts-only breakdown for a single user.

Required:

tenant_id

start_date

end_date

Response:

total_queries

success_rate_pct

breakdown[]

view_details_supported: false

7. Multi-Tenancy & Security

All endpoints require JWT authentication.

JWT MUST contain:

sub (admin user ID)

tenant_id

role

Tenant ID MUST be derived from JWT for Tenant Admins.
Super Admin may specify tenant_id in request.

Unauthorized access MUST return:

401 if unauthenticated

403 if cross-tenant access attempt

All database queries MUST filter by tenant_id.

8. Data Model
8.1 Query Event Schema
query_id UUID
tenant_id UUID
user_id VARCHAR
created_at TIMESTAMP (UTC)
status ENUM('answered','failed')
confidence_score INTEGER (0–100, NULL if failed)
failure_reason VARCHAR (nullable)


Events are immutable.

Confidence_score MUST be validated at insert time (0–100 inclusive).

9. Non-Functional Requirements
Performance

Dashboard bundle response: < 2 seconds

Per-user metrics: < 2 seconds

Drilldown counts: < 1 second

Data Freshness

Metrics updated within 5 minutes of ingestion.

Correctness

Bucket boundaries strictly enforced.

Percentages must sum to 100% (when applicable).

Scalability

Must support millions of query events without degrading response times.

10. Edge Cases

No events in range → counts = 0, percentages = "N/A"

start_date > end_date → 400 Bad Request

Time range > 90 days → optional 400 restriction

Answered query with NULL confidence_score → excluded from averages and buckets

Duplicate query_id → prevented by primary key

Confidence score outside 0–100 → rejected at insertion