import React, { useState } from 'react';
import { Check, Calendar, User, Flag, MessageSquare, Paperclip, MoreHorizontal, Eye } from 'lucide-react';
import { Task } from '../boards/TaskBoard';
import { TaskDetailModal } from './TaskDetailModal';

interface TaskListViewProps {
  tasks: Task[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskSelect?: (taskIds: string[]) => void;
  selectedTasks?: string[];
  showSelection?: boolean;
  groupBy?: 'none' | 'status' | 'priority' | 'assignee' | 'section';
  sortBy?: 'title' | 'dueDate' | 'priority' | 'status' | 'lastUpdated';
  sortOrder?: 'asc' | 'desc';
}

export const TaskListView: React.FC<TaskListViewProps> = ({
  tasks,
  onTaskUpdate,
  onTaskDelete,
  onTaskSelect,
  selectedTasks = [],
  showSelection = false,
  groupBy = 'none',
  sortBy = 'lastUpdated',
  sortOrder = 'desc',
}) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Sort tasks
  const sortedTasks = [...tasks].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'title':
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case 'dueDate':
        aValue = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        bValue = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        break;
      case 'priority':
        const priorityOrder = { 'Urgent': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
        aValue = priorityOrder[a.priority];
        bValue = priorityOrder[b.priority];
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      case 'lastUpdated':
        aValue = new Date(a.lastUpdated).getTime();
        bValue = new Date(b.lastUpdated).getTime();
        break;
      default:
        aValue = a.title;
        bValue = b.title;
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Group tasks
  const groupedTasks = React.useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Tasks': sortedTasks };
    }

    const groups: Record<string, Task[]> = {};
    
    sortedTasks.forEach(task => {
      let groupKey: string;
      
      switch (groupBy) {
        case 'status':
          groupKey = task.status;
          break;
        case 'priority':
          groupKey = task.priority;
          break;
        case 'assignee':
          groupKey = task.assignee?.name || 'Unassigned';
          break;
        case 'section':
          groupKey = task.section;
          break;
        default:
          groupKey = 'All Tasks';
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(task);
    });

    return groups;
  }, [sortedTasks, groupBy]);

  const handleTaskSelect = (taskId: string, checked: boolean) => {
    if (!onTaskSelect) return;
    
    const newSelection = checked
      ? [...selectedTasks, taskId]
      : selectedTasks.filter(id => id !== taskId);
    
    onTaskSelect(newSelection);
  };

  const handleSelectAll = (groupTasks: Task[], checked: boolean) => {
    if (!onTaskSelect) return;
    
    const groupTaskIds = groupTasks.map(task => task.id);
    const newSelection = checked
      ? [...new Set([...selectedTasks, ...groupTaskIds])]
      : selectedTasks.filter(id => !groupTaskIds.includes(id));
    
    onTaskSelect(newSelection);
  };

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Not Started': return '#c4c4c4';
      case 'Working on it': return '#fdab3d';
      case 'Stuck': return '#e2445c';
      case 'Done': return '#00c875';
      default: return '#c4c4c4';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent': return '#e2445c';
      case 'High': return '#ff7b00';
      case 'Medium': return '#fdab3d';
      case 'Low': return '#00c875';
      default: return '#c4c4c4';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)}d overdue`, color: 'text-red-600' };
    } else if (diffDays === 0) {
      return { text: 'Due today', color: 'text-orange-600' };
    } else if (diffDays <= 3) {
      return { text: `${diffDays}d left`, color: 'text-yellow-600' };
    } else {
      return { text: date.toLocaleDateString(), color: 'text-gray-600' };
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {Object.entries(groupedTasks).map(([groupName, groupTasks]) => {
        const isExpanded = expandedGroups.has(groupName) || groupBy === 'none';
        const groupSelectedCount = groupTasks.filter(task => selectedTasks.includes(task.id)).length;
        const isGroupFullySelected = groupSelectedCount === groupTasks.length && groupTasks.length > 0;
        const isGroupPartiallySelected = groupSelectedCount > 0 && groupSelectedCount < groupTasks.length;

        return (
          <div key={groupName} className="border-b border-gray-200 last:border-b-0">
            {/* Group Header */}
            {groupBy !== 'none' && (
              <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  {showSelection && (
                    <input
                      type="checkbox"
                      checked={isGroupFullySelected}
                      ref={input => {
                        if (input) input.indeterminate = isGroupPartiallySelected;
                      }}
                      onChange={(e) => handleSelectAll(groupTasks, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  )}
                  <button
                    onClick={() => toggleGroup(groupName)}
                    className="flex items-center space-x-2 text-left"
                  >
                    <span className="text-sm font-medium text-gray-900">{groupName}</span>
                    <span className="text-sm text-gray-500">({groupTasks.length})</span>
                  </button>
                </div>
                <button
                  onClick={() => toggleGroup(groupName)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Tasks List */}
            {isExpanded && (
              <div className="divide-y divide-gray-100">
                {groupTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-center p-4 hover:bg-gray-50 transition-colors ${
                      selectedTasks.includes(task.id) ? 'bg-blue-50' : ''
                    }`}
                  >
                    {/* Selection Checkbox */}
                    {showSelection && (
                      <div className="flex-shrink-0 mr-3">
                        <input
                          type="checkbox"
                          checked={selectedTasks.includes(task.id)}
                          onChange={(e) => handleTaskSelect(task.id, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </div>
                    )}

                    {/* Task Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0 group relative">
                          <h4
                            className="text-sm font-medium text-gray-900 truncate cursor-pointer"
                            title={task.title}
                          >
                            {task.title}
                          </h4>
                          {/* Tooltip on hover */}
                          <div className="absolute left-0 top-full mt-1 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg z-50 whitespace-normal max-w-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                            {task.title}
                          </div>
                          <div className="flex items-center space-x-4 mt-1">
                            {/* Status */}
                            <div className="flex items-center space-x-1">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: getStatusColor(task.status) }}
                              />
                              <span className="text-xs text-gray-600">{task.status}</span>
                            </div>

                            {/* Priority */}
                            <div className="flex items-center space-x-1">
                              <Flag 
                                className="w-3 h-3" 
                                style={{ color: getPriorityColor(task.priority) }}
                              />
                              <span className="text-xs text-gray-600">{task.priority}</span>
                            </div>

                            {/* Assignee */}
                            {task.assignee && (
                              <div className="flex items-center space-x-1">
                                <User className="w-3 h-3 text-gray-400" />
                                <span className="text-xs text-gray-600">{task.assignee.name}</span>
                              </div>
                            )}

                            {/* Due Date */}
                            {task.dueDate && (
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3 text-gray-400" />
                                {(() => {
                                  const dueDateInfo = formatDate(task.dueDate);
                                  return (
                                    <span className={`text-xs ${dueDateInfo.color}`}>
                                      {dueDateInfo.text}
                                    </span>
                                  );
                                })()}
                              </div>
                            )}

                            {/* Tags */}
                            {task.tags && task.tags.length > 0 && (
                              <div className="flex items-center space-x-1">
                                {task.tags.slice(0, 2).map((tag, index) => (
                                  <span
                                    key={index}
                                    className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {task.tags.length > 2 && (
                                  <span className="text-xs text-gray-400">
                                    +{task.tags.length - 2}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Task Meta & Actions */}
                        <div className="flex items-center space-x-3 ml-4">
                          {/* Comments Count */}
                          <div className="flex items-center space-x-1 text-gray-400">
                            <MessageSquare className="w-4 h-4" />
                            <span className="text-xs">0</span>
                          </div>

                          {/* Attachments Count */}
                          <div className="flex items-center space-x-1 text-gray-400">
                            <Paperclip className="w-4 h-4" />
                            <span className="text-xs">0</span>
                          </div>

                          {/* Last Updated */}
                          <span className="text-xs text-gray-500">
                            {new Date(task.lastUpdated).toLocaleDateString()}
                          </span>

                          {/* Actions */}
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => setSelectedTask(task)}
                              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                              title="View details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {groupTasks.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <p>No tasks in this group</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {tasks.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          <p>No tasks found</p>
          <p className="text-sm mt-1">Create your first task to get started</p>
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={onTaskUpdate}
          onDelete={onTaskDelete}
        />
      )}
    </div>
  );
};
