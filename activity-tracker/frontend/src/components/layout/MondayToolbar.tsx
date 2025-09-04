import React, { useState, useRef, useEffect } from 'react';

interface MondayToolbarProps {
  onNewTask?: () => void;
  onSearch?: (query: string) => void;
  onFilter?: () => void;
  onSort?: () => void;
  onGroupBy?: () => void;
  viewMode?: 'list' | 'kanban' | 'board';
  onViewModeChange?: (mode: 'list' | 'kanban' | 'board') => void;
  className?: string;
  // New props for simplified version
  simplified?: boolean;
  groupBy?: 'status' | 'priority';
  onGroupByChange?: (groupBy: 'status' | 'priority') => void;
  showListToggle?: boolean;
  isListView?: boolean;
  onListViewToggle?: (isListView: boolean) => void;
}

/**
 * Standardized Monday.com-style toolbar component
 * Reusable across all task board interfaces
 */
export const MondayToolbar: React.FC<MondayToolbarProps> = ({
  onNewTask,
  onSearch,
  onFilter,
  onSort,
  onGroupBy,
  viewMode = 'board',
  onViewModeChange,
  className = '',
  simplified = false,
  groupBy = 'status',
  onGroupByChange,
  showListToggle = false,
  isListView = false,
  onListViewToggle,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  // Simplified version for My Activities
  if (simplified) {
    return (
      <div className={`flex items-center justify-between ${className}`}>
        {/* List View Toggle */}
        {showListToggle && (
          <div className="flex items-center space-x-0.5 bg-gray-100 rounded p-0.5">
            <button
              onClick={() => onListViewToggle?.(false)}
              className={`flex items-center space-x-1.5 px-2.5 py-1 text-xs rounded transition-colors duration-150 ${
                !isListView
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span>Grouped</span>
            </button>
            <button
              onClick={() => onListViewToggle?.(true)}
              className={`flex items-center space-x-1.5 px-2.5 py-1 text-xs rounded transition-colors duration-150 ${
                isListView
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span>List</span>
            </button>
          </div>
        )}

        {/* Group By Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-1.5 px-2.5 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors duration-150 text-xs"
          >
            <span>{groupBy === 'status' ? 'Status view' : 'Priority view'}</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-50">
              <div className="py-1">
                <button
                  onClick={() => {
                    onGroupByChange?.('status');
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 ${
                    groupBy === 'status' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                >
                  Status view
                </button>
                <button
                  onClick={() => {
                    onGroupByChange?.('priority');
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 ${
                    groupBy === 'priority' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                >
                  Priority view
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center space-x-4">
        {onNewTask && (
          <button
            onClick={onNewTask}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors duration-150 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New task
          </button>
        )}

        {/* Quick toolbar actions */}
        <div className="flex items-center space-x-2 text-sm">
          {onSearch && (
            <button
              onClick={() => onSearch('')}
              className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors duration-150"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Search</span>
            </button>
          )}
          
          <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors duration-150">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Person</span>
          </button>
          
          {onFilter && (
            <button 
              onClick={onFilter}
              className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors duration-150"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span>Filter</span>
            </button>
          )}
          
          {onSort && (
            <button 
              onClick={onSort}
              className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors duration-150"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
              <span>Sort</span>
            </button>
          )}
          
          {onGroupBy && (
            <button 
              onClick={onGroupBy}
              className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors duration-150"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span>Group by</span>
            </button>
          )}
        </div>
      </div>

      {/* View Mode Toggle */}
      {onViewModeChange && (
        <div className="flex items-center space-x-1 bg-gray-100 rounded p-1">
          <button
            onClick={() => onViewModeChange('list')}
            className={`flex items-center space-x-2 px-3 py-1.5 text-sm rounded transition-colors duration-150 ${
              viewMode === 'list'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <span>List</span>
          </button>
          <button
            onClick={() => onViewModeChange('kanban')}
            className={`flex items-center space-x-2 px-3 py-1.5 text-sm rounded transition-colors duration-150 ${
              viewMode === 'kanban'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            <span>Kanban</span>
          </button>
          <button
            onClick={() => onViewModeChange('board')}
            className={`flex items-center space-x-2 px-3 py-1.5 text-sm rounded transition-colors duration-150 ${
              viewMode === 'board'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>Board</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default MondayToolbar;
