'use client';

import { useState, useEffect } from 'react';
import { projectsAPI, tasksAPI, activitiesAPI } from '@/lib/api';

interface PMOOverviewProps {
  projects: any[];
  users: any[];
  pms: any[];
  counts: {
    projects?: number;
    users?: number;
    pms?: number;
    members?: number;
    team?: number;
    approvals?: number;
    tasks?: number;
  };
}

export function PMOOverview({ projects, users, pms, counts }: PMOOverviewProps) {
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalUsers: 0,
    totalPMs: 0,
    totalMembers: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingApprovals: 0,
    organizationHealth: 85, // Mock health score
  });

  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [projectHealth, setProjectHealth] = useState<any[]>([]);

  useEffect(() => {
    loadOverviewData();
  }, [projects, users, pms]);

  const loadOverviewData = async () => {
    try {
      // Calculate basic stats
      const activeProjects = projects.filter(p => p.status === 'active' || !p.status).length;
      const totalMembers = users.filter(u => u.role === 'MEMBER' || u.role === 'member').length;

      // Load tasks across all projects
      let totalTasks = 0;
      let completedTasks = 0;
      const projectHealthData = [];

      for (const project of projects) {
        try {
          const tasks = await tasksAPI.getByProject(project.id);
          const projectTasks = tasks?.length || 0;
          const projectCompleted = tasks?.filter((t: any) => 
            t.status === 'Done' || t.status === 'Completed' || t.status === 'done'
          ).length || 0;

          totalTasks += projectTasks;
          completedTasks += projectCompleted;

          // Calculate project health
          const completionRate = projectTasks > 0 ? (projectCompleted / projectTasks) * 100 : 0;
          const health = completionRate > 80 ? 'excellent' : 
                       completionRate > 60 ? 'good' : 
                       completionRate > 40 ? 'fair' : 'poor';

          projectHealthData.push({
            id: project.id,
            name: project.name,
            totalTasks: projectTasks,
            completedTasks: projectCompleted,
            completionRate,
            health,
            members: project.members?.length || 0,
          });
        } catch (error) {
          console.error(`Failed to load tasks for project ${project.id}:`, error);
        }
      }

      setStats({
        totalProjects: projects.length,
        activeProjects,
        totalUsers: users.length,
        totalPMs: pms.length,
        totalMembers,
        totalTasks,
        completedTasks,
        pendingApprovals: 0, // Will be loaded separately
        organizationHealth: Math.round((completedTasks / Math.max(totalTasks, 1)) * 100),
      });

      setProjectHealth(projectHealthData);

      // Mock recent activity (in real app, this would come from audit logs)
      setRecentActivity([
        { id: 1, type: 'project_created', user: 'John Doe', project: 'New Website', time: '2 hours ago' },
        { id: 2, type: 'task_completed', user: 'Jane Smith', project: 'Mobile App', time: '4 hours ago' },
        { id: 3, type: 'user_invited', user: 'Admin', project: 'Team Expansion', time: '1 day ago' },
        { id: 4, type: 'approval_pending', user: 'Mike Johnson', project: 'Database Migration', time: '2 days ago' },
      ]);

    } catch (error) {
      console.error('Failed to load overview data:', error);
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'fair': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'project_created': return '📁';
      case 'task_completed': return '✅';
      case 'user_invited': return '👤';
      case 'approval_pending': return '⏳';
      default: return '📋';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">PMO Dashboard</h1>
        <p className="text-gray-600">Organization-wide overview and insights</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-sm">📁</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Projects</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalProjects}</p>
              <p className="text-xs text-green-600">{stats.activeProjects} active</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-semibold text-sm">👥</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Team Members</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
              <p className="text-xs text-blue-600">{stats.totalPMs} PMs, {stats.totalMembers} Members</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-semibold text-sm">🎯</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Tasks</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalTasks}</p>
              <p className="text-xs text-green-600">{stats.completedTasks} completed</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600 font-semibold text-sm">📊</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Org Health</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.organizationHealth}%</p>
              <p className="text-xs text-gray-600">Overall completion rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Project Health and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Project Health */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Project Health</h3>
            <p className="text-sm text-gray-500">Overview of all project statuses</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {projectHealth.slice(0, 6).map((project) => (
                <div key={project.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium text-gray-900">{project.name}</h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getHealthColor(project.health)}`}>
                        {project.health}
                      </span>
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <span>{project.completedTasks}/{project.totalTasks} tasks</span>
                      <span className="mx-2">•</span>
                      <span>{project.members} members</span>
                      <span className="mx-2">•</span>
                      <span>{Math.round(project.completionRate)}% complete</span>
                    </div>
                    <div className="mt-2">
                      <div className="bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${project.completionRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
            <p className="text-sm text-gray-500">Latest organization updates</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <span className="text-lg">{getActivityIcon(activity.type)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{activity.user}</span>
                      {' '}
                      {activity.type === 'project_created' && 'created project'}
                      {activity.type === 'task_completed' && 'completed a task in'}
                      {activity.type === 'user_invited' && 'invited a new user to'}
                      {activity.type === 'approval_pending' && 'submitted for approval in'}
                      {' '}
                      <span className="font-medium">{activity.project}</span>
                    </p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
