import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, CheckCircle, AlertCircle, Eye, Edit, Trash2, Plus, Filter, Search } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { activitiesAPI } from '@/lib/api';

interface Activity {
  id: string;
  title: string;
  description?: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'completed';
  approvalState?: 'pending' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  startDate?: string;
  endDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
  project?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ActivityListProps {
  projectId?: string;
  onActivitySelect?: (activity: Activity) => void;
  onActivityCreate?: () => void;
  onActivityEdit?: (activity: Activity) => void;
  onActivityDelete?: (activityId: string) => void;
}

export const ActivityList: React.FC<ActivityListProps> = ({
  projectId,
  onActivitySelect,
  onActivityCreate,
  onActivityEdit,
  onActivityDelete,
}) => {
  const { user } = useAuthStore();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'timeline'>('list');

  useEffect(() => {
    loadActivities();
  }, [projectId]);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const params = projectId ? { projectId } : {};
      const activityData = await activitiesAPI.getAll(params);
      
      // Transform activity data
      const transformedActivities: Activity[] = activityData.map((activity: any) => ({
        id: activity.id,
        title: activity.title,
        description: activity.description,
        status: activity.status,
        approvalState: activity.approvalState,
        priority: activity.priority || 'medium',
        startDate: activity.startDate,
        endDate: activity.endDate,
        actualStartDate: activity.actualStartDate,
        actualEndDate: activity.actualEndDate,
        estimatedHours: activity.estimatedHours,
        actualHours: activity.actualHours,
        createdBy: activity.createdBy || { id: user?.id || '', name: user?.name || '', email: user?.email || '' },
        assignedTo: activity.assignedTo,
        project: activity.project,
        createdAt: activity.createdAt,
        updatedAt: activity.updatedAt,
      }));

      setActivities(transformedActivities);
    } catch (error) {
      console.error('Error loading activities:', error);
      // Mock data for development
      setActivities(generateMockActivities());
    } finally {
      setLoading(false);
    }
  };

  const generateMockActivities = (): Activity[] => {
    return [
      {
        id: '1',
        title: 'Requirements Analysis',
        description: 'Analyze and document system requirements for the new feature',
        status: 'completed',
        approvalState: 'approved',
        priority: 'high',
        startDate: '2024-01-01',
        endDate: '2024-01-05',
        actualStartDate: '2024-01-01',
        actualEndDate: '2024-01-04',
        estimatedHours: 40,
        actualHours: 35,
        createdBy: { id: '1', name: 'John Doe', email: 'john@example.com' },
        assignedTo: { id: '1', name: 'John Doe', email: 'john@example.com' },
        project: { id: '1', name: 'Website Redesign' },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-04T00:00:00Z',
      },
      {
        id: '2',
        title: 'UI/UX Design',
        description: 'Create wireframes and mockups for the user interface',
        status: 'submitted',
        approvalState: 'pending',
        priority: 'high',
        startDate: '2024-01-06',
        endDate: '2024-01-15',
        estimatedHours: 60,
        createdBy: { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
        assignedTo: { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
        project: { id: '1', name: 'Website Redesign' },
        createdAt: '2024-01-06T00:00:00Z',
        updatedAt: '2024-01-10T00:00:00Z',
      },
      {
        id: '3',
        title: 'Database Schema Design',
        description: 'Design and implement the database schema for the new system',
        status: 'draft',
        priority: 'medium',
        startDate: '2024-01-10',
        endDate: '2024-01-20',
        estimatedHours: 30,
        createdBy: { id: '3', name: 'Mike Johnson', email: 'mike@example.com' },
        assignedTo: { id: '3', name: 'Mike Johnson', email: 'mike@example.com' },
        project: { id: '2', name: 'Mobile App Development' },
        createdAt: '2024-01-10T00:00:00Z',
        updatedAt: '2024-01-10T00:00:00Z',
      },
    ];
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || activity.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || activity.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: string, approvalState?: string) => {
    if (status === 'submitted' && approvalState === 'pending') {
      return 'bg-yellow-100 text-yellow-800';
    }
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateProgress = (activity: Activity) => {
    if (activity.status === 'completed') return 100;
    if (activity.status === 'draft') return 0;
    
    if (activity.startDate && activity.endDate) {
      const start = new Date(activity.startDate).getTime();
      const end = new Date(activity.endDate).getTime();
      const now = new Date().getTime();
      
      if (now < start) return 0;
      if (now > end) return 100;
      
      const progress = ((now - start) / (end - start)) * 100;
      return Math.min(Math.max(progress, 0), 100);
    }
    
    return 25; // Default progress for submitted activities
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {projectId ? 'Project Activities' : 'Activities'}
          </h1>
          <p className="text-gray-600">Track and manage your work activities</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="list">List View</option>
            <option value="grid">Grid View</option>
            <option value="timeline">Timeline View</option>
          </select>
          {onActivityCreate && (
            <button
              onClick={onActivityCreate}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span>New Activity</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search activities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="completed">Completed</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Priority</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Activities List */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredActivities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{activity.title}</div>
                        {activity.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">{activity.description}</div>
                        )}
                        {activity.project && (
                          <div className="text-xs text-blue-600 mt-1">{activity.project.name}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(activity.status, activity.approvalState)}`}>
                        {activity.status === 'submitted' && activity.approvalState === 'pending' ? 'Pending Approval' : activity.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-medium ${getPriorityColor(activity.priority)}`}>
                        {activity.priority.charAt(0).toUpperCase() + activity.priority.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {activity.assignedTo ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-xs text-white font-medium">
                              {activity.assignedTo.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm text-gray-900">{activity.assignedTo.name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{formatDate(activity.endDate)}</div>
                      {activity.endDate && (
                        <div className="text-xs text-gray-500">
                          {new Date(activity.endDate) < new Date() ? 'Overdue' : 'Upcoming'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 bg-blue-600 rounded-full"
                            style={{ width: `${calculateProgress(activity)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">{Math.round(calculateProgress(activity))}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {onActivitySelect && (
                          <button
                            onClick={() => onActivitySelect(activity)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        {onActivityEdit && (
                          <button
                            onClick={() => onActivityEdit(activity)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Edit activity"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {onActivityDelete && (
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this activity?')) {
                                onActivityDelete(activity.id);
                              }
                            }}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Delete activity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredActivities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onSelect={() => onActivitySelect?.(activity)}
              onEdit={() => onActivityEdit?.(activity)}
              onDelete={() => {
                if (confirm('Are you sure you want to delete this activity?')) {
                  onActivityDelete?.(activity.id);
                }
              }}
              getStatusColor={getStatusColor}
              getPriorityColor={getPriorityColor}
              formatDate={formatDate}
              calculateProgress={calculateProgress}
            />
          ))}
        </div>
      )}

      {/* Timeline View */}
      {viewMode === 'timeline' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-center text-gray-500 py-12">
            <Calendar className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Timeline View</h3>
            <p>Timeline view is coming soon. Use List or Grid view for now.</p>
          </div>
        </div>
      )}

      {filteredActivities.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <CheckCircle className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Get started by creating your first activity'
            }
          </p>
          {onActivityCreate && !searchTerm && statusFilter === 'all' && priorityFilter === 'all' && (
            <button
              onClick={onActivityCreate}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span>Create Activity</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Activity Card Component for Grid View
const ActivityCard: React.FC<{
  activity: Activity;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  getStatusColor: (status: string, approvalState?: string) => string;
  getPriorityColor: (priority: string) => string;
  formatDate: (date?: string) => string;
  calculateProgress: (activity: Activity) => number;
}> = ({ activity, onSelect, onEdit, onDelete, getStatusColor, getPriorityColor, formatDate, calculateProgress }) => {
  const progress = calculateProgress(activity);

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{activity.title}</h3>
            {activity.description && (
              <p className="text-sm text-gray-600 line-clamp-2">{activity.description}</p>
            )}
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(activity.status, activity.approvalState)}`}>
              {activity.status === 'submitted' && activity.approvalState === 'pending' ? 'Pending' : activity.status}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {/* Progress */}
          <div>
            <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Priority:</span>
              <span className={`ml-1 font-medium ${getPriorityColor(activity.priority)}`}>
                {activity.priority.charAt(0).toUpperCase() + activity.priority.slice(1)}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Due:</span>
              <span className="ml-1 font-medium">{formatDate(activity.endDate)}</span>
            </div>
          </div>

          {/* Assignee */}
          {activity.assignedTo && (
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">{activity.assignedTo.name}</span>
            </div>
          )}

          {/* Project */}
          {activity.project && (
            <div className="text-sm">
              <span className="text-gray-500">Project:</span>
              <span className="ml-1 text-blue-600 font-medium">{activity.project.name}</span>
            </div>
          )}

          {/* Hours */}
          {(activity.estimatedHours || activity.actualHours) && (
            <div className="text-sm">
              <span className="text-gray-500">Hours:</span>
              <span className="ml-1 font-medium">
                {activity.actualHours || 0} / {activity.estimatedHours || 0}
              </span>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Updated {new Date(activity.updatedAt).toLocaleDateString()}
          </span>
          <div className="flex items-center space-x-2">
            {onSelect && (
              <button
                onClick={onSelect}
                className="p-1 text-gray-400 hover:text-gray-600"
                title="View details"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-1 text-gray-400 hover:text-gray-600"
                title="Edit activity"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="p-1 text-gray-400 hover:text-red-600"
                title="Delete activity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
