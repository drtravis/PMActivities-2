export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'PROJECT_MANAGER' | 'MEMBER';
  organizationId?: string;
  organization_id?: string;
}

export interface Organization {
  id: string;
  name: string;
  settings?: Record<string, any>;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  ownerId: string;
  owner: User;
  members: User[];
}

export interface Activity {
  id: string;
  ticketNumber: string;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status: 'Not Started' | 'Working on it' | 'Stuck' | 'Done' | 'Blocked' | 'Canceled';
  approvalState: 'draft' | 'submitted' | 'approved' | 'closed' | 'reopened' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  tags?: string[];
  projectId: string;
  project: Project;
  createdById: string;
  createdBy: User;
  updatedById: string;
  updatedBy: User;
  approvedById?: string;
  approvedBy?: User;
  approvedAt?: string;
  assignees: User[];
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  body: string;
  activityId: string;
  createdById: string;
  createdBy: User;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ActivityStatusReport {
  totalActivities: number;
  byStatus: Record<string, number>;
  byApprovalState: Record<string, number>;
  completionRate: number;
  overdueActivities: number;
}

export interface MemberPerformanceReport {
  userId: string;
  userName: string;
  totalActivities: number;
  completedActivities: number;
  approvalSuccessRate: number;
  averageCompletionTime: number;
  activitiesByStatus: Record<string, number>;
}

export interface ApprovalAgingReport {
  pendingApprovals: number;
  averageApprovalTime: number;
  approvalsByTimeRange: {
    lessThan24h: number;
    between24h48h: number;
    between48h72h: number;
    moreThan72h: number;
  };
  bottleneckManagers: Array<{
    managerId: string;
    managerName: string;
    pendingCount: number;
    averageTime: number;
  }>;
}
