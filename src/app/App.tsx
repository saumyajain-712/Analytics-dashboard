import { useState } from 'react';
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

// Mock data
const generateMockData = () => {
  const users = [
    { userId: 'u001', userName: 'Alice Johnson' },
    { userId: 'u002', userName: 'Bob Smith' },
    { userId: 'u003', userName: 'Carol Williams' },
    { userId: 'u004', userName: 'David Brown' },
    { userId: 'u005', userName: 'Eve Davis' },
    { userId: 'u006', userName: 'Frank Miller' },
    { userId: 'u007', userName: 'Grace Wilson' },
    { userId: 'u008', userName: 'Henry Moore' },
  ];

  const userStats = users.map((user) => {
    const totalQueries = Math.floor(Math.random() * 500) + 100;
    const failedQueries = Math.floor(totalQueries * (Math.random() * 0.15));
    const successfulQueries = totalQueries - failedQueries;
    
    const highConfidence = Math.floor(successfulQueries * (0.4 + Math.random() * 0.3));
    const mediumConfidence = Math.floor(successfulQueries * (0.2 + Math.random() * 0.2));
    const lowConfidence = successfulQueries - highConfidence - mediumConfidence;
    
    return {
      ...user,
      totalQueries,
      failedQueries,
      successRate: Math.round(((successfulQueries / totalQueries) * 100)),
      highConfidence,
      mediumConfidence,
      lowConfidence,
    };
  });

  const totalQueries = userStats.reduce((sum, user) => sum + user.totalQueries, 0);
  const totalFailed = userStats.reduce((sum, user) => sum + user.failedQueries, 0);
  const totalHigh = userStats.reduce((sum, user) => sum + user.highConfidence, 0);
  const totalMedium = userStats.reduce((sum, user) => sum + user.mediumConfidence, 0);
  const totalLow = userStats.reduce((sum, user) => sum + user.lowConfidence, 0);

  const trendData = Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (13 - i));
    const total = Math.floor(Math.random() * 300) + 200;
    const failed = Math.floor(total * 0.1);
    return {
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      total,
      failed,
      successful: total - failed,
    };
  });

  const answeredQueries = totalQueries - totalFailed;

  return {
    totalQueries,
    totalFailed,
    userStats,
    confidenceData: [
      { 
        name: 'High (>90%)', 
        value: totalHigh, 
        percentage: Math.round((totalHigh / answeredQueries) * 100),
        color: '#10b981' 
      },
      { 
        name: 'Medium (70-90%)', 
        value: totalMedium, 
        percentage: Math.round((totalMedium / answeredQueries) * 100),
        color: '#f59e0b' 
      },
      { 
        name: 'Low (<70%)', 
        value: totalLow, 
        percentage: Math.round((totalLow / answeredQueries) * 100),
        color: '#ef4444' 
      },
    ],
    trendData,
  };
};

export default function App() {
  const [selectedTenant, setSelectedTenant] = useState('acme-corp');
  const [startDate, setStartDate] = useState('2026-01-19');
  const [endDate, setEndDate] = useState('2026-02-18');
  const [dateRange, setDateRange] = useState('30d');
  const [selectedUser, setSelectedUser] = useState('all');
  const mockData = generateMockData();
  
  const maxQueries = Math.max(...mockData.userStats.map(u => u.totalQueries));
  const minQueries = Math.min(...mockData.userStats.map(u => u.totalQueries));
  const avgSuccessRate = Math.round(
    mockData.userStats.reduce((sum, u) => sum + u.successRate, 0) / mockData.userStats.length
  );

  const tenants = [
    { id: 'acme-corp', name: 'Acme Corporation' },
    { id: 'techstart-inc', name: 'TechStart Inc' },
    { id: 'global-solutions', name: 'Global Solutions Ltd' },
    { id: 'innovate-co', name: 'Innovate Co' },
  ];

  const selectedTenantName = tenants.find(t => t.id === selectedTenant)?.name || '';
  const dateRangeText = `${startDate} to ${endDate}`;

  const handleConfidenceClick = (name: string) => {
    toast.info(`Drilling down into ${name} confidence queries`, {
      description: 'This feature would show detailed queries and help identify low-performing areas.',
    });
  };

  const filteredUserStats = selectedUser === 'all' 
    ? mockData.userStats 
    : mockData.userStats.filter(u => u.userId === selectedUser);

  return (
    <div className="min-h-screen bg-gray-50">
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
                {mockData.userStats.map((user) => (
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
            value={mockData.totalQueries.toLocaleString()}
            subtitle="Across all users"
            icon={Search}
            trend={{ value: 12.5, isPositive: true }}
          />
          <MetricCard
            title="Failed Queries"
            value={mockData.totalFailed.toLocaleString()}
            subtitle={`${((mockData.totalFailed / mockData.totalQueries) * 100).toFixed(1)}% failure rate`}
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
            value={mockData.userStats.length}
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
                    {mockData.confidenceData[0].percentage}% High Confidence Queries
                  </Badge>
                  <Badge variant="secondary">
                    {mockData.userStats.filter(u => u.successRate >= 90).length} users with 90%+ success rate
                  </Badge>
                  <Badge variant="secondary">
                    {mockData.userStats.filter(u => u.lowConfidence > u.highConfidence).length} users need attention
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ConfidenceChart 
            data={mockData.confidenceData}
            onSegmentClick={handleConfidenceClick}
          />
          <QueryTrendChart data={mockData.trendData} />
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