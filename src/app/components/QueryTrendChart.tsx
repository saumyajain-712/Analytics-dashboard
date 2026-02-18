import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';

interface TrendData {
  date: string;
  total: number;
  failed: number;
  successful: number;
}

interface QueryTrendChartProps {
  data: TrendData[];
}

export function QueryTrendChart({ data }: QueryTrendChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Query Trends Over Time</CardTitle>
        <CardDescription>Daily query volume and success rates</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="total" 
              stroke="#8884d8" 
              strokeWidth={2}
              name="Total Queries"
            />
            <Line 
              type="monotone" 
              dataKey="successful" 
              stroke="#10b981" 
              strokeWidth={2}
              name="Successful"
            />
            <Line 
              type="monotone" 
              dataKey="failed" 
              stroke="#ef4444" 
              strokeWidth={2}
              name="Failed"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
