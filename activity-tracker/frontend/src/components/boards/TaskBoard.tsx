'use client';

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, Filter, ArrowUpDown, MoreHorizontal, User, ChevronDown } from 'lucide-react';
import { useStatus } from '@/contexts/StatusContext';

// Types
export interface Task {
  id: string;
  title: string;
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
  status: 'Not Started' | 'Working on it' | 'Stuck' | 'Done';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  dueDate?: string;
  section: string;
  position: number;
  lastUpdated: string;
  customData?: Record<string, any>;
  tags?: string[];
}

export interface Column {
  id: string;
  name: string;
  type: 'text' | 'select' | 'date' | 'user';
  width?: number;
  sortable?: boolean;
}

interface TaskBoardProps {
  tasks: Task[];
  columns: Column[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskCreate: (task: Omit<Task, 'id'>) => void;
  onTaskMove: (taskId: string, newSection: string, newPosition: number) => void;
  loading?: boolean;
  groupBy?: 'section' | 'status' | 'priority' | 'assignee';
}

// Monday.com exact status colors
const getStatusColor = (status: string): string => {
  const colors = {
    'Not Started': '#c4c4c4',
    'Working on it': '#fdab3d',  // Orange
    'Stuck': '#e2445c',          // Red
    'Done': '#00c875',           // Green
    'Blocked': '#a25ddc',        // Purple
    'Canceled': '#808080',
  };
  return colors[status as keyof typeof colors] || '#c4c4c4';
};

// Monday.com exact priority colors
const getPriorityColor = (priority: string): string => {
  const colors = {
    'Low': '#579bfc',      // Light blue
    'Medium': '#a25ddc',   // Purple
    'High': '#e2445c',     // Red
    'Urgent': '#bb3354',   // Dark red
  };
  return colors[priority as keyof typeof colors] || '#a25ddc';
};

// Section colors for left borders
const getSectionColor = (section: string): string => {
  const colors = {
    'To-Do': '#00c875',      // Green
    'Completed': '#00d2d3',  // Teal
    'Backlog': '#fdab3d',    // Orange
    'In Review': '#a25ddc',  // Purple
  };
  return colors[section as keyof typeof colors] || '#00c875';
};

// Monday.com exact status pill component
const StatusPill: React.FC<{ status: string; onClick?: () => void }> = ({ status, onClick }) => {
  const { getStatusColor, getStatusDisplayName } = useStatus();

  return (
    <div
      className="px-3 py-1 rounded-full text-white text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity min-w-[100px] text-center"
      style={{ backgroundColor: getStatusColor(status, 'task') }}
      onClick={onClick}
    >
      {getStatusDisplayName(status, 'task')}
    </div>
  );
};

// Monday.com exact priority indicator component
const PriorityIndicator: React.FC<{ priority: string; onClick?: () => void }> = ({ priority, onClick }) => (
  <div
    className="px-3 py-1 rounded text-white text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity min-w-[70px] text-center"
    style={{ backgroundColor: getPriorityColor(priority) }}
    onClick={onClick}
  >
    {priority}
  </div>
);

// User avatar component
const UserAvatar: React.FC<{ user?: { name: string; email: string } }> = ({ user }) => {
  if (!user) {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
        <span className="text-xs text-gray-600">?</span>
      </div>
    );
  }

  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
      <span className="text-xs text-white font-medium">{initials}</span>
    </div>
  );
};

// Inline add task component
const InlineAddTask: React.FC<{ 
  section: string; 
  onAdd: (task: Omit<Task, 'id'>) => void;
  onCancel: () => void;
}> = ({ section, onAdd, onCancel }) => {
  const [title, setTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAdd({
        title: title.trim(),
        status: section === 'Completed' ? 'Done' : 'Not Started',
        priority: 'Medium',
        section,
        position: 0,
        lastUpdated: new Date().toISOString(),
      });
      setTitle('');
      onCancel();
    }
  };

  return (
    <tr className="bg-blue-50 border-b border-gray-100">
      {/* Drag handle column */}
      <td className="px-3 py-2 border-r border-gray-100 w-6"></td>

      {/* Task title input */}
      <td className="px-3 py-2 border-r border-gray-100">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter task title..."
            className="w-full px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            autoFocus
          />
        </form>
      </td>

      {/* Assigned To column */}
      <td className="px-3 py-2 border-r border-gray-100"></td>

      {/* Status column */}
      <td className="px-3 py-2 border-r border-gray-100"></td>

      {/* Due date column */}
      <td className="px-3 py-2 border-r border-gray-100"></td>

      {/* Priority column */}
      <td className="px-3 py-2 border-r border-gray-100"></td>

      {/* Last updated column with action buttons */}
      <td className="px-3 py-2">
        <div className="flex items-center space-x-1">
          <button
            onClick={handleSubmit}
            className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700"
          >
            Add
          </button>
          <button
            onClick={onCancel}
            className="px-2 py-1 bg-gray-300 text-gray-700 text-xs font-medium rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </td>
    </tr>
  );
};

// Task row component
const TaskRow: React.FC<{
  task: Task;
  index: number;
  onUpdate: (updates: Partial<Task>) => void;
  formatDate?: (dateString: string) => string;
  getRelativeTime?: (dateString: string) => string;
}> = ({ task, index, onUpdate, formatDate: parentFormatDate, getRelativeTime }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);

  const handleTitleSubmit = () => {
    if (editTitle.trim() !== task.title) {
      onUpdate({ title: editTitle.trim() });
    }
    setIsEditing(false);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));

    if (diffDays === 0) {
      if (diffHours === 0) return 'Just now';
      return `${diffHours} hours ago`;
    } else if (diffDays < 365) {
      return `${diffDays} days ago`;
    } else {
      const diffYears = Math.floor(diffDays / 365);
      return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
    }
  };

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <tr
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`border-b border-gray-100 hover:bg-blue-50 group transition-colors duration-150 ${
            snapshot.isDragging ? 'shadow-lg bg-white' : ''
          }`}
        >
          {/* Drag handle column */}
          <td className="px-3 py-2 border-r border-gray-100 w-6">
            <div className="w-3 h-3 rounded-full bg-gray-300 group-hover:bg-gray-400 transition-colors duration-150"></div>
          </td>

          {/* Task title */}
          <td className="px-3 py-2 border-r border-gray-100">
            {isEditing ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleSubmit();
                  if (e.key === 'Escape') {
                    setEditTitle(task.title);
                    setIsEditing(false);
                  }
                }}
                className="w-full px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                autoFocus
              />
            ) : (
              <span
                className="cursor-pointer hover:text-blue-600 text-sm font-normal text-gray-900"
                onClick={() => setIsEditing(true)}
              >
                {task.title || `Task ${index + 1}`}
              </span>
            )}
          </td>

          {/* Assigned To */}
          <td className="px-3 py-2 border-r border-gray-100">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
                {task.assignee?.name?.charAt(0) || 'U'}
              </div>
              <span className="text-xs text-gray-900 truncate">
                {task.assignee?.name || 'Unassigned'}
              </span>
            </div>
          </td>

          {/* Status */}
          <td className="px-3 py-2 border-r border-gray-100">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
              {task.status}
            </span>
          </td>

          {/* Due date */}
          <td className="px-3 py-2 border-r border-gray-100">
            {task.dueDate && (
              <span className="text-xs text-gray-900">
                {parentFormatDate ? parentFormatDate(task.dueDate) : new Date(task.dueDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            )}
          </td>

          {/* Priority */}
          <td className="px-3 py-2 border-r border-gray-100">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </span>
          </td>

          {/* Last updated */}
          <td className="px-3 py-2">
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs">
                {task.assignee?.name?.charAt(0) || 'U'}
              </div>
              <span className="text-xs text-gray-500">
                {getRelativeTime ? getRelativeTime(task.lastUpdated) : formatDate(task.lastUpdated)}
              </span>
            </div>
          </td>
        </tr>
      )}
    </Draggable>
  );
};

export const TaskBoard: React.FC<TaskBoardProps> = ({
  tasks,
  columns,
  onTaskUpdate,
  onTaskCreate,
  onTaskMove,
  loading = false,
  groupBy = 'section',
}) => {
  const [showAddTask, setShowAddTask] = useState<string | null>(null);

  // Helper function to get section color
  const getSectionColor = (section: string) => {
    const colors = {
      'To-Do': '#00c875',
      'In Progress': '#fdab3d',
      'Done': '#00c875',
      'Completed': '#00c875'
    };
    return colors[section as keyof typeof colors] || '#00c875';
  };

  // Helper function to format dates like Monday.com (Aug 23, Aug 24)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Helper function to get relative time like Monday.com (2 hours ago, Just now)
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return formatDate(dateString);
  };

  // Group tasks by the specified criteria
  const groupedTasks = React.useMemo(() => {
    const groups: Record<string, Task[]> = {};
    
    tasks.forEach(task => {
      let key: string;
      switch (groupBy) {
        case 'status':
          key = task.status;
          break;
        case 'priority':
          key = task.priority;
          break;
        case 'assignee':
          key = task.assignee?.name || 'Unassigned';
          break;
        case 'section':
        default:
          key = task.section;
          break;
      }
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(task);
    });

    // Sort tasks within each group by position
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => a.position - b.position);
    });

    return groups;
  }, [tasks, groupBy]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    onTaskMove(draggableId, destination.droppableId, destination.index);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Monday.com style toolbar */}
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button className="px-3 py-1.5 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors">
                New task
              </button>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <button className="hover:text-gray-900 flex items-center">
                  <Filter className="w-4 h-4 mr-1" />
                  Filter
                </button>
                <button className="hover:text-gray-900 flex items-center">
                  <ArrowUpDown className="w-4 h-4 mr-1" />
                  Sort
                </button>
                <button className="hover:text-gray-900">Hide</button>
                <button className="hover:text-gray-900">Group by</button>
              </div>
            </div>
          </div>
        </div>

        {/* Monday.com style table with exact grid styling */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            {/* Table Headers - exact Monday.com style */}
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 w-6"></th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 min-w-[250px]">Task</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 w-24">Owner</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 w-28">Status</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 w-24">Due date</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 w-20">Priority</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Last updated</th>
              </tr>
            </thead>
          </table>
        </div>

        {/* Monday.com style grouped sections */}
        {Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
          <div key={groupName} className="border-collapse">
            {/* Monday.com exact section header with colored left border */}
            <div
              className="relative bg-gray-50 border-b border-gray-200"
              style={{ borderLeft: `4px solid ${getSectionColor(groupName)}` }}
            >
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    <td className="px-3 py-2 border-r border-gray-200 w-6">
                      <button className="text-gray-400 hover:text-gray-600">
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </td>
                    <td className="px-3 py-2 border-r border-gray-200" colSpan={6}>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900 text-sm">{groupName}</h3>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Task rows with Monday.com grid styling */}
            <Droppable droppableId={groupName}>
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  <table className="w-full border-collapse">
                    <tbody>
                      {groupTasks.map((task, index) => (
                        <TaskRow
                          key={task.id}
                          task={task}
                          index={index}
                          onUpdate={(updates) => onTaskUpdate(task.id, updates)}
                          formatDate={formatDate}
                          getRelativeTime={getRelativeTime}
                        />
                      ))}
                      {provided.placeholder}
                    </tbody>
                  </table>

                  {/* Add task row - Monday.com style */}
                  <table className="w-full border-collapse">
                    <tbody>
                      {showAddTask === groupName ? (
                        <InlineAddTask
                          section={groupName}
                          onAdd={onTaskCreate}
                          onCancel={() => setShowAddTask(null)}
                        />
                      ) : (
                        <tr className="hover:bg-gray-50 border-b border-gray-100">
                          <td className="px-3 py-2 border-r border-gray-100 w-6"></td>
                          <td className="px-3 py-2 border-r border-gray-100" colSpan={6}>
                            <button
                              onClick={() => setShowAddTask(groupName)}
                              className="text-xs text-gray-500 hover:text-blue-600 flex items-center"
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              + Add task
                            </button>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
};
