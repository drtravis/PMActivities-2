import { Controller, Post, Patch, Get, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../entities/user.entity';
import { TasksService } from './tasks.service';
// TaskStatus is now dynamic and managed by StatusConfiguration

@Controller()
@UseGuards(AuthGuard('jwt'))
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  // PM/Admin creates task assigned to a member
  @Post('projects/:projectId/tasks')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  pmCreateAssign(
    @Param('projectId') projectId: string,
    @Body() body: { title: string; description?: string; assigneeId: string; priority?: string; dueDate?: string },
    @Request() req: any,
  ) {
    const dto: any = {
      title: body.title,
      description: body.description,
      assigneeId: body.assigneeId,
      priority: body.priority,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
    };
    return this.tasksService.pmCreateAndAssign(projectId, dto, req.user);
  }

  // Member self create -> auto self-assign and InProgress
  @Post('projects/:projectId/tasks/self')
  memberSelfCreate(
    @Param('projectId') projectId: string,
    @Body() body: { title: string; description?: string; priority?: string; dueDate?: string },
    @Request() req: any,
  ) {
    const dto: any = {
      title: body.title,
      description: body.description,
      priority: body.priority,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
    };
    return this.tasksService.memberSelfCreate(projectId, dto, req.user);
  }

  // Get all tasks (PM/Admin only)
  @Get('tasks')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.PMO)
  getAll(@Request() req: any, @Query('status') status?: string, @Query('assigneeId') assigneeId?: string) {
    return this.tasksService.getAllTasks(req.user, { status, assigneeId });
  }

  // Member inbox / working lists
  @Get('tasks/my')
  getMy(@Request() req: any, @Query('status') status?: string, @Query('projectId') projectId?: string) {
    return this.tasksService.getMyTasks(req.user, { status, projectId });
  }

  // Member starts assigned task
  @Patch('tasks/:id/start')
  start(@Param('id') id: string, @Request() req: any) {
    return this.tasksService.startTask(id, req.user);
  }

  // Update status (assignee or PM/Admin)
  @Patch('tasks/:id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
    @Request() req: any,
  ) {
    return this.tasksService.updateStatus(id, body.status, req.user);
  }
}
