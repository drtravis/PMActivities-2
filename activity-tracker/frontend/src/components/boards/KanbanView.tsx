import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, MoreHorizontal, Calendar, User, Flag } from 'lucide-react';
import { Task } from './TaskBoard';

interface KanbanViewProps {
  tasks: Task[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskCreate: (task: Omit<Task, 'id'>) => void;
  onTaskMove: (taskId: string, newStatus: string, newPosition: number) => void;
}

interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  tasks: Task[];
}

export const KanbanView: React.FC<KanbanViewProps> = ({
  tasks,
  onTaskUpdate,
  onTaskCreate,
  onTaskMove,
}) => {
  const [addingToColumn, setAddingToColumn] = useState<string | null>(null);

  // Group tasks by status
  const columns: KanbanColumn[] = [
    {
      id: 'Not Started',
      title: 'Not Started',
      color: '#c4c4c4',
      tasks: tasks.filter(task => task.status === 'Not Started'),
    },
    {
      id: 'Working on it',
      title: 'Working on it',
      color: '#fdab3d',
      tasks: tasks.filter(task => task.status === 'Working on it'),
    },
    {
      id: 'Stuck',
      title: 'Stuck',
      color: '#e2445c',
      tasks: tasks.filter(task => task.status === 'Stuck'),
    },
    {
      id: 'Done',
      title: 'Done',
      color: '#00c875',
      tasks: tasks.filter(task => task.status === 'Done'),
    },
  ];

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId as Task['status'];
    onTaskMove(draggableId, newStatus, destination.index);
  };

  const handleAddTask = (columnId: string, title: string) => {
    onTaskCreate({
      title,
      status: columnId as Task['status'],
      priority: 'Medium',
      section: 'General',
      position: 0,
      lastUpdated: new Date().toISOString(),
    });
    setAddingToColumn(null);
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

  const formatDueDate = (dueDate?: string) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)}d overdue`, color: 'text-red-600 bg-red-100' };
    } else if (diffDays === 0) {
      return { text: 'Due today', color: 'text-orange-600 bg-orange-100' };
    } else if (diffDays <= 3) {
      return { text: `${diffDays}d left`, color: 'text-yellow-600 bg-yellow-100' };
    } else {
      return { text: date.toLocaleDateString(), color: 'text-gray-600 bg-gray-100' };
    }
  };

  return (
    <div className="h-full bg-gray-50 p-6">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex space-x-6 h-full overflow-x-auto">
          {columns.map((column) => (
            <div key={column.id} className="flex-shrink-0 w-80">
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: column.color }}
                  />
                  <h3 className="font-semibold text-gray-900">{column.title}</h3>
                  <span className="text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                    {column.tasks.length}
                  </span>
                </div>
                <button
                  onClick={() => setAddingToColumn(column.id)}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Column Content */}
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-3 min-h-[200px] p-2 rounded-lg transition-colors ${
                      snapshot.isDraggingOver ? 'bg-blue-50 border-2 border-blue-300 border-dashed' : ''
                    }`}
                  >
                    {/* Add Task Input */}
                    {addingToColumn === column.id && (
                      <AddTaskCard
                        onAdd={(title) => handleAddTask(column.id, title)}
                        onCancel={() => setAddingToColumn(null)}
                      />
                    )}

                    {/* Tasks */}
                    {column.tasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer ${
                              snapshot.isDragging ? 'rotate-3 shadow-lg' : ''
                            }`}
                          >
                            {/* Task Title */}
                            <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
                              {task.title}
                            </h4>

                            {/* Task Meta */}
                            <div className="space-y-2">
                              {/* Priority */}
                              {task.priority && (
                                <div className="flex items-center space-x-1">
                                  <Flag 
                                    className="w-3 h-3" 
                                    style={{ color: getPriorityColor(task.priority) }}
                                  />
                                  <span className="text-xs text-gray-600">{task.priority}</span>
                                </div>
                              )}

                              {/* Due Date */}
                              {task.dueDate && (
                                <div className="flex items-center space-x-1">
                                  <Calendar className="w-3 h-3 text-gray-400" />
                                  {(() => {
                                    const dueDateInfo = formatDueDate(task.dueDate);
                                    return dueDateInfo ? (
                                      <span className={`text-xs px-2 py-1 rounded-full ${dueDateInfo.color}`}>
                                        {dueDateInfo.text}
                                      </span>
                                    ) : null;
                                  })()}
                                </div>
                              )}

                              {/* Assignee */}
                              {task.assignee && (
                                <div className="flex items-center space-x-2">
                                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                    <span className="text-xs text-white font-medium">
                                      {task.assignee.name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <span className="text-xs text-gray-600">{task.assignee.name}</span>
                                </div>
                              )}

                              {/* Tags */}
                              {task.tags && task.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {task.tags.slice(0, 3).map((tag, tagIndex) => (
                                    <span
                                      key={tagIndex}
                                      className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                  {task.tags.length > 3 && (
                                    <span className="text-xs text-gray-400">
                                      +{task.tags.length - 3} more
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Task Actions */}
                            <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                              <span className="text-xs text-gray-400">
                                {new Date(task.lastUpdated).toLocaleDateString()}
                              </span>
                              <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

// Add Task Card Component
const AddTaskCard: React.FC<{
  onAdd: (title: string) => void;
  onCancel: () => void;
}> = ({ onAdd, onCancel }) => {
  const [title, setTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAdd(title.trim());
      setTitle('');
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter task title..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          autoFocus
        />
        <div className="flex items-center space-x-2 mt-3">
          <button
            type="submit"
            className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
          >
            Add Task
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1 bg-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
