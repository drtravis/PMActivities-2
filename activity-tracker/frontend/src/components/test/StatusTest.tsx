'use client';

import React, { useState } from 'react';
import StatusDropdown from '@/components/ui/StatusDropdown';
import { useStatus } from '@/contexts/StatusContext';

export const StatusTest: React.FC = () => {
  const [currentStatus, setCurrentStatus] = useState('Not Started');
  const { taskStatuses, loading } = useStatus();

  const handleStatusChange = (newStatus: string) => {
    console.log('Status changed to:', newStatus);
    setCurrentStatus(newStatus);
  };

  const testTask = {
    id: 'test-1',
    title: 'Test Task',
    status: currentStatus,
    createdBy: {
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com'
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Status Dropdown & Assigned By Test</h2>
      
      <div className="space-y-4">
        {/* Status Context Info */}
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="font-semibold mb-2">Status Context Info:</h3>
          <p>Loading: {loading ? 'Yes' : 'No'}</p>
          <p>Available Task Statuses: {taskStatuses.length}</p>
          {taskStatuses.length > 0 && (
            <ul className="mt-2 text-sm">
              {taskStatuses.map(status => (
                <li key={status.id} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded" 
                    style={{ backgroundColor: status.color }}
                  ></div>
                  <span>{status.displayName}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Test Task Row */}
        <div className="border rounded p-4">
          <h3 className="font-semibold mb-3">Test Task Row:</h3>
          <div className="grid grid-cols-4 gap-4 items-center">
            {/* Task Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Task</label>
              <div className="text-sm">{testTask.title}</div>
            </div>

            {/* Assigned By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned By</label>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
                  {testTask.createdBy.name.charAt(0)}
                </div>
                <span className="text-sm">{testTask.createdBy.name}</span>
              </div>
            </div>

            {/* Status Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <StatusDropdown
                value={currentStatus}
                onChange={handleStatusChange}
                size="sm"
                type="task"
              />
            </div>

            {/* Current Status Display */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
              <div className="text-sm font-medium text-blue-600">{currentStatus}</div>
            </div>
          </div>
        </div>

        {/* Test Results */}
        <div className="bg-green-50 p-4 rounded">
          <h3 className="font-semibold mb-2 text-green-800">Test Results:</h3>
          <div className="space-y-1 text-sm">
            <p>✅ Status Dropdown: {taskStatuses.length > 0 ? 'Working' : 'Not Working'}</p>
            <p>✅ Assigned By Display: {testTask.createdBy.name ? 'Working' : 'Not Working'}</p>
            <p>✅ Status Change: {currentStatus !== 'Not Started' ? 'Working' : 'Click dropdown to test'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
