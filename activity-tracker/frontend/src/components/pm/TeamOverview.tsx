'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { projectsAPI, tasksAPI } from '@/lib/api';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  status: 'active' | 'away' | 'busy';
  activeActivities: number;
  completedActivities: number;
  averageCompletionTime: number;
  workload: number; // percentage
  lastActivity: string;
  skills: string[];
}

interface TeamStats {
  totalMembers: number;
  activeMembers: number;
  totalActivities: number;
  completedThisWeek: number;
  averageProductivity: number;
  overdueActivities: number;
}

interface TeamOverviewProps {
  selectedProject?: any;
}

export function TeamOverview({ selectedProject }: TeamOverviewProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  useEffect(() => {
    if (selectedProject) {
      fetchTeamData();
    }
  }, [selectedProject]);

  const fetchTeamData = async () => {
    if (!selectedProject) {
      setLoading(false);
      return;
    }

    try {
      // Fetch project members and their activities/tasks
      const [members, activities, tasks] = await Promise.all([
        projectsAPI.getMembers(selectedProject.id),
        activitiesAPI.getAll({ projectId: selectedProject.id }),
        tasksAPI.getAll({ projectId: selectedProject.id }),
      ]);

      // Transform members data to include activity stats
      const teamMembersData: TeamMember[] = members.map((member: any) => {
        // Get activities assigned to this member
        const memberActivities = activities.filter((activity: any) =>
          activity.assignees && activity.assignees.some((assignee: any) => assignee.id === member.id)
        );

        // Get tasks assigned to this member
        const memberTasks = tasks.filter((task: any) => task.assigneeId === member.id);

        const activeActivities = memberActivities.filter((a: any) =>
          a.status === 'in_progress' || a.approvalState === 'submitted'
        ).length;

        const completedActivities = memberActivities.filter((a: any) =>
          a.status === 'completed' && a.approvalState === 'approved'
        ).length;

        const activeTasks = memberTasks.filter((t: any) =>
          t.status === 'assigned' || t.status === 'in_progress'
        ).length;

        // Calculate workload based on active activities and tasks
        const totalActive = activeActivities + activeTasks;
        const workload = Math.min(totalActive * 25, 100); // Rough calculation

        return {
          id: member.id,
          name: member.name,
          email: member.email,
          role: member.role || 'Team Member',
          status: totalActive > 3 ? 'busy' : totalActive > 0 ? 'active' : 'away',
          activeActivities: totalActive,
          completedActivities,
          averageCompletionTime: 2.5, // Mock for now
          workload,
          lastActivity: new Date().toISOString(), // Mock for now
          skills: [], // Mock for now
        };
      });

      const projectStats: TeamStats = {
        totalMembers: teamMembersData.length,
        activeMembers: teamMembersData.filter(m => m.status === 'active' || m.status === 'busy').length,
        totalActivities: activities.length,
        completedThisWeek: activities.filter((a: any) => {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return a.status === 'completed' && new Date(a.updatedAt) > weekAgo;
        }).length,
        averageProductivity: teamMembersData.length > 0
          ? Math.round(teamMembersData.reduce((sum, m) => sum + m.workload, 0) / teamMembersData.length)
          : 0,
        overdueActivities: activities.filter((a: any) => {
          if (!a.endDate) return false;
          return new Date(a.endDate) < new Date() && a.status !== 'completed';
        }).length,
      };

      setTeamMembers(teamMembersData);
      setTeamStats(projectStats);
    } catch (error) {
      console.error('Failed to fetch team data:', error);
      toast.error('Failed to fetch team data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'busy': return 'bg-yellow-100 text-yellow-800';
      case 'away': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getWorkloadColor = (workload: number) => {
    if (workload >= 90) return 'bg-red-500';
    if (workload >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatLastActivity = (dateString: string) => {
    const now = new Date();
    const lastActivity = new Date(dateString);
    const diffHours = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
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
          <div className="text-4xl mb-2">👥</div>
          <p>Please select a project to view team members</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Team Statistics */}
      {teamStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{teamStats.totalMembers}</div>
            <div className="text-sm text-blue-700">Total Members</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{teamStats.activeMembers}</div>
            <div className="text-sm text-green-700">Active Now</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{teamStats.totalActivities}</div>
            <div className="text-sm text-purple-700">Total Activities</div>
          </div>
          <div className="bg-indigo-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-indigo-600">{teamStats.completedThisWeek}</div>
            <div className="text-sm text-indigo-700">Completed This Week</div>
          </div>
          <div className="bg-teal-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-teal-600">{teamStats.averageProductivity}%</div>
            <div className="text-sm text-teal-700">Avg Productivity</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{teamStats.overdueActivities}</div>
            <div className="text-sm text-red-700">Overdue Tasks</div>
          </div>
        </div>
      )}

      {/* Team Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teamMembers.map((member) => (
          <div
            key={member.id}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedMember(selectedMember === member.id ? null : member.id)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-medium text-lg">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{member.name}</h3>
                  <p className="text-sm text-gray-500">{member.role}</p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(member.status)}`}>
                {member.status}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Tasks</span>
                <span className="font-medium">{member.activeActivities}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Completed</span>
                <span className="font-medium">{member.completedActivities}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg Completion</span>
                <span className="font-medium">{member.averageCompletionTime}d</span>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Workload</span>
                  <span className="text-sm font-medium">{member.workload}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getWorkloadColor(member.workload)}`}
                    style={{ width: `${member.workload}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Last Activity</span>
                <span className="text-sm font-medium">{formatLastActivity(member.lastActivity)}</span>
              </div>
            </div>

            {/* Expanded Details */}
            {selectedMember === member.id && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {member.skills.map((skill, index) => (
                      <span key={index} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button className="flex-1 px-3 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">
                    Assign Task
                  </button>
                  <button className="flex-1 px-3 py-2 text-xs bg-gray-600 text-white rounded hover:bg-gray-700">
                    View Details
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Team Performance Chart Placeholder */}
      <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Team Performance Trends</h3>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-2">📈</div>
            <p>Performance charts coming soon...</p>
            <p className="text-sm">Track productivity, completion rates, and workload distribution</p>
          </div>
        </div>
      </div>

      {/* Workload Distribution */}
      <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Workload Distribution</h3>
        <div className="space-y-4">
          {teamMembers.map((member) => (
            <div key={member.id} className="flex items-center space-x-4">
              <div className="w-24 text-sm text-gray-600 truncate">{member.name}</div>
              <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                <div
                  className={`h-4 rounded-full ${getWorkloadColor(member.workload)}`}
                  style={{ width: `${member.workload}%` }}
                ></div>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                  {member.workload}%
                </span>
              </div>
              <div className="w-20 text-sm text-gray-600">
                {member.activeActivities} active
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
