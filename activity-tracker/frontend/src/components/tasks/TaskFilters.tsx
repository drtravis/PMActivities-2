import React, { useState } from 'react';
import { Filter, X, Calendar, User, Flag, Tag, Search } from 'lucide-react';

export interface TaskFilterOptions {
  search: string;
  status: string[];
  priority: string[];
  assignee: string[];
  dueDate: {
    from?: string;
    to?: string;
    preset?: 'overdue' | 'today' | 'this_week' | 'this_month' | 'next_week' | 'next_month';
  };
  tags: string[];
  section: string[];
  createdDate: {
    from?: string;
    to?: string;
  };
}

interface TaskFiltersProps {
  filters: TaskFilterOptions;
  onFiltersChange: (filters: TaskFilterOptions) => void;
  availableUsers?: Array<{ id: string; name: string; email: string }>;
  availableTags?: string[];
  availableSections?: string[];
  className?: string;
}

export const TaskFilters: React.FC<TaskFiltersProps> = ({
  filters,
  onFiltersChange,
  availableUsers = [],
  availableTags = [],
  availableSections = [],
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

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

  const dueDatePresets = [
    { value: 'overdue', label: 'Overdue' },
    { value: 'today', label: 'Due Today' },
    { value: 'this_week', label: 'This Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'next_week', label: 'Next Week' },
    { value: 'next_month', label: 'Next Month' },
  ];

  const updateFilters = (updates: Partial<TaskFilterOptions>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const toggleArrayFilter = (key: keyof TaskFilterOptions, value: string) => {
    const currentArray = filters[key] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    updateFilters({ [key]: newArray });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      search: '',
      status: [],
      priority: [],
      assignee: [],
      dueDate: {},
      tags: [],
      section: [],
      createdDate: {},
    });
  };

  const hasActiveFilters = () => {
    return (
      filters.search ||
      filters.status.length > 0 ||
      filters.priority.length > 0 ||
      filters.assignee.length > 0 ||
      filters.tags.length > 0 ||
      filters.section.length > 0 ||
      filters.dueDate.preset ||
      filters.dueDate.from ||
      filters.dueDate.to ||
      filters.createdDate.from ||
      filters.createdDate.to
    );
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Filter Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
          {hasActiveFilters() && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
              Active
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {hasActiveFilters() && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear all
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            {isExpanded ? <X className="w-4 h-4" /> : <Filter className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Search Bar - Always Visible */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="p-4 space-y-6">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Flag className="w-4 h-4 inline mr-1" />
              Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              {statusOptions.map((status) => (
                <label key={status.value} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.status.includes(status.value)}
                    onChange={() => toggleArrayFilter('status', status.value)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: status.color }}
                    />
                    <span className="text-sm text-gray-700">{status.label}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Flag className="w-4 h-4 inline mr-1" />
              Priority
            </label>
            <div className="grid grid-cols-2 gap-2">
              {priorityOptions.map((priority) => (
                <label key={priority.value} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.priority.includes(priority.value)}
                    onChange={() => toggleArrayFilter('priority', priority.value)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: priority.color }}
                    />
                    <span className="text-sm text-gray-700">{priority.label}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Assignee Filter */}
          {availableUsers.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <User className="w-4 h-4 inline mr-1" />
                Assignee
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.assignee.includes('unassigned')}
                    onChange={() => toggleArrayFilter('assignee', 'unassigned')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Unassigned</span>
                </label>
                {availableUsers.map((user) => (
                  <label key={user.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.assignee.includes(user.id)}
                      onChange={() => toggleArrayFilter('assignee', user.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm text-gray-700">{user.name}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Due Date Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Calendar className="w-4 h-4 inline mr-1" />
              Due Date
            </label>
            <div className="space-y-3">
              {/* Presets */}
              <div className="grid grid-cols-2 gap-2">
                {dueDatePresets.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => updateFilters({
                      dueDate: {
                        ...filters.dueDate,
                        preset: filters.dueDate.preset === preset.value ? undefined : preset.value as any,
                        from: undefined,
                        to: undefined,
                      }
                    })}
                    className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                      filters.dueDate.preset === preset.value
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Custom Date Range */}
              <div className="space-y-2">
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Custom date range
                </button>
                {showDatePicker && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">From</label>
                      <input
                        type="date"
                        value={filters.dueDate.from || ''}
                        onChange={(e) => updateFilters({
                          dueDate: {
                            ...filters.dueDate,
                            from: e.target.value,
                            preset: undefined,
                          }
                        })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">To</label>
                      <input
                        type="date"
                        value={filters.dueDate.to || ''}
                        onChange={(e) => updateFilters({
                          dueDate: {
                            ...filters.dueDate,
                            to: e.target.value,
                            preset: undefined,
                          }
                        })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tags Filter */}
          {availableTags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Tag className="w-4 h-4 inline mr-1" />
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleArrayFilter('tags', tag)}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                      filters.tags.includes(tag)
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section Filter */}
          {availableSections.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Section
              </label>
              <div className="space-y-2">
                {availableSections.map((section) => (
                  <label key={section} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.section.includes(section)}
                      onChange={() => toggleArrayFilter('section', section)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{section}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters() && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-2">
            {filters.status.map((status) => (
              <span
                key={`status-${status}`}
                className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
              >
                Status: {status}
                <button
                  onClick={() => toggleArrayFilter('status', status)}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {filters.priority.map((priority) => (
              <span
                key={`priority-${priority}`}
                className="inline-flex items-center px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full"
              >
                Priority: {priority}
                <button
                  onClick={() => toggleArrayFilter('priority', priority)}
                  className="ml-1 text-orange-600 hover:text-orange-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {filters.dueDate.preset && (
              <span className="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                Due: {dueDatePresets.find(p => p.value === filters.dueDate.preset)?.label}
                <button
                  onClick={() => updateFilters({ dueDate: {} })}
                  className="ml-1 text-green-600 hover:text-green-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
