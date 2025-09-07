'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { activitiesAPI, boardsAPI, tasksAPI, usersAPI, projectsAPI } from '@/lib/api';
import TaskToActivityModal from './TaskToActivityModal';
import TaskDetailsModal from './TaskDetailsModal';
import { usePersistentState } from '@/hooks/usePersistentState';
import { MondayLayout } from '../layout/MondayLayout';
import { MondayToolbar } from '../layout/MondayToolbar';
import { MondayHeaderActions } from '../ui/MondayHeaderActions';
import { MondayTable, MondayTableRow, MondayTableCell } from '../ui/MondayTable';
import { StatusPill } from '../ui/StatusPill';
import { PriorityBadge } from '../ui/PriorityBadge';
import StatusDropdown from '../ui/StatusDropdown';
import { UserAvatar } from '../ui/UserAvatar';
import { EditableTableRow } from '../ui/EditableTableRow';
import { useStatus } from '@/contexts/StatusContext';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Drag Handle Component (Square with 4-way arrows)
const DragHandle = () => (
  <div className="flex items-center justify-center w-7 h-7 bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300 rounded-lg cursor-grab active:cursor-grabbing hover:from-blue-100 hover:to-blue-200 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md">
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
    >
      {/* Vertical line */}
      <line x1="8" y1="2" x2="8" y2="14" stroke="currentColor" strokeWidth="2"/>
      {/* Horizontal line */}
      <line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="2"/>
      {/* Up arrow */}
      <path d="M5 5l3-3 3 3" stroke="currentColor" strokeWidth="2" fill="none"/>
      {/* Down arrow */}
      <path d="M5 11l3 3 3-3" stroke="currentColor" strokeWidth="2" fill="none"/>
      {/* Left arrow */}
      <path d="M5 5l-3 3 3 3" stroke="currentColor" strokeWidth="2" fill="none"/>
      {/* Right arrow */}
      <path d="M11 5l3 3-3 3" stroke="currentColor" strokeWidth="2" fill="none"/>
    </svg>
  </div>
);

// Sortable Table Row Component
interface SortableTableRowProps {
  activity: Activity;
  onConvertToActivity: (activity: Activity) => void;
  onOpenTaskDetails: (activity: Activity) => void;
  onStatusChange: (activityId: string, newStatus: string) => void;
  formatDate: (date: string) => string;
  formatLastUpdated: (date: string) => string;
}

const SortableTableRow: React.FC<SortableTableRowProps> = ({
  activity,
  onConvertToActivity,
  onOpenTaskDetails,
  onStatusChange,
  formatDate,
  formatLastUpdated,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: activity.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      className={`gap-0 px-1.5 py-1 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150 min-h-[28px] ${
        isDragging ? 'opacity-50 shadow-lg z-10' : ''
      }`}
      style={{
        ...style,
        display: 'grid',
        gridTemplateColumns: '32px minmax(200px, 2fr) 120px 100px 70px 100px 90px',
        alignItems: 'center'
      }}
      {...attributes}
    >
      {/* Drag Handle */}
      <div className="flex items-center justify-center px-1 border-r border-gray-200" {...listeners}>
        <div className="flex items-center justify-center w-5 h-5 bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300 rounded cursor-grab active:cursor-grabbing hover:from-blue-100 hover:to-blue-200 hover:border-blue-300 transition-all duration-200">
          <svg
            width="10"
            height="10"
            viewBox="0 0 16 16"
            fill="none"
            className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
          >
            {/* Vertical line */}
            <line x1="8" y1="3" x2="8" y2="13" stroke="currentColor" strokeWidth="1.5"/>
            {/* Horizontal line */}
            <line x1="3" y1="8" x2="13" y2="8" stroke="currentColor" strokeWidth="1.5"/>
            {/* Up arrow */}
            <path d="M6 6l2-2 2 2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            {/* Down arrow */}
            <path d="M6 10l2 2 2-2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            {/* Left arrow */}
            <path d="M6 6l-2 2 2 2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            {/* Right arrow */}
            <path d="M10 6l2 2-2 2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          </svg>
        </div>
      </div>

      {/* Task Name with Tooltip */}
      <div className="flex items-center space-x-1.5 px-1.5 border-r border-gray-200">
        <div className="flex-1 min-w-0 group relative">
          <h4
            className="text-xs font-medium text-gray-900 truncate hover:text-blue-600 cursor-pointer"
            title={activity.title}
          >
            {activity.title}
          </h4>
          {/* Tooltip on hover */}
          <div className="absolute left-0 top-full mt-1 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg z-50 whitespace-normal max-w-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            {activity.title}
          </div>
        </div>
        <div className="flex items-center space-x-1 flex-shrink-0">
          {/* Comment Icon */}
          <button
            onClick={() => onOpenTaskDetails(activity)}
            className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded transition-all duration-200"
            title="Add comment / View details"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              <path d="M12 8v4M8 12h8"/>
            </svg>
          </button>

          {/* Convert Icon (Double Arrow) */}
          {activity.taskId && (
            <button
              onClick={() => onConvertToActivity(activity)}
              className="p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded transition-all duration-200"
              title="Convert task to activity"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14"/>
                <path d="M12 5l7 7-7 7"/>
                <path d="M5 9h14" strokeWidth="2"/>
                <path d="M12 2l7 7-7 7" strokeWidth="2"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Assigned By */}
      <div className="flex items-center space-x-1 px-1.5 border-r border-gray-200">
        <UserAvatar name={activity.createdBy?.name || 'U'} size="xs" className="flex-shrink-0" />
        <span className="text-xs text-gray-900 truncate flex-1">
          {activity.createdBy?.name || 'Unknown'}
        </span>
      </div>

      {/* Status */}
      <div className="flex items-center justify-center px-1.5 border-r border-gray-200">
        <StatusDropdown
          value={activity.status}
          onChange={(newStatus) => onStatusChange(activity.id, newStatus)}
          size="xs"
          type="task"
        />
      </div>

      {/* Due Date */}
      <div className="flex items-center justify-center px-1.5 border-r border-gray-200">
        <span className="text-xs text-gray-600 text-center">
          {formatDate(activity.endDate)}
        </span>
      </div>

      {/* Priority */}
      <div className="flex items-center justify-center px-1.5 border-r border-gray-200">
        <PriorityBadge priority={(activity.priority ?? 'medium') as 'low' | 'medium' | 'high' | 'urgent'} size="xs" />
      </div>

      {/* Last Updated */}
      <div className="flex items-center justify-center space-x-1 px-1.5">
        <UserAvatar name={activity.updatedBy?.name || 'U'} size="xs" className="flex-shrink-0" />
        <span className="text-xs text-gray-500 truncate">
          {formatLastUpdated(activity.lastUpdated)}
        </span>
      </div>
    </div>
  );
};

interface Activity {
  id: string;
  title: string;
  description: string;
  status: string; // Dynamic status from StatusContext
  priority: 'low' | 'medium' | 'high' | 'urgent' | null | undefined;
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

type MyActivitiesProps = { assigneeId?: string; viewerMode?: 'self' | 'pm'; titleOverride?: string; onNewItem?: () => void };

const MyActivitiesRefactored = ({ assigneeId, viewerMode = 'self', titleOverride, onNewItem }: MyActivitiesProps) => {
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'board'>('board');
  const [activities, setActivities] = usePersistentState<Activity[]>('member-activities', []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [selectedTaskForConversion, setSelectedTaskForConversion] = useState<any>(null);
  const [taskDetailsModalOpen, setTaskDetailsModalOpen] = useState(false);
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState<Activity | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [groupBy, setGroupBy] = useState<'status' | 'priority'>('status');
  const [isListView, setIsListView] = useState(false);

  const router = useRouter();

  // Status context (use actual task statuses and display names)
  const { taskStatuses, getStatusDisplayName } = useStatus();

  // Persist view preferences server-side. In PM viewer mode, we load the MEMBER's prefs but do not save.
  useEffect(() => {
    const syncInitialPrefs = async () => {
      try {
        const viewerIsPM = viewerMode === 'pm';
        if (viewerIsPM && assigneeId) {
          const prefs = await usersAPI.getPreferences(assigneeId);
          if (prefs?.memberView?.isListView !== undefined) setIsListView(!!prefs.memberView.isListView);
          if (prefs?.memberView?.groupBy) setGroupBy(prefs.memberView.groupBy);
          return;
        }
        const me = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;
        if (!me?.id) return;
        const prefs = await usersAPI.getPreferences(me.id);
        if (prefs?.memberView?.isListView !== undefined) setIsListView(!!prefs.memberView.isListView);
        if (prefs?.memberView?.groupBy) setGroupBy(prefs.memberView.groupBy);
      } catch (e) {
        // non-blocking
      }
    };
    syncInitialPrefs();
  }, [assigneeId, viewerMode]);

  useEffect(() => {
    if (viewerMode === 'pm') return; // PM viewer should not save member prefs
    const savePrefs = async () => {
      try { await usersAPI.updateMyPreferences({ memberView: { isListView, groupBy } }); } catch {}
    };
    savePrefs();
  }, [isListView, groupBy, viewerMode]);
  const [searchQuery, setSearchQuery] = useState('');

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

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setActivities((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);

        const newOrder = arrayMove(items, oldIndex, newIndex);

        // Here you could also make an API call to persist the new order
        // updateTaskOrder(newOrder.map(item => item.id));

        return newOrder;
      });
    }
  };

  // Load activities on mount or when assignee changes
  useEffect(() => {
    const loadActivities = async () => {
      try {
        setLoading(true);
        const tasks = assigneeId
          ? await tasksAPI.getAll({ assigneeId })
          : await tasksAPI.getMy();

        console.log('Loaded tasks:', tasks);

        // Transform tasks to activity format with proper status mapping
        const priorityMap: Record<string, Activity['priority']> = {
          Low: 'low',
          Medium: 'medium',
          High: 'high',
          Urgent: 'urgent',
        };

        // Map database task statuses to UI status values (from screenshot)
        const statusMap: Record<string, string> = {
          // Database task statuses to UI status values
          'assigned': 'To Do',
          'In Progress': 'In Progress',
          'in_progress': 'In Progress',
          'working_on_it': 'In Progress',
          'stuck': 'In Review',
          'blocked': 'In Review',
          'in_review': 'In Review',
          'completed': 'Done',
          'done': 'Done',
          'cancelled': 'Done', // Treat cancelled as done for grouping
          'canceled': 'Done',
          // Direct mappings (if UI status values are used directly)
          'To Do': 'To Do',
          'In Review': 'In Review',
          'Done': 'Done',
          // Legacy fallbacks
          'Not Started': 'To Do',
          'Working on it': 'In Progress',
          'Stuck': 'In Review',
          'Cancelled': 'Done'
        };

        const mapped: Activity[] = (tasks || []).map((t: any) => {
          // Fallback creator info if not provided by backend
          const createdBy = t.createdBy || t.creator || {
            id: 'unknown',
            name: 'System User',
            email: 'system@example.com'
          };

          const mappedStatus = statusMap[t.status] || 'To Do';
          const mappedPriority = priorityMap[t.priority] || 'medium';

          return {
            id: t.id,
            title: t.title,
            description: t.description || '',
            status: mappedStatus, // Map database status to context status
            priority: mappedPriority,
            category: t.board?.name || t.project?.name || (assigneeId ? 'Assigned Tasks' : 'Assigned to me'),
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
            // Show task creator (who assigned the task) in the "Assigned By" column
            createdBy: createdBy,
            updatedBy: createdBy,
            // Store assignee info for potential future use
            assignee: t.assignee || { name: 'Unassigned' },
            projectId: t.projectId,
            projectName: t.project?.name || 'Unknown Project'
          };
        });

        setActivities(mapped);
        setError(null); // Clear any previous errors on successful load
        // Cache successful data for offline fallback
        if (typeof window !== 'undefined') {
          localStorage.setItem('member-activities', JSON.stringify(mapped));
        }
      } catch (err: any) {
        console.error('Error loading activities:', err);
        // Graceful fallback: use cached or mock data instead of showing a blocking error
        try {
          const cached = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('member-activities') || '[]') : [];
          if (cached && cached.length > 0) {
            setActivities(cached);
            setError(null);
          } else {
            const mock: Activity[] = [
              {
                id: 'mock-1',
                title: 'Task1',
                description: '',
                status: 'Working on it',
                priority: 'medium',
                category: 'Assigned to me',
                startDate: new Date().toISOString(),
                endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                progress: 50,
                estimatedHours: 8,
                actualHours: 2,
                tags: [],
                comments: 0,
                attachments: 0,
                lastUpdated: new Date().toISOString(),
                taskId: 'mock-1',
                createdBy: { name: 'Unassigned' },
                updatedBy: { name: 'System' },
              },
              {
                id: 'mock-2',
                title: 'Task2',
                description: '',
                status: 'Stuck',
                priority: 'high',
                category: 'Assigned to me',
                startDate: new Date().toISOString(),
                endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
                progress: 25,
                estimatedHours: 8,
                actualHours: 1,
                tags: [],
                comments: 0,
                attachments: 0,
                lastUpdated: new Date().toISOString(),
                taskId: 'mock-2',
                createdBy: { name: 'Unassigned' },
                updatedBy: { name: 'System' },
              },
              {
                id: 'mock-3',
                title: 'Task3',
                description: '',
                status: 'Done',
                priority: 'medium',
                category: 'Assigned to me',
                startDate: new Date().toISOString(),
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                progress: 75,
                estimatedHours: 8,
                actualHours: 3,
                tags: [],
                comments: 0,
                attachments: 0,
                lastUpdated: new Date().toISOString(),
                taskId: 'mock-3',
                createdBy: { name: 'Unassigned' },
                updatedBy: { name: 'System' },
              },
            ];
            setActivities(mock);
            setError(null);
          }
        } catch (e) {
          setError('Unable to load tasks. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadActivities();
  }, []);

  // Handle task to activity conversion
  const handleConvertToActivity = (activity: Activity) => {
    if (activity.taskId) {
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

  const handleOpenTaskDetails = (activity: Activity) => {
    setSelectedTaskForDetails(activity);
    setTaskDetailsModalOpen(true);
  };

  const handleStatusChange = async (activityId: string, newStatus: Activity['status']) => {
    console.log('Status change requested:', { activityId, newStatus });

    // Optimistic UI update
    const prevActivities = activities;
    setActivities(prev => prev.map(a => a.id === activityId ? { ...a, status: newStatus } : a));

    // Find taskId for this activity
    const activity = prevActivities.find(a => a.id === activityId);
    const taskId = activity?.taskId;

    if (!taskId) {
      console.error('No taskId found for activity:', activityId);
      setToast({ message: 'Task ID not found. Cannot update status.', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    // Direct status update - no mapping needed since both use unified status system
    try {
      console.log('Updating task status:', { taskId, newStatus });
      await tasksAPI.updateStatus(taskId, newStatus);
      console.log('Status updated successfully');
      setToast({ message: 'Status updated successfully', type: 'success' });
      setTimeout(() => setToast(null), 2000);
    } catch (err: any) {
      console.error('Failed to update task status:', err);
      // Revert UI on failure
      setActivities(prevActivities);
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to update status. Please try again.';
      setToast({ message: errorMessage, type: 'error' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleSaveTask = async (taskId: string, updates: any) => {
    try {
      await boardsAPI.updateTask(taskId, updates);

      // Update the local activity data
      setActivities(prevActivities =>
        prevActivities.map(activity =>
          activity.taskId === taskId
            ? {
                ...activity,
                description: updates.description || activity.description,
                priority: updates.priority || activity.priority,
                category: updates.category || activity.category,
                endDate: updates.dueDate || activity.endDate,
                estimatedHours: updates.estimatedHours || activity.estimatedHours,
                actualHours: updates.actualHours || activity.actualHours,
                lastUpdated: new Date().toISOString(),
              }
            : activity
        )
      );

      setToast({ message: 'Task updated successfully!', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error('Failed to update task:', error);
      setToast({ message: 'Failed to update task. Please try again.', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      throw error; // Re-throw to let the component handle it
    }
  };

  const handleConversionSuccess = async () => {
    setToast({ message: 'Task converted to activity successfully!', type: 'success' });
    setTimeout(() => setToast(null), 3000);

    // Reload activities data without page refresh
    try {
      setLoading(true);
      const myTasks = await tasksAPI.getMy();

      // Direct mapping for reload path - no status conversion needed
      const priorityMap: Record<string, Activity['priority']> = {
        Low: 'low',
        Medium: 'medium',
        High: 'high',
        Urgent: 'high',
      };

      const mapped: Activity[] = myTasks.map((t: any) => ({
        id: t.id,
        title: t.title,
        description: t.description || '',
        status: t.status || 'to_do', // actual task status name
        priority: priorityMap[t.priority] || 'medium',
        startDate: t.createdAt,
        endDate: t.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        tags: [],
        assignees: t.assignee ? [{ id: t.assignee.id, name: t.assignee.name, email: t.assignee.email }] : [],
        progress: getProgressFromTaskStatus(t.status),
        lastUpdated: t.updatedAt,
        taskId: t.id,
        category: t.category || 'General',
        estimatedHours: t.estimatedHours || 0,
        actualHours: t.actualHours || 0,
        projectId: t.projectId,
        projectName: t.project?.name || 'Unknown Project'
      }));

      setActivities(mapped);
    } catch (error) {
      console.error('Failed to reload activities:', error);
      setToast({ message: 'Failed to reload activities', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setLoading(false);
    }
  };

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

  // Filter activities based on search query
  const filteredActivities = activities.filter(activity => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      activity.title.toLowerCase().includes(query) ||
      activity.description?.toLowerCase().includes(query) ||
      activity.createdBy?.name?.toLowerCase().includes(query) ||
      activity.status.toLowerCase().includes(query) ||
      activity.priority?.toLowerCase().includes(query)
    );
  });

  // Grouping logic - group by actual task status and priority
  const groupActivities = (activities: Activity[]) => {
    if (groupBy === 'status') {
      // Use status order that matches the UI dropdown (from screenshot)
      const statusOrder = ['To Do', 'In Progress', 'In Review', 'Done'];
      const groups: Record<string, Activity[]> = {};

      statusOrder.forEach((statusName) => {
        const groupActivities = activities.filter(a => a.status === statusName);
        // Only add groups that have at least one activity
        if (groupActivities.length > 0) {
          groups[statusName] = groupActivities;
        }
      });

      // Include any activities with unknown status in an "Other" group
      const knownStatuses = new Set(statusOrder);
      const others = activities.filter(a => !knownStatuses.has(a.status));
      if (others.length > 0) {
        groups['Other'] = others;
      }

      return groups;
    } else {
      const groups: Record<string, Activity[]> = {};

      // Only add priority groups that have at least one activity
      const urgentActivities = activities.filter(a => a.priority === 'urgent' || a.priority === 'Urgent');
      if (urgentActivities.length > 0) groups['Urgent'] = urgentActivities;

      const highActivities = activities.filter(a => a.priority === 'high' || a.priority === 'High');
      if (highActivities.length > 0) groups['High'] = highActivities;

      const mediumActivities = activities.filter(a => a.priority === 'medium' || a.priority === 'Medium');
      if (mediumActivities.length > 0) groups['Medium'] = mediumActivities;

      const lowActivities = activities.filter(a => a.priority === 'low' || a.priority === 'Low');
      if (lowActivities.length > 0) groups['Low'] = lowActivities;

      const blankActivities = activities.filter(a => !a.priority || a.priority === null || a.priority === undefined);
      if (blankActivities.length > 0) groups['Blank'] = blankActivities;

      return groups;
    }
  };

  const groupedActivities = groupActivities(filteredActivities);

  // Layout components
  const headerActions = (
    <MondayHeaderActions
      simplified={true}
      onNewItem={() => {
        if (viewerMode === 'pm' && assigneeId) {
          // For PM viewing member activities, navigate to PM task assignment
          router.push('/pm?tab=tasks');
        } else if (onNewItem) {
          // For member, use callback to switch to create tab
          onNewItem();
        } else {
          // Fallback navigation
          router.push('/member?tab=create');
        }
      }}
      onSearch={setSearchQuery}
    />
  );

  const toolbar = (
    <MondayToolbar
      simplified={true}
      groupBy={groupBy}
      onGroupByChange={setGroupBy}
      showListToggle={true}
      isListView={isListView}
      onListViewToggle={setIsListView}
    />
  );

  // Table columns configuration
  const columns = [
    { key: 'task', label: 'Task', width: 'col-span-3', sortable: true },
    { key: 'owner', label: 'Assigned By', width: 'col-span-2' },
    { key: 'status', label: 'Status', width: 'col-span-2' },
    { key: 'dueDate', label: 'Due date', width: 'col-span-1' },
    { key: 'priority', label: 'Priority', width: 'col-span-2' },
    { key: 'lastUpdated', label: 'Last updated', width: 'col-span-1' },
  ];

  if (loading) {
    return (
      <MondayLayout
        title="My Activities"
        subtitle="Loading..."
        headerActions={headerActions}
        toolbar={toolbar}
      >
        <div className="p-8 text-center text-gray-500">Loading activities...</div>
      </MondayLayout>
    );
  }

  return (
    <>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 border rounded-md px-4 py-3 shadow ${
          toast.type === 'success'
            ? 'bg-green-50 text-green-800 border-green-200'
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          <div className="text-sm">{toast.message}</div>
        </div>
      )}

      <MondayLayout
        title={titleOverride || 'My Activities'}
        subtitle={searchQuery ? `${filteredActivities.length} of ${activities.length} tasks/activities` : `${activities.length} tasks/activities`}
        headerActions={headerActions}
        toolbar={toolbar}
      >
        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded p-2">
            {error}
          </div>
        )}

        {activities.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl mb-4 block">📝</span>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
            <p className="text-gray-500">You don't have any assigned tasks yet</p>
          </div>
        ) : filteredActivities.length === 0 && searchQuery ? (
          <div className="text-center py-12">
            <span className="text-4xl mb-4 block">🔍</span>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-500">Try adjusting your search terms</p>
          </div>
        ) : isListView ? (
          // Single List View
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {/* Table Header */}
            <div className="bg-gray-50 border-b border-gray-200">
              <div
                className="gap-0 divide-x divide-gray-200 px-2 py-1 items-center text-xs font-medium text-gray-600 uppercase tracking-wide min-h-[28px]"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '32px minmax(200px, 2fr) 120px 100px 70px 100px 90px 80px',
                  alignItems: 'center'
                }}
              >
                <div className="px-1 text-center"></div>
                <div className="px-2">Task</div>
                <div className="px-2 text-center">Assigned By</div>
                <div className="px-2 text-center">Status</div>
                <div className="px-2 text-center">Due date</div>
                <div className="px-2 text-center">Priority</div>
                <div className="px-2 text-center whitespace-normal break-words leading-tight">Last updated</div>
                <div className="px-1 text-center">Actions</div>
              </div>
            </div>

            {/* All Activities in Single List */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filteredActivities.map(activity => activity.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="divide-y divide-gray-100">
                  {filteredActivities.map((activity) => (
                    <EditableTableRow
                      key={activity.id}
                      activity={activity}
                      onConvertToActivity={handleConvertToActivity}
                      onOpenTaskDetails={handleOpenTaskDetails}
                      onStatusChange={handleStatusChange}
                      onSaveTask={handleSaveTask}
                      formatDate={formatDate}
                      formatLastUpdated={formatLastUpdated}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        ) : (
          // Grouped View
          <div className="space-y-6">
            {Object.entries(groupedActivities).map(([groupName, groupActivities]) => (
              <div key={groupName} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                {/* Group Header */}
                <div className="bg-gray-50 border-b border-gray-200 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      <h3 className="text-xs font-medium text-gray-900">{groupName}</h3>
                      <span className="text-xs text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded-full">
                        {groupActivities.length} items
                      </span>
                    </div>
                  </div>
                </div>

                {/* Table Header */}
                <div className="bg-gray-50 border-b border-gray-200">
                  <div
                    className="gap-0 divide-x divide-gray-200 px-1.5 py-0.5 items-center text-xs font-medium text-gray-600 uppercase tracking-wide min-h-[24px]"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '32px minmax(200px, 2fr) 120px 100px 70px 100px 90px 80px',
                      alignItems: 'center'
                    }}
                  >
                    <div className="px-1 text-center"></div>
                    <div className="px-1.5">Task</div>
                    <div className="px-1.5 text-center">Assigned By</div>
                    <div className="px-1.5 text-center">Status</div>
                    <div className="px-1.5 text-center">Due date</div>
                    <div className="px-1.5 text-center">Priority</div>
                    <div className="px-1.5 text-center whitespace-normal break-words leading-tight">Last updated</div>
                    <div className="px-1 text-center">Actions</div>
                  </div>
                </div>

                {/* Group Activities */}
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={groupActivities.map(activity => activity.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="divide-y divide-gray-100">
                      {groupActivities.map((activity) => (
                        <EditableTableRow
                          key={activity.id}
                          activity={activity}
                          onConvertToActivity={handleConvertToActivity}
                          onOpenTaskDetails={handleOpenTaskDetails}
                          onStatusChange={handleStatusChange}
                          onSaveTask={handleSaveTask}
                          formatDate={formatDate}
                          formatLastUpdated={formatLastUpdated}
                        />
                      ))}
                      {groupActivities.length === 0 && (
                        <div className="px-3 py-4 text-center text-gray-500 text-xs">
                          No items in this group
                        </div>
                      )}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            ))}
          </div>
        )}

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

        {/* Task Details Modal */}
        {selectedTaskForDetails && (
          <TaskDetailsModal
            activity={selectedTaskForDetails}
            isOpen={taskDetailsModalOpen}
            onClose={() => {
              setTaskDetailsModalOpen(false);
              setSelectedTaskForDetails(null);
            }}
            onUpdate={(updatedActivity) => {
              // Update the activity in the list
              setActivities(prev =>
                prev.map(activity =>
                  activity.id === updatedActivity.id ? updatedActivity : activity
                )
              );
            }}
          />
        )}


      </MondayLayout>
    </>
  );
};

export default MyActivitiesRefactored;
