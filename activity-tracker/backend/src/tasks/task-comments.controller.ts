import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskComment, TaskHistory, ChangeType, User } from '../entities';

@Controller('tasks')
@UseGuards(AuthGuard('jwt'))
export class TaskCommentsController {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(TaskComment)
    private readonly commentRepo: Repository<TaskComment>,
    @InjectRepository(TaskHistory)
    private readonly historyRepo: Repository<TaskHistory>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // GET /tasks/:taskId/comments - Get all comments for a task
  @Get(':taskId/comments')
  async getTaskComments(@Param('taskId') taskId: string, @Request() req: any) {
    const userId = req.user.userId || req.user.id;

    // Verify user has access to this task
    const task = await this.taskRepo.findOne({
      where: { id: taskId },
      relations: ['project', 'project.members'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check if user has access to this task
    const hasAccess = task.assigneeId === userId || 
                     task.createdById === userId ||
                     task.project?.members?.some((member: any) => member.userId === userId);

    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this task');
    }

    const comments = await this.commentRepo.find({
      where: { taskId },
      relations: ['author'],
      order: { createdAt: 'DESC' },
    });

    return comments.map(comment => ({
      id: comment.id,
      body: comment.body,
      author: {
        id: comment.author.id,
        name: comment.author.name,
        email: comment.author.email,
      },
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      isEdited: comment.isEdited,
      lastEditedAt: comment.lastEditedAt?.toISOString(),
      reactions: comment.reactions,
      mentions: comment.mentions,
      isPinned: comment.isPinned,
    }));
  }

  // POST /tasks/:taskId/comments - Create a new comment
  @Post(':taskId/comments')
  async createTaskComment(
    @Param('taskId') taskId: string,
    @Body() body: { body: string; mentions?: string[] },
    @Request() req: any,
  ) {
    const userId = req.user.userId || req.user.id;

    if (!body.body || body.body.trim().length === 0) {
      throw new BadRequestException('Comment body is required');
    }

    // Verify user has access to this task
    const task = await this.taskRepo.findOne({
      where: { id: taskId },
      relations: ['project', 'project.members'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check if user has access to this task
    const hasAccess = task.assigneeId === userId || 
                     task.createdById === userId ||
                     task.project?.members?.some((member: any) => member.userId === userId);

    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this task');
    }

    // Get the current user
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Extract mentions from comment body
    const mentions = body.mentions || [];

    // Create the comment
    const comment = this.commentRepo.create({
      taskId,
      authorId: userId,
      body: body.body.trim(),
      mentions,
    });

    const savedComment = await this.commentRepo.save(comment);

    // Create activity log entry
    await this.historyRepo.save({
      taskId,
      actorId: userId,
      changeType: ChangeType.COMMENTED,
      description: `${user.name} added a comment`,
      changes: [],
    });

    // Load the comment with author relation
    const commentWithAuthor = await this.commentRepo.findOne({
      where: { id: savedComment.id },
      relations: ['author'],
    });

    if (!commentWithAuthor) {
      throw new NotFoundException('Comment not found after creation');
    }

    return {
      id: commentWithAuthor.id,
      body: commentWithAuthor.body,
      author: {
        id: commentWithAuthor.author.id,
        name: commentWithAuthor.author.name,
        email: commentWithAuthor.author.email,
      },
      createdAt: commentWithAuthor.createdAt.toISOString(),
      updatedAt: commentWithAuthor.updatedAt.toISOString(),
      isEdited: commentWithAuthor.isEdited,
      reactions: commentWithAuthor.reactions,
      mentions: commentWithAuthor.mentions,
      isPinned: commentWithAuthor.isPinned,
    };
  }
}
