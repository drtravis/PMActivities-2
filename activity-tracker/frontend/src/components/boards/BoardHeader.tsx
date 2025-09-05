import React, { useState } from 'react';
import { Search, Filter, Plus, MoreHorizontal, Users, Calendar, BarChart3, Settings } from 'lucide-react';

interface BoardHeaderProps {
  boardName: string;
  onBoardNameChange: (name: string) => void;
  onAddTask: () => void;
  onAddColumn: () => void;
  onFilterChange: (filters: BoardFilters) => void;
  onViewChange: (view: BoardView) => void;
  currentView: BoardView;
  taskCount: number;
  memberCount: number;
  filters: BoardFilters;
}

export interface BoardFilters {
  search: string;
  assignee: string[];
  status: string[];
  priority: string[];
  dueDate: 'overdue' | 'today' | 'this_week' | 'this_month' | null;
}

export type BoardView = 'main' | 'kanban' | 'timeline' | 'calendar' | 'chart';

export const BoardHeader: React.FC<BoardHeaderProps> = ({
  boardName,
  onBoardNameChange,
  onAddTask,
  onAddColumn,
  onFilterChange,
  onViewChange,
  currentView,
  taskCount,
  memberCount,
  filters,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showViewMenu, setShowViewMenu] = useState(false);

  const handleNameSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsEditingName(false);
  };

  const views = [
    { id: 'main', name: 'Main Table', icon: BarChart3 },
    { id: 'kanban', name: 'Kanban', icon: MoreHorizontal },
    { id: 'timeline', name: 'Timeline', icon: Calendar },
    { id: 'calendar', name: 'Calendar', icon: Calendar },
    { id: 'chart', name: 'Chart', icon: BarChart3 },
  ];

  const currentViewData = views.find(v => v.id === currentView) || views[0];

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      {/* Top row - Board name and actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          {isEditingName ? (
            <form onSubmit={handleNameSubmit} className="flex items-center">
              <input
                type="text"
                value={boardName}
                onChange={(e) => onBoardNameChange(e.target.value)}
                onBlur={() => setIsEditingName(false)}
                className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-blue-500 focus:outline-none"
                autoFocus
              />
            </form>
          ) : (
            <h1 
              className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-blue-600"
              onClick={() => setIsEditingName(true)}
            >
              {boardName}
            </h1>
          )}
          
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>{taskCount} items</span>
            <span>•</span>
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>{memberCount} members</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onAddTask}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Item</span>
          </button>
          
          <button
            onClick={onAddColumn}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Column</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowViewMenu(!showViewMenu)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <currentViewData.icon className="w-4 h-4" />
              <span>{currentViewData.name}</span>
            </button>

            {showViewMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                {views.map((view) => (
                  <button
                    key={view.id}
                    onClick={() => {
                      onViewChange(view.id as BoardView);
                      setShowViewMenu(false);
                    }}
                    className={`w-full flex items-center space-x-2 px-4 py-2 text-left hover:bg-gray-50 ${
                      currentView === view.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                    }`}
                  >
                    <view.icon className="w-4 h-4" />
                    <span>{view.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom row - Search and filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={filters.search}
              onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-3 py-2 border rounded-lg transition-colors ${
                showFilters || Object.values(filters).some(f => Array.isArray(f) ? f.length > 0 : f)
                  ? 'border-blue-500 bg-blue-50 text-blue-600'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </button>

            {showFilters && (
              <div className="absolute left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <div className="space-y-1">
                      {['Not Started', 'Working on it', 'Stuck', 'Done'].map((status) => (
                        <label key={status} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={filters.status.includes(status)}
                            onChange={(e) => {
                              const newStatus = e.target.checked
                                ? [...filters.status, status]
                                : filters.status.filter(s => s !== status);
                              onFilterChange({ ...filters, status: newStatus });
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm">{status}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <div className="space-y-1">
                      {['Low', 'Medium', 'High', 'Urgent'].map((priority) => (
                        <label key={priority} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={filters.priority.includes(priority)}
                            onChange={(e) => {
                              const newPriority = e.target.checked
                                ? [...filters.priority, priority]
                                : filters.priority.filter(p => p !== priority);
                              onFilterChange({ ...filters, priority: newPriority });
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm">{priority}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                    <select
                      value={filters.dueDate || ''}
                      onChange={(e) => onFilterChange({ 
                        ...filters, 
                        dueDate: e.target.value as BoardFilters['dueDate'] 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All dates</option>
                      <option value="overdue">Overdue</option>
                      <option value="today">Due today</option>
                      <option value="this_week">Due this week</option>
                      <option value="this_month">Due this month</option>
                    </select>
                  </div>

                  <div className="flex justify-between pt-2 border-t">
                    <button
                      onClick={() => onFilterChange({
                        search: '',
                        assignee: [],
                        status: [],
                        priority: [],
                        dueDate: null,
                      })}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Clear all
                    </button>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <span>Last updated: 2 minutes ago</span>
        </div>
      </div>
    </div>
  );
};
