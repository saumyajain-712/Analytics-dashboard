import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';

interface ConfidenceData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

interface ConfidenceChartProps {
  data: ConfidenceData[];
  onSegmentClick?: (name: string) => void;
}

export function ConfidenceChart({ data, onSegmentClick }: ConfidenceChartProps) {
  const handleClick = (entry: ConfidenceData) => {
    if (onSegmentClick) {
      onSegmentClick(entry.name);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Query Confidence Distribution</CardTitle>
        <CardDescription>Breakdown of answered queries by confidence level</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) => `${name}: ${percentage}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              onClick={handleClick}
              style={{ cursor: 'pointer' }}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => `${value} queries`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          {data.map((item) => (
            <div key={item.name} className="space-y-1">
              <div className="text-2xl font-bold">{item.percentage}%</div>
              <div className="text-sm text-muted-foreground">{item.name}</div>
              <div className="text-xs text-muted-foreground">{item.value} queries</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
