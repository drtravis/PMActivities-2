'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { activitiesAPI, tasksAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';
import KPIStepper from '@/components/ui/KPIStepper';

interface Activity {
  id: string;
  title: string;
  status: 'draft' | 'submitted' | 'in_progress' | 'completed' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  progress: number;
  assignee: string;
  project: string;
  updatedAt: string;
}



interface PersonalDashboardProps {
  selectedProject?: any;
}

export function PersonalDashboard({ selectedProject }: PersonalDashboardProps) {
  const { user } = useAuthStore();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && selectedProject) {
      fetchActivities();
    }
  }, [user, selectedProject]);



  const fetchActivities = async () => {
    if (!user || !selectedProject) return;

    try {
      setLoading(true);
      // Get activities for the current user in the selected project
      const userActivities = await activitiesAPI.getAll({ projectId: selectedProject.id });

      // Transform activities to match our interface
      const transformedActivities: Activity[] = userActivities.map((activity: any) => ({
        id: activity.id,
        title: activity.title,
        status: activity.status,
        priority: activity.priority,
        dueDate: activity.endDate || '',
        progress: activity.status === 'completed' ? 100 :
                 activity.status === 'in_progress' ? 50 :
                 activity.status === 'submitted' ? 75 : 0,
        assignee: user.name,
        project: selectedProject.name,
        updatedAt: activity.updatedAt
      }));

      // Sort by most recently updated
      transformedActivities.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

      setActivities(transformedActivities);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
      toast.error('Failed to fetch activities');
    } finally {
      setLoading(false);
    }
  };



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'submitted': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };



  const updateActivityProgress = async (activityId: string, newProgress: number) => {
    try {
      // Update progress locally first for immediate feedback
      setActivities(prev =>
        prev.map(activity =>
          activity.id === activityId ? { ...activity, progress: newProgress } : activity
        )
      );

      // Here you could add an API call to update the activity progress
      // await activitiesAPI.update(activityId, { progress: newProgress });
      toast.success('Progress updated');
    } catch (error) {
      console.error('Failed to update progress:', error);
      toast.error('Failed to update progress');
      // Revert the local change on error
      fetchActivities();
    }
  };



  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* KPI Statistics */}
        <KPIStepper
          active={activities.filter(activity => activity.status === 'in_progress').length}
          assigned={activities.filter(activity => activity.status === 'submitted').length}
          completed={activities.filter(activity => activity.status === 'completed').length}
          allActivities={activities.length}
        />

        {/* Today's Focus */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">🎯</span>
              Today's Focus
            </h3>
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                </div>
              ) : activities.filter(activity => activity.status === 'in_progress').length > 0 ? (
                activities.filter(activity => activity.status === 'in_progress').map(activity => (
                  <div key={activity.id} className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{activity.title}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(activity.priority)}`}>
                        {activity.priority}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 mr-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${activity.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500 mt-1">{activity.progress}% complete</span>
                      </div>
                      <button
                        onClick={() => updateActivityProgress(activity.id, Math.min(activity.progress + 10, 100))}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                      >
                        Update Progress
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p>No activities in progress</p>
                  <p className="text-sm">Start working on an assigned task or create a new activity</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activities */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">📈</span>
              Recent Activities
            </h3>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="divide-y divide-gray-200">
                {loading ? (
                  <div className="p-4 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                  </div>
                ) : activities.length > 0 ? (
                  activities.slice(0, 5).map(activity => (
                    <div key={activity.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{activity.title}</h4>
                          <p className="text-sm text-gray-500">{activity.project}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(activity.status)}`}>
                            {activity.status.replace('_', ' ')}
                          </span>
                          {activity.dueDate && (
                            <span className="text-sm text-gray-500">
                              Due: {new Date(activity.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    <p>No recent activities</p>
                    <p className="text-sm">Create your first activity to get started</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}
