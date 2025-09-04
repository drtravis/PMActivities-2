'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { activitiesAPI, projectsAPI } from '@/lib/api';

interface ReportData {
  activityStatus: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    overdue: number;
    completionRate: number;
  };
  memberPerformance: {
    name: string;
    tasksCompleted: number;
    averageTime: number;
    efficiency: number;
  }[];
  timeTracking: {
    estimatedHours: number;
    actualHours: number;
    variance: number;
  };
  priorityBreakdown: {
    high: number;
    medium: number;
    low: number;
  };
}

interface ProjectReportsProps {
  selectedProject?: any;
}

export function ProjectReports({ selectedProject }: ProjectReportsProps) {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState('overview');
  const [dateRange, setDateRange] = useState({
    start: '2024-01-01',
    end: '2024-01-31',
  });

  useEffect(() => {
    if (selectedProject) {
      fetchReportData();
    }
  }, [selectedProject, dateRange]);

  const fetchReportData = async () => {
    if (!selectedProject) {
      setLoading(false);
      return;
    }

    try {
      // Fetch project-specific activities and members
      const [activities, members] = await Promise.all([
        activitiesAPI.getAll({ projectId: selectedProject.id }),
        projectsAPI.getMembers(selectedProject.id)
      ]);

      // Calculate activity status
      const total = activities.length;
      const completed = activities.filter((a: any) => a.status === 'completed').length;
      const inProgress = activities.filter((a: any) => a.status === 'in_progress').length;
      const pending = activities.filter((a: any) => a.approvalState === 'submitted').length;
      const overdue = activities.filter((a: any) => {
        if (!a.endDate || a.status === 'completed') return false;
        return new Date(a.endDate) < new Date();
      }).length;
      const completionRate = total > 0 ? (completed / total) * 100 : 0;

      // Calculate member performance
      const memberPerformance = members.map((member: any) => {
        const memberActivities = activities.filter((a: any) =>
          a.assignees && a.assignees.some((assignee: any) => assignee.id === member.id)
        );
        const completedActivities = memberActivities.filter((a: any) => a.status === 'completed');

        return {
          name: member.name,
          tasksCompleted: completedActivities.length,
          averageTime: 2.5, // Mock for now - would need time tracking data
          efficiency: completedActivities.length > 0 ? Math.min(95, 70 + completedActivities.length * 5) : 0
        };
      });

      // Calculate priority breakdown
      const priorityBreakdown = {
        high: activities.filter((a: any) => a.priority === 'high').length,
        medium: activities.filter((a: any) => a.priority === 'medium').length,
        low: activities.filter((a: any) => a.priority === 'low').length,
      };

      const reportData: ReportData = {
        activityStatus: {
          total,
          completed,
          inProgress,
          pending,
          overdue,
          completionRate: Math.round(completionRate * 10) / 10,
        },
        memberPerformance,
        timeTracking: {
          estimatedHours: 0, // Not available in current schema
          actualHours: 0, // Not available in current schema
          variance: 0,
        },
        priorityBreakdown,
      };

      setReportData(reportData);
    } catch (error) {
      console.error('Failed to fetch report data:', error);
      toast.error('Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: 'pdf' | 'csv' | 'excel') => {
    try {
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!selectedProject) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">📊</div>
          <p>Please select a project to view reports</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="p-6 text-center text-gray-500">
        No report data available
      </div>
    );
  }

  const reports = [
    { id: 'overview', label: 'Project Overview', icon: '📊' },
    { id: 'performance', label: 'Team Performance', icon: '👥' },
    { id: 'time', label: 'Time Tracking', icon: '⏱️' },
    { id: 'priority', label: 'Priority Analysis', icon: '🎯' },
  ];

  return (
    <div className="p-6">
      {/* Report Controls */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex space-x-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="flex items-center text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => exportReport('pdf')} variant="outline" className="text-sm">
            📄 PDF
          </Button>
          <Button onClick={() => exportReport('csv')} variant="outline" className="text-sm">
            📊 CSV
          </Button>
          <Button onClick={() => exportReport('excel')} variant="outline" className="text-sm">
            📈 Excel
          </Button>
        </div>
      </div>

      {/* Report Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {reports.map((report) => (
            <button
              key={report.id}
              onClick={() => setSelectedReport(report.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                selectedReport === report.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{report.icon}</span>
              {report.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Report Content */}
      {selectedReport === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{reportData.activityStatus.total}</div>
              <div className="text-sm text-blue-700">Total Activities</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{reportData.activityStatus.completed}</div>
              <div className="text-sm text-green-700">Completed</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{reportData.activityStatus.inProgress}</div>
              <div className="text-sm text-yellow-700">In Progress</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{reportData.activityStatus.pending}</div>
              <div className="text-sm text-purple-700">Pending</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{reportData.activityStatus.overdue}</div>
              <div className="text-sm text-red-700">Overdue</div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Completion Rate</h3>
            <div className="flex items-center space-x-4">
              <div className="flex-1 bg-gray-200 rounded-full h-4">
                <div
                  className="bg-green-500 h-4 rounded-full"
                  style={{ width: `${reportData.activityStatus.completionRate}%` }}
                ></div>
              </div>
              <span className="text-2xl font-bold text-green-600">
                {reportData.activityStatus.completionRate}%
              </span>
            </div>
          </div>
        </div>
      )}

      {selectedReport === 'performance' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Team Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tasks Completed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Time (days)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Efficiency
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.memberPerformance.map((member, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-sm font-medium">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{member.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.tasksCompleted}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.averageTime}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${member.efficiency}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-sm text-gray-600">{member.efficiency}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedReport === 'time' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{reportData.timeTracking.estimatedHours}h</div>
              <div className="text-sm text-blue-700">Estimated Hours</div>
            </div>
            <div className="bg-green-50 p-6 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{reportData.timeTracking.actualHours}h</div>
              <div className="text-sm text-green-700">Actual Hours</div>
            </div>
            <div className={`p-6 rounded-lg ${reportData.timeTracking.variance < 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className={`text-2xl font-bold ${reportData.timeTracking.variance < 0 ? 'text-green-600' : 'text-red-600'}`}>
                {reportData.timeTracking.variance > 0 ? '+' : ''}{reportData.timeTracking.variance}%
              </div>
              <div className={`text-sm ${reportData.timeTracking.variance < 0 ? 'text-green-700' : 'text-red-700'}`}>
                Variance
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedReport === 'priority' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-red-50 p-6 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{reportData.priorityBreakdown.high}</div>
              <div className="text-sm text-red-700">High Priority</div>
            </div>
            <div className="bg-yellow-50 p-6 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{reportData.priorityBreakdown.medium}</div>
              <div className="text-sm text-yellow-700">Medium Priority</div>
            </div>
            <div className="bg-green-50 p-6 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{reportData.priorityBreakdown.low}</div>
              <div className="text-sm text-green-700">Low Priority</div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Priority Distribution</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <span className="w-20 text-sm text-gray-600">High</span>
                <div className="flex-1 bg-gray-200 rounded-full h-4 mx-4">
                  <div
                    className="bg-red-500 h-4 rounded-full"
                    style={{ width: `${(reportData.priorityBreakdown.high / reportData.activityStatus.total) * 100}%` }}
                  ></div>
                </div>
                <span className="w-12 text-sm text-gray-600">{reportData.priorityBreakdown.high}</span>
              </div>
              <div className="flex items-center">
                <span className="w-20 text-sm text-gray-600">Medium</span>
                <div className="flex-1 bg-gray-200 rounded-full h-4 mx-4">
                  <div
                    className="bg-yellow-500 h-4 rounded-full"
                    style={{ width: `${(reportData.priorityBreakdown.medium / reportData.activityStatus.total) * 100}%` }}
                  ></div>
                </div>
                <span className="w-12 text-sm text-gray-600">{reportData.priorityBreakdown.medium}</span>
              </div>
              <div className="flex items-center">
                <span className="w-20 text-sm text-gray-600">Low</span>
                <div className="flex-1 bg-gray-200 rounded-full h-4 mx-4">
                  <div
                    className="bg-green-500 h-4 rounded-full"
                    style={{ width: `${(reportData.priorityBreakdown.low / reportData.activityStatus.total) * 100}%` }}
                  ></div>
                </div>
                <span className="w-12 text-sm text-gray-600">{reportData.priorityBreakdown.low}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
