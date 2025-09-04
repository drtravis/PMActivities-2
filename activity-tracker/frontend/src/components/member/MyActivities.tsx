'use client';

import { useState, useEffect } from 'react';
import { activitiesAPI } from '@/lib/api';
import { boardsAPI } from '@/lib/api';
import { tasksAPI } from '@/lib/api';
import TaskToActivityModal from './TaskToActivityModal';
import { MondayLayout } from '../layout/MondayLayout';
import { MondayToolbar } from '../layout/MondayToolbar';
import { MondayHeaderActions } from '../ui/MondayHeaderActions';
import { MondayTable, MondayTableRow, MondayTableCell } from '../ui/MondayTable';
import { StatusPill } from '../ui/StatusPill';
import { PriorityBadge } from '../ui/PriorityBadge';
import { UserAvatar } from '../ui/UserAvatar';
import { useStatus } from '@/contexts/StatusContext';


interface Activity {
  id: string;
  title: string;
  description: string;
  status: 'Not Started' | 'Working on it' | 'Stuck' | 'Done' | 'Blocked' | 'Canceled';
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
  taskId?: string; // optional back-reference to originating task
  projectId?: string;
  projectName?: string;
  createdBy?: { id: string; name: string };
  updatedBy?: { id: string; name: string };
}

interface TaskRow {
  id: string;
  title: string;
  assignee?: { id: string; name: string } | null;
  status: 'Not Started' | 'Working on it' | 'Stuck' | 'Done' | 'Blocked' | 'Canceled';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  dueDate?: string | null;
  section?: string;
  position?: number;
  lastUpdated?: string;
}

interface MyActivitiesProps {
  selectedProject?: any;
}

export function MyActivities({ selectedProject }: MyActivitiesProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [selectedTaskForConversion, setSelectedTaskForConversion] = useState<any>(null);

  // Helper function to calculate progress from task status
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

  // Handle task to activity conversion
  const handleConvertToActivity = (activity: Activity) => {
    if (activity.taskId) {
      // This is a task, convert it to activity
      setSelectedTaskForConversion({
        id: activity.taskId,
        title: activity.title,
        description: activity.description,
        priority: activity.priority,
        dueDate: activity.endDate,
        projectId: activity.projectId,
        projectName: activity.projectName,
      });
      setConvertModalOpen(true);
    }
  };

  const handleConversionSuccess = () => {
    // Reload activities after successful conversion
    const load = async () => {
      try {
        const myTasks = await tasksAPI.getMy();
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

        const mapped: Activity[] = (myTasks || []).map((t: any) => ({
          id: t.id,
          title: t.title,
          description: t.description || '',
          status: statusMap[t.status] || 'Not Started',
          priority: priorityMap[t.priority] || 'medium',
          category: t.board?.name || t.project?.name || 'Assigned to me',
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
          updatedBy: t.assignee || t.createdBy || { name: 'Unassigned' },
          projectId: t.projectId,
          projectName: t.project?.name || 'Unknown Project'
        }));

        setActivities(mapped);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // Primary source: tasks assigned to me (works for PM-assigned tasks)
        const myTasks = await tasksAPI.getMy();

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

        const mapped: Activity[] = (myTasks || []).map((t: any) => ({
          id: t.id,
          title: t.title,
          description: t.description || '',
          status: statusMap[t.status] || 'Not Started',
          priority: priorityMap[t.priority] || 'medium',
          category: t.board?.name || t.project?.name || 'Assigned to me',
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
          updatedBy: t.assignee || t.createdBy || { name: 'Unassigned' },
          projectId: t.projectId,
          projectName: t.project?.name || 'Unknown Project'
        }));

        setActivities(mapped);
      } catch (e) {
        console.error(e);
        setError('Failed to load your board tasks');
      } finally {
        setLoading(false);
      }
    };

    load();

  }, []);

  // Simple toast for errors
  const [toast, setToast] = useState<{ message: string; type?: 'error' | 'info' | 'success' | 'warning' } | null>(null);
  const showError = (msg: string) => {
    setToast({ message: msg, type: 'error' });
    setTimeout(() => setToast(null), 3000);
  };

  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'board'>('board');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'progress' | 'lastUpdated'>('lastUpdated');


  // Board grouping for Monday.com-style sections - using unified status system
  const TODO_STATUSES: Activity['status'][] = ['Not Started', 'Working on it', 'Stuck', 'Blocked'];
  const COMPLETED_STATUSES: Activity['status'][] = ['Done', 'Canceled'];
  const getGroupForStatus = (status: Activity['status']) => (TODO_STATUSES.includes(status) ? 'todo' : 'completed');

  // DnD state
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // Reorder/move helper
  const moveActivity = (activityId: string, targetGroup: 'todo' | 'completed', targetIndex: number) => {
    setActivities(prev => {
      const items = [...prev];
      const currentIdx = items.findIndex(a => a.id === activityId);
      if (currentIdx === -1) return prev;
      const item = { ...items[currentIdx] };
      items.splice(currentIdx, 1);

      // Update status when crossing groups
      const isTargetTodo = targetGroup === 'todo';
      const newStatus: Activity['status'] = isTargetTodo ? 'Working on it' : 'Done';
      item.status = newStatus;
      item.lastUpdated = new Date().toISOString();

      // Build list of global indices for target group in the updated array
      const targetGroupGlobals = items
        .map((a, i) => ({ a, i }))
        .filter(({ a }) => (isTargetTodo ? TODO_STATUSES.includes(a.status) : COMPLETED_STATUSES.includes(a.status)))
        .map(({ i }) => i);

      let insertAt = items.length; // default append at end
      if (targetGroupGlobals.length === 0) {
        // Insert at first position of section boundary: for simplicity, append
        insertAt = items.length;
      } else if (targetIndex >= targetGroupGlobals.length) {
        insertAt = targetGroupGlobals[targetGroupGlobals.length - 1] + 1;
      } else {
        insertAt = targetGroupGlobals[targetIndex];
      }

      items.splice(insertAt, 0, item);
      return items;
    });
  };

  const handleDragStart = (e: React.DragEvent, activityId: string) => {
    setDraggingId(activityId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', activityId);
  };

  const handleDragOverRow = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnRow = (
    e: React.DragEvent,
    targetGroup: 'todo' | 'completed',
    targetIndex: number
  ) => {
    e.preventDefault();
    const id = (e.dataTransfer.getData('text/plain') || draggingId) as string;
    if (!id) return;
    moveActivity(id, targetGroup, targetIndex);
    const tId = getTaskIdForActivity(id);
    if (tId) persistMove(tId, targetGroup, targetIndex);
    setDraggingId(null);
  };

  const handleDropAtEnd = (e: React.DragEvent, targetGroup: 'todo' | 'completed') => {
    e.preventDefault();
    const id = (e.dataTransfer.getData('text/plain') || draggingId) as string;
    if (!id) return;
    // append at end of target group
    const targetIndex = getGroupLength(targetGroup);
    moveActivity(id, targetGroup, targetIndex);
    const tId = getTaskIdForActivity(id);
    if (tId) persistMove(tId, targetGroup, targetIndex);
    setDraggingId(null);
  };

  // Persist move to backend (optimistic)
  const persistMove = async (
    taskId: string,
    targetGroup: 'todo' | 'completed',
    targetIndex: number
  ) => {
    // Map groups to backend task status strings
    const statusMap = {
      todo: 'Working on it',
      completed: 'Done',
    } as const;

    // Snapshot for optimistic revert
    const prev = activities;
    try {
      await boardsAPI.updateTask(taskId, {
        section: targetGroup === 'todo' ? 'To-Do' : 'Completed',
        status: statusMap[targetGroup],
        position: targetIndex,
      });
    } catch (err) {
      console.error('Failed to persist move', err);
      showError('Could not save the move');
      // Revert optimistic change
      setActivities(prev);
    }
  };

  const getTaskIdForActivity = (activityId: string) => {
    const a = activities.find(x => x.id === activityId);
    return a?.taskId || null;
  };
  const getGroupLength = (group: 'todo' | 'completed') =>
    activities.filter(a => (group === 'todo' ? TODO_STATUSES.includes(a.status) : COMPLETED_STATUSES.includes(a.status))).length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Not Started': return 'bg-gray-100 text-gray-800';
      case 'Working on it': return 'bg-orange-100 text-orange-800';
      case 'Stuck': return 'bg-red-100 text-red-800';
      case 'Done': return 'bg-green-100 text-green-800';
      case 'Blocked': return 'bg-purple-100 text-purple-800';
      case 'Canceled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const updateActivityProgress = (activityId: string, newProgress: number) => {
    setActivities(prev =>
      prev.map(activity =>
        activity.id === activityId
          ? { ...activity, progress: newProgress, lastUpdated: new Date().toISOString() }
          : activity
      )
    );
  };

  const updateActivityStatus = (activityId: string, newStatus: Activity['status']) => {
    setActivities(prev =>
      prev.map(activity =>
        activity.id === activityId
          ? { ...activity, status: newStatus, lastUpdated: new Date().toISOString() }
          : activity
      )
    );
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || activity.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || activity.priority === filterPriority;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const sortedActivities = [...filteredActivities].sort((a, b) => {
    switch (sortBy) {
      case 'dueDate':
        return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      case 'progress':
        return b.progress - a.progress;
      case 'lastUpdated':
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      default:
        return 0;
    }
  });

  const renderKanbanView = () => {
    const columns = [
      { id: 'not_started', title: 'Not Started', status: 'Not Started' },
      { id: 'working_on_it', title: 'Working on it', status: 'Working on it' },
      { id: 'stuck', title: 'Stuck', status: 'Stuck' },
      { id: 'done', title: 'Done', status: 'Done' },
      { id: 'blocked', title: 'Blocked', status: 'Blocked' },
      { id: 'canceled', title: 'Canceled', status: 'Canceled' }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {columns.map(column => (
          <div key={column.id} className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center justify-between">
              {column.title}
              <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                {activities.filter(a => a.status === column.status).length}
              </span>
            </h3>
            <div className="space-y-3">
              {activities.filter(a => a.status === column.status).map(activity => (
                <div key={activity.id} className="bg-white p-3 rounded-lg shadow-sm border">
                  <h4 className="font-medium text-sm text-gray-900 mb-2">{activity.title}</h4>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(activity.priority)}`}>
                      {activity.priority}
                    </span>
                    <span className="text-xs text-gray-500">{activity.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1 mb-2">
                    <div
                      className="bg-blue-600 h-1 rounded-full"
                      style={{ width: `${activity.progress}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Due: {new Date(activity.endDate).toLocaleDateString()}</span>
                    <div className="flex items-center space-x-2">
                      {activity.comments > 0 && <span>💬 {activity.comments}</span>}
                      {activity.attachments > 0 && <span>📎 {activity.attachments}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };
  const renderBoardView = () => {
    // Monday.com style status groups
    const statusGroups = [
      {
        id: 'todo',
        title: 'To-Do',
        statuses: ['Not Started', 'Working on it', 'Stuck', 'Blocked'],
        color: '#0073ea',
        bgColor: 'bg-blue-50',
        borderColor: 'border-l-blue-500'
      },
      {
        id: 'completed',
        title: 'Completed',
        statuses: ['Done', 'Canceled'],
        color: '#00c875',
        bgColor: 'bg-green-50',
        borderColor: 'border-l-green-500'
      }
    ];

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const formatLastUpdated = (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

      if (diffInHours < 1) return 'Just now';
      if (diffInHours < 24) return `${diffInHours} hours ago`;
      if (diffInHours < 48) return '1 day ago';
      return `${Math.floor(diffInHours / 24)} days ago`;
    };

    // Status pill logic is now handled by the StatusPill component using the status context

    const getPriorityPill = (priority: Activity['priority']) => {
      switch (priority) {
        case 'low':
          return { text: 'Low', bgColor: 'bg-blue-500', textColor: 'text-white' };
        case 'medium':
          return { text: 'Medium', bgColor: 'bg-purple-400', textColor: 'text-white' };
        case 'high':
          return { text: 'High', bgColor: 'bg-purple-600', textColor: 'text-white' };
        default:
          return { text: 'Medium', bgColor: 'bg-purple-400', textColor: 'text-white' };
      }
    };

    const getUserInitials = (name: string) => {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Monday.com style table header */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-12 gap-0 divide-x divide-gray-200 px-4 h-8 items-center text-xs font-medium text-gray-600 uppercase tracking-wide">
            <div className="col-span-1 flex items-center justify-center">
              <input
                type="checkbox"
                className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>
            <div className="col-span-3 px-2">Task</div>
            <div className="col-span-2 px-2">Owner</div>
            <div className="col-span-2 px-2">Status</div>
            <div className="col-span-1 px-2">Due date</div>
            <div className="col-span-2 px-2">Priority</div>
            <div className="col-span-1 px-2">Last updated</div>
          </div>
        </div>

        {/* Grouped sections */}
        {statusGroups.map(group => {
          const groupActivities = sortedActivities.filter(activity =>
            group.statuses.includes(activity.status)
          );

          return (
            <div key={group.id} className="border-collapse">
              {/* Section header with colored left border - Monday.com style */}
              <div className={`${group.bgColor} border-l-4 ${group.borderColor} border-b border-gray-200 px-4 py-2`}>
                <div className="flex items-center space-x-2">
                  <button className="text-gray-500 hover:text-gray-700">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <h3 className="text-sm font-semibold text-gray-900" style={{ color: group.color }}>
                    {group.title}
                  </h3>
                </div>
              </div>

              {/* Activities in this section - Monday.com style rows */}
              {groupActivities.map((activity, index) => {
                const priorityPill = getPriorityPill(activity.priority);

                return (
                  <div
                    key={activity.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, activity.id)}
                    onDragOver={handleDragOverRow}
                    onDrop={(e) => handleDropOnRow(e, getGroupForStatus(activity.status) === 'todo' ? 'todo' : 'completed', index)}
                    className="grid grid-cols-12 gap-0 px-4 py-2 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150 min-h-[40px]"
                  >
                    {/* Checkbox */}
                    <div className="col-span-1 flex items-center justify-center border-r border-gray-200">
                      <input
                        type="checkbox"
                        className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>

                    {/* Task Name */}
                    <div className="col-span-3 flex items-center px-2 border-r border-gray-200">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-medium text-gray-900 truncate hover:text-blue-600 cursor-pointer">
                            {activity.title}
                          </h4>
                          {activity.taskId && (
                            <button
                              onClick={() => handleConvertToActivity(activity)}
                              className="text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors duration-150"
                              title="Convert task to activity"
                            >
                              Convert
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Owner */}
                    <div className="col-span-2 flex items-center px-2 border-r border-gray-200">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-[9px] font-medium text-gray-700">
                            {getUserInitials(activity.createdBy?.name || activity.category || 'U')}
                          </span>
                        </div>
                        <span className="text-sm text-gray-900 truncate">
                          {activity.createdBy?.name || 'Unassigned'}
                        </span>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="col-span-2 flex items-center px-2 border-r border-gray-200">
                      <StatusPill status={activity.status} type="activity" size="sm" />
                    </div>

                    {/* Due Date */}
                    <div className="col-span-1 flex items-center px-2 border-r border-gray-200">
                      <span className="text-xs text-gray-600">
                        {formatDate(activity.endDate)}
                      </span>
                    </div>

                    {/* Priority */}
                    <div className="col-span-2 flex items-center px-2 border-r border-gray-200">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${priorityPill.bgColor} ${priorityPill.textColor}`}>
                        {priorityPill.text}
                      </span>
                    </div>

                    {/* Last Updated */}
                    <div className="col-span-1 flex items-center px-2">
                      <div className="flex items-center space-x-1">
                        <div className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-[8px] font-medium text-gray-700">
                            {getUserInitials(activity.updatedBy?.name || activity.category || 'U')}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatLastUpdated(activity.lastUpdated)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Add Task Button + Drop zone at end of group */}
              <div
                className="px-4 py-2 border-b border-gray-100"
                onDragOver={handleDragOverRow}
                onDrop={(e) => handleDropAtEnd(e, group.id === 'todo' ? 'todo' : 'completed')}
              >
                <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors duration-150">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-sm">Add task</span>
                </button>
              </div>
            </div>
          );
        })}

        {/* Empty state */}
        {sortedActivities.length === 0 && (
          <div className="text-center py-16">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
            <p className="text-gray-500 mb-4">Get started by creating your first activity.</p>
            <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-150">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Activity
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {toast && (
        <div className="fixed top-4 right-4 z-50 border rounded-md px-4 py-3 shadow bg-red-50 text-red-800 border-red-200">
          <div className="text-sm">{toast.message}</div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-gray-900">My Activities</h1>
          <div className="flex items-center space-x-3">
            <button className="px-4 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium">
              Enhance
            </button>
            <button className="px-4 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium">
              Integrate
            </button>
            <button className="px-4 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium">
              Automate
            </button>
            <div className="flex items-center space-x-2 ml-6">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700">U</span>
              </div>
              <button className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900">
                Invite / 1
              </button>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors duration-150 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New task
            </button>

            {/* Quick toolbar actions - Monday.com style */}
            <div className="flex items-center space-x-2 text-sm">
              <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors duration-150">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Search</span>
              </button>
              <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors duration-150">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Person</span>
              </button>
              <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors duration-150">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span>Filter</span>
              </button>
              <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors duration-150">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
                <span>Sort</span>
              </button>
              <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors duration-150">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
                <span>Hide</span>
              </button>
              <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors duration-150">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                <span>Group by</span>
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-150">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>
          </div>

          {/* View Mode Toggle - Monday.com style */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center space-x-2 px-3 py-1.5 text-sm rounded transition-colors duration-150 ${
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center space-x-2 px-3 py-1.5 text-sm rounded transition-colors duration-150 ${
                viewMode === 'kanban'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`flex items-center space-x-2 px-3 py-1.5 text-sm rounded transition-colors duration-150 ${
                viewMode === 'board'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span>Board</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded p-2">{error}</div>
        )}
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : viewMode === 'kanban' ? renderKanbanView() : viewMode === 'board' ? renderBoardView() : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="divide-y divide-gray-200">
            {sortedActivities.map(activity => (
              <div key={activity.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-1">
                      <h3 className="text-sm font-medium text-gray-900">{activity.title}</h3>
                      <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${getStatusColor(activity.status)}`}>
                        {activity.status.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full border ${getPriorityColor(activity.priority)}`}>
                        {activity.priority}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">{activity.description}</p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-2">
                      {activity.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[11px] rounded">
                          #{tag}
                        </span>
                      ))}
                      {activity.taskId && (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-800 text-[11px] rounded inline-flex items-center gap-1">
                          🔗 Task
                          <span className="font-mono">{activity.taskId.slice(0, 8)}…</span>
                          <button
                            className="text-amber-700 hover:text-amber-900"
                            onClick={() => navigator.clipboard.writeText(activity.taskId!)}
                            title="Copy Task ID"
                          >
                            ⧉
                          </button>
                        </span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">Progress</span>
                        <span className="text-xs text-gray-900 font-medium">{activity.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${activity.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Meta Info */}
                    <div className="flex items-center space-x-6 text-xs text-gray-500">
                      <span>📅 {new Date(activity.endDate).toLocaleDateString()}</span>
                      <span>⏱️ {activity.actualHours}h / {activity.estimatedHours}h</span>
                      <span>📂 {activity.category}</span>
                      {activity.comments > 0 && <span>💬 {activity.comments}</span>}
                      {activity.attachments > 0 && <span>📎 {activity.attachments}</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => updateActivityProgress(activity.id, Math.min(activity.progress + 10, 100))}
                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                    >
                      Update
                    </button>
                    <button className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700">
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {sortedActivities.length === 0 && (
        <div className="text-center py-12">
          <span className="text-4xl mb-4 block">📝</span>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
          <p className="text-gray-500">Try adjusting your search or filter criteria</p>
        </div>
      )}
      </div>

      {/* Task to Activity Conversion Modal */}
      {selectedTaskForConversion && (
        <TaskToActivityModal
          task={selectedTaskForConversion}
          isOpen={convertModalOpen}
          onClose={() => {
            setConvertModalOpen(false);
            setSelectedTaskForConversion(null);
          }}
          onSuccess={handleConversionSuccess}
        />
      )}
    </div>
  );
}
