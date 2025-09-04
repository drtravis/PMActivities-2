import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskHistory } from '../entities';

@Controller('tasks')
@UseGuards(AuthGuard('jwt'))
export class TaskHistoryController {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(TaskHistory)
    private readonly historyRepo: Repository<TaskHistory>,
  ) {}

  // GET /tasks/:taskId/history - Get activity history for a task
  @Get(':taskId/history')
  async getTaskHistory(@Param('taskId') taskId: string, @Request() req: any) {
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

    const history = await this.historyRepo.find({
      where: { taskId },
      relations: ['actor'],
      order: { createdAt: 'DESC' },
    });

    return history.map(entry => ({
      id: entry.id,
      changeType: entry.changeType,
      description: entry.description || entry.getChangeDescription(),
      changes: entry.changes,
      actor: {
        id: entry.actor.id,
        name: entry.actor.name,
        email: entry.actor.email,
      },
      createdAt: entry.createdAt.toISOString(),
      metadata: entry.metadata,
      changeSummary: entry.getChangeSummary(),
    }));
  }
}
