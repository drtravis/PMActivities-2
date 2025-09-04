// DEPRECATED: These constants are deprecated in favor of dynamic status configuration
// Use the StatusContext and useStatus hook instead for centralized status management
// This file will be removed in a future version

// @deprecated Use StatusContext instead
export type TaskStatus = 'To Do' | 'Assigned' | 'In Progress' | 'Completed' | 'Backlog' | 'On Hold' | 'In Review' | 'Approved' | 'Closed';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

// @deprecated Use StatusContext.getActiveStatusOptions('task') instead
export const TASK_STATUS_OPTIONS: Array<{ value: TaskStatus; label: string; color: string }> = [
  { value: 'To Do', label: 'To Do', color: '#c4c4c4' },
  { value: 'Assigned', label: 'Assigned', color: '#9cd326' },
  { value: 'In Progress', label: 'In Progress', color: '#fdab3d' },
  { value: 'Completed', label: 'Completed', color: '#00c875' },
  { value: 'Backlog', label: 'Backlog', color: '#a25ddc' },
  { value: 'On Hold', label: 'On Hold', color: '#ff642e' },
  { value: 'In Review', label: 'In Review', color: '#037f4c' },
  { value: 'Approved', label: 'Approved', color: '#00c875' },
  { value: 'Closed', label: 'Closed', color: '#808080' },
];

export const TASK_PRIORITY_OPTIONS: Array<{ value: TaskPriority; label: string; color: string }> = [
  { value: 'Low', label: 'Low', color: '#579bfc' },
  { value: 'Medium', label: 'Medium', color: '#a25ddc' },
  { value: 'High', label: 'High', color: '#e2445c' },
  { value: 'Urgent', label: 'Urgent', color: '#bb3354' },
];

// Note: Old mapping functions removed - Task and Activity now use identical status values
// No mapping needed since both use the unified status system

