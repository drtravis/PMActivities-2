import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Approval, ApprovalState } from '../entities/approval.entity';
import { Activity } from '../entities/activity.entity';
import { Task } from '../entities/task.entity';
import { User } from '../entities/user.entity';
import { AuditService } from './audit.service';
import { AuditAction, EntityType } from '../entities/audit-log.entity';

@Injectable()
export class ApprovalService {
  constructor(
    @InjectRepository(Approval)
    private approvalRepo: Repository<Approval>,
    @InjectRepository(Activity)
    private activityRepo: Repository<Activity>,
    @InjectRepository(Task)
    private taskRepo: Repository<Task>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private auditService: AuditService,
  ) {}

  async getApprovals(filters: {
    organizationId: string;
    status?: ApprovalState;
    entityType?: 'activity' | 'task';
    approverId?: string;
    limit?: number;
    offset?: number;
  }) {
    const query = this.approvalRepo.createQueryBuilder('approval')
      .leftJoinAndSelect('approval.approver', 'approver')
      .leftJoinAndSelect('approval.activity', 'activity')
      .leftJoinAndSelect('approval.task', 'task')
      .orderBy('approval.createdAt', 'DESC');

    // Filter by organization through related entities
    if (filters.entityType === 'activity') {
      query.innerJoin('approval.activity', 'act')
        .andWhere('act.organizationId = :organizationId', { organizationId: filters.organizationId });
    } else if (filters.entityType === 'task') {
      query.innerJoin('approval.task', 'tsk')
        .andWhere('tsk.organizationId = :organizationId', { organizationId: filters.organizationId });
    } else {
      // Include both activities and tasks from the organization
      query.andWhere(`(
        (approval.activityId IS NOT NULL AND EXISTS (
          SELECT 1 FROM activities a WHERE a.id = approval.activityId AND a.organizationId = :organizationId
        )) OR
        (approval.taskId IS NOT NULL AND EXISTS (
          SELECT 1 FROM tasks t WHERE t.id = approval.taskId AND t.organizationId = :organizationId
        ))
      )`, { organizationId: filters.organizationId });
    }

    if (filters.status) {
      query.andWhere('approval.status = :status', { status: filters.status });
    }

    if (filters.approverId) {
      query.andWhere('approval.approverId = :approverId', { approverId: filters.approverId });
    }

    const total = await query.getCount();

    if (filters.limit) {
      query.limit(filters.limit);
    }

    if (filters.offset) {
      query.offset(filters.offset);
    }

    const approvals = await query.getMany();

    return { approvals, total };
  }

  async getPendingApprovals(organizationId: string, approverId: string) {
    return this.getApprovals({
      organizationId,
      status: ApprovalState.PENDING,
      approverId,
    });
  }

  async getApprovalRequestsByUser(organizationId: string, userId: string) {
    const query = this.approvalRepo.createQueryBuilder('approval')
      .leftJoinAndSelect('approval.approver', 'approver')
      .leftJoinAndSelect('approval.activity', 'activity')
      .leftJoinAndSelect('approval.task', 'task')
      .where(`(
        (approval.activityId IS NOT NULL AND EXISTS (
          SELECT 1 FROM activities a WHERE a.id = approval.activityId AND a.createdById = :userId AND a.organizationId = :organizationId
        )) OR
        (approval.taskId IS NOT NULL AND EXISTS (
          SELECT 1 FROM tasks t WHERE t.id = approval.taskId AND t.createdById = :userId AND t.organizationId = :organizationId
        ))
      )`, { userId, organizationId })
      .orderBy('approval.createdAt', 'DESC');

    return query.getMany();
  }

  async getApprovalById(id: string, user: any) {
    const approval = await this.approvalRepo.findOne({
      where: { id },
      relations: ['approver', 'activity', 'task'],
    });

    if (!approval) {
      throw new NotFoundException('Approval not found');
    }

    // Check access permissions
    const hasAccess = user.role === 'admin' || 
                     user.role === 'pmo' ||
                     approval.approverId === user.id ||
                     (approval.activity && approval.activity.createdById === user.id) ||
                     (approval.task && approval.task.createdById === user.id);

    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this approval');
    }

    return approval;
  }

  async approve(id: string, user: any, comments?: string) {
    const approval = await this.getApprovalById(id, user);

    if (approval.status !== ApprovalState.PENDING) {
      throw new BadRequestException('Only pending approvals can be approved');
    }

    if (approval.approverId !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('You can only approve requests assigned to you');
    }

    approval.status = ApprovalState.APPROVED;
    approval.comments = comments;

    const savedApproval = await this.approvalRepo.save(approval);

    // Update the related entity status if needed
    if (approval.activityId) {
      await this.activityRepo.update(approval.activityId, {
        approvalState: 'approved' as any,
        approvedById: user.id,
        approvedAt: new Date(),
      });
    }

    if (approval.taskId) {
      await this.taskRepo.update(approval.taskId, {
        isApproved: true,
        approvedById: user.id,
        approvedAt: new Date(),
      });
    }

    // Log audit trail
    await this.auditService.log({
      entityType: approval.activityId ? EntityType.ACTIVITY : EntityType.TASK,
      entityId: approval.activityId || approval.taskId,
      action: AuditAction.APPROVE,
      userId: user.id,
      newValues: { comments },
    });

    return savedApproval;
  }

  async reject(id: string, user: any, comments: string) {
    const approval = await this.getApprovalById(id, user);

    if (approval.status !== ApprovalState.PENDING) {
      throw new BadRequestException('Only pending approvals can be rejected');
    }

    if (approval.approverId !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('You can only reject requests assigned to you');
    }

    approval.status = ApprovalState.REJECTED;
    approval.comments = comments;

    const savedApproval = await this.approvalRepo.save(approval);

    // Update the related entity status if needed
    if (approval.activityId) {
      await this.activityRepo.update(approval.activityId, {
        approvalState: 'rejected' as any,
      });
    }

    // Log audit trail
    await this.auditService.log({
      entityType: approval.activityId ? EntityType.ACTIVITY : EntityType.TASK,
      entityId: approval.activityId || approval.taskId,
      action: AuditAction.REJECT,
      userId: user.id,
      newValues: { comments },
    });

    return savedApproval;
  }

  async reassign(id: string, newApproverId: string, user: any, comments?: string) {
    const approval = await this.getApprovalById(id, user);

    if (approval.status !== ApprovalState.PENDING) {
      throw new BadRequestException('Only pending approvals can be reassigned');
    }

    // Verify new approver exists and has appropriate role
    const newApprover = await this.userRepo.findOne({ where: { id: newApproverId } });
    if (!newApprover) {
      throw new NotFoundException('New approver not found');
    }

    if (!['admin', 'project_manager'].includes(newApprover.role)) {
      throw new BadRequestException('New approver must be an admin or project manager');
    }

    const oldApproverId = approval.approverId;
    approval.approverId = newApproverId;
    approval.comments = comments;

    const savedApproval = await this.approvalRepo.save(approval);

    // Log audit trail
    await this.auditService.log({
      entityType: approval.activityId ? EntityType.ACTIVITY : EntityType.TASK,
      entityId: approval.activityId || approval.taskId,
      action: AuditAction.UPDATE,
      userId: user.id,
      previousValues: { approverId: oldApproverId },
      newValues: { approverId: newApproverId, comments },
    });

    return savedApproval;
  }

  async getApprovalsByEntity(entityType: 'activity' | 'task', entityId: string, user: any) {
    const whereClause = entityType === 'activity' 
      ? { activityId: entityId }
      : { taskId: entityId };

    return this.approvalRepo.find({
      where: whereClause,
      relations: ['approver'],
      order: { createdAt: 'DESC' },
    });
  }

  async getApprovalStats(filters: {
    organizationId: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const query = this.approvalRepo.createQueryBuilder('approval')
      .where(`(
        (approval.activityId IS NOT NULL AND EXISTS (
          SELECT 1 FROM activities a WHERE a.id = approval.activityId AND a.organizationId = :organizationId
        )) OR
        (approval.taskId IS NOT NULL AND EXISTS (
          SELECT 1 FROM tasks t WHERE t.id = approval.taskId AND t.organizationId = :organizationId
        ))
      )`, { organizationId: filters.organizationId });

    if (filters.startDate) {
      query.andWhere('approval.createdAt >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      query.andWhere('approval.createdAt <= :endDate', { endDate: filters.endDate });
    }

    const approvals = await query.getMany();

    const stats = {
      total: approvals.length,
      pending: approvals.filter(a => a.status === ApprovalState.PENDING).length,
      approved: approvals.filter(a => a.status === ApprovalState.APPROVED).length,
      rejected: approvals.filter(a => a.status === ApprovalState.REJECTED).length,
      averageApprovalTime: 0,
      byApprover: {} as Record<string, number>,
    };

    // Calculate average approval time for completed approvals
    const completedApprovals = approvals.filter(a => a.status !== ApprovalState.PENDING);
    if (completedApprovals.length > 0) {
      const totalTime = completedApprovals.reduce((sum, approval) => {
        return sum + (approval.updatedAt.getTime() - approval.createdAt.getTime());
      }, 0);
      stats.averageApprovalTime = totalTime / completedApprovals.length / (1000 * 60 * 60); // in hours
    }

    // Count by approver
    approvals.forEach(approval => {
      const approverId = approval.approverId;
      stats.byApprover[approverId] = (stats.byApprover[approverId] || 0) + 1;
    });

    return stats;
  }

  async getApprovalAgingReport(organizationId: string) {
    const pendingApprovals = await this.getApprovals({
      organizationId,
      status: ApprovalState.PENDING,
    });

    const now = new Date();
    const aging = {
      lessThan24h: 0,
      between24h48h: 0,
      between48h72h: 0,
      moreThan72h: 0,
    };

    pendingApprovals.approvals.forEach(approval => {
      const hoursOld = (now.getTime() - approval.createdAt.getTime()) / (1000 * 60 * 60);
      
      if (hoursOld < 24) {
        aging.lessThan24h++;
      } else if (hoursOld < 48) {
        aging.between24h48h++;
      } else if (hoursOld < 72) {
        aging.between48h72h++;
      } else {
        aging.moreThan72h++;
      }
    });

    return {
      totalPending: pendingApprovals.total,
      aging,
      oldestPending: pendingApprovals.approvals.length > 0 
        ? pendingApprovals.approvals[pendingApprovals.approvals.length - 1]
        : null,
    };
  }

  async bulkApprove(approvalIds: string[], user: any, comments?: string) {
    const results = await Promise.all(
      approvalIds.map(id => this.approve(id, user, comments))
    );
    return { message: 'Bulk approval completed', results };
  }

  async bulkReject(approvalIds: string[], user: any, comments: string) {
    const results = await Promise.all(
      approvalIds.map(id => this.reject(id, user, comments))
    );
    return { message: 'Bulk rejection completed', results };
  }
}
