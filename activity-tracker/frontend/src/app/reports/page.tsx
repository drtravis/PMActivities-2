'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/lib/store';
import { reportsAPI } from '@/lib/api';
import { ActivityStatusReport, MemberPerformanceReport, ApprovalAgingReport } from '@/types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell,
  ResponsiveContainer 
} from 'recharts';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function ReportsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [activityReport, setActivityReport] = useState<ActivityStatusReport | null>(null);
  const [memberReport, setMemberReport] = useState<MemberPerformanceReport[]>([]);
  const [approvalReport, setApprovalReport] = useState<ApprovalAgingReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    if (user?.role === 'MEMBER') {
      toast.error('Access denied. Reports are only available to admins and project managers.');
      router.push('/dashboard');
      return;
    }

    loadReports();
  }, [isAuthenticated, user, filters]);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const [activityData, memberData, approvalData] = await Promise.all([
        reportsAPI.getActivityStatusReport(filters),
        reportsAPI.getMemberPerformanceReport(filters),
        reportsAPI.getApprovalAgingReport(),
      ]);

      setActivityReport(activityData);
      setMemberReport(memberData);
      setApprovalReport(approvalData);
    } catch (error: any) {
      toast.error('Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const blob = await reportsAPI.exportActivitiesCSV(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `activities-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Export downloaded successfully');
    } catch (error: any) {
      toast.error('Failed to export data');
    }
  };

  const getStatusChartData = () => {
    if (!activityReport) return [];
    return Object.entries(activityReport.byStatus).map(([status, count]) => ({
      name: status.replace('_', ' ').toUpperCase(),
      value: count,
    }));
  };

  const getApprovalStateChartData = () => {
    if (!activityReport) return [];
    return Object.entries(activityReport.byApprovalState).map(([state, count]) => ({
      name: state.replace('_', ' ').toUpperCase(),
      value: count,
    }));
  };

  const getApprovalTimingData = () => {
    if (!approvalReport) return [];
    return [
      { name: '< 24h', value: approvalReport.approvalsByTimeRange.lessThan24h },
      { name: '24-48h', value: approvalReport.approvalsByTimeRange.between24h48h },
      { name: '48-72h', value: approvalReport.approvalsByTimeRange.between48h72h },
      { name: '> 72h', value: approvalReport.approvalsByTimeRange.moreThan72h },
    ];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
              <p className="text-sm text-gray-600">Comprehensive insights into activity management</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md text-sm font-medium"
              >
                Back to Dashboard
              </button>
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
              >
                <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Activity Status Report */}
        {activityReport && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Activity Status Overview</h3>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{activityReport.totalActivities}</div>
                <div className="text-sm text-blue-600">Total Activities</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{activityReport.completionRate.toFixed(1)}%</div>
                <div className="text-sm text-green-600">Completion Rate</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{activityReport.overdueActivities}</div>
                <div className="text-sm text-red-600">Overdue Activities</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{activityReport.byApprovalState.submitted || 0}</div>
                <div className="text-sm text-purple-600">Pending Approval</div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-2">Activities by Status</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getStatusChartData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getStatusChartData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-2">Activities by Approval State</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getApprovalStateChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Member Performance Report */}
        {memberReport.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Member Performance</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Activities
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Completed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Approval Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg. Completion Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {memberReport.map((member) => (
                    <tr key={member.userId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {member.userName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {member.totalActivities}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {member.completedActivities}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {member.approvalSuccessRate.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {member.averageCompletionTime.toFixed(1)} days
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Approval Aging Report */}
        {approvalReport && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Approval Aging Analysis</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{approvalReport.pendingApprovals}</div>
                <div className="text-sm text-yellow-600">Pending Approvals</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{approvalReport.averageApprovalTime.toFixed(1)}h</div>
                <div className="text-sm text-orange-600">Avg. Approval Time</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{approvalReport.approvalsByTimeRange.moreThan72h}</div>
                <div className="text-sm text-red-600">Overdue (&gt;72h)</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-2">Approval Time Distribution</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getApprovalTimingData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-2">Manager Bottlenecks</h4>
                {approvalReport.bottleneckManagers.length > 0 ? (
                  <div className="space-y-2">
                    {approvalReport.bottleneckManagers.slice(0, 5).map((manager) => (
                      <div key={manager.managerId} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="font-medium">{manager.managerName}</span>
                        <span className="text-sm text-gray-600">{manager.pendingCount} pending</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No bottlenecks detected</p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
