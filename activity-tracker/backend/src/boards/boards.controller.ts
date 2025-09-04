import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../entities';
import { BoardsService } from './boards.service';
import type {
  CreateBoardDto,
  UpdateBoardDto,
  CreateTaskDto,
  UpdateTaskDto,
  TaskFilters,
  TaskQueryOptions
} from './boards.service';

@Controller('boards')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  // Board endpoints
  @Post()
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.MEMBER)
  async createBoard(@Body() dto: CreateBoardDto, @Request() req) {
    return this.boardsService.createBoard(dto, req.user);
  }

  @Get('me')
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.MEMBER)
  async getMyBoards(@Request() req) {
    return this.boardsService.getMyBoards(req.user);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.MEMBER)
  async getBoardById(@Param('id') id: string, @Request() req) {
    return this.boardsService.getBoardById(id, req.user);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.MEMBER)
  async updateBoard(
    @Param('id') id: string,
    @Body() dto: UpdateBoardDto,
    @Request() req
  ) {
    return this.boardsService.updateBoard(id, dto, req.user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.MEMBER)
  async deleteBoard(@Param('id') id: string, @Request() req) {
    await this.boardsService.deleteBoard(id, req.user);
  }

  // Task endpoints
  @Post(':boardId/tasks')
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.MEMBER)
  async createTask(
    @Param('boardId') boardId: string,
    @Body() dto: CreateTaskDto,
    @Request() req
  ) {
    return this.boardsService.createTask(boardId, dto, req.user);
  }

  @Get(':boardId/tasks')
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.MEMBER)
  async getBoardTasks(
    @Param('boardId') boardId: string,
    @Query() filters: TaskFilters,
    @Query() options: TaskQueryOptions,
    @Request() req
  ) {
    return this.boardsService.getBoardTasks(boardId, filters, options, req.user);
  }

  @Patch('tasks/:taskId')
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.MEMBER)
  async updateTask(
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDto,
    @Request() req
  ) {
    return this.boardsService.updateTask(taskId, dto, req.user);
  }

  @Delete('tasks/:taskId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.MEMBER)
  async deleteTask(@Param('taskId') taskId: string, @Request() req) {
    await this.boardsService.deleteTask(taskId, req.user);
  }

  // Task history and approvals
  @Get('tasks/:taskId/history')
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.MEMBER, UserRole.PMO)
  async getTaskHistory(@Param('taskId') taskId: string, @Request() req) {
    return this.boardsService.getTaskHistory(taskId, req.user);
  }

  @Post('tasks/:taskId/approve')
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  async approveTask(
    @Param('taskId') taskId: string,
    @Body() dto: { note?: string },
    @Request() req
  ) {
    return this.boardsService.approveTask(taskId, dto.note, req.user);
  }

  @Post('tasks/:taskId/reject')
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  async rejectTask(
    @Param('taskId') taskId: string,
    @Body() dto: { reason: string },
    @Request() req
  ) {
    return this.boardsService.rejectTask(taskId, dto.reason, req.user);
  }

  // PM Multi-board view
  @Get('projects/:projectId/tasks')
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.PMO)
  async getProjectTasks(
    @Param('projectId') projectId: string,
    @Query() filters: TaskFilters & { memberIds?: string[] },
    @Query() options: TaskQueryOptions,
    @Request() req
  ) {
    return this.boardsService.getProjectTasks(projectId, filters, options, req.user);
  }

  // Bulk operations
  @Patch('tasks/bulk')
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.MEMBER)
  async bulkUpdateTasks(
    @Body() dto: { taskIds: string[]; updates: UpdateTaskDto },
    @Request() req
  ) {
    return this.boardsService.bulkUpdateTasks(dto.taskIds, dto.updates, req.user);
  }

  // Export functionality
  @Post('export/csv')
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  async exportTasksCSV(
    @Body() dto: { 
      boardIds?: string[]; 
      projectId?: string; 
      filters?: TaskFilters;
      columns?: string[];
    },
    @Request() req
  ) {
    return this.boardsService.exportTasksCSV(dto, req.user);
  }
}
