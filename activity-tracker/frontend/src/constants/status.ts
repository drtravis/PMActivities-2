// DEPRECATED: These constants are deprecated in favor of dynamic status configuration
// Use the StatusContext and useStatus hook instead for centralized status management
// This file will be removed in a future version

// @deprecated Use StatusContext instead
export type ActivityStatus = 'To Do' | 'Assigned' | 'In Progress' | 'Completed' | 'Backlog' | 'On Hold' | 'In Review' | 'Approved' | 'Closed';

// @deprecated Use StatusContext.getStatusDisplayName() instead
export const ACTIVITY_STATUS_LABELS: Record<ActivityStatus, string> = {
  'To Do': 'To Do',
  'Assigned': 'Assigned',
  'In Progress': 'In Progress',
  'Completed': 'Completed',
  'Backlog': 'Backlog',
  'On Hold': 'On Hold',
  'In Review': 'In Review',
  'Approved': 'Approved',
  'Closed': 'Closed',
};

// @deprecated Use StatusContext.getActiveStatusOptions('activity') instead
export const ACTIVITY_STATUS_OPTIONS: Array<{ value: ActivityStatus; label: string; color: string }> = [
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

// Activity.approvalState (lifecycle/approval state)
// @deprecated Use StatusContext.getActiveStatusOptions('approval') instead
export type ApprovalState = 'draft' | 'submitted' | 'approved' | 'reopened' | 'closed' | 'rejected';

// @deprecated Use StatusContext.getStatusDisplayName() instead
export const APPROVAL_STATE_LABELS: Record<ApprovalState, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  approved: 'Approved',
  reopened: 'Reopened',
  closed: 'Closed',
  rejected: 'Rejected',
};

// @deprecated Use StatusContext.getActiveStatusOptions('approval') instead
export const APPROVAL_STATE_OPTIONS: Array<{ value: ApprovalState; label: string }> = (
  Object.keys(APPROVAL_STATE_LABELS) as ApprovalState[]
).map((k) => ({ value: k, label: APPROVAL_STATE_LABELS[k] }));

// Helper for mapping Activity.status to UI pill styles
// @deprecated Use StatusPill component with StatusContext instead
export type StatusPillKey = 'not_started' | 'working' | 'done' | 'stuck' | 'blocked' | 'draft' | 'in_review' | 'approved' | 'rejected';

// @deprecated Use StatusPill component with StatusContext instead
export const mapActivityStatusToPill = (status: ActivityStatus): StatusPillKey => {
  switch (status) {
    case 'To Do':
      return 'not_started';
    case 'Assigned':
      return 'not_started';
    case 'In Progress':
      return 'working';
    case 'Completed':
      return 'done';
    case 'Backlog':
      return 'stuck';
    case 'On Hold':
      return 'blocked';
    case 'In Review':
      return 'in_review';
    case 'Approved':
      return 'approved';
    case 'Closed':
      return 'done';
    default:
      return 'not_started';
  }
};

