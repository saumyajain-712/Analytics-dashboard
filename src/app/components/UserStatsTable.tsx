import { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from './ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Progress } from './ui/progress';

interface UserStats {
  userId: string;
  userName: string;
  totalQueries: number;
  failedQueries: number;
  successRate: number;
  highConfidence: number;
  mediumConfidence: number;
  lowConfidence: number;
}

interface UserStatsTableProps {
  data: UserStats[];
  maxQueries: number;
  minQueries: number;
}

export function UserStatsTable({ data, maxQueries, minQueries }: UserStatsTableProps) {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof UserStats;
    direction: 'asc' | 'desc';
  }>({ key: 'totalQueries', direction: 'desc' });
  
  const [selectedUser, setSelectedUser] = useState<UserStats | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const sortedData = [...data].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = sortedData.slice(startIndex, endIndex);

  const handleSort = (key: keyof UserStats) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc',
    });
    setCurrentPage(1); // Reset to first page when sorting
  };

  const SortButton = ({ column }: { column: keyof UserStats }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(column)}
      className="h-8 p-0 hover:bg-transparent"
    >
      {sortConfig.key === column ? (
        sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
      ) : (
        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
      )}
    </Button>
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Per-User Query Statistics</CardTitle>
          <CardDescription>
            Detailed breakdown of queries per user. Click on a row to view confidence distribution.
          </CardDescription>
          <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
            <span>
              <strong>Max Queries:</strong> {maxQueries}
            </span>
            <span>
              <strong>Min Queries:</strong> {minQueries}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    User
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      Total Queries
                      <SortButton column="totalQueries" />
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      Failed
                      <SortButton column="failedQueries" />
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      Success Rate
                      <SortButton column="successRate" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((user) => (
                  <TableRow 
                    key={user.userId}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedUser(user)}
                  >
                    <TableCell className="font-medium">
                      {user.userName}
                      {user.totalQueries === maxQueries && (
                        <Badge variant="default" className="ml-2">Top</Badge>
                      )}
                      {user.totalQueries === minQueries && (
                        <Badge variant="secondary" className="ml-2">Low</Badge>
                      )}
                    </TableCell>
                    <TableCell>{user.totalQueries}</TableCell>
                    <TableCell>
                      <span className="text-red-600">{user.failedQueries}</span>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={user.successRate >= 90 ? 'default' : user.successRate >= 70 ? 'secondary' : 'destructive'}
                      >
                        {user.successRate}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUser(user);
                        }}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination Controls */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rows per page:</span>
              <Select value={pageSize.toString()} onValueChange={(value) => {
                setPageSize(Number(value));
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages} ({sortedData.length} total)
              </span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  First
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  Last
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedUser?.userName} - Query Confidence Breakdown</DialogTitle>
            <DialogDescription>
              Detailed confidence level distribution for this user
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Total Queries</div>
                  <div className="text-2xl font-bold">{selectedUser.totalQueries}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Success Rate</div>
                  <div className="text-2xl font-bold">{selectedUser.successRate}%</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="space-y-2 p-3 rounded-lg bg-green-50 border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-green-900">High Confidence (&gt;90%)</div>
                      <div className="text-sm text-green-700">
                        {selectedUser.highConfidence} queries ({((selectedUser.highConfidence / selectedUser.totalQueries) * 100).toFixed(1)}%)
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-green-900">
                      {selectedUser.highConfidence}
                    </div>
                  </div>
                  <Progress 
                    value={(selectedUser.highConfidence / selectedUser.totalQueries) * 100}
                    className="h-2 bg-green-200"
                  />
                </div>

                <div className="space-y-2 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-yellow-900">Medium Confidence (70-90%)</div>
                      <div className="text-sm text-yellow-700">
                        {selectedUser.mediumConfidence} queries ({((selectedUser.mediumConfidence / selectedUser.totalQueries) * 100).toFixed(1)}%)
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-yellow-900">
                      {selectedUser.mediumConfidence}
                    </div>
                  </div>
                  <Progress 
                    value={(selectedUser.mediumConfidence / selectedUser.totalQueries) * 100}
                    className="h-2 bg-yellow-200"
                  />
                </div>

                <div className="space-y-2 p-3 rounded-lg bg-red-50 border border-red-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-red-900">Low Confidence (&lt;70%)</div>
                      <div className="text-sm text-red-700">
                        {selectedUser.lowConfidence} queries ({((selectedUser.lowConfidence / selectedUser.totalQueries) * 100).toFixed(1)}%)
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-red-900">
                      {selectedUser.lowConfidence}
                    </div>
                  </div>
                  <Progress 
                    value={(selectedUser.lowConfidence / selectedUser.totalQueries) * 100}
                    className="h-2 bg-red-200"
                  />
                </div>

                <div className="space-y-2 p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">Failed Queries</div>
                      <div className="text-sm text-gray-700">
                        {selectedUser.failedQueries} queries ({((selectedUser.failedQueries / selectedUser.totalQueries) * 100).toFixed(1)}%)
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {selectedUser.failedQueries}
                    </div>
                  </div>
                  <Progress 
                    value={(selectedUser.failedQueries / selectedUser.totalQueries) * 100}
                    className="h-2 bg-gray-200"
                  />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}