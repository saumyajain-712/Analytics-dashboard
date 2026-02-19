import { useEffect, useMemo, useState } from 'react';
import { 
  Search, 
  AlertCircle, 
  TrendingUp, 
  Users,
  Calendar,
  Filter,
  Building2
} from 'lucide-react';
import { MetricCard } from './components/MetricCard';
import { ConfidenceChart } from './components/ConfidenceChart';
import { QueryTrendChart } from './components/QueryTrendChart';
import { UserStatsTable } from './components/UserStatsTable';
import { Button } from './components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './components/ui/select';
import { Card, CardContent } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { toast } from 'sonner';

import { fetchTenants, fetchDashboard, fetchUserDrilldown } from '../api/analytics';
import type { DashboardResponse, UserDrilldownResponse } from '../types/analytics';

export default function App() {
  const [selectedTenant, setSelectedTenant] = useState('');
  const [startDate, setStartDate] = useState('2026-01-19');
  const [endDate, setEndDate] = useState('2026-02-18');
  const [dateRange, setDateRange] = useState('30d');
  const [selectedUser, setSelectedUser] = useState('all');

  const [tenants, setTenants] = useState<{ id: string; name: string }[]>([]);
  const [dashboard, setDashboard] = useState<DashboardResponse["data"] | null>(null);
  const [loadingTenants, setLoadingTenants] = useState(false);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  // ✅ NEW STATE (Drilldown)
  const [drilldown, setDrilldown] = useState<UserDrilldownResponse["data"] | null>(null);
  const [loadingDrilldown, setLoadingDrilldown] = useState(false);

  // ===============================
  // LOAD TENANTS
  // ===============================
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoadingTenants(true);
        const res = await fetchTenants({
          start_date: startDate,
          end_date: endDate,
          limit: 50,
          sort: "queries_desc",
        });

        if (cancelled) return;

        const mapped = res.tenants.map((t) => ({
          id: t.tenant_id,
          name: t.tenant_name,
        }));

        setTenants(mapped);

        if (!selectedTenant && mapped.length > 0) {
          setSelectedTenant(mapped[0].id);
        }
      } catch {
        toast.error("Failed to load tenants");
      } finally {
        setLoadingTenants(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [startDate, endDate, selectedTenant]);

  // ===============================
  // LOAD DASHBOARD
  // ===============================
  useEffect(() => {
    if (!selectedTenant) return;

    let cancelled = false;

    (async () => {
      try {
        setLoadingDashboard(true);
        const res = await fetchDashboard({
          tenant_id: selectedTenant,
          start_date: startDate,
          end_date: endDate,
          page: 1,
          page_size: 25,
        });

        if (cancelled) return;
        setDashboard(res.data);
        setSelectedUser("all");
      } catch {
        toast.error("Failed to load dashboard");
        setDashboard(null);
      } finally {
        setLoadingDashboard(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedTenant, startDate, endDate]);

  // ===============================
  // ✅ LOAD USER DRILLDOWN (NEW)
  // ===============================
  useEffect(() => {
    if (!selectedTenant) return;
    if (selectedUser === "all") {
      setDrilldown(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoadingDrilldown(true);
        const res = await fetchUserDrilldown(selectedUser, {
          tenant_id: selectedTenant,
          start_date: startDate,
          end_date: endDate,
        });

        if (cancelled) return;
        setDrilldown(res.data);
      } catch {
        toast.error("Failed to load user drilldown");
        setDrilldown(null);
      } finally {
        setLoadingDrilldown(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedTenant, selectedUser, startDate, endDate]);

  const maxQueries = dashboard?.summary.max_queries_per_user ?? 0;
  const minQueries = dashboard?.summary.min_queries_per_user ?? 0;
  const avgSuccessRate = dashboard ? Math.round(dashboard.summary.success_rate_pct) : 0;

  const confidenceData = useMemo(() => {
    if (!dashboard) return [];
    return [
      {
        name: "High (>90%)",
        value: dashboard.confidence_distribution.high.count,
        percentage: Math.round(dashboard.confidence_distribution.high.pct_of_answered),
        color: "#10b981",
      },
      {
        name: "Medium (70-90%)",
        value: dashboard.confidence_distribution.medium.count,
        percentage: Math.round(dashboard.confidence_distribution.medium.pct_of_answered),
        color: "#f59e0b",
      },
      {
        name: "Low (<70%)",
        value: dashboard.confidence_distribution.low.count,
        percentage: Math.round(dashboard.confidence_distribution.low.pct_of_answered),
        color: "#ef4444",
      },
    ];
  }, [dashboard]);

  const trendData = useMemo(() => {
    if (!dashboard) return [];
    return dashboard.query_timeseries.series.map((s) => ({
      date: s.date,
      total: s.total_queries,
      failed: s.failed_queries,
      successful: s.total_queries - s.failed_queries,
    }));
  }, [dashboard]);

  const userStats = useMemo(() => {
    if (!dashboard) return [];
    return dashboard.user_query_stats.users.map((u) => ({
      userId: u.user_id,
      userName: u.display_name,
      totalQueries: u.total_queries,
      failedQueries: u.failed_queries,
      successRate: Math.round(u.success_rate_pct),
      highConfidence: 0,
      mediumConfidence: 0,
      lowConfidence: 0,
    }));
  }, [dashboard]);

  const selectedTenantName = tenants.find(t => t.id === selectedTenant)?.name || '';
  const dateRangeText = `${startDate} to ${endDate}`;

  // ✅ UPDATED HANDLER (Drilldown Enabled)
  const handleConfidenceClick = (name: string) => {
    if (selectedUser === "all") {
      toast.info(`Select a user to view drilldown counts`, {
        description: `Drilldown is counts-only per user (v1).`,
      });
      return;
    }

    if (loadingDrilldown) {
      toast.info("Loading drilldown...");
      return;
    }

    if (!drilldown) {
      toast.error("No drilldown data available for this user");
      return;
    }

    const lines = drilldown.breakdown
      .map((b) => `${b.label}: ${b.count}`)
      .join(" • ");

    toast.info(`User drilldown — ${name}`, {
      description: lines,
    });
  };

  const filteredUserStats = selectedUser === 'all' 
    ? userStats 
    : userStats.filter(u => u.userId === selectedUser);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ---- REST OF YOUR FILE REMAINS EXACTLY THE SAME ---- */}
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                  Monitor query performance and system metrics
                </p>
              </div>
              
              {/* Tenant Selector in Header */}
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Tenant
                </span>
                <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                  <SelectTrigger id="tenant-select-header" className="w-[260px] h-12 text-base font-semibold">
                    <Building2 className="h-5 w-5 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Date Range and User Filters */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <Label htmlFor="start-date" className="text-sm font-medium whitespace-nowrap">
                Date Range:
              </Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-[150px]"
              />
              <span className="text-sm text-muted-foreground">to</span>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-[150px]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="user-select" className="text-sm font-medium whitespace-nowrap">
              User:
            </Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger id="user-select" className="w-[220px]">
                <Users className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {userStats.map((user) => (
                  <SelectItem key={user.userId} value={user.userId}>
                    {user.userName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Analytics Summary - Made More Prominent */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2">
                <Filter className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-base font-semibold text-foreground">
                Showing analytics for: 
                <Badge variant="secondary" className="ml-2 text-base font-bold px-3 py-1">
                  {selectedTenantName}
                </Badge>
                <span className="mx-2 text-muted-foreground">•</span>
                <Badge variant="outline" className="text-base font-semibold px-3 py-1">
                  {dateRangeText}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Queries"
            value={(dashboard?.summary.total_queries ?? 0).toLocaleString()}
            subtitle="Across all users"
            icon={Search}
            trend={{ value: 12.5, isPositive: true }}
          />
          <MetricCard
            title="Failed Queries"
            value={(dashboard?.summary.failed_queries ?? 0).toLocaleString()}
            subtitle={`${dashboard ? (100 - dashboard.summary.success_rate_pct).toFixed(1) : "0.0"}% failure rate`}
            icon={AlertCircle}
            trend={{ value: 3.2, isPositive: false }}
          />
          <MetricCard
            title="Average Success Rate"
            value={`${avgSuccessRate}%`}
            subtitle="Per user average"
            icon={TrendingUp}
            trend={{ value: 5.8, isPositive: true }}
          />
          <MetricCard
            title="Active Users"
            value={dashboard?.summary.active_users ?? 0}
            subtitle={`${minQueries} min, ${maxQueries} max queries`}
            icon={Users}
          />
        </div>

        {/* High-Level Insights */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-blue-100 p-3">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">Key Insights</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    {confidenceData[0]?.percentage ?? 0}% High Confidence Queries
                  </Badge>
                  <Badge variant="secondary">
                    {userStats.filter(u => u.successRate >= 90).length} users with 90%+ success rate
                  </Badge>
                  <Badge variant="secondary">
                    {userStats.filter(u => u.lowConfidence > u.highConfidence).length} users need attention
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ConfidenceChart 
            data={confidenceData}
            onSegmentClick={handleConfidenceClick}
          />
          <QueryTrendChart data={trendData} />
        </div>

        {/* User Stats Table */}
        <UserStatsTable 
          data={filteredUserStats}
          maxQueries={maxQueries}
          minQueries={minQueries}
        />

        {/* Footer Insights */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3">Recommendations</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>
                  Focus on improving content quality for low confidence queries to boost overall performance
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>
                  Investigate users with high failure rates to identify common query patterns
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>
                  Consider adding more training data for areas with consistently low confidence scores
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
