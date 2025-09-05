import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity, ApprovalState } from '../entities/activity.entity';
import { User, UserRole } from '../entities/user.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { Task } from '../entities/task.entity';
import { Board } from '../entities/board.entity';
import { Cache } from '../common/decorators/cache.decorator';

export interface ActivityStatusReport {
  totalActivities: number;
  byStatus: Record<string, number>; // Dynamic status names
  byApprovalState: Record<ApprovalState, number>;
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

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Activity)
    private activityRepository: Repository<Activity>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(Board)
    private boardRepository: Repository<Board>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  @Cache('activity-status-report', 300)
  async getActivityStatusReport(organizationId: string, filters?: any): Promise<ActivityStatusReport> {
    const queryBuilder = this.activityRepository.createQueryBuilder('activity')
      .leftJoin('activity.project', 'project')
      .where('project.organizationId = :organizationId', { organizationId });

    // Apply filters
    if (filters?.startDate) {
      queryBuilder.andWhere('activity.createdAt >= :startDate', { startDate: filters.startDate });
    }
    if (filters?.endDate) {
      queryBuilder.andWhere('activity.createdAt <= :endDate', { endDate: filters.endDate });
    }
    if (filters?.projectId) {
      queryBuilder.andWhere('activity.projectId = :projectId', { projectId: filters.projectId });
    }

    const activities = await queryBuilder.getMany();
    const totalActivities = activities.length;

    // Count by status - dynamically get all unique status values
    const uniqueStatuses = [...new Set(activities.map(a => a.status))];
    const byStatus = uniqueStatuses.reduce((acc, status) => {
      acc[status] = activities.filter(a => a.status === status).length;
      return acc;
    }, {} as Record<string, number>);

    // Count by approval state
    const byApprovalState = Object.values(ApprovalState).reduce((acc, state) => {
      acc[state] = activities.filter(a => a.approvalState === state).length;
      return acc;
    }, {} as Record<ApprovalState, number>);

    // Calculate completion rate - use common completed status names
    const completedActivities = activities.filter(a => a.status === 'completed' || a.status === 'closed').length;
    const completionRate = totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0;

    // Calculate overdue activities (activities past end date)
    const now = new Date();
    const overdueActivities = activities.filter(a =>
      a.endDate && new Date(a.endDate) < now && a.status !== 'completed' && a.status !== 'closed'
    ).length;

    return {
      totalActivities,
      byStatus,
      byApprovalState,
      completionRate,
      overdueActivities,
    };
  }

  async getMemberPerformanceReport(organizationId: string, filters?: any): Promise<MemberPerformanceReport[]> {
    const users = await this.userRepository.find({
      where: { organizationId, isActive: true },
    });

    const reports: MemberPerformanceReport[] = [];

    for (const user of users) {
      const queryBuilder = this.activityRepository.createQueryBuilder('activity')
        .leftJoin('activity.project', 'project')
        .where('project.organizationId = :organizationId', { organizationId })
        .andWhere('activity.createdById = :userId', { userId: user.id });

      // Apply filters
      if (filters?.startDate) {
        queryBuilder.andWhere('activity.createdAt >= :startDate', { startDate: filters.startDate });
      }
      if (filters?.endDate) {
        queryBuilder.andWhere('activity.createdAt <= :endDate', { endDate: filters.endDate });
      }

      const userActivities = await queryBuilder.getMany();
      const totalActivities = userActivities.length;

      if (totalActivities === 0) continue;

      const completedActivities = userActivities.filter(a => a.status === 'completed' || a.status === 'closed').length;
      const approvedActivities = userActivities.filter(a => a.approvalState === ApprovalState.APPROVED).length;
      const approvalSuccessRate = totalActivities > 0 ? (approvedActivities / totalActivities) * 100 : 0;

      // Calculate average completion time
      const completedWithDates = userActivities.filter(a =>
        (a.status === 'completed' || a.status === 'closed') && a.startDate && a.updatedAt
      );
      const averageCompletionTime = completedWithDates.length > 0 
        ? completedWithDates.reduce((sum, activity) => {
            const start = new Date(activity.startDate!);
            const end = new Date(activity.updatedAt);
            return sum + (end.getTime() - start.getTime());
          }, 0) / (completedWithDates.length * 24 * 60 * 60 * 1000) // Convert to days
        : 0;

      // Count by status - dynamically get all unique status values
      const uniqueStatuses = [...new Set(userActivities.map(a => a.status))];
      const activitiesByStatus = uniqueStatuses.reduce((acc, status) => {
        acc[status] = userActivities.filter(a => a.status === status).length;
        return acc;
      }, {} as Record<string, number>);

      reports.push({
        userId: user.id,
        userName: user.name,
        totalActivities,
        completedActivities,
        approvalSuccessRate,
        averageCompletionTime,
        activitiesByStatus,
      });
    }

    return reports.sort((a, b) => b.totalActivities - a.totalActivities);
  }

  async getApprovalAgingReport(organizationId: string): Promise<ApprovalAgingReport> {
    // Get pending approvals
    const pendingActivities = await this.activityRepository.createQueryBuilder('activity')
      .leftJoin('activity.project', 'project')
      .where('project.organizationId = :organizationId', { organizationId })
      .andWhere('activity.approvalState = :state', { state: ApprovalState.SUBMITTED })
      .getMany();

    const pendingApprovals = pendingActivities.length;
    const now = new Date();

    // Calculate approval time ranges
    const approvalsByTimeRange = {
      lessThan24h: 0,
      between24h48h: 0,
      between48h72h: 0,
      moreThan72h: 0,
    };

    let totalApprovalTime = 0;

    pendingActivities.forEach(activity => {
      const submittedTime = new Date(activity.updatedAt);
      const hoursWaiting = (now.getTime() - submittedTime.getTime()) / (1000 * 60 * 60);
      
      totalApprovalTime += hoursWaiting;

      if (hoursWaiting < 24) {
        approvalsByTimeRange.lessThan24h++;
      } else if (hoursWaiting < 48) {
        approvalsByTimeRange.between24h48h++;
      } else if (hoursWaiting < 72) {
        approvalsByTimeRange.between48h72h++;
      } else {
        approvalsByTimeRange.moreThan72h++;
      }
    });

    const averageApprovalTime = pendingApprovals > 0 ? totalApprovalTime / pendingApprovals : 0;

    // Get bottleneck managers
    const managers = await this.userRepository.find({
      where: { 
        organizationId, 
        role: UserRole.PROJECT_MANAGER,
        isActive: true 
      },
    });

    const bottleneckManagers: Array<{
      managerId: string;
      managerName: string;
      pendingCount: number;
      averageTime: number;
    }> = [];
    for (const manager of managers) {
      const managerPendingCount = pendingActivities.filter(activity => {
        // This would need to be enhanced to properly track which manager should approve
        return true; // Simplified for now
      }).length;

      if (managerPendingCount > 0) {
        bottleneckManagers.push({
          managerId: manager.id,
          managerName: manager.name,
          pendingCount: managerPendingCount,
          averageTime: averageApprovalTime, // Simplified
        });
      }
    }

    return {
      pendingApprovals,
      averageApprovalTime,
      approvalsByTimeRange,
      bottleneckManagers: bottleneckManagers.sort((a, b) => b.pendingCount - a.pendingCount),
    };
  }

  async exportActivitiesCSV(organizationId: string, filters?: any): Promise<string> {
    const queryBuilder = this.activityRepository.createQueryBuilder('activity')
      .leftJoinAndSelect('activity.project', 'project')
      .leftJoinAndSelect('activity.createdBy', 'createdBy')
      .leftJoinAndSelect('activity.assignees', 'assignees')
      .leftJoinAndSelect('activity.approvedBy', 'approvedBy')
      .where('project.organizationId = :organizationId', { organizationId });

    // Apply filters
    if (filters?.status) {
      queryBuilder.andWhere('activity.status = :status', { status: filters.status });
    }
    if (filters?.approvalState) {
      queryBuilder.andWhere('activity.approvalState = :approvalState', { approvalState: filters.approvalState });
    }
    if (filters?.startDate) {
      queryBuilder.andWhere('activity.createdAt >= :startDate', { startDate: filters.startDate });
    }
    if (filters?.endDate) {
      queryBuilder.andWhere('activity.createdAt <= :endDate', { endDate: filters.endDate });
    }

    const activities = await queryBuilder.getMany();

    // Generate CSV content
    const headers = [
      'Ticket Number',
      'Title',
      'Description',
      'Status',
      'Approval State',
      'Priority',
      'Project',
      'Created By',
      'Assignees',
      'Approved By',
      'Start Date',
      'End Date',
      'Created At',
      'Updated At',
      'Tags'
    ];

    const csvRows = [headers.join(',')];

    activities.forEach(activity => {
      const row = [
        activity.ticketNumber,
        `"${activity.title}"`,
        `"${activity.description || ''}"`,
        activity.status,
        activity.approvalState,
        activity.priority,
        `"${activity.project?.name || ''}"`,
        `"${activity.createdBy?.name || ''}"`,
        `"${activity.assignees?.map(a => a.name).join('; ') || ''}"`,
        `"${activity.approvedBy?.name || ''}"`,
        activity.startDate || '',
        activity.endDate || '',
        activity.createdAt.toISOString(),
        activity.updatedAt.toISOString(),
        `"${activity.tags?.join('; ') || ''}"`
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  @Cache('task-analytics', 300) // 5 minutes
  async getTaskAnalytics(organizationId: string, filters: any = {}) {
    const query = this.taskRepository.createQueryBuilder('task')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .leftJoinAndSelect('task.board', 'board')
      .where('task.organizationId = :organizationId', { organizationId });

    if (filters.boardId) {
      query.andWhere('task.boardId = :boardId', { boardId: filters.boardId });
    }

    if (filters.startDate) {
      query.andWhere('task.createdAt >= :startDate', { startDate: new Date(filters.startDate) });
    }

    if (filters.endDate) {
      query.andWhere('task.createdAt <= :endDate', { endDate: new Date(filters.endDate) });
    }

    const tasks = await query.getMany();

    const analytics = {
      totalTasks: tasks.length,
      byStatus: {} as Record<string, number>,
      byPriority: {} as Record<string, number>,
      byAssignee: {} as Record<string, number>,
      completionRate: 0,
      averageCompletionTime: 0,
      overdueTasks: 0,
    };

    let completedTasks = 0;
    let totalCompletionTime = 0;
    const now = new Date();

    tasks.forEach(task => {
      // Status breakdown
      analytics.byStatus[task.status] = (analytics.byStatus[task.status] || 0) + 1;

      // Priority breakdown
      analytics.byPriority[task.priority] = (analytics.byPriority[task.priority] || 0) + 1;

      // Assignee breakdown
      if (task.assignee) {
        analytics.byAssignee[task.assignee.name] = (analytics.byAssignee[task.assignee.name] || 0) + 1;
      }

      // Completion tracking
      if (task.status === 'Done' || task.status === 'Completed') {
        completedTasks++;
        if (task.updatedAt && task.createdAt) {
          totalCompletionTime += task.updatedAt.getTime() - task.createdAt.getTime();
        }
      }

      // Overdue tracking
      if (task.dueDate && task.dueDate < now && task.status !== 'Done' && task.status !== 'Completed') {
        analytics.overdueTasks++;
      }
    });

    analytics.completionRate = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;
    analytics.averageCompletionTime = completedTasks > 0 ? totalCompletionTime / completedTasks / (1000 * 60 * 60 * 24) : 0; // in days

    return analytics;
  }

  @Cache('board-performance', 300) // 5 minutes
  async getBoardPerformance(organizationId: string, filters: any = {}) {
    const query = this.boardRepository.createQueryBuilder('board')
      .leftJoinAndSelect('board.tasks', 'tasks')
      .leftJoinAndSelect('tasks.assignee', 'assignee')
      .where('board.organizationId = :organizationId', { organizationId });

    const boards = await query.getMany();

    return boards.map(board => {
      const tasks = board.tasks || [];
      const completedTasks = tasks.filter(t => t.status === 'Done' || t.status === 'Completed');
      const overdueTasks = tasks.filter(t => t.dueDate && t.dueDate < new Date() && t.status !== 'Done' && t.status !== 'Completed');

      return {
        boardId: board.id,
        boardName: board.name,
        totalTasks: tasks.length,
        completedTasks: completedTasks.length,
        completionRate: tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0,
        overdueTasks: overdueTasks.length,
        tasksByStatus: tasks.reduce((acc, task) => {
          acc[task.status] = (acc[task.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      };
    });
  }

  async exportTasksCSV(organizationId: string, filters: any = {}): Promise<string> {
    const query = this.taskRepository.createQueryBuilder('task')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .leftJoinAndSelect('task.board', 'board')
      .where('task.organizationId = :organizationId', { organizationId });

    if (filters.boardId) {
      query.andWhere('task.boardId = :boardId', { boardId: filters.boardId });
    }

    if (filters.status) {
      query.andWhere('task.status = :status', { status: filters.status });
    }

    const tasks = await query.getMany();

    const csvRows = [
      'ID,Title,Description,Status,Priority,Assignee,Board,Due Date,Created At,Updated At,Tags'
    ];

    tasks.forEach(task => {
      const row = [
        task.id,
        `"${task.title.replace(/"/g, '""')}"`,
        `"${(task.description || '').replace(/"/g, '""')}"`,
        task.status,
        task.priority,
        `"${task.assignee?.name || ''}"`,
        `"${task.board?.name || ''}"`,
        task.dueDate?.toISOString() || '',
        task.createdAt.toISOString(),
        task.updatedAt.toISOString(),
        `"${task.tags?.join('; ') || ''}"`
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }
}
