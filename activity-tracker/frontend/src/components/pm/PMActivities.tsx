import React, { useState, useEffect } from 'react';
import { tasksAPI, usersAPI, projectsAPI } from '../../lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Project {
  id: string;
  name: string;
  members: User[];
}

interface Activity {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'in_review' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  category: string;
  startDate: string;
  endDate: string;
  progress: number;
  estimatedHours: number;
  actualHours: number;
  tags: string[];
  comments: number;
  attachments: number;
  lastUpdated: string;
  taskId?: string;
  createdBy?: { name: string };
  updatedBy?: { name: string };
  projectId?: string;
  projectName?: string;
}

const PMActivities: React.FC = () => {
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [memberActivities, setMemberActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load PM's projects and members
  useEffect(() => {
    const loadProjectsAndMembers = async () => {
      try {
        setLoading(true);
        
        // Get PM's projects
        const pmProjects = await projectsAPI.getAll();
        setProjects(pmProjects);

        // Get all members from PM's projects
        const allMembers: User[] = [];
        const memberIds = new Set<string>();

        for (const project of pmProjects) {
          for (const member of project.members || []) {
            if (!memberIds.has(member.id) && member.role === 'MEMBER') {
              memberIds.add(member.id);
              allMembers.push(member);
            }
          }
        }

        setMembers(allMembers);
        
        // Auto-select first member if available
        if (allMembers.length > 0) {
          setSelectedMember(allMembers[0]);
        }

      } catch (err: any) {
        console.error('Error loading projects and members:', err);
        setError(err.message || 'Failed to load projects and members');
      } finally {
        setLoading(false);
      }
    };

    loadProjectsAndMembers();
  }, []);

  // Load selected member's activities
  useEffect(() => {
    if (!selectedMember) return;

    const loadMemberActivities = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get tasks assigned to the selected member
        const memberTasks = await tasksAPI.getByAssignee(selectedMember.id);
        
        // Transform tasks to activity format with proper status mapping
        const statusMap: Record<string, Activity['status']> = {
          // Database task statuses to activity status values
          'assigned': 'draft',
          'in_progress': 'draft',
          'working_on_it': 'draft',
          'stuck': 'in_review',
          'blocked': 'in_review',
          'completed': 'approved',
          'done': 'approved',
          'cancelled': 'rejected',
          'canceled': 'rejected',
          // Fallback mappings
          'Not Started': 'draft',
          'Working on it': 'draft',
          'Stuck': 'in_review',
          'Blocked': 'in_review',
          'Done': 'approved',
          'Canceled': 'rejected',
        };

        const priorityMap: Record<string, Activity['priority']> = {
          Low: 'low',
          Medium: 'medium',
          High: 'high',
          Urgent: 'urgent',
        };

        const getProgressFromTaskStatus = (status: string): number => {
          const progressMap: Record<string, number> = {
            'Not Started': 0,
            'Working on it': 50,
            'Stuck': 25,
            'Blocked': 25,
            'Done': 100,
            'Canceled': 0,
          };
          return progressMap[status] || 0;
        };

        const activities: Activity[] = (memberTasks || []).map((t: any) => ({
          id: t.id,
          title: t.title,
          description: t.description || '',
          status: statusMap[t.status] || 'draft',
          priority: priorityMap[t.priority] || 'medium',
          category: t.board?.name || t.project?.name || 'Task',
          startDate: t.createdAt || new Date().toISOString(),
          endDate: t.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          progress: getProgressFromTaskStatus(t.status),
          estimatedHours: 8,
          actualHours: Math.floor(Math.random() * 8),
          tags: t.tags || [],
          comments: 0,
          attachments: 0,
          lastUpdated: t.updatedAt || new Date().toISOString(),
          taskId: t.id,
          createdBy: t.createdBy || { name: 'Unknown' },
          updatedBy: t.assignee || { name: selectedMember.name },
          projectId: t.projectId,
          projectName: t.project?.name || 'Unknown Project'
        }));

        setMemberActivities(activities);

      } catch (err: any) {
        console.error('Error loading member activities:', err);
        setError(err.message || 'Failed to load member activities');
      } finally {
        setLoading(false);
      }
    };

    loadMemberActivities();
  }, [selectedMember]);

  // Helper functions for display
  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      in_review: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || colors.draft;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'border-blue-300 text-blue-700',
      medium: 'border-purple-300 text-purple-700',
      high: 'border-red-300 text-red-700',
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatLastUpdated = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return formatDate(dateString);
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading && !selectedMember) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="p-8 text-center text-gray-500">Loading projects and members...</div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Modern Header */}
      <div className="bg-white border-b border-gray-200">
        {/* Top Header Bar */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Team Activities</h1>
              <div className="text-sm text-gray-500">
                {memberActivities.length} tasks/activities
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Action Buttons */}
              <button className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <span>Enhance</span>
              </button>

              <button className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Integrate</span>
              </button>

              <button className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Automate</span>
              </button>

              <div className="w-px h-6 bg-gray-300"></div>

              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-semibold">
                PM
              </div>

              <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                Invite / {members.length}
              </button>
            </div>
          </div>
        </div>

        {/* Member Tabs */}
        <div className="px-6">
          <div className="flex items-center space-x-1 border-b border-gray-200">
            {members.map((member) => (
              <button
                key={member.id}
                onClick={() => setSelectedMember(member)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 ${
                  selectedMember?.id === member.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {member.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-gray-50">
        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          {selectedMember && (
            <div className="mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {getUserInitials(selectedMember.name)}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {selectedMember.name}'s Activities
                  </h2>
                  <p className="text-sm text-gray-600">
                    {memberActivities.length} tasks/activities • Member Dashboard
                  </p>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading activities...</p>
              </div>
            </div>
          ) : memberActivities.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No activities found</h3>
              <p className="text-gray-600 max-w-sm mx-auto">
                {selectedMember ? `${selectedMember.name} has no assigned tasks yet. Tasks will appear here once assigned.` : 'Select a team member to view their activities and tasks.'}
              </p>
            </div>
          ) : (
            <>
              {/* Toolbar */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>New task</span>
                  </button>

                  <button className="flex items-center space-x-2 px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span>Search</span>
                  </button>

                  <button className="flex items-center space-x-2 px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Person</span>
                  </button>

                  <button className="flex items-center space-x-2 px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    <span>Filter</span>
                  </button>

                  <button className="flex items-center space-x-2 px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                    <span>Sort</span>
                  </button>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden">
                    <button className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                    </button>
                    <button className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </button>
                    <button className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border-l border-gray-300">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Modern Monday.com style board */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Enhanced Table Header */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <div className="grid grid-cols-12 gap-0 px-6 h-12 items-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                <div className="col-span-1 flex items-center justify-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                </div>
                <div className="col-span-3 px-3 flex items-center space-x-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Task</span>
                </div>
                <div className="col-span-2 px-3 flex items-center space-x-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Assigned To</span>
                </div>
                <div className="col-span-2 px-3 flex items-center space-x-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Status</span>
                </div>
                <div className="col-span-1 px-3 flex items-center space-x-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Due Date</span>
                </div>
                <div className="col-span-2 px-3 flex items-center space-x-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Priority</span>
                </div>
                <div className="col-span-1 px-3 flex items-center space-x-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Updated</span>
                </div>
              </div>
            </div>

            {/* Enhanced Activities */}
            <div className="divide-y divide-gray-100">
              {memberActivities.map((activity, index) => (
                <div
                  key={activity.id}
                  className={`grid grid-cols-12 gap-0 px-6 py-4 hover:bg-blue-50 transition-all duration-200 min-h-[60px] group ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  {/* Checkbox */}
                  <div className="col-span-1 flex items-center justify-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                  </div>

                  {/* Task Name */}
                  <div className="col-span-3 flex items-center px-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 truncate hover:text-blue-600 cursor-pointer transition-colors">
                        {activity.title}
                      </h4>
                      {activity.description && (
                        <p className="text-xs text-gray-500 truncate mt-1">
                          {activity.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Owner */}
                  <div className="col-span-2 flex items-center px-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm">
                        <span className="text-xs font-semibold text-white">
                          {getUserInitials(selectedMember?.name || 'U')}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {selectedMember?.name || 'Unassigned'}
                      </span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="col-span-2 flex items-center px-3">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${getStatusColor(activity.status)}`}>
                      <div className="w-2 h-2 rounded-full mr-2 bg-current opacity-75"></div>
                      {activity.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  {/* Due Date */}
                  <div className="col-span-1 flex items-center px-3">
                    <div className="text-xs">
                      <div className="font-medium text-gray-900">
                        {formatDate(activity.endDate)}
                      </div>
                      <div className="text-gray-500 mt-0.5">
                        {new Date(activity.endDate) < new Date() ? 'Overdue' : 'Due'}
                      </div>
                    </div>
                  </div>

                  {/* Priority */}
                  <div className="col-span-2 flex items-center px-3">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border-2 ${getPriorityColor(activity.priority)}`}>
                      <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                      </svg>
                      {activity.priority.toUpperCase()}
                    </span>
                  </div>

                  {/* Last Updated */}
                  <div className="col-span-1 flex items-center px-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-sm">
                        <span className="text-[10px] font-semibold text-white">
                          {getUserInitials(activity.updatedBy?.name || 'U')}
                        </span>
                      </div>
                      <div className="text-xs">
                        <div className="font-medium text-gray-900">
                          {formatLastUpdated(activity.lastUpdated)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
            </>
        )}
        </div>
      </div>
    </div>
  );
};

export default PMActivities;
