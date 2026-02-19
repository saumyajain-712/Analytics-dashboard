import { apiGet } from "./client";
import type { TenantListResponse, DashboardResponse, UserDrilldownResponse } from "../types/analytics";

export function fetchTenants(params: { start_date?: string; end_date?: string; limit?: number; sort?: string }) {
  return apiGet<TenantListResponse>("/api/v1/tenants", params);
}

export function fetchDashboard(params: { tenant_id: string; start_date: string; end_date: string; page?: number; page_size?: number }) {
  return apiGet<DashboardResponse>("/api/v1/analytics/dashboard", params);
}

export function fetchUserDrilldown(userId: string, params: { tenant_id: string; start_date: string; end_date: string }) {
  return apiGet<UserDrilldownResponse>(`/api/v1/analytics/users/${encodeURIComponent(userId)}/drilldown`, params);
}
