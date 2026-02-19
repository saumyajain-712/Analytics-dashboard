Analytics Dashboard — Query & Confidence Analytics (Admin)

Source of Truth: dashboard-plan.md
Task Breakdown Reference: task.md
Status: Execution Guide
Prepared For: AI AGENT Engineering Team

1. Pre-Requisites
Backend

Python 3.10+

FastAPI

Uvicorn

Pydantic

SQLAlchemy (or existing DB layer)

Pytest

Frontend

Node 18+

React 18 + TypeScript

Tailwind CSS

shadcn/ui

lucide-react

sonner

2. Local Setup Commands
Backend
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate (Windows)
pip install -r requirements.txt
uvicorn app.main:app --reload

Frontend
cd frontend
npm install
npm run dev


Ensure frontend runs on http://localhost:5173 (or configured port).
Backend runs on http://127.0.0.1:8000.

3. Branching & PR Strategy

Each task in task.md = one PR (0.5–2h max).

Naming convention:

feat/analytics-<task-number>


Example:

feat/analytics-2.2-summary-service


Merge order:

Foundation

Backend services

Backend endpoints

Frontend API layer

Frontend integration

Testing

Polish

No mega PRs.

4. Execution by Task
Phase 1 — Foundation
Task 1.1 — Shared Response Envelope
Goal

Standardize metadata wrapper for all 3 endpoints.

Files

app/schemas/common.py

src/types/common.ts

Implementation Steps

Define Pydantic models:

Status

Metadata

Window

Add helper to generate metadata:

request_id (uuid4)

timestamp (UTC ISO)

schema_version = "1.0"

Mirror exact TypeScript types.

Verification

FastAPI docs show wrapped response.

TypeScript builds with no any.

Rollback

Revert schema files.

Task 1.2 — JWT Auth Context
Goal

Enforce 401 vs 403 + tenant scoping.

Files

app/auth/context.py

app/auth/deps.py

app/auth/errors.py

Implementation Steps

Create AuthContext object.

Implement dependency get_auth_context.

Validate JWT:

invalid → 401

Enforce:

tenant_admin cannot override tenant_id.

super_admin can filter by tenant_id.

Add unit tests for role behavior.

Verification

Tenant Admin cross-tenant request returns 403.

Missing token returns 401.

Rollback

Remove dependency injection.

Task 1.3 — Date Validation
Goal

Enforce strict YYYY-MM-DD parsing.

Implementation Steps

Parse with datetime.strptime.

Validate:

start <= end

optional 90-day cap.

Raise HTTP 400 on failure.

Verification

Reversed dates → 400.

Invalid format → 400.

Phase 2 — Backend Aggregation
Task 2.1 — Confidence Buckets
Goal

Single source of truth for boundaries.

Implementation Steps

Implement get_bucket(score) function.

Add tests:

69 → low

70 → medium

90 → medium

91 → high

Verification

All boundary tests pass.

Task 2.2 — Summary Service
Goal

Compute KPI cards + distribution.

Implementation Steps

Query events filtered by:

tenant_id

date range

Compute:

total_queries

failed_queries

success_rate_pct

avg_confidence (answered only)

Use bucket helper for counts.

Guard divide-by-zero cases.

Verification

Matches sample dataset calculations.

Task 2.3 — Timeseries Service
Goal

Daily aggregation.

Implementation Steps

GROUP BY DATE(created_at)

Return sorted ascending by date.

Task 2.4 — Per-User Service
Goal

Paginated table + global min/max.

Implementation Steps

GROUP BY user_id.

Compute:

total

failed

success_rate

avg_confidence

Compute min/max across totals.

Apply server-side pagination.

Default sort: total desc.

Task 2.5 — Counts-Only Drilldown
Goal

User-level aggregate only.

Implementation Steps

Filter by:

tenant_id

user_id

date range

Compute totals + bucket counts.

Return:

breakdown[]

view_details_supported=false

Phase 3 — Backend Endpoints
Task 3.1 — GET /api/v1/tenants
Steps

Auth required.

Apply tenant scoping.

Return:

metadata

window

tenants[]

Task 3.2 — GET /api/v1/analytics/dashboard
Steps

Validate dates.

Resolve tenant scope.

Call:

summary service

timeseries service

per-user service

Return bundled response.

Task 3.3 — GET /api/v1/analytics/users/{user_id}/drilldown
Steps

Validate dates.

Resolve tenant.

Call drilldown service.

Return counts-only payload.

Task 3.4 — Enable CORS

Add middleware:

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)

Phase 4 — Frontend API Layer
Task 4.1 — API Client

Create:

src/api/client.ts

export async function apiGet<T>(url: string): Promise<T> { ... }


No any allowed.

Task 4.2 — Analytics Types + Wrappers

Create:

src/types/analytics.ts

src/api/analytics.ts

Functions:

fetchTenants

fetchDashboard

fetchUserDrilldown

Phase 5 — Frontend Integration
Task 5.1 — Replace Tenant Mock

Remove hardcoded tenant list.
Fetch from /tenants.

Task 5.2 — Replace generateMockData()

Remove function entirely.
Fetch /analytics/dashboard.

Map response to:

KPI cards

Confidence chart

Trend chart

User table

Task 5.3 — Implement Drilldown

When user selected:
Call /analytics/users/{user_id}/drilldown.
Render counts-only breakdown.

Task 5.4 — Loading + Error States

Add:

isLoading flags

Error toast

Empty state for zero data

Phase 6 — Testing
Task 6.1 — Backend Contract Tests

Validate:

Required keys

Schema stability

Status codes (401/403)

Task 6.2 — Optional MSW

Dev-only mock handlers.

Final Definition of Done

Exactly 3 endpoints implemented.

Strict tenant isolation enforced.

Confidence boundaries correct.

All aggregation server-side.

Frontend fully API-driven.

No mock data remains.

No forbidden branding anywhere.

Dashboard response < 2s.

Drilldown response < 1s.

Contract tests passing.