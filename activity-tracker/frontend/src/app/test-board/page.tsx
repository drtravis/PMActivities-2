'use client';

import React, { useState } from 'react';
import { TaskBoard, Task } from '../../components/boards/TaskBoard';

// Sample data for testing
const initialTasks: Task[] = [
  {
    id: '1',
    title: 'Design new user interface',
    status: 'Working on it',
    priority: 'High',
    section: 'To-Do',
    position: 0,
    assignee: {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com'
    },
    dueDate: '2024-08-30',
    lastUpdated: '2024-08-24T10:00:00Z'
  },
  {
    id: '2',
    title: 'Implement authentication system',
    status: 'Stuck',
    priority: 'Urgent',
    section: 'To-Do',
    position: 1,
    assignee: {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com'
    },
    dueDate: '2024-08-28',
    lastUpdated: '2024-08-23T15:30:00Z'
  },
  {
    id: '3',
    title: 'Write API documentation',
    status: 'Not Started',
    priority: 'Medium',
    section: 'To-Do',
    position: 2,
    dueDate: '2024-09-05',
    lastUpdated: '2024-08-22T09:15:00Z'
  },
  {
    id: '4',
    title: 'Set up CI/CD pipeline',
    status: 'Done',
    priority: 'High',
    section: 'Completed',
    position: 0,
    assignee: {
      id: '3',
      name: 'Mike Johnson',
      email: 'mike@example.com'
    },
    dueDate: '2024-08-25',
    lastUpdated: '2024-08-24T14:20:00Z'
  },
  {
    id: '5',
    title: 'Code review and testing',
    status: 'Done',
    priority: 'Medium',
    section: 'Completed',
    position: 1,
    assignee: {
      id: '4',
      name: 'Sarah Wilson',
      email: 'sarah@example.com'
    },
    dueDate: '2024-08-26',
    lastUpdated: '2024-08-23T11:45:00Z'
  }
];

const columns = [
  { id: 'task', name: 'Task', type: 'text' as const, width: 200 },
  { id: 'owner', name: 'Owner', type: 'user' as const, width: 120 },
  { id: 'status', name: 'Status', type: 'select' as const, width: 120 },
  { id: 'dueDate', name: 'Due date', type: 'date' as const, width: 120 },
  { id: 'priority', name: 'Priority', type: 'select' as const, width: 100 },
  { id: 'lastUpdated', name: 'Last updated', type: 'date' as const, width: 120 }
];

export default function TestBoardPage() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const handleTaskUpdate = (taskId: string, updates: Partial<Task>) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? { ...task, ...updates, lastUpdated: new Date().toISOString() }
          : task
      )
    );
    console.log('Task updated:', taskId, updates);
  };

  const handleTaskCreate = (newTask: Omit<Task, 'id'>) => {
    const task: Task = {
      ...newTask,
      id: Date.now().toString(),
      lastUpdated: new Date().toISOString()
    };
    setTasks(prevTasks => [...prevTasks, task]);
    console.log('Task created:', task);
  };

  const handleTaskMove = (taskId: string, newSection: string, newPosition: number) => {
    setTasks(prevTasks => {
      const taskIndex = prevTasks.findIndex(t => t.id === taskId);
      if (taskIndex === -1) return prevTasks;

      const updatedTasks = [...prevTasks];
      const task = updatedTasks[taskIndex];
      
      // Update task section and position
      updatedTasks[taskIndex] = {
        ...task,
        section: newSection,
        position: newPosition,
        lastUpdated: new Date().toISOString()
      };

      return updatedTasks;
    });
    console.log('Task moved:', taskId, 'to section:', newSection, 'position:', newPosition);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Monday.com Style Task Board - Test Page
          </h1>
          <p className="text-gray-600">
            Test all the features: drag & drop, inline editing, status changes, priority updates, and adding new tasks.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🧪 Testing Instructions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">✅ Features to Test:</h3>
              <ul className="space-y-1">
                <li>• Click task titles to edit them</li>
                <li>• Click status pills to cycle through statuses</li>
                <li>• Click priority indicators to change priority</li>
                <li>• Drag tasks between sections</li>
                <li>• Click "Add task" to create new tasks</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">🎨 Visual Elements:</h3>
              <ul className="space-y-1">
                <li>• Grid lines between all columns</li>
                <li>• Colored section borders (green/teal)</li>
                <li>• Monday.com style status pills</li>
                <li>• User avatars with initials</li>
                <li>• Hover effects and transitions</li>
              </ul>
            </div>
          </div>
        </div>

        <TaskBoard
          tasks={tasks}
          columns={columns}
          onTaskUpdate={handleTaskUpdate}
          onTaskCreate={handleTaskCreate}
          onTaskMove={handleTaskMove}
          groupBy="section"
        />

        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 Current Tasks Data</h2>
          <pre className="bg-gray-50 p-4 rounded-md text-xs overflow-x-auto">
            {JSON.stringify(tasks, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
