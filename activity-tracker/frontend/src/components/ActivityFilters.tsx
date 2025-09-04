'use client';

import { useActivityStore } from '@/lib/store';

export default function ActivityFilters() {
  const { filters, setFilters } = useActivityStore();

  const handleFilterChange = (key: string, value: string) => {
    setFilters({
      ...filters,
      [key]: value === 'all' ? undefined : value,
    });
  };

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
          Status:
        </label>
        <select
          id="status-filter"
          value={filters.status || 'all'}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
        >
          <option value="all">All</option>
          <option value="Not Started">Not Started</option>
          <option value="Working on it">Working on it</option>
          <option value="Stuck">Stuck</option>
          <option value="Done">Done</option>
          <option value="Blocked">Blocked</option>
          <option value="Canceled">Canceled</option>
        </select>
      </div>

      <div className="flex items-center space-x-2">
        <label htmlFor="approval-filter" className="text-sm font-medium text-gray-700">
          Approval:
        </label>
        <select
          id="approval-filter"
          value={filters.approvalState || 'all'}
          onChange={(e) => handleFilterChange('approvalState', e.target.value)}
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
        >
          <option value="all">All</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="closed">Closed</option>
        </select>
      </div>
    </div>
  );
}
