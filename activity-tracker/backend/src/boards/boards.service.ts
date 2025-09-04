import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import {
  Board,
  Task,
  Project,
  User,
  TaskHistory,
  Approval,
  TaskPriority,
  UserRole,
  ChangeType,
  ApprovalState
} from '../entities';

export interface CreateBoardDto {
  name: string;
  description?: string;
  projectId?: string;
  customColumns?: any[];
}

export interface UpdateBoardDto {
  name?: string;
  description?: string;
  customColumns?: any[];
  settings?: any;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  assigneeId?: string;
  status?: string;
  priority?: TaskPriority;
  dueDate?: Date;
  section?: string;
  customData?: Record<string, any>;
  tags?: string[];
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  assigneeId?: string;
  status?: string;
  priority?: TaskPriority;
  dueDate?: Date;
  section?: string;
  customData?: Record<string, any>;
  tags?: string[];
  position?: number;
}

export interface TaskFilters {
  status?: string[];
  priority?: TaskPriority[];
  assigneeId?: string[];
  section?: string[];
  dueFrom?: Date;
  dueTo?: Date;
  search?: string;
  tags?: string[];
}

export interface TaskQueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  groupBy?: 'status' | 'priority' | 'assignee' | 'section';
}

@Injectable()
export class BoardsService {
  constructor(
    @InjectRepository(Board) private readonly boardRepo: Repository<Board>,
    @InjectRepository(Task) private readonly taskRepo: Repository<Task>,
    @InjectRepository(Project) private readonly projectRepo: Repository<Project>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(TaskHistory) private readonly historyRepo: Repository<TaskHistory>,
    @InjectRepository(Approval) private readonly approvalRepo: Repository<Approval>,
  ) {}

  // Board CRUD Operations
  async createBoard(dto: CreateBoardDto, currentUser: any): Promise<Board> {
    const userId = currentUser.userId || currentUser.id;
    
    // Validate project if provided
    if (dto.projectId) {
      const project = await this.projectRepo.findOne({ 
        where: { id: dto.projectId },
        relations: ['members']
      });
      
      if (!project) {
        throw new NotFoundException('Project not found');
      }

      // Check if user is project member or has admin/PM role
      const isProjectMember = project.members.some(member => member.id === userId);
      const hasManagerRole = [UserRole.ADMIN, UserRole.PROJECT_MANAGER].includes(currentUser.role);
      
      if (!isProjectMember && !hasManagerRole) {
        throw new ForbiddenException('Not authorized to create board for this project');
      }
    }

    const board = this.boardRepo.create({
      name: dto.name,
      description: dto.description,
      projectId: dto.projectId,
      ownerId: userId,
      organizationId: currentUser.organizationId,
      customColumns: dto.customColumns || [],
    });

    return this.boardRepo.save(board);
  }

  async getMyBoards(currentUser: any): Promise<Board[]> {
    const userId = currentUser.userId || currentUser.id;
    
    return this.boardRepo.find({
      where: { ownerId: userId, isActive: true },
      relations: ['project', 'owner'],
      order: { updatedAt: 'DESC' },
    });
  }

  async getBoardById(boardId: string, currentUser: any): Promise<Board> {
    const board = await this.boardRepo.findOne({
      where: { id: boardId },
      relations: ['project', 'owner', 'tasks', 'tasks.assignee'],
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    // Check access permissions
    await this.checkBoardAccess(board, currentUser);

    return board;
  }

  async updateBoard(boardId: string, dto: UpdateBoardDto, currentUser: any): Promise<Board> {
    const board = await this.getBoardById(boardId, currentUser);
    
    // Only owner or admin can update board
    const userId = currentUser.userId || currentUser.id;
    if (board.ownerId !== userId && currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only board owner or admin can update board');
    }

    Object.assign(board, dto);
    return this.boardRepo.save(board);
  }

  async deleteBoard(boardId: string, currentUser: any): Promise<void> {
    const board = await this.getBoardById(boardId, currentUser);
    
    // Only owner or admin can delete board
    const userId = currentUser.userId || currentUser.id;
    if (board.ownerId !== userId && currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only board owner or admin can delete board');
    }

    // Soft delete by marking as inactive
    board.isActive = false;
    await this.boardRepo.save(board);
  }

  // Task Operations
  async createTask(boardId: string, dto: CreateTaskDto, currentUser: any): Promise<Task> {
    const board = await this.getBoardById(boardId, currentUser);
    const userId = currentUser.userId || currentUser.id;

    // Validate assignee if provided
    if (dto.assigneeId) {
      const assignee = await this.userRepo.findOne({ where: { id: dto.assigneeId } });
      if (!assignee) {
        throw new NotFoundException('Assignee not found');
      }
    }

    // Get next position in section
    const maxPosition = await this.taskRepo
      .createQueryBuilder('task')
      .select('MAX(task.position)', 'maxPosition')
      .where('task.boardId = :boardId', { boardId })
      .andWhere('task.section = :section', { section: dto.section || 'To-Do' })
      .getRawOne();

    const task = this.taskRepo.create({
      boardId,
      projectId: board.projectId,
      organizationId: currentUser.organizationId,
      createdById: userId,
      assigneeId: dto.assigneeId || userId,
      title: dto.title,
      description: dto.description,
      status: dto.status || 'to_do',
      priority: dto.priority || TaskPriority.MEDIUM,
      dueDate: dto.dueDate,
      section: dto.section || 'To-Do',
      customData: dto.customData || {},
      tags: dto.tags || [],
      position: (maxPosition?.maxPosition || 0) + 1,
    });

    const savedTask = await this.taskRepo.save(task);

    // Create history entry
    await this.createHistoryEntry(
      savedTask,
      currentUser,
      ChangeType.CREATED,
      [{ field: 'title', oldValue: null, newValue: savedTask.title }]
    );

    return savedTask;
  }

  async updateTask(taskId: string, dto: UpdateTaskDto, currentUser: any): Promise<Task> {
    const task = await this.taskRepo.findOne({
      where: { id: taskId },
      relations: ['board', 'assignee'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check if task can be edited
    const userId = currentUser.userId || currentUser.id;
    if (!task.canBeEditedBy(userId, currentUser.role)) {
      throw new ForbiddenException('Task is locked after approval');
    }

    // Track changes for history
    const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];
    const oldValues = { ...task };

    // Update fields and track changes
    if (dto.title !== undefined && dto.title !== task.title) {
      changes.push({ field: 'title', oldValue: task.title, newValue: dto.title });
      task.title = dto.title;
    }

    if (dto.status !== undefined && dto.status !== task.status) {
      changes.push({ field: 'status', oldValue: task.status, newValue: dto.status });
      task.status = dto.status;
    }

    if (dto.priority !== undefined && dto.priority !== task.priority) {
      changes.push({ field: 'priority', oldValue: task.priority, newValue: dto.priority });
      task.priority = dto.priority;
    }

    if (dto.section !== undefined && dto.section !== task.section) {
      changes.push({ field: 'section', oldValue: task.section, newValue: dto.section });
      task.section = dto.section;
    }

    // Update other fields
    if (dto.description !== undefined) task.description = dto.description;
    if (dto.assigneeId !== undefined) task.assigneeId = dto.assigneeId;
    if (dto.dueDate !== undefined) task.dueDate = dto.dueDate;
    if (dto.customData !== undefined) task.customData = { ...task.customData, ...dto.customData };
    if (dto.tags !== undefined) task.tags = dto.tags;
    if (dto.position !== undefined) task.position = dto.position;

    const savedTask = await this.taskRepo.save(task);

    // Create history entry if there were changes
    if (changes.length > 0) {
      const changeType = changes.some(c => c.field === 'status') ? ChangeType.STATUS_CHANGED :
                        changes.some(c => c.field === 'priority') ? ChangeType.PRIORITY_CHANGED :
                        ChangeType.UPDATED;

      await this.createHistoryEntry(savedTask, currentUser, changeType, changes);
    }

    return savedTask;
  }

  // Helper methods
  private async checkBoardAccess(board: Board, currentUser: any): Promise<void> {
    const userId = currentUser.userId || currentUser.id;
    
    // Owner always has access
    if (board.ownerId === userId) return;
    
    // Admin and PMO always have access
    if (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.PMO) return;
    
    // If board is project-based, check project membership
    if (board.projectId) {
      const project = await this.projectRepo.findOne({
        where: { id: board.projectId },
        relations: ['members'],
      });
      
      if (project) {
        const isMember = project.members.some(member => member.id === userId);
        const isPM = currentUser.role === UserRole.PROJECT_MANAGER;
        
        if (isMember || isPM) return;
      }
    }
    
    throw new ForbiddenException('Access denied to this board');
  }

  async getBoardTasks(
    boardId: string,
    filters: TaskFilters,
    options: TaskQueryOptions,
    currentUser: any
  ): Promise<{ tasks: Task[]; total: number; grouped?: any }> {
    const board = await this.getBoardById(boardId, currentUser);

    const qb = this.taskRepo.createQueryBuilder('task')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .where('task.boardId = :boardId', { boardId });

    // Apply filters
    this.applyTaskFilters(qb, filters);

    // Apply sorting
    const sortBy = options.sortBy || 'position';
    const sortOrder = options.sortOrder || 'ASC';
    qb.orderBy(`task.${sortBy}`, sortOrder);

    // Apply pagination
    const page = options.page || 1;
    const limit = options.limit || 50;
    qb.skip((page - 1) * limit).take(limit);

    const [tasks, total] = await qb.getManyAndCount();

    // Group tasks if requested
    let grouped;
    if (options.groupBy) {
      grouped = this.groupTasks(tasks, options.groupBy);
    }

    return { tasks, total, grouped };
  }

  async deleteTask(taskId: string, currentUser: any): Promise<void> {
    const task = await this.taskRepo.findOne({
      where: { id: taskId },
      relations: ['board'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check permissions
    const userId = currentUser.userId || currentUser.id;
    if (!task.canBeEditedBy(userId, currentUser.role)) {
      throw new ForbiddenException('Cannot delete approved task');
    }

    await this.taskRepo.remove(task);

    // Create history entry
    await this.createHistoryEntry(task, currentUser, ChangeType.DELETED, []);
  }

  async getTaskHistory(taskId: string, currentUser: any): Promise<TaskHistory[]> {
    const task = await this.taskRepo.findOne({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return this.historyRepo.find({
      where: { taskId },
      relations: ['actor'],
      order: { createdAt: 'DESC' },
    });
  }

  async approveTask(taskId: string, note: string | undefined, currentUser: any): Promise<Approval> {
    const task = await this.taskRepo.findOne({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Create approval record
    const approval = this.approvalRepo.create({
      taskId,
      approverId: currentUser.userId || currentUser.id,
      state: 'approved' as any,
      note,
      taskSnapshot: { ...task },
      processedAt: new Date(),
    });

    const savedApproval = await this.approvalRepo.save(approval);

    // Update task
    task.isApproved = true;
    task.approvedById = currentUser.userId || currentUser.id;
    task.approvedAt = new Date();
    await this.taskRepo.save(task);

    // Create history entry
    await this.createHistoryEntry(task, currentUser, ChangeType.APPROVED, [
      { field: 'approved', oldValue: false, newValue: true }
    ]);

    return savedApproval;
  }

  async rejectTask(taskId: string, reason: string, currentUser: any): Promise<Approval> {
    const task = await this.taskRepo.findOne({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const approval = this.approvalRepo.create({
      taskId,
      approverId: currentUser.userId || currentUser.id,
      state: 'rejected' as any,
      rejectionReason: reason,
      taskSnapshot: { ...task },
      processedAt: new Date(),
    });

    const savedApproval = await this.approvalRepo.save(approval);

    // Create history entry
    await this.createHistoryEntry(task, currentUser, ChangeType.REJECTED, [
      { field: 'rejected', oldValue: false, newValue: true }
    ]);

    return savedApproval;
  }

  async getProjectTasks(
    projectId: string,
    filters: TaskFilters & { memberIds?: string[] },
    options: TaskQueryOptions,
    currentUser: any
  ): Promise<{ tasks: Task[]; total: number; grouped?: any }> {
    // Verify PM has access to project
    if (currentUser.role !== UserRole.ADMIN) {
      const project = await this.projectRepo.findOne({
        where: { id: projectId },
        relations: ['members'],
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }
    }

    const qb = this.taskRepo.createQueryBuilder('task')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .leftJoinAndSelect('task.board', 'board')
      .where('task.projectId = :projectId', { projectId });

    // Filter by specific members if requested
    if (filters.memberIds && filters.memberIds.length > 0) {
      qb.andWhere('task.assigneeId IN (:...memberIds)', { memberIds: filters.memberIds });
    }

    // Apply other filters
    this.applyTaskFilters(qb, filters);

    // Apply sorting and pagination
    const sortBy = options.sortBy || 'updatedAt';
    const sortOrder = options.sortOrder || 'DESC';
    qb.orderBy(`task.${sortBy}`, sortOrder);

    const page = options.page || 1;
    const limit = options.limit || 100;
    qb.skip((page - 1) * limit).take(limit);

    const [tasks, total] = await qb.getManyAndCount();

    // Group tasks if requested
    let grouped;
    if (options.groupBy) {
      grouped = this.groupTasks(tasks, options.groupBy);
    }

    return { tasks, total, grouped };
  }

  async bulkUpdateTasks(taskIds: string[], updates: UpdateTaskDto, currentUser: any): Promise<Task[]> {
    const tasks = await this.taskRepo.findByIds(taskIds);
    const updatedTasks: Task[] = [];

    for (const task of tasks) {
      if (task.canBeEditedBy(currentUser.userId || currentUser.id, currentUser.role)) {
        const updatedTask = await this.updateTask(task.id, updates, currentUser);
        updatedTasks.push(updatedTask);
      }
    }

    return updatedTasks;
  }

  async exportTasksCSV(dto: any, currentUser: any): Promise<{ url: string }> {
    // This would integrate with Azure Blob Storage for file generation
    // For now, return a placeholder
    return { url: 'https://placeholder-export-url.com/tasks.csv' };
  }

  // Helper methods
  private applyTaskFilters(qb: SelectQueryBuilder<Task>, filters: TaskFilters): void {
    if (filters.status && filters.status.length > 0) {
      qb.andWhere('task.status IN (:...statuses)', { statuses: filters.status });
    }

    if (filters.priority && filters.priority.length > 0) {
      qb.andWhere('task.priority IN (:...priorities)', { priorities: filters.priority });
    }

    if (filters.assigneeId && filters.assigneeId.length > 0) {
      qb.andWhere('task.assigneeId IN (:...assigneeIds)', { assigneeIds: filters.assigneeId });
    }

    if (filters.section && filters.section.length > 0) {
      qb.andWhere('task.section IN (:...sections)', { sections: filters.section });
    }

    if (filters.dueFrom) {
      qb.andWhere('task.dueDate >= :dueFrom', { dueFrom: filters.dueFrom });
    }

    if (filters.dueTo) {
      qb.andWhere('task.dueDate <= :dueTo', { dueTo: filters.dueTo });
    }

    if (filters.search) {
      qb.andWhere('(task.title ILIKE :search OR task.description ILIKE :search)', {
        search: `%${filters.search}%`
      });
    }

    if (filters.tags && filters.tags.length > 0) {
      qb.andWhere('task.tags && :tags', { tags: filters.tags });
    }
  }

  private groupTasks(tasks: Task[], groupBy: string): Record<string, Task[]> {
    return tasks.reduce((groups, task) => {
      let key: string;

      switch (groupBy) {
        case 'status':
          key = task.status;
          break;
        case 'priority':
          key = task.priority;
          break;
        case 'assignee':
          key = task.assignee?.name || 'Unassigned';
          break;
        case 'section':
          key = task.section;
          break;
        default:
          key = 'Other';
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(task);

      return groups;
    }, {} as Record<string, Task[]>);
  }

  private async createHistoryEntry(
    task: Task,
    currentUser: any,
    changeType: ChangeType,
    changes: any[]
  ): Promise<void> {
    const history = this.historyRepo.create({
      taskId: task.id,
      actorId: currentUser.userId || currentUser.id,
      changeType,
      changes,
    });

    await this.historyRepo.save(history);
  }
}
