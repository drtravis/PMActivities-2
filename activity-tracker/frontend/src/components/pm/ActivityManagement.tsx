'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { activitiesAPI, projectsAPI } from '@/lib/api';
import { MondayTable, MondayTableRow, MondayTableCell } from '@/components/ui/MondayTable';
import { StatusPill } from '@/components/ui/StatusPill';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Modal } from '@/components/ui/Modal';
import { useStatus } from '@/contexts/StatusContext';
import { useAuthStore } from '@/lib/store';

interface Activity {
  id: string;
  title: string;
  description: string;
  // Source of truth: backend Activity.status (unified with TaskStatus)
  status: 'Not Started' | 'Working on it' | 'Stuck' | 'Done' | 'Blocked' | 'Canceled';
  // Backend Activity.approvalState
  approvalState?: 'draft' | 'submitted' | 'approved' | 'reopened' | 'closed' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  assignedTo: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  dueDate: string;
  estimatedHours: number;
  actualHours?: number;
  category: string;
  tags: string[];
  progress: number;
  assignees?: any[];
}

interface ActivityManagementProps {
  selectedProject?: any;
}

export function ActivityManagement({ selectedProject }: ActivityManagementProps) {
  const { user } = useAuthStore();
  const { getActiveStatusOptions, getStatusDisplayName, loading: statusLoading } = useStatus();
  const isPM = user?.role === 'PROJECT_MANAGER';
  const isPMO = false; // PMO role not used in current system
  const isAdmin = user?.role === 'ADMIN';
  const canEditActivities = isAdmin || isPM; // PMO is read-only



  const [activities, setActivities] = useState<Activity[]>([]);
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'timeline'>('list');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editingOpen, setEditingOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  // Debug logging
  console.log('🔍 Modal States:', { detailsOpen, editingOpen, selectedActivity: selectedActivity?.id });
  console.log('🚨 COMPONENT LOADED AT:', new Date().toISOString());




  useEffect(() => {
    if (selectedProject) {
      fetchActivities();
      fetchProjectMembers();
    }
  }, [selectedProject]);

  const fetchActivities = async () => {
    if (!selectedProject) {
      setLoading(false);
      return;
    }

    try {
      // Fetch project-specific activities
      const projectActivities = await activitiesAPI.getAll({ projectId: selectedProject.id });

      // Transform activities to match our interface
      const transformedActivities: Activity[] = projectActivities.map((a: any) => ({
        id: a.id,
        title: a.title,
        description: a.description || '',
        status: a.status, // Not Started | Working on it | Stuck | Done | Blocked | Canceled
        approvalState: a.approvalState, // draft | submitted | approved | reopened | closed | rejected
        priority: a.priority,
        assignedTo: a.assignees && a.assignees.length > 0
          ? a.assignees.map((x: any) => x.name).join(', ')
          : 'Unassigned',
        createdBy: a.createdBy?.name || 'Unknown',
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
        dueDate: a.endDate || '',
        estimatedHours: 0,
        actualHours: 0,
        category: a.tags && a.tags.length > 0 ? a.tags[0] : 'General',
        tags: a.tags || [],
        progress: a.status === 'Done' ? 100 : a.status === 'Working on it' ? 50 : 0,
        assignees: a.assignees || []
      }));

      setActivities(transformedActivities);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
      toast.error('Failed to fetch activities');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectMembers = async () => {
    if (!selectedProject) return;

    try {
      const members = await projectsAPI.getMembers(selectedProject.id);
      setProjectMembers(members);
    } catch (error) {
      console.error('Failed to fetch project members:', error);
      toast.error('Failed to fetch project members');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString();
  };

  const isOverdue = (dueDate: string, status: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && status !== 'completed';
  };

  const filteredActivities = activities.filter((activity: any) => {
    const matchesSearch = activity.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (activity.createdBy?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || activity.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || activity.priority === priorityFilter;
    const matchesAssignee = assigneeFilter === 'all' || (activity.assignees || []).some((a: any) => a.id === assigneeFilter);

    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
  });

  // Use project members for assignee filter instead of just current activity assignees
  const uniqueAssignees = projectMembers.map(member => member.name);

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
          <div className="text-4xl mb-2">📋</div>
          <p>Please select a project to manage activities</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white">


      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Activity Management</h1>
            <p className="text-sm text-gray-600 mt-1">
              {selectedProject?.name} • {filteredActivities.length} activities
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Export
            </button>
            <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
              + New Activity
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-64 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>



          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="all">All Status</option>
            {getActiveStatusOptions('activity').map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="all">All Assignees</option>
            {uniqueAssignees.map(assignee => (
              <option key={assignee} value={assignee}>{assignee}</option>
            ))}
          </select>

          <div className="ml-auto flex items-center space-x-2">
            <div className="flex bg-white border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                📋 List
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-2 text-sm font-medium transition-colors border-l border-gray-300 ${
                  viewMode === 'kanban'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                📊 Kanban
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-2 text-sm font-medium transition-colors border-l border-gray-300 ${
                  viewMode === 'timeline'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                📅 Timeline
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Activities Display */}
      {viewMode === 'list' && (
        <div className="flex-1 overflow-hidden p-6">
          <MondayTable
            columns={[
              { key: 'activity', label: 'Activity', width: 'col-span-3', sortable: true },
              { key: 'assignedTo', label: 'Assigned To', width: 'col-span-2' },
              { key: 'status', label: 'Status', width: 'col-span-1' },
              { key: 'priority', label: 'Priority', width: 'col-span-1' },
              { key: 'dueDate', label: 'Due Date', width: 'col-span-2' },
              { key: 'progress', label: 'Progress', width: 'col-span-2' },
              { key: 'actions', label: 'Actions', width: 'col-span-1' }
            ]}
            showCheckboxes={false}
          >
            {filteredActivities.map((activity, index) => (
              <MondayTableRow key={activity.id} showCheckbox={false}>
                <MondayTableCell width="col-span-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-medium text-blue-600">📋</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 truncate">{activity.title}</div>
                      <div className="text-xs text-gray-500 mt-1 line-clamp-2">{activity.description}</div>
                      {activity.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {activity.tags.slice(0, 3).map((tag, tagIndex) => (
                            <span key={tagIndex} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                              {tag}
                            </span>
                          ))}
                          {activity.tags.length > 3 && (
                            <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                              +{activity.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </MondayTableCell>

                <MondayTableCell width="col-span-2">
                  <div className="flex items-center space-x-3">
                    <UserAvatar
                      name={activity.assignedTo}
                      size="sm"
                      showTooltip={true}
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{activity.assignedTo}</div>
                      <div className="text-xs text-gray-500">{activity.category}</div>
                    </div>
                  </div>
                </MondayTableCell>

                <MondayTableCell width="col-span-1">
                  <StatusPill status={activity.status} type="activity" />
                </MondayTableCell>

                <MondayTableCell width="col-span-1">
                  <PriorityBadge priority={activity.priority} />
                </MondayTableCell>

                <MondayTableCell width="col-span-2">
                  <div className={`text-sm ${isOverdue(activity.dueDate, activity.status) ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                    {formatDate(activity.dueDate)}
                    {isOverdue(activity.dueDate, activity.status) && (
                      <span className="ml-1">⚠️</span>
                    )}
                  </div>
                </MondayTableCell>

                <MondayTableCell width="col-span-2">
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-20">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${activity.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700 min-w-10">{activity.progress}%</span>
                  </div>
                </MondayTableCell>

                <MondayTableCell width="col-span-1">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedActivity(activity);
                        setDetailsOpen(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors cursor-pointer"
                      style={{ pointerEvents: 'auto' }}
                    >
                      View
                    </button>
                    {canEditActivities && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedActivity(activity);
                          setEditingOpen(true);
                        }}
                        className="text-green-600 hover:text-green-800 text-sm font-medium transition-colors cursor-pointer"
                        style={{ pointerEvents: 'auto' }}
                      >
                        Edit
                      </button>
                    )}
                    {activity.approvalState === 'submitted' && (
                      <button
                        type="button"
                        className="text-purple-600 hover:text-purple-800 text-sm font-medium transition-colors cursor-pointer"
                      >
                        Review
                      </button>
                    )}
                  </div>
                </MondayTableCell>
              </MondayTableRow>
            ))}
          </MondayTable>
        </div>
      )}

      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {['draft', 'submitted', 'reopened', 'approved', 'closed', 'rejected'].map(state => (
            <div key={state} className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-4 capitalize">
                {state.replace('_', ' ')} ({filteredActivities.filter((a: any) => a.approvalState === state).length})
              </h3>
              <div className="space-y-3">
                {filteredActivities
                  .filter((activity: any) => activity.approvalState === state)
                  .map((activity: any) => (
                    <div key={activity.id} className="bg-white p-3 rounded-lg shadow-sm border">
                      <h4 className="font-medium text-sm text-gray-900 mb-2">{activity.title}</h4>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(activity.priority)}`}>
                          {activity.priority}
                        </span>
                        <span className="text-xs text-gray-500">{formatDate(activity.dueDate)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">{activity.assignedTo}</span>
                        <div className="w-12 bg-gray-200 rounded-full h-1">
                          <div
                            className="bg-blue-600 h-1 rounded-full"
                            style={{ width: `${activity.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'timeline' && (
        <div className="space-y-4">
          <div className="text-center text-gray-500 py-12">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Timeline View</h3>
            <p>Timeline visualization coming soon...</p>


          </div>
        </div>
      )}

      {filteredActivities.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
          <p className="text-gray-500">Try adjusting your filters or create a new activity.</p>
        </div>
      )}

      {/* View Details Modal */}
      <Modal isOpen={detailsOpen} onClose={() => {
        console.log('🔍 Closing View Details Modal');
        setDetailsOpen(false);
      }} title="Activity Details" size="xl">
        {selectedActivity ? (
          <div className="space-y-4">
            <div>
              <div className="text-lg font-semibold text-gray-900">{selectedActivity.title}</div>
              <div className="text-sm text-gray-600 mt-1">{selectedActivity.description || 'No description'}</div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Status:</span> <span className="ml-1">{getStatusDisplayName(selectedActivity.status, 'activity')}</span></div>
              <div><span className="text-gray-500">Priority:</span> <span className="ml-1 capitalize">{selectedActivity.priority}</span></div>
              <div><span className="text-gray-500">Due Date:</span> <span className="ml-1">{formatDate(selectedActivity.dueDate)}</span></div>
              <div><span className="text-gray-500">Progress:</span> <span className="ml-1">{selectedActivity.progress}%</span></div>
            </div>
          </div>
        ) : (
          <div className="text-gray-500">No activity selected</div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={editingOpen} onClose={() => setEditingOpen(false)} title="Edit Activity" size="xl">
        {selectedActivity ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                value={selectedActivity.title}
                onChange={(e) => setSelectedActivity({ ...selectedActivity, title: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={selectedActivity.description}
                onChange={(e) => setSelectedActivity({ ...selectedActivity, description: e.target.value })}
                rows={4}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={selectedActivity.status}
                  onChange={(e) => setSelectedActivity({ ...selectedActivity, status: e.target.value as any })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
                >
                  {getActiveStatusOptions('activity').map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Priority</label>
                <select
                  value={selectedActivity.priority}
                  onChange={(e) => setSelectedActivity({ ...selectedActivity, priority: e.target.value as any })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white capitalize"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setEditingOpen(false)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!selectedActivity) return;
                  try {
                    const updated = await activitiesAPI.update(selectedActivity.id, {
                      title: selectedActivity.title,
                      description: selectedActivity.description,
                      status: selectedActivity.status,
                      priority: selectedActivity.priority,
                    });

                    const updatedTransformed: Activity = {
                      id: updated.id,
                      title: updated.title,
                      description: updated.description || '',
                      status: updated.status,
                      approvalState: updated.approvalState,
                      priority: updated.priority,
                      assignedTo: updated.assignees && updated.assignees.length > 0
                        ? updated.assignees.map((x: any) => x.name).join(', ')
                        : 'Unassigned',
                      createdBy: updated.createdBy?.name || 'Unknown',
                      createdAt: updated.createdAt,
                      updatedAt: updated.updatedAt,
                      dueDate: updated.endDate || '',
                      estimatedHours: 0,
                      actualHours: 0,
                      category: updated.tags && updated.tags.length > 0 ? updated.tags[0] : 'General',
                      tags: updated.tags || [],
                      progress: updated.status === 'Done' ? 100 : updated.status === 'Working on it' ? 50 : 0,
                      assignees: updated.assignees || [],
                    };

                    setActivities((prev) => prev.map((a) => (a.id === updated.id ? updatedTransformed : a)));
                    setEditingOpen(false);
                    toast.success('Activity updated');
                  } catch (e) {
                    console.error(e);
                    toast.error('Failed to update activity');
                  }
                }}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="text-gray-500">No activity selected</div>
        )}
      </Modal>
    </div>
  );
}
