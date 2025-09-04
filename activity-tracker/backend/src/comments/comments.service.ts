import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../entities/comment.entity';
import { Activity } from '../entities/activity.entity';
import { User, UserRole } from '../entities/user.entity';
import { AuditLog, EntityType, AuditAction } from '../entities/audit-log.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    @InjectRepository(Activity)
    private activityRepository: Repository<Activity>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  private async logAudit(entityId: string, action: AuditAction, userId: string, details?: any): Promise<void> {
    // TODO: Fix audit logging - temporarily disabled for testing
    return;
  }

  async create(activityId: string, body: string, user: User): Promise<Comment> {
    // Verify activity exists and user has access
    const activity = await this.activityRepository.findOne({
      where: { id: activityId },
      relations: ['project', 'assignees', 'createdBy'],
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

    const comment = this.commentRepository.create({
      body,
      activityId,
      createdById: user.id,
    });

    const savedComment = await this.commentRepository.save(comment);
    await this.logAudit(savedComment.id, AuditAction.CREATE, user.id, { body });

    return savedComment;
  }

  async findByActivity(activityId: string, user: User): Promise<Comment[]> {
    // Verify activity access first
    const activity = await this.activityRepository.findOne({
      where: { id: activityId },
      relations: ['project', 'assignees', 'createdBy'],
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

    return await this.commentRepository.find({
      where: { activityId },
      relations: ['createdBy'],
      order: { createdAt: 'ASC' },
    });
  }

  async update(id: string, body: string, user: User): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: ['createdBy', 'activity'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.createdById !== user.id) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    const oldBody = comment.body;
    comment.body = body;

    const savedComment = await this.commentRepository.save(comment);
    await this.logAudit(id, AuditAction.UPDATE, user.id, { old: oldBody, new: body });

    return savedComment;
  }

  async remove(id: string, user: User): Promise<void> {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: ['createdBy'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const canDelete = user.role === UserRole.ADMIN || 
                     user.role === UserRole.PROJECT_MANAGER ||
                     comment.createdById === user.id;

    if (!canDelete) {
      throw new ForbiddenException('You cannot delete this comment');
    }

    await this.commentRepository.remove(comment);
    await this.logAudit(id, AuditAction.DELETE, user.id);
  }
}
