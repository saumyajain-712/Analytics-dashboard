export type TenantListResponse = {
  metadata: unknown;
  window: { start_date: string; end_date: string };
  limit: number;
  tenants: { tenant_id: string; tenant_name: string; total_queries: number }[];
};

export type DashboardResponse = {
  metadata: unknown;
  data: {
    tenant_id: string;
    window: { start_date: string; end_date: string };
    summary: {
      total_queries: number;
      failed_queries: number;
      success_rate_pct: number;
      active_users: number;
      max_queries_per_user: number;
      min_queries_per_user: number;
    };
    confidence_distribution: {
      high: { count: number; pct_of_answered: number };
      medium: { count: number; pct_of_answered: number };
      low: { count: number; pct_of_answered: number };
    };
    query_timeseries: {
      granularity: "day";
      series: { date: string; total_queries: number; failed_queries: number }[];
    };
    user_query_stats: {
      pagination: { page: number; page_size: number; total_records: number };
      users: { user_id: string; display_name: string; total_queries: number; failed_queries: number; success_rate_pct: number }[];
    };
  };
};

export type UserDrilldownResponse = {
  metadata: unknown;
  data: {
    tenant_id: string;
    user_id: string;
    total_queries: number;
    success_rate_pct: number;
    breakdown: { label: string; count: number }[];
    view_details_supported: boolean;
  };
};
