import React, { useState } from 'react';
import { Check, X, User, Flag, Calendar, Trash2, Archive, Copy, Move } from 'lucide-react';
import { Task } from '../boards/TaskBoard';

interface TaskBulkActionsProps {
  selectedTasks: string[];
  tasks: Task[];
  onBulkUpdate: (taskIds: string[], updates: Partial<Task>) => void;
  onBulkDelete: (taskIds: string[]) => void;
  onBulkMove: (taskIds: string[], targetSection: string) => void;
  onClearSelection: () => void;
  availableUsers?: Array<{ id: string; name: string; email: string }>;
  availableSections?: string[];
}

export const TaskBulkActions: React.FC<TaskBulkActionsProps> = ({
  selectedTasks,
  tasks,
  onBulkUpdate,
  onBulkDelete,
  onBulkMove,
  onClearSelection,
  availableUsers = [],
  availableSections = [],
}) => {
  const [showAssigneeMenu, setShowAssigneeMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const selectedTasksData = tasks.filter(task => selectedTasks.includes(task.id));

  const statusOptions = [
    { value: 'Not Started', label: 'Not Started', color: '#c4c4c4' },
    { value: 'Working on it', label: 'Working on it', color: '#fdab3d' },
    { value: 'Stuck', label: 'Stuck', color: '#e2445c' },
    { value: 'Done', label: 'Done', color: '#00c875' },
  ];

  const priorityOptions = [
    { value: 'Low', label: 'Low', color: '#00c875' },
    { value: 'Medium', label: 'Medium', color: '#fdab3d' },
    { value: 'High', label: 'High', color: '#ff7b00' },
    { value: 'Urgent', label: 'Urgent', color: '#e2445c' },
  ];

  const handleBulkStatusUpdate = (status: Task['status']) => {
    onBulkUpdate(selectedTasks, { status });
    setShowStatusMenu(false);
  };

  const handleBulkPriorityUpdate = (priority: Task['priority']) => {
    onBulkUpdate(selectedTasks, { priority });
    setShowPriorityMenu(false);
  };

  const handleBulkAssigneeUpdate = (assigneeId: string) => {
    const assignee = availableUsers.find(user => user.id === assigneeId);
    onBulkUpdate(selectedTasks, { assignee });
    setShowAssigneeMenu(false);
  };

  const handleBulkDueDateUpdate = (dueDate: string) => {
    onBulkUpdate(selectedTasks, { dueDate });
    setShowDatePicker(false);
  };

  const handleBulkMove = (section: string) => {
    onBulkMove(selectedTasks, section);
    setShowMoveMenu(false);
  };

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedTasks.length} tasks? This action cannot be undone.`)) {
      onBulkDelete(selectedTasks);
    }
  };

  const handleDuplicateTasks = () => {
    // Create duplicates of selected tasks
    selectedTasksData.forEach(task => {
      const duplicatedTask = {
        ...task,
        title: `${task.title} (Copy)`,
        status: 'Not Started' as Task['status'],
        lastUpdated: new Date().toISOString(),
      };
      // This would need to be implemented in the parent component
      console.log('Duplicate task:', duplicatedTask);
    });
  };

  if (selectedTasks.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[600px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-900">
                {selectedTasks.length} task{selectedTasks.length > 1 ? 's' : ''} selected
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {/* Assignee Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowAssigneeMenu(!showAssigneeMenu)}
                  className="flex items-center space-x-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <User className="w-4 h-4" />
                  <span>Assign</span>
                </button>
                {showAssigneeMenu && (
                  <div className="absolute bottom-full mb-2 left-0 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <div className="p-2">
                      <button
                        onClick={() => handleBulkAssigneeUpdate('')}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded"
                      >
                        Unassign
                      </button>
                      {availableUsers.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => handleBulkAssigneeUpdate(user.id)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded flex items-center space-x-2"
                        >
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-xs text-white font-medium">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span>{user.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Status Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                  className="flex items-center space-x-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <div className="w-3 h-3 bg-gray-400 rounded-full" />
                  <span>Status</span>
                </button>
                {showStatusMenu && (
                  <div className="absolute bottom-full mb-2 left-0 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <div className="p-2">
                      {statusOptions.map((status) => (
                        <button
                          key={status.value}
                          onClick={() => handleBulkStatusUpdate(status.value as Task['status'])}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded flex items-center space-x-2"
                        >
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: status.color }}
                          />
                          <span>{status.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Priority Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowPriorityMenu(!showPriorityMenu)}
                  className="flex items-center space-x-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Flag className="w-4 h-4" />
                  <span>Priority</span>
                </button>
                {showPriorityMenu && (
                  <div className="absolute bottom-full mb-2 left-0 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <div className="p-2">
                      {priorityOptions.map((priority) => (
                        <button
                          key={priority.value}
                          onClick={() => handleBulkPriorityUpdate(priority.value as Task['priority'])}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded flex items-center space-x-2"
                        >
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: priority.color }}
                          />
                          <span>{priority.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Due Date */}
              <div className="relative">
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="flex items-center space-x-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Due Date</span>
                </button>
                {showDatePicker && (
                  <div className="absolute bottom-full mb-2 left-0 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-3">
                    <div className="space-y-2">
                      <label className="block text-xs text-gray-500">Set due date</label>
                      <input
                        type="date"
                        onChange={(e) => handleBulkDueDateUpdate(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => handleBulkDueDateUpdate('')}
                        className="w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded"
                      >
                        Clear due date
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Move Dropdown */}
              {availableSections.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setShowMoveMenu(!showMoveMenu)}
                    className="flex items-center space-x-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Move className="w-4 h-4" />
                    <span>Move</span>
                  </button>
                  {showMoveMenu && (
                    <div className="absolute bottom-full mb-2 left-0 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      <div className="p-2">
                        {availableSections.map((section) => (
                          <button
                            key={section}
                            onClick={() => handleBulkMove(section)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded"
                          >
                            {section}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Duplicate */}
              <button
                onClick={handleDuplicateTasks}
                className="flex items-center space-x-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Copy className="w-4 h-4" />
                <span>Duplicate</span>
              </button>

              {/* Archive */}
              <button
                onClick={() => onBulkUpdate(selectedTasks, { section: 'Archived' })}
                className="flex items-center space-x-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Archive className="w-4 h-4" />
                <span>Archive</span>
              </button>

              {/* Delete */}
              <button
                onClick={handleBulkDelete}
                className="flex items-center space-x-1 px-3 py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>

          <button
            onClick={onClearSelection}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selection Summary */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <span>
                Status: {[...new Set(selectedTasksData.map(t => t.status))].join(', ')}
              </span>
              <span>
                Priority: {[...new Set(selectedTasksData.map(t => t.priority))].join(', ')}
              </span>
            </div>
            <span>
              {selectedTasksData.filter(t => t.assignee).length} assigned, {' '}
              {selectedTasksData.filter(t => t.dueDate).length} with due dates
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
