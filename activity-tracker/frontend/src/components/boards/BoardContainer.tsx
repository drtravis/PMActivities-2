import React, { useState, useEffect, useMemo } from 'react';
import { BoardHeader, BoardFilters, BoardView } from './BoardHeader';
import { TaskBoard, Task, Column } from './TaskBoard';
import { KanbanView } from './KanbanView';
import { useAuthStore } from '@/lib/store';
import { boardsAPI, tasksAPI } from '@/lib/api';

interface BoardContainerProps {
  boardId: string;
}

export const BoardContainer: React.FC<BoardContainerProps> = ({ boardId }) => {
  const { user } = useAuthStore();
  const [board, setBoard] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<BoardView>('main');
  const [filters, setFilters] = useState<BoardFilters>({
    search: '',
    assignee: [],
    status: [],
    priority: [],
    dueDate: null,
  });

  // Default columns for Monday.com-style board
  const defaultColumns: Column[] = [
    { id: 'title', name: 'Task', type: 'text', width: 300, sortable: true },
    { id: 'assignee', name: 'Person', type: 'user', width: 120, sortable: true },
    { id: 'status', name: 'Status', type: 'select', width: 120, sortable: true },
    { id: 'dueDate', name: 'Due Date', type: 'date', width: 120, sortable: true },
    { id: 'priority', name: 'Priority', type: 'select', width: 100, sortable: true },
    { id: 'lastUpdated', name: 'Last Updated', type: 'date', width: 120, sortable: true },
  ];

  useEffect(() => {
    loadBoardData();
  }, [boardId]);

  const loadBoardData = async () => {
    setLoading(true);
    try {
      const [boardData, tasksData] = await Promise.all([
        boardsAPI.getById(boardId),
        boardsAPI.getTasks(boardId),
      ]);

      setBoard(boardData);
      
      // Transform tasks to match our Task interface
      const transformedTasks: Task[] = tasksData.map((task: any) => ({
        id: task.id,
        title: task.title,
        assignee: task.assignee ? {
          id: task.assignee.id,
          name: task.assignee.name,
          email: task.assignee.email,
        } : undefined,
        status: task.status as Task['status'],
        priority: task.priority as Task['priority'],
        dueDate: task.dueDate,
        section: task.section || 'General',
        position: task.position || 0,
        lastUpdated: task.updatedAt || task.createdAt,
        customData: task.customData || {},
        tags: task.tags || [],
      }));

      setTasks(transformedTasks);
    } catch (error) {
      console.error('Error loading board data:', error);
      // Fallback to mock data for development
      setBoard({
        id: boardId,
        name: 'Sample Project Board',
        description: 'A sample board for development',
        members: [
          { id: '1', name: 'John Doe', email: 'john@example.com' },
          { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
        ],
      });
      setTasks(generateMockTasks());
    } finally {
      setLoading(false);
    }
  };

  const generateMockTasks = (): Task[] => {
    return [
      {
        id: '1',
        title: 'Design new homepage layout',
        assignee: { id: '1', name: 'John Doe', email: 'john@example.com' },
        status: 'Working on it',
        priority: 'High',
        dueDate: '2024-01-15',
        section: 'Design',
        position: 0,
        lastUpdated: new Date().toISOString(),
        tags: ['design', 'homepage'],
      },
      {
        id: '2',
        title: 'Implement user authentication',
        assignee: { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
        status: 'Not Started',
        priority: 'Urgent',
        dueDate: '2024-01-10',
        section: 'Development',
        position: 1,
        lastUpdated: new Date().toISOString(),
        tags: ['auth', 'backend'],
      },
      {
        id: '3',
        title: 'Write API documentation',
        status: 'Done',
        priority: 'Medium',
        section: 'Documentation',
        position: 2,
        lastUpdated: new Date().toISOString(),
        tags: ['docs', 'api'],
      },
      {
        id: '4',
        title: 'Fix mobile responsive issues',
        assignee: { id: '1', name: 'John Doe', email: 'john@example.com' },
        status: 'Stuck',
        priority: 'High',
        dueDate: '2024-01-12',
        section: 'Bug Fixes',
        position: 3,
        lastUpdated: new Date().toISOString(),
        tags: ['mobile', 'css'],
      },
    ];
  };

  // Filter tasks based on current filters
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Search filter
      if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(task.status)) {
        return false;
      }

      // Priority filter
      if (filters.priority.length > 0 && !filters.priority.includes(task.priority)) {
        return false;
      }

      // Assignee filter
      if (filters.assignee.length > 0 && (!task.assignee || !filters.assignee.includes(task.assignee.id))) {
        return false;
      }

      // Due date filter
      if (filters.dueDate && task.dueDate) {
        const dueDate = new Date(task.dueDate);
        const now = new Date();
        const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        switch (filters.dueDate) {
          case 'overdue':
            if (diffDays >= 0) return false;
            break;
          case 'today':
            if (diffDays !== 0) return false;
            break;
          case 'this_week':
            if (diffDays < 0 || diffDays > 7) return false;
            break;
          case 'this_month':
            if (diffDays < 0 || diffDays > 30) return false;
            break;
        }
      }

      return true;
    });
  }, [tasks, filters]);

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    try {
      await tasksAPI.update(taskId, updates);
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, ...updates, lastUpdated: new Date().toISOString() } : task
      ));
    } catch (error) {
      console.error('Error updating task:', error);
      // Optimistic update for development
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, ...updates, lastUpdated: new Date().toISOString() } : task
      ));
    }
  };

  const handleTaskCreate = async (taskData: Omit<Task, 'id'>) => {
    try {
      const newTask = await tasksAPI.create({
        ...taskData,
        boardId,
      });
      
      const transformedTask: Task = {
        id: newTask.id,
        title: newTask.title,
        assignee: newTask.assignee,
        status: newTask.status as Task['status'],
        priority: newTask.priority as Task['priority'],
        dueDate: newTask.dueDate,
        section: newTask.section || 'General',
        position: newTask.position || tasks.length,
        lastUpdated: newTask.createdAt,
        customData: newTask.customData || {},
        tags: newTask.tags || [],
      };

      setTasks(prev => [...prev, transformedTask]);
    } catch (error) {
      console.error('Error creating task:', error);
      // Fallback for development
      const newTask: Task = {
        id: Date.now().toString(),
        ...taskData,
        lastUpdated: new Date().toISOString(),
      };
      setTasks(prev => [...prev, newTask]);
    }
  };

  const handleTaskMove = async (taskId: string, newSection: string, newPosition: number) => {
    try {
      await tasksAPI.move(taskId, { section: newSection, position: newPosition });
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, section: newSection, position: newPosition, lastUpdated: new Date().toISOString() }
          : task
      ));
    } catch (error) {
      console.error('Error moving task:', error);
      // Optimistic update for development
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, section: newSection, position: newPosition, lastUpdated: new Date().toISOString() }
          : task
      ));
    }
  };

  const handleBoardNameChange = async (newName: string) => {
    try {
      await boardsAPI.update(boardId, { name: newName });
      setBoard(prev => ({ ...prev, name: newName }));
    } catch (error) {
      console.error('Error updating board name:', error);
      // Optimistic update for development
      setBoard(prev => ({ ...prev, name: newName }));
    }
  };

  const handleAddColumn = () => {
    // TODO: Implement add column functionality
    console.log('Add column clicked');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Board not found</h3>
          <p className="text-gray-500">The board you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <BoardHeader
        boardName={board.name}
        onBoardNameChange={handleBoardNameChange}
        onAddTask={() => handleTaskCreate({
          title: 'New Task',
          status: 'Not Started',
          priority: 'Medium',
          section: 'General',
          position: tasks.length,
          lastUpdated: new Date().toISOString(),
        })}
        onAddColumn={handleAddColumn}
        onFilterChange={setFilters}
        onViewChange={setCurrentView}
        currentView={currentView}
        taskCount={filteredTasks.length}
        memberCount={board.members?.length || 0}
        filters={filters}
      />

      <div className="flex-1 overflow-hidden">
        {currentView === 'main' && (
          <TaskBoard
            tasks={filteredTasks}
            columns={defaultColumns}
            onTaskUpdate={handleTaskUpdate}
            onTaskCreate={handleTaskCreate}
            onTaskMove={handleTaskMove}
            loading={false}
          />
        )}

        {currentView === 'kanban' && (
          <KanbanView
            tasks={filteredTasks}
            onTaskUpdate={handleTaskUpdate}
            onTaskCreate={handleTaskCreate}
            onTaskMove={(taskId, newStatus, newPosition) => 
              handleTaskUpdate(taskId, { status: newStatus as Task['status'] })
            }
          />
        )}

        {(currentView === 'timeline' || currentView === 'calendar' || currentView === 'chart') && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900">Coming Soon</h3>
              <p className="text-gray-500">The {currentView} view is under development.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
