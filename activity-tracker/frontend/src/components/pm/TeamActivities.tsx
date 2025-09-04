'use client';

import { useState, useEffect } from 'react';
import { activitiesAPI, boardsAPI, tasksAPI, projectsAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import TaskToActivityModal from '../member/TaskToActivityModal';
import { usePersistentState } from '@/hooks/usePersistentState';

import { MondayTable, MondayTableRow, MondayTableCell } from '../ui/MondayTable';
import { StatusPill } from '../ui/StatusPill';
import { PriorityBadge } from '../ui/PriorityBadge';
import { UserAvatar } from '../ui/UserAvatar';
import MyActivitiesRefactored from '../member/MyActivitiesRefactored';
import { ActivityStatus } from '@/constants/status';

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

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface TeamActivitiesProps {
  selectedProject?: any;
}

const TeamActivities = ({ selectedProject }: TeamActivitiesProps) => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<string>('self');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [selectedTaskForConversion, setSelectedTaskForConversion] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Load team members when component mounts or project changes
  useEffect(() => {
    const loadTeamMembers = async () => {
      if (!selectedProject) return;
      
      try {
        const members = await projectsAPI.getMembers(selectedProject.id);
        setTeamMembers(members || []);
        
        // Set default tab to self if user is in the project, otherwise first member
        const userInProject = members?.find((m: TeamMember) => m.id === user?.id);
        if (userInProject) {
          setActiveTab('self');
        } else if (members && members.length > 0) {
          setActiveTab(members[0].id);
        }
      } catch (error) {
        console.error('Failed to load team members:', error);
        setTeamMembers([]);
      }
    };

    loadTeamMembers();
  }, [selectedProject, user]);

  // Load activities for the selected member
  useEffect(() => {
    const loadActivitiesForMember = async () => {
      if (!selectedProject || !activeTab) return;

      try {
        setLoading(true);
        setError(null);
        
        // Determine which user's tasks to load
        const targetUserId = activeTab === 'self' ? user?.id : activeTab;
        
        if (!targetUserId) return;

        // Get tasks for the specific user and project
        const userTasks = await tasksAPI.getAll({ 
          projectId: selectedProject.id,
          assigneeId: targetUserId 
        });
        
        // Transform tasks to activity format using unified status system
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

        const mapped: Activity[] = (userTasks || []).map((t: any) => ({
          id: t.id,
          title: t.title,
          description: t.description || '',
          status: t.status || 'Not Started', // Direct unified status
          priority: priorityMap[t.priority] || 'medium',
          category: t.board?.name || t.project?.name || 'Assigned Tasks',
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
          createdBy: t.assignee || t.createdBy || { name: 'Unassigned' },
          updatedBy: t.updatedBy || { name: 'System' },
          projectId: t.projectId,
          projectName: t.project?.name || selectedProject.name,
        }));

        setActivities(mapped);
      } catch (error) {
        console.error('Failed to load activities for member:', error);
        setError('Failed to load activities');
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    loadActivitiesForMember();
  }, [selectedProject, activeTab, user]);

  const handleRefresh = () => {
    // Trigger a reload of activities for the current member
    const loadActivitiesForMember = async () => {
      if (!selectedProject || !activeTab) return;

      try {
        setLoading(true);
        setError(null);
        
        const targetUserId = activeTab === 'self' ? user?.id : activeTab;
        if (!targetUserId) return;

        const userTasks = await tasksAPI.getAll({ 
          projectId: selectedProject.id,
          assigneeId: targetUserId 
        });
        
        // Same transformation logic using unified status system
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

        const mapped: Activity[] = (userTasks || []).map((t: any) => ({
          id: t.id,
          title: t.title,
          description: t.description || '',
          status: t.status || 'Not Started', // Direct unified status
          priority: priorityMap[t.priority] || 'medium',
          category: t.board?.name || t.project?.name || 'Assigned Tasks',
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
          createdBy: t.assignee || t.createdBy || { name: 'Unassigned' },
          updatedBy: t.updatedBy || { name: 'System' },
          projectId: t.projectId,
          projectName: t.project?.name || selectedProject.name,
        }));

        setActivities(mapped);
        
        // Show success toast
        setToast({ message: 'Activities refreshed successfully!', type: 'success' });
        setTimeout(() => setToast(null), 3000);
      } catch (error) {
        console.error('Failed to refresh activities:', error);
        setError('Failed to refresh activities');
        setToast({ message: 'Failed to refresh activities', type: 'error' });
        setTimeout(() => setToast(null), 3000);
      } finally {
        setLoading(false);
      }
    };

    loadActivitiesForMember();
  };

  const handleTaskToActivityConversion = (task: any) => {
    setSelectedTaskForConversion(task);
    setConvertModalOpen(true);
  };

  const handleConversionComplete = () => {
    setConvertModalOpen(false);
    setSelectedTaskForConversion(null);
    handleRefresh(); // Refresh the activities after conversion
  };

  if (!selectedProject) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Please select a project to view team activities.</p>
      </div>
    );
  }

  // Create tabs array with self + team members (exclude admin as they are super users)
  const tabs = [
    { id: 'self', label: 'My Activities', name: user?.name || 'Me' },
    ...teamMembers
      .filter(member => member.id !== user?.id && member.role !== 'admin') // Exclude self and admin users
      .map(member => ({
        id: member.id,
        label: member.name,
        name: member.name
      }))
  ];

  const getCurrentMemberName = () => {
    if (activeTab === 'self') return user?.name || 'Me';
    const member = teamMembers.find(m => m.id === activeTab);
    return member?.name || 'Unknown Member';
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-md text-white ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {toast.message}
        </div>
      )}

      <div className="w-full px-6 flex-1 flex flex-col">
        <div className="rounded-[26px] shadow-2xl overflow-hidden bg-white flex-1 flex flex-col w-full tab-content-container">
          {/* Custom Glossy Tabs Row */}
          <div className="px-5 pt-5 bg-white flex-shrink-0">
            <div className="flex items-end">
              {tabs.map((tab, index) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`tab-overlap tab-glossy relative px-6 py-3 min-h-[44px] rounded-t-2xl border transition-all duration-200 flex items-center ${
                    activeTab === tab.id
                      ? 'border-gray-300 bg-white text-gray-900 shadow-[0_10px_18px_-10px_rgba(0,0,0,0.45)] -mb-px ring-1 ring-gray-200'
                      : 'border-gray-200 bg-gray-50 text-gray-700 shadow-md hover:shadow-lg hover:-translate-y-[1px]'
                  }`}
                  style={{
                    zIndex: activeTab === tab.id ? 10 : tabs.length - index,
                  }}
                >
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Panel */}
          <div className="border-t border-gray-300 rounded-b-[26px] bg-white flex-1 flex flex-col min-h-0 w-full">
            <div className="flex items-center justify-between p-8 pb-4 flex-shrink-0 w-full">
              <h2 className="text-lg font-medium text-gray-900">
                {getCurrentMemberName()}'s Activities
              </h2>

              {/* Small Refresh Icon */}
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-150 flex-shrink-0"
                title="Refresh"
              >
                {loading ? (
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
              </button>
            </div>

            {/* Content Area */}
            <div className="mx-8 mb-8 rounded-2xl border border-gray-200 bg-white shadow flex-1 flex flex-col min-h-0 w-auto tab-content-area">
              <div className="flex-1 flex flex-col min-h-0 relative">
                {/* Fixed height container to prevent jumping */}
                <div className="absolute inset-0 flex flex-col fixed-height-container">
                  {loading ? (
                    <div className="flex items-center justify-center flex-1">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : error ? (
                    <div className="flex items-center justify-center flex-1">
                      <div className="text-center">
                        <p className="text-red-500">{error}</p>
                        <button
                          onClick={handleRefresh}
                          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Try Again
                        </button>
                      </div>
                    </div>
                  ) : activities.length === 0 ? (
                    <div className="flex items-center justify-center flex-1">
                      <div className="text-center">
                        <span className="text-4xl mb-4 block">📝</span>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
                        <p className="text-gray-500">
                          {getCurrentMemberName()} has no assigned tasks yet
                        </p>
                      </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col min-h-0 p-6">
                      <div className="flex-1 overflow-auto">
                        {/* Replace table with exact member view replica */}
                        <MyActivitiesRefactored
                          viewerMode="pm"
                          assigneeId={activeTab === 'self' ? (user?.id || '') : String(activeTab)}
                          titleOverride={`${getCurrentMemberName()}'s Activities`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Task to Activity Conversion Modal */}
      {convertModalOpen && selectedTaskForConversion && (
        <TaskToActivityModal
          task={selectedTaskForConversion}
          isOpen={convertModalOpen}
          onClose={() => setConvertModalOpen(false)}
          onSuccess={handleConversionComplete}
        />
      )}
    </div>
  );
};

export default TeamActivities;
