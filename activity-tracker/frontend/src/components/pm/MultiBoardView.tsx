'use client';

import React, { useState, useEffect } from 'react';
import { TaskFilters } from './TaskFilters';
import { Task } from '../boards/TaskBoard';

interface MultiBoardViewProps {
  projectId?: string;
  userId: string;
  organizationId: string;
}

interface Member {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
}

interface TaskWithBoard extends Task {
  board: {
    id: string;
    name: string;
    owner: Member;
  };
  project?: Project;
}

export const MultiBoardView: React.FC<MultiBoardViewProps> = ({
  projectId,
  userId,
  organizationId,
}) => {
  const [tasks, setTasks] = useState<TaskWithBoard[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [filters, setFilters] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<string>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);
  const [totalTasks, setTotalTasks] = useState(0);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  // Mock data for development
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Mock members
        const mockMembers: Member[] = [
          { id: 'user-1', name: 'Alice Johnson', email: 'alice@example.com' },
          { id: 'user-2', name: 'Bob Smith', email: 'bob@example.com' },
          { id: 'user-3', name: 'Carol Davis', email: 'carol@example.com' },
          { id: 'user-4', name: 'David Wilson', email: 'david@example.com' },
        ];

        // Mock projects
        const mockProjects: Project[] = [
          { id: 'proj-1', name: 'Website Redesign', description: 'Complete website overhaul' },
          { id: 'proj-2', name: 'Mobile App', description: 'New mobile application' },
          { id: 'proj-3', name: 'API Integration', description: 'Third-party API integration' },
        ];

        // Mock tasks with board information
        const mockTasks: TaskWithBoard[] = [
          {
            id: 'task-1',
            title: 'Design homepage mockup',
            assignee: mockMembers[0],
            status: 'Working on it',
            priority: 'High',
            dueDate: '2024-08-30',
            section: 'To-Do',
            position: 1,
            lastUpdated: '2024-08-24T10:30:00Z',
            tags: ['design', 'homepage'],
            board: {
              id: 'board-1',
              name: 'Alice\'s Board',
              owner: mockMembers[0],
            },
            project: mockProjects[0],
          },
          {
            id: 'task-2',
            title: 'Implement user authentication',
            assignee: mockMembers[1],
            status: 'Stuck',
            priority: 'Urgent',
            dueDate: '2024-08-28',
            section: 'To-Do',
            position: 1,
            lastUpdated: '2024-08-23T15:45:00Z',
            tags: ['backend', 'auth'],
            board: {
              id: 'board-2',
              name: 'Bob\'s Board',
              owner: mockMembers[1],
            },
            project: mockProjects[1],
          },
          {
            id: 'task-3',
            title: 'Write API documentation',
            assignee: mockMembers[2],
            status: 'Done',
            priority: 'Medium',
            section: 'Completed',
            position: 1,
            lastUpdated: '2024-08-22T09:15:00Z',
            tags: ['documentation', 'api'],
            board: {
              id: 'board-3',
              name: 'Carol\'s Board',
              owner: mockMembers[2],
            },
            project: mockProjects[2],
          },
          {
            id: 'task-4',
            title: 'Test mobile responsiveness',
            assignee: mockMembers[3],
            status: 'Not Started',
            priority: 'Low',
            dueDate: '2024-09-05',
            section: 'To-Do',
            position: 2,
            lastUpdated: '2024-08-21T14:20:00Z',
            tags: ['testing', 'mobile'],
            board: {
              id: 'board-4',
              name: 'David\'s Board',
              owner: mockMembers[3],
            },
            project: mockProjects[0],
          },
        ];

        setMembers(mockMembers);
        setProjects(mockProjects);
        setTasks(mockTasks);
        setTotalTasks(mockTasks.length);
        setSelectedMembers(mockMembers.map(m => m.id)); // Select all members by default
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [projectId, organizationId]);

  // Filter and sort tasks
  const filteredTasks = React.useMemo(() => {
    let filtered = tasks;

    // Filter by selected members
    if (selectedMembers.length > 0) {
      filtered = filtered.filter(task => 
        task.assignee && selectedMembers.includes(task.assignee.id)
      );
    }

    // Apply other filters
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(search) ||
        task.assignee?.name.toLowerCase().includes(search) ||
        task.board.name.toLowerCase().includes(search)
      );
    }

    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(task => filters.status.includes(task.status));
    }

    if (filters.priority && filters.priority.length > 0) {
      filtered = filtered.filter(task => filters.priority.includes(task.priority));
    }

    if (filters.section && filters.section.length > 0) {
      filtered = filtered.filter(task => filters.section.includes(task.section));
    }

    if (filters.projectIds && filters.projectIds.length > 0) {
      filtered = filtered.filter(task => 
        task.project && filters.projectIds.includes(task.project.id)
      );
    }

    if (filters.dueFrom) {
      filtered = filtered.filter(task => 
        task.dueDate && task.dueDate >= filters.dueFrom
      );
    }

    if (filters.dueTo) {
      filtered = filtered.filter(task => 
        task.dueDate && task.dueDate <= filters.dueTo
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(task =>
        task.tags && filters.tags.some((tag: string) => task.tags!.includes(tag))
      );
    }

    // Sort tasks
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'title':
          aValue = a.title;
          bValue = b.title;
          break;
        case 'assignee':
          aValue = a.assignee?.name || '';
          bValue = b.assignee?.name || '';
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'priority':
          const priorityOrder = { 'Urgent': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
          break;
        case 'dueDate':
          aValue = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          bValue = b.dueDate ? new Date(b.dueDate).getTime() : 0;
          break;
        case 'updatedAt':
        default:
          aValue = new Date(a.lastUpdated).getTime();
          bValue = new Date(b.lastUpdated).getTime();
          break;
      }

      if (sortOrder === 'ASC') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [tasks, selectedMembers, filters, sortBy, sortOrder]);

  // Paginate tasks
  const paginatedTasks = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredTasks.slice(startIndex, startIndex + pageSize);
  }, [filteredTasks, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredTasks.length / pageSize);

  const handleMemberToggle = (memberId: string) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSelectAllMembers = () => {
    setSelectedMembers(members.map(m => m.id));
  };

  const handleDeselectAllMembers = () => {
    setSelectedMembers([]);
  };

  const handleTaskSelect = (taskId: string) => {
    setSelectedTasks(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleSelectAllTasks = () => {
    setSelectedTasks(paginatedTasks.map(t => t.id));
  };

  const handleDeselectAllTasks = () => {
    setSelectedTasks([]);
  };

  const handleBulkStatusUpdate = (newStatus: string) => {
    // In a real implementation, this would make API calls
    console.log('Bulk update status:', selectedTasks, newStatus);
    setSelectedTasks([]);
  };

  const handleBulkPriorityUpdate = (newPriority: string) => {
    // In a real implementation, this would make API calls
    console.log('Bulk update priority:', selectedTasks, newPriority);
    setSelectedTasks([]);
  };

  const handleApproveTask = (taskId: string) => {
    // In a real implementation, this would make API calls
    console.log('Approve task:', taskId);
  };

  const handleRejectTask = (taskId: string) => {
    // In a real implementation, this would make API calls
    console.log('Reject task:', taskId);
  };

  const handleExportCSV = () => {
    // In a real implementation, this would trigger CSV export
    console.log('Export CSV with filters:', filters);
  };

  const getStatusColor = (status: string): string => {
    const colors = {
      'Not Started': '#c4c4c4',
      'Working on it': '#fdab3d',
      'Stuck': '#e2445c',
      'Done': '#00c875',
      'Blocked': '#a25ddc',
      'Canceled': '#808080',
    };
    return colors[status as keyof typeof colors] || '#c4c4c4';
  };

  const getPriorityColor = (priority: string): string => {
    const colors = {
      'Low': '#579bfc',
      'Medium': '#a25ddc',
      'High': '#e2445c',
      'Urgent': '#bb3354',
    };
    return colors[priority as keyof typeof colors] || '#a25ddc';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {projectId ? 'Project Tasks' : 'All Tasks'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage tasks across all team members
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Member Selection */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-900">Select Team Members</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSelectAllMembers}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Select All
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={handleDeselectAllMembers}
              className="text-xs text-gray-600 hover:text-gray-800"
            >
              Clear All
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {members.map(member => (
            <button
              key={member.id}
              onClick={() => handleMemberToggle(member.id)}
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedMembers.includes(member.id)
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-blue-500 mr-2 flex items-center justify-center">
                <span className="text-xs text-white font-medium">
                  {member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </span>
              </div>
              {member.name}
            </button>
          ))}
        </div>
        <div className="mt-2 text-xs text-gray-500">
          {selectedMembers.length} of {members.length} members selected
        </div>
      </div>

      {/* Filters */}
      <TaskFilters
        filters={filters}
        onFiltersChange={setFilters}
        members={members}
        projects={projects}
        availableTags={['urgent', 'review', 'design', 'backend', 'frontend', 'testing', 'documentation']}
        onClearFilters={() => setFilters({})}
      />

      {/* Bulk Actions */}
      {selectedTasks.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-sm font-medium text-blue-900">
                {selectedTasks.length} task{selectedTasks.length > 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkStatusUpdate(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="text-sm border border-blue-300 rounded px-2 py-1"
                defaultValue=""
              >
                <option value="">Update Status...</option>
                <option value="Not Started">Not Started</option>
                <option value="Working on it">Working on it</option>
                <option value="Stuck">Stuck</option>
                <option value="Done">Done</option>
              </select>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkPriorityUpdate(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="text-sm border border-blue-300 rounded px-2 py-1"
                defaultValue=""
              >
                <option value="">Update Priority...</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
              <button
                onClick={handleDeselectAllTasks}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tasks Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedTasks.length === paginatedTasks.length && paginatedTasks.length > 0}
                  onChange={selectedTasks.length === paginatedTasks.length ? handleDeselectAllTasks : handleSelectAllTasks}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
                </span>
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="updatedAt">Last Updated</option>
                <option value="title">Title</option>
                <option value="assignee">Assignee</option>
                <option value="status">Status</option>
                <option value="priority">Priority</option>
                <option value="dueDate">Due Date</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC')}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <svg className={`w-4 h-4 transform ${sortOrder === 'DESC' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedTasks.length === paginatedTasks.length && paginatedTasks.length > 0}
                    onChange={selectedTasks.length === paginatedTasks.length ? handleDeselectAllTasks : handleSelectAllTasks}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Board</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedTasks.map(task => (
                <tr key={task.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedTasks.includes(task.id)}
                      onChange={() => handleTaskSelect(task.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">{task.title}</div>
                    {task.tags && task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {task.tags.map(tag => (
                          <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-900">{task.board.name}</div>
                    <div className="text-xs text-gray-500">{task.board.owner.name}</div>
                  </td>
                  <td className="px-4 py-3">
                    {task.assignee && (
                      <div className="flex items-center">
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center mr-2">
                          <span className="text-xs text-white font-medium">
                            {task.assignee.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-900">{task.assignee.name}</div>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: getStatusColor(task.status) }}
                    >
                      {task.status}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div
                      className="inline-flex items-center px-2 py-1 rounded text-xs font-medium text-white"
                      style={{ backgroundColor: getPriorityColor(task.priority) }}
                    >
                      {task.priority}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {task.dueDate && (
                      <div className="text-sm text-gray-900">
                        {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {task.project && (
                      <div className="text-sm text-gray-900">{task.project.name}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-500">
                      {formatDate(task.lastUpdated)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleApproveTask(task.id)}
                        className="text-green-600 hover:text-green-800 text-sm"
                        title="Approve"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => handleRejectTask(task.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                        title="Reject"
                      >
                        ✗
                      </button>
                      <button className="text-gray-400 hover:text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span>
                    {' '}to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * pageSize, filteredTasks.length)}
                    </span>
                    {' '}of{' '}
                    <span className="font-medium">{filteredTasks.length}</span>
                    {' '}results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pageNum
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
