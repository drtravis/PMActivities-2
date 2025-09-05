'use client';

import React, { useState } from 'react';
import { Task } from '../boards/TaskBoard';
import { useStatus } from '@/contexts/StatusContext';

export interface TaskFilters {
  search?: string;
  status?: string[];
  priority?: string[];
  assigneeIds?: string[];
  projectIds?: string[];
  dueFrom?: string;
  dueTo?: string;
  tags?: string[];
  section?: string[];
}

interface TaskFiltersProps {
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
  members?: Array<{ id: string; name: string; email: string }>;
  projects?: Array<{ id: string; name: string }>;
  availableTags?: string[];
  onClearFilters: () => void;
  onSavePreset?: (name: string, filters: TaskFilters) => void;
  savedPresets?: Array<{ name: string; filters: TaskFilters }>;
}

const sectionOptions = [
  { value: 'To-Do', label: 'To-Do' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Backlog', label: 'Backlog' },
  { value: 'In Review', label: 'In Review' },
];

export const TaskFilters: React.FC<TaskFiltersProps> = ({
  filters,
  onFiltersChange,
  members = [],
  projects = [],
  availableTags = [],
  onClearFilters,
  onSavePreset,
  savedPresets = [],
}) => {
  const { getActiveStatusOptions } = useStatus();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [presetName, setPresetName] = useState('');

  const statusOptions = getActiveStatusOptions('task');

  const priorityOptions = [
    { value: 'Low', label: 'Low', color: '#00c875' },
    { value: 'Medium', label: 'Medium', color: '#fdab3d' },
    { value: 'High', label: 'High', color: '#ff642e' },
    { value: 'Urgent', label: 'Urgent', color: '#e2445c' }
  ];

  const updateFilter = (key: keyof TaskFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleArrayFilter = (key: keyof TaskFilters, value: string) => {
    const currentArray = (filters[key] as string[]) || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    updateFilter(key, newArray.length > 0 ? newArray : undefined);
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== '' && (!Array.isArray(value) || value.length > 0)
  );

  const handleSavePreset = () => {
    if (presetName.trim() && onSavePreset) {
      onSavePreset(presetName.trim(), filters);
      setPresetName('');
      setShowSavePreset(false);
    }
  };

  const loadPreset = (preset: { name: string; filters: TaskFilters }) => {
    onFiltersChange(preset.filters);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Filter Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <svg 
                className={`mr-2 h-4 w-4 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Filters
              {hasActiveFilters && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Active
                </span>
              )}
            </button>

            {/* Quick Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search tasks..."
                value={filters.search || ''}
                onChange={(e) => updateFilter('search', e.target.value || undefined)}
                className="pl-8 pr-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg className="absolute left-2 top-1.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Saved Presets */}
            {savedPresets.length > 0 && (
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    const preset = savedPresets.find(p => p.name === e.target.value);
                    if (preset) loadPreset(preset);
                  }
                }}
                className="text-sm border border-gray-300 rounded px-2 py-1"
                value=""
              >
                <option value="">Load Preset...</option>
                {savedPresets.map(preset => (
                  <option key={preset.name} value={preset.name}>
                    {preset.name}
                  </option>
                ))}
              </select>
            )}

            {/* Save Preset */}
            {hasActiveFilters && onSavePreset && (
              <button
                onClick={() => setShowSavePreset(true)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Save Preset
              </button>
            )}

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={onClearFilters}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="px-4 py-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <div className="space-y-1">
                {statusOptions.map(option => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={(filters.status || []).includes(option.value)}
                      onChange={() => toggleArrayFilter('status', option.value)}
                      className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: option.color }}
                      />
                      <span className="text-sm">{option.label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <div className="space-y-1">
                {priorityOptions.map(option => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={(filters.priority || []).includes(option.value)}
                      onChange={() => toggleArrayFilter('priority', option.value)}
                      className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: option.color }}
                      />
                      <span className="text-sm">{option.label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Section Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
              <div className="space-y-1">
                {sectionOptions.map(option => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={(filters.section || []).includes(option.value)}
                      onChange={() => toggleArrayFilter('section', option.value)}
                      className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Assignee Filter */}
            {members.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assignee</label>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {members.map(member => (
                    <label key={member.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={(filters.assigneeIds || []).includes(member.id)}
                        onChange={() => toggleArrayFilter('assigneeIds', member.id)}
                        className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">{member.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Project Filter */}
            {projects.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project</label>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {projects.map(project => (
                    <label key={project.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={(filters.projectIds || []).includes(project.id)}
                        onChange={() => toggleArrayFilter('projectIds', project.id)}
                        className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">{project.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Due Date Range</label>
              <div className="space-y-2">
                <input
                  type="date"
                  value={filters.dueFrom || ''}
                  onChange={(e) => updateFilter('dueFrom', e.target.value || undefined)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="From"
                />
                <input
                  type="date"
                  value={filters.dueTo || ''}
                  onChange={(e) => updateFilter('dueTo', e.target.value || undefined)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="To"
                />
              </div>
            </div>
          </div>

          {/* Tags Filter */}
          {availableTags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleArrayFilter('tags', tag)}
                    className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                      (filters.tags || []).includes(tag)
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Save Preset Modal */}
      {showSavePreset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Save Filter Preset</h3>
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Enter preset name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => setShowSavePreset(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePreset}
                disabled={!presetName.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
