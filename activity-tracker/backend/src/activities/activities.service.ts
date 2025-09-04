import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity, ApprovalState, Priority } from '../entities/activity.entity';
import { User, UserRole } from '../entities/user.entity';
import { Project } from '../entities/project.entity';
import { AuditLog, EntityType, AuditAction } from '../entities/audit-log.entity';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity)
    private activityRepository: Repository<Activity>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  private generateTicketNumber(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `ACT-${timestamp}-${random}`.toUpperCase();
  }

  private async logAudit(entityId: string, action: AuditAction, userId: string, details?: any): Promise<void> {
    // TODO: Fix audit logging - temporarily disabled for testing
    return;
  }

  async create(createActivityDto: any, user: User): Promise<Activity> {
    // Verify project access
    const project = await this.projectRepository.findOne({
      where: { id: createActivityDto.projectId, organizationId: user.organizationId },
      relations: ['members'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check if user has access to the project
    const hasAccess = user.role === UserRole.ADMIN || 
                     user.role === UserRole.PROJECT_MANAGER ||
                     project.members.some((member: any) => member.id === user.id);

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this project');
    }

    const activity = this.activityRepository.create({
      ...createActivityDto,
      ticketNumber: this.generateTicketNumber(),
      createdById: user.id,
      updatedById: user.id,
      approvalState: ApprovalState.DRAFT,
    });

    const savedActivity = await this.activityRepository.save(activity);
    
    // TODO: Fix audit logging - temporarily disabled for testing
    // await this.logAudit(savedActivity.id, AuditAction.CREATE, user.id, createActivityDto);
    
    return savedActivity as unknown as Activity;
  }

  async findAll(user: User, filters?: any): Promise<Activity[]> {
    const queryBuilder = this.activityRepository.createQueryBuilder('activity')
      .leftJoinAndSelect('activity.project', 'project')
      .leftJoinAndSelect('activity.assignees', 'assignees')
      .leftJoinAndSelect('activity.createdBy', 'createdBy')
      .leftJoinAndSelect('activity.approvedBy', 'approvedBy')
      .where('project.organizationId = :organizationId', { organizationId: user.organizationId });

    // Role-based filtering
    if (user.role === UserRole.MEMBER) {
      // Members only see their own created activities (and those they are assigned to via extra filters)
      queryBuilder.andWhere('activity.createdById = :userId', { userId: user.id });
    }

    // Apply filters
    if (filters?.status) {
      queryBuilder.andWhere('activity.status = :status', { status: filters.status });
    }
    if (filters?.approvalState) {
      queryBuilder.andWhere('activity.approvalState = :approvalState', { approvalState: filters.approvalState });
    }
    if (filters?.projectId) {
      queryBuilder.andWhere('activity.projectId = :projectId', { projectId: filters.projectId });
    }
    if (filters?.assigneeId) {
      queryBuilder.andWhere('assignees.id = :assigneeId', { assigneeId: filters.assigneeId });
    }

    return await queryBuilder.getMany();
  }

  async findOne(id: string, user: User): Promise<Activity> {
    const activity = await this.activityRepository.findOne({
      where: { id },
      relations: ['project', 'assignees', 'createdBy', 'approvedBy', 'comments'],
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    // Check access
    if (user.role === UserRole.MEMBER) {
      const hasAccess = activity.createdById === user.id || 
                       activity.assignees.some(assignee => assignee.id === user.id);
      if (!hasAccess) {
        throw new ForbiddenException('You do not have access to this activity');
      }
    }

    return activity;
  }

  async update(id: string, updateActivityDto: any, user: User): Promise<Activity> {
    const activity = await this.findOne(id, user);

    // Check edit permissions
    const canEdit = user.role === UserRole.ADMIN ||
                   user.role === UserRole.PROJECT_MANAGER ||
                   ((activity.approvalState === ApprovalState.DRAFT || activity.approvalState === ApprovalState.REOPENED) && activity.createdById === user.id);

    if (!canEdit) {
      throw new ForbiddenException('You cannot edit this activity');
    }

    const oldData = { ...activity };
    Object.assign(activity, updateActivityDto);
    activity.updatedById = user.id;

    const savedActivity = await this.activityRepository.save(activity);
    await this.logAudit(id, AuditAction.UPDATE, user.id, { old: oldData, new: updateActivityDto });

    return savedActivity;
  }

  async submit(id: string, user: User): Promise<Activity> {
    const activity = await this.findOne(id, user);

    if (![ApprovalState.DRAFT, ApprovalState.REOPENED].includes(activity.approvalState)) {
      throw new BadRequestException('Only draft or reopened activities can be submitted');
    }

    if (activity.createdById !== user.id && user.role === UserRole.MEMBER) {
      throw new ForbiddenException('You can only submit your own activities');
    }

    activity.approvalState = ApprovalState.SUBMITTED;
    activity.updatedById = user.id;

    const savedActivity = await this.activityRepository.save(activity);
    await this.logAudit(id, AuditAction.SUBMIT, user.id);

    return savedActivity;
  }

  async approve(id: string, user: User, comment?: string): Promise<Activity> {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.PROJECT_MANAGER) {
      throw new ForbiddenException('Only admins and project managers can approve activities');
    }

    const activity = await this.findOne(id, user);

    if (activity.approvalState !== ApprovalState.SUBMITTED) {
      throw new BadRequestException('Only submitted activities can be approved');
    }

    activity.approvalState = ApprovalState.APPROVED;
    activity.approvedById = user.id;
    activity.approvedAt = new Date();
    activity.updatedById = user.id;

    const savedActivity = await this.activityRepository.save(activity);
    await this.logAudit(id, AuditAction.APPROVE, user.id, { comment });

    return savedActivity;
  }

  async reject(id: string, user: User, comment: string): Promise<Activity> {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.PROJECT_MANAGER) {
      throw new ForbiddenException('Only admins and project managers can reject activities');
    }

    const activity = await this.findOne(id, user);

    if (activity.approvalState !== ApprovalState.SUBMITTED) {
      throw new BadRequestException('Only submitted activities can be rejected');
    }

    activity.approvalState = ApprovalState.REJECTED;
    activity.updatedById = user.id;

    const savedActivity = await this.activityRepository.save(activity);
    await this.logAudit(id, AuditAction.REJECT, user.id, { comment });

    return savedActivity;
  }

  async reopen(id: string, user: User, comment?: string): Promise<Activity> {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.PROJECT_MANAGER) {
      throw new ForbiddenException('Only admins and project managers can reopen activities');
    }

    const activity = await this.findOne(id, user);

    if (![ApprovalState.APPROVED, ApprovalState.CLOSED, ApprovalState.REJECTED].includes(activity.approvalState)) {
      throw new BadRequestException('Only approved, closed or rejected activities can be reopened');
    }

    activity.approvalState = ApprovalState.REOPENED;
    activity.updatedById = user.id;

    const savedActivity = await this.activityRepository.save(activity);
    await this.logAudit(id, AuditAction.UPDATE, user.id, { action: 'reopen', comment });

    return savedActivity;
  }

  async close(id: string, user: User, comment?: string): Promise<Activity> {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.PROJECT_MANAGER) {
      throw new ForbiddenException('Only admins and project managers can close activities');
    }

    const activity = await this.findOne(id, user);

    if (![ApprovalState.APPROVED, ApprovalState.REOPENED].includes(activity.approvalState)) {
      throw new BadRequestException('Only approved or reopened activities can be closed');
    }

    activity.approvalState = ApprovalState.CLOSED;
    activity.updatedById = user.id;

    const savedActivity = await this.activityRepository.save(activity);
    await this.logAudit(id, AuditAction.UPDATE, user.id, { action: 'close', comment });

    return savedActivity;
  }

  async remove(id: string, user: User): Promise<void> {
    const activity = await this.findOne(id, user);

    const canDelete = user.role === UserRole.ADMIN ||
                     (activity.approvalState === ApprovalState.DRAFT && activity.createdById === user.id);

    if (!canDelete) {
      throw new ForbiddenException('You cannot delete this activity');
    }

    await this.activityRepository.remove(activity);
    await this.logAudit(id, AuditAction.DELETE, user.id);
  }
}
