import React, { useEffect, useState } from 'react';
import { BaseWidget } from './BaseWidget';
import { DashboardWidget } from '@/lib/dashboardStore';
import { useAuthStore } from '@/lib/store';
import { tasksAPI } from '@/lib/api';

interface TasksWidgetProps {
  widget: DashboardWidget;
  onEdit?: () => void;
  onRemove?: () => void;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string;
  assignee?: { name: string };
  project?: { name: string };
}

export const TasksWidget: React.FC<TasksWidgetProps> = ({ widget, onEdit, onRemove }) => {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, [user]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      let taskData: Task[] = [];
      
      if (user?.role === 'MEMBER') {
        // Load member's own tasks
        taskData = await tasksAPI.getMy();
      } else if (user?.role === 'PROJECT_MANAGER') {
        // Load all tasks for PM's projects
        taskData = await tasksAPI.getAll();
      } else {
        // Admin sees all tasks
        taskData = await tasksAPI.getAll();
      }

      // Limit to recent tasks for widget display
      const recentTasks = taskData.slice(0, widget.config?.limit || 5);
      setTasks(recentTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      // Fallback to mock data
      setTasks(generateMockTasks());
    } finally {
      setLoading(false);
    }
  };

  const generateMockTasks = (): Task[] => {
    const mockTasks = [
      {
        id: '1',
        title: 'Update user interface components',
        status: 'Working on it',
        priority: 'High',
        dueDate: '2025-08-26',
        assignee: { name: user?.name || 'You' },
        project: { name: 'Frontend Redesign' }
      },
      {
        id: '2',
        title: 'Review API documentation',
        status: 'Not Started',
        priority: 'Medium',
        dueDate: '2025-08-28',
        assignee: { name: user?.name || 'You' },
        project: { name: 'Backend API' }
      },
      {
        id: '3',
        title: 'Fix authentication bug',
        status: 'Done',
        priority: 'High',
        assignee: { name: user?.name || 'You' },
        project: { name: 'Security Updates' }
      },
      {
        id: '4',
        title: 'Write unit tests',
        status: 'Stuck',
        priority: 'Medium',
        dueDate: '2025-08-30',
        assignee: { name: user?.name || 'You' },
        project: { name: 'Quality Assurance' }
      }
    ];

    return mockTasks.slice(0, widget.config?.limit || 5);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'Not Started': 'bg-gray-100 text-gray-800',
      'Working on it': 'bg-blue-100 text-blue-800',
      'Stuck': 'bg-red-100 text-red-800',
      'Done': 'bg-green-100 text-green-800',
      'Blocked': 'bg-yellow-100 text-yellow-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      'Low': 'text-green-600',
      'Medium': 'text-yellow-600',
      'High': 'text-red-600',
      'Urgent': 'text-red-700 font-bold',
    };
    return colors[priority as keyof typeof colors] || 'text-gray-600';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 0) return `In ${diffDays} days`;
    return `${Math.abs(diffDays)} days ago`;
  };

  return (
    <BaseWidget widget={widget} onEdit={onEdit} onRemove={onRemove}>
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <svg className="w-12 h-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v11a2 2 0 002 2h2m0-13h10a2 2 0 012 2v11a2 2 0 01-2 2H9m0-13v13" />
          </svg>
          <p className="text-sm">No tasks found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors duration-150 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-900 line-clamp-2 flex-1">
                  {task.title}
                </h4>
                <span className={`text-xs font-medium ml-2 ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(task.status)}`}>
                  {task.status}
                </span>
                
                {task.dueDate && (
                  <span className="text-xs text-gray-500">
                    {formatDate(task.dueDate)}
                  </span>
                )}
              </div>
              
              {task.project && (
                <div className="mt-2 text-xs text-gray-500">
                  📁 {task.project.name}
                </div>
              )}
            </div>
          ))}
          
          {tasks.length > 0 && (
            <div className="pt-2 border-t border-gray-100">
              <button className="w-full text-center text-xs text-blue-600 hover:text-blue-800 font-medium">
                View All Tasks →
              </button>
            </div>
          )}
        </div>
      )}
    </BaseWidget>
  );
};
