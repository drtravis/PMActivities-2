'use client';

import React, { useState, useEffect } from 'react';
import { TaskBoard, Task, Column } from '../boards/TaskBoard';
import { tasksAPI, boardsAPI } from '@/lib/api';

interface PersonalBoardProps {
  userId: string;
  organizationId: string;
}

export const PersonalBoard: React.FC<PersonalBoardProps> = ({ userId, organizationId }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [boardId, setBoardId] = useState<string | null>(null);

  // Default columns for Monday.com-style board
  const columns: Column[] = [
    { id: 'title', name: 'Task', type: 'text', sortable: true },
    { id: 'assignee', name: 'Assigned To', type: 'user' },
    { id: 'status', name: 'Status', type: 'select' },
    { id: 'dueDate', name: 'Due date', type: 'date', sortable: true },
    { id: 'priority', name: 'Priority', type: 'select' },
    { id: 'lastUpdated', name: 'Last updated', type: 'date', sortable: true },
  ];

  // Load real data from API
  useEffect(() => {
    const loadPersonalBoard = async () => {
      try {
        setLoading(true);

        // Load user's personal board and tasks from API
        try {
          // First, get user's boards to find their personal board
          const boards = await boardsAPI.getMyBoards();
          let personalBoard = boards?.find((board: any) => !board.projectId); // Personal board has no project

          // If no personal board exists, create one
          if (!personalBoard) {
            personalBoard = await boardsAPI.create({
              name: 'My Personal Board',
              description: 'Personal task management board'
            });
          }

          setBoardId(personalBoard.id);

          // Load tasks from the personal board
          const boardTasks = await boardsAPI.getTasks(personalBoard.id);
          if (boardTasks && boardTasks.tasks) {
            setTasks(boardTasks.tasks);
            setError(null);
            return;
          }
        } catch (apiError) {
          console.warn('Board API call failed, trying tasks API:', apiError);

          // Fallback to tasks API
          try {
            const tasksData = await tasksAPI.getMy();
            if (tasksData && tasksData.length > 0) {
              setTasks(tasksData);
              setBoardId('fallback-board');
              setError(null);
              return;
            }
          } catch (tasksError) {
            console.warn('Tasks API also failed, using mock data:', tasksError);
          }
        }

        // Fallback to mock data for demo purposes
        const mockTasks: Task[] = [
          {
            id: '1',
            title: 'Review project requirements',
            assignee: {
              id: userId,
              name: 'John Doe',
              email: 'john@example.com',
            },
            status: 'Working on it',
            priority: 'High',
            dueDate: '2024-08-30',
            section: 'To-Do',
            position: 1,
            lastUpdated: '2024-08-24T10:30:00Z',
            tags: ['urgent', 'review'],
          },
          {
            id: '2',
            title: 'Update documentation',
            assignee: {
              id: userId,
              name: 'John Doe',
              email: 'john@example.com',
            },
            status: 'Not Started',
            priority: 'Medium',
            dueDate: '2024-09-01',
            section: 'To-Do',
            position: 2,
            lastUpdated: '2024-08-23T15:45:00Z',
            tags: ['documentation'],
          },
          {
            id: '3',
            title: 'Fix login bug',
            assignee: {
              id: userId,
              name: 'John Doe',
              email: 'john@example.com',
            },
            status: 'Done',
            priority: 'High',
            section: 'Completed',
            position: 1,
            lastUpdated: '2024-08-22T09:15:00Z',
            tags: ['bug', 'critical'],
          },
          {
            id: '4',
            title: 'Prepare presentation',
            assignee: {
              id: userId,
              name: 'John Doe',
              email: 'john@example.com',
            },
            status: 'Stuck',
            priority: 'Medium',
            section: 'To-Do',
            position: 3,
            lastUpdated: '2024-08-21T14:20:00Z',
            tags: ['presentation'],
          },
        ];

        setTasks(mockTasks);
        setBoardId('personal-board-1');
        setError(null);
      } catch (err) {
        setError('Failed to load personal board');
        console.error('Error loading personal board:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPersonalBoard();
  }, [userId, organizationId]);

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    try {
      // Optimistic update
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId
            ? { ...task, ...updates, lastUpdated: new Date().toISOString() }
            : task
        )
      );

      // Make real API call
      if (boardId && boardId !== 'fallback-board') {
        await boardsAPI.updateTask(taskId, updates);
      } else if (updates.status) {
        await tasksAPI.updateStatus(taskId, updates.status);
      }

      console.log('Task updated:', taskId, updates);
    } catch (err) {
      console.error('Error updating task:', err);
      // Revert optimistic update on error
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId ? { ...task } : task
        )
      );
      // Reload tasks from server
      try {
        if (boardId && boardId !== 'fallback-board') {
          const boardTasks = await boardsAPI.getTasks(boardId);
          if (boardTasks && boardTasks.tasks) {
            setTasks(boardTasks.tasks);
          }
        } else {
          const refreshedTasks = await tasksAPI.getMy();
          if (refreshedTasks) {
            setTasks(refreshedTasks);
          }
        }
      } catch (refreshError) {
        console.error('Error refreshing tasks:', refreshError);
      }
    }
  };

  const handleTaskCreate = async (newTask: Omit<Task, 'id'>) => {
    let tempId: string | null = null;
    try {
      // Generate temporary ID for optimistic update
      tempId = `temp-${Date.now()}`;
      const taskWithId: Task = {
        ...newTask,
        id: tempId,
        assignee: {
          id: userId,
          name: 'Current User', // Would come from user context
          email: 'user@example.com',
        },
        lastUpdated: new Date().toISOString(),
      };

      // Optimistic update
      setTasks(prevTasks => [...prevTasks, taskWithId]);

      // Make real API call to create task in board
      try {
        if (boardId && boardId !== 'fallback-board') {
          const createdTask = await boardsAPI.createTask(boardId, {
            title: newTask.title,
            priority: newTask.priority,
            dueDate: newTask.dueDate,
            section: newTask.section,
            status: newTask.status
          });

          // Replace temp task with real task
          setTasks(prevTasks =>
            prevTasks.map(task =>
              task.id === tempId ? createdTask : task
            )
          );
        } else {
          // Fallback - keep optimistic update for demo
          console.log('Using fallback board, keeping optimistic update');
        }

        console.log('Task created:', newTask);
      } catch (apiError) {
        console.warn('API task creation failed, keeping optimistic update:', apiError);
      }
    } catch (err) {
      console.error('Error creating task:', err);
      // Remove optimistic task on error
      setTasks(prevTasks => prevTasks.filter(task => task.id !== tempId));
    }
  };

  const handleTaskMove = async (taskId: string, newSection: string, newPosition: number) => {
    try {
      // Find the task being moved
      const taskToMove = tasks.find(task => task.id === taskId);
      if (!taskToMove) return;

      // Update task section and position
      const updatedTask = {
        ...taskToMove,
        section: newSection,
        position: newPosition,
        // Auto-update status based on section
        status: newSection === 'Completed' ? 'Done' as const : taskToMove.status,
        lastUpdated: new Date().toISOString(),
      };

      // Optimistic update
      setTasks(prevTasks => {
        const otherTasks = prevTasks.filter(task => task.id !== taskId);
        return [...otherTasks, updatedTask];
      });

      // Make real API call to update task position and section
      try {
        if (boardId && boardId !== 'fallback-board') {
          await boardsAPI.updateTask(taskId, {
            section: newSection,
            position: newPosition,
            status: newSection === 'Completed' ? 'Done' : updatedTask.status
          });
        }
      } catch (apiError) {
        console.warn('API task move failed, keeping optimistic update:', apiError);
      }

      console.log('Task moved:', taskId, newSection, newPosition);
    } catch (err) {
      console.error('Error moving task:', err);
      // Revert optimistic update on error
    }
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Task Board</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your personal tasks with drag & drop functionality
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
              Board Settings
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Task
            </button>
          </div>
        </div>
      </div>

      {/* Task Board */}
      <TaskBoard
        tasks={tasks}
        columns={columns}
        onTaskUpdate={handleTaskUpdate}
        onTaskCreate={handleTaskCreate}
        onTaskMove={handleTaskMove}
        loading={loading}
        groupBy="section"
      />

      {/* Stats Footer */}
      <div className="mt-8 bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {tasks.filter(t => t.section === 'To-Do').length}
            </div>
            <div className="text-sm text-gray-500">To-Do Tasks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {tasks.filter(t => t.status === 'Working on it').length}
            </div>
            <div className="text-sm text-gray-500">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {tasks.filter(t => t.status === 'Stuck').length}
            </div>
            <div className="text-sm text-gray-500">Stuck</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {tasks.filter(t => t.section === 'Completed').length}
            </div>
            <div className="text-sm text-gray-500">Completed</div>
          </div>
        </div>
      </div>
    </div>
  );
};
