'use client';

import { useState, useEffect } from 'react';
import { tasksAPI, activitiesAPI } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface PMOReportsProps {
  projects: any[];
  users: any[];
  selectedProject: any;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function PMOReports({ projects, users, selectedProject }: PMOReportsProps) {
  const [reportData, setReportData] = useState<any>({
    projectHealth: [],
    taskDistribution: [],
    userProductivity: [],
    organizationMetrics: {},
    timelineData: [],
  });
  const [loading, setLoading] = useState(false);
  const [activeReport, setActiveReport] = useState('overview');

  useEffect(() => {
    loadReportData();
  }, [projects, users, selectedProject]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      // Project Health Data
      const projectHealthData = await Promise.all(
        projects.map(async (project) => {
          try {
            const tasks = await tasksAPI.getByProject(project.id);
            const totalTasks = tasks?.length || 0;
            const completedTasks = tasks?.filter((t: any) => 
              t.status === 'Done' || t.status === 'Completed' || t.status === 'done'
            ).length || 0;
            const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            return {
              name: project.name,
              totalTasks,
              completedTasks,
              completionRate,
              members: project.members?.length || 0,
            };
          } catch (error) {
            return {
              name: project.name,
              totalTasks: 0,
              completedTasks: 0,
              completionRate: 0,
              members: project.members?.length || 0,
            };
          }
        })
      );

      // Task Distribution by Status
      const allTasks = [];
      for (const project of projects) {
        try {
          const tasks = await tasksAPI.getByProject(project.id);
          if (tasks) allTasks.push(...tasks);
        } catch (error) {
          console.error(`Failed to load tasks for project ${project.id}:`, error);
        }
      }

      const taskStatusCounts = allTasks.reduce((acc: any, task: any) => {
        const status = task.status || 'Not Started';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      const taskDistribution = Object.entries(taskStatusCounts).map(([status, count]) => ({
        name: status,
        value: count,
      }));

      // User Productivity (mock data - would come from time tracking)
      const userProductivity = users.map((user, index) => ({
        name: user.name,
        tasksCompleted: Math.floor(Math.random() * 20) + 5,
        hoursLogged: Math.floor(Math.random() * 40) + 20,
        projectsActive: projects.filter(p => 
          p.members?.some((m: any) => m.id === user.id || m.userId === user.id)
        ).length,
      }));

      // Organization Metrics
      const organizationMetrics = {
        totalProjects: projects.length,
        activeProjects: projects.filter(p => p.status === 'active' || !p.status).length,
        totalUsers: users.length,
        totalTasks: allTasks.length,
        completedTasks: allTasks.filter(t => t.status === 'Done' || t.status === 'Completed' || t.status === 'done').length,
        overallCompletion: allTasks.length > 0 ? Math.round((allTasks.filter(t => t.status === 'Done' || t.status === 'Completed' || t.status === 'done').length / allTasks.length) * 100) : 0,
      };

      // Timeline Data (mock - would come from audit logs)
      const timelineData = [
        { month: 'Jan', projects: 8, tasks: 120, completed: 95 },
        { month: 'Feb', projects: 10, tasks: 150, completed: 125 },
        { month: 'Mar', projects: 12, tasks: 180, completed: 160 },
        { month: 'Apr', projects: 15, tasks: 220, completed: 190 },
        { month: 'May', projects: 18, tasks: 250, completed: 220 },
        { month: 'Jun', projects: 20, tasks: 280, completed: 250 },
      ];

      setReportData({
        projectHealth: projectHealthData,
        taskDistribution,
        userProductivity: userProductivity.slice(0, 10), // Top 10 users
        organizationMetrics,
        timelineData,
      });

    } catch (error) {
      console.error('Failed to load report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    const csvContent = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Organization Reports</h1>
        <p className="text-gray-600">Comprehensive analytics and insights across all projects</p>
      </div>

      {/* Report Navigation */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'projects', label: 'Project Health', icon: '📁' },
            { id: 'tasks', label: 'Task Analytics', icon: '🎯' },
            { id: 'team', label: 'Team Performance', icon: '👥' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveReport(tab.id)}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                activeReport === tab.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeReport === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-blue-600 text-2xl">📁</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Projects</p>
                  <p className="text-2xl font-semibold text-gray-900">{reportData.organizationMetrics.totalProjects}</p>
                  <p className="text-xs text-green-600">{reportData.organizationMetrics.activeProjects} active</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-green-600 text-2xl">👥</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Team Members</p>
                  <p className="text-2xl font-semibold text-gray-900">{reportData.organizationMetrics.totalUsers}</p>
                  <p className="text-xs text-blue-600">Across all projects</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-purple-600 text-2xl">🎯</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Tasks</p>
                  <p className="text-2xl font-semibold text-gray-900">{reportData.organizationMetrics.totalTasks}</p>
                  <p className="text-xs text-green-600">{reportData.organizationMetrics.completedTasks} completed</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-yellow-600 text-2xl">📈</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Completion Rate</p>
                  <p className="text-2xl font-semibold text-gray-900">{reportData.organizationMetrics.overallCompletion}%</p>
                  <p className="text-xs text-gray-600">Organization average</p>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Organization Growth</h3>
              <button
                onClick={() => exportToCSV(reportData.timelineData, 'organization-timeline')}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Export CSV
              </button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reportData.timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="projects" stroke="#8884d8" name="Projects" />
                <Line type="monotone" dataKey="tasks" stroke="#82ca9d" name="Tasks" />
                <Line type="monotone" dataKey="completed" stroke="#ffc658" name="Completed" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Project Health Tab */}
      {activeReport === 'projects' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Project Health Overview</h3>
            <button
              onClick={() => exportToCSV(reportData.projectHealth, 'project-health')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Export CSV
            </button>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={reportData.projectHealth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalTasks" fill="#8884d8" name="Total Tasks" />
              <Bar dataKey="completedTasks" fill="#82ca9d" name="Completed Tasks" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Task Analytics Tab */}
      {activeReport === 'tasks' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Task Distribution by Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reportData.taskDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {reportData.taskDistribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Task Status Summary</h3>
            <div className="space-y-4">
              {reportData.taskDistribution.map((item: any, index: number) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded-full mr-3"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span className="text-sm font-medium text-gray-900">{item.name}</span>
                  </div>
                  <span className="text-sm text-gray-600">{item.value} tasks</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Team Performance Tab */}
      {activeReport === 'team' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Team Performance</h3>
            <button
              onClick={() => exportToCSV(reportData.userProductivity, 'team-performance')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Export CSV
            </button>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={reportData.userProductivity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="tasksCompleted" fill="#8884d8" name="Tasks Completed" />
              <Bar dataKey="projectsActive" fill="#82ca9d" name="Active Projects" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
