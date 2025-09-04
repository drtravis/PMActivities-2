import React, { useState, useEffect } from 'react';
import { tasksAPI, usersAPI, projectsAPI, boardsAPI } from '../../lib/api';
import { MondayLayout } from '../layout/MondayLayout';
import { MondayToolbar } from '../layout/MondayToolbar';
import { MondayHeaderActions } from '../ui/MondayHeaderActions';
import MyActivitiesRefactored from '../member/MyActivitiesRefactored';

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
  status: 'Not Started' | 'Working on it' | 'Stuck' | 'Done' | 'Blocked' | 'Canceled'; // Unified status system
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



const PMActivitiesRefactored: React.FC = () => {
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [memberActivities, setMemberActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'board'>('board');
  const [groupBy, setGroupBy] = useState<'status' | 'priority'>('status');
  const [isListView, setIsListView] = useState(false);

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

        // Transform tasks to activity format - direct unified status mapping
        const statusMap: Record<string, Activity['status']> = {
          'Not Started': 'Not Started',
          'Working on it': 'Working on it',
          'Stuck': 'Stuck',
          'Blocked': 'Blocked',
          'Done': 'Done',
          'Canceled': 'Canceled',
        };

        const priorityMap: Record<string, Activity['priority']> = {
          Low: 'low',
          Medium: 'medium',
          High: 'high',
          Urgent: 'high',
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
  // Edit/save/status handlers (mirror member)
  const handleStatusChange = async (activityId: string, newStatus: Activity['status']) => {
    const prev = memberActivities;
    setMemberActivities(prevList => prevList.map(a => a.id === activityId ? { ...a, status: newStatus } : a));

    const activity = prev.find(a => a.id === activityId);
    const taskId = activity?.taskId;
    if (!taskId) return;

    // Direct status update - no mapping needed since both use unified status system
    try {
      await tasksAPI.updateStatus(taskId, newStatus);
    } catch (e) {
      setMemberActivities(prev);
    }
  };

  const handleSaveTask = async (taskId: string, updates: any) => {
    // Map priority to backend enum values
    const priorityMap: Record<string, string> = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };
    const payload = { ...updates, priority: updates.priority ? priorityMap[updates.priority] || 'Medium' : undefined };
    await boardsAPI.updateTask(taskId, payload);
  };

      }
    };

  // Sync selected member's preferences to PM view
  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        if (!selectedMember) return;
        const prefs = await usersAPI.getPreferences(selectedMember.id);
        if (prefs?.memberView?.isListView !== undefined) setIsListView(!!prefs.memberView.isListView);
        if (prefs?.memberView?.groupBy) setGroupBy(prefs.memberView.groupBy);
      } catch {}
    };
    fetchPrefs();
  }, [selectedMember]);

    loadMemberActivities();
  }, [selectedMember]);

  // Helper functions
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

  // Member tabs component
  const memberTabs = (
    <div className="flex items-center space-x-1 border-b border-gray-200">
      {members.map((member) => (
        <button
          key={member.id}
          onClick={() => setSelectedMember(member)}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors duration-150 ${
            selectedMember?.id === member.id
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          {member.name}
        </button>
      ))}
    </div>
  );

  if (loading && !selectedMember) {
    return (
      <MondayLayout title="Team Activities" subtitle="Loading...">
        <div className="p-8 text-center text-gray-500">Loading projects and members...</div>
      </MondayLayout>
    );
  }

  return (
    <MondayLayout title="Team Activities" subtitle={selectedMember ? `${selectedMember.name}'s Activities` : 'Select a member'}>
      {/* Member Tabs */}
      {memberTabs}

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded p-2 mt-4">
          {error}
        </div>
      )}

      {selectedMember && (
        <div className="mt-4">
          <MyActivitiesRefactored
            viewerMode="pm"
            assigneeId={selectedMember.id}
            titleOverride={`${selectedMember.name}'s Activities`}
          />
        </div>
      )}
    </MondayLayout>
  );
};

export default PMActivitiesRefactored;
