import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskPriority, Project, User, Priority, Activity, Board } from '../entities';
import { UserRole } from '../entities/user.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task) private readonly taskRepo: Repository<Task>,
    @InjectRepository(Project) private readonly projectRepo: Repository<Project>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Activity) private readonly activityRepo: Repository<Activity>,
    @InjectRepository(Board) private readonly boardRepo: Repository<Board>,
  ) {}

  private generateTicketNumber(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `ACT-${timestamp}-${random}`.toUpperCase();
  }

  private mapTaskPriorityToActivityPriority(taskPriority: TaskPriority): Priority {
    switch (taskPriority) {
      case TaskPriority.LOW:
        return Priority.LOW;
      case TaskPriority.MEDIUM:
        return Priority.MEDIUM;
      case TaskPriority.HIGH:
      case TaskPriority.URGENT:
        return Priority.HIGH;
      default:
        return Priority.MEDIUM;
    }
  }

  private async getOrCreateDefaultBoard(projectId: string, organizationId: string, userId: string): Promise<Board> {
    // Try to find existing default board for this project
    let board = await this.boardRepo.findOne({
      where: { projectId, name: 'Default Board' }
    });

    if (!board) {
      // Create default board
      board = this.boardRepo.create({
        name: 'Default Board',
        description: 'Auto-created default board for tasks',
        projectId,
        organizationId,
        ownerId: userId,
      });
      board = await this.boardRepo.save(board);
    }

    return board;
  }

  async pmCreateAndAssign(projectId: string, dto: any, currentUser: any) {
    // Only PM or Admin
    if (![UserRole.ADMIN, UserRole.PROJECT_MANAGER].includes(currentUser.role)) {
      throw new ForbiddenException('Not allowed');
    }

    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    // Ensure assignee is provided and exists
    const assigneeId: string | undefined = dto.assigneeId;
    if (!assigneeId) throw new ForbiddenException('assigneeId is required');
    const assignee = await this.userRepo.findOne({ where: { id: assigneeId } });
    if (!assignee) throw new NotFoundException('Assignee not found');

    // Get or create default board for this project
    const board = await this.getOrCreateDefaultBoard(projectId, currentUser.organizationId, currentUser.userId || currentUser.id);

    const task = this.taskRepo.create({
      projectId,
      boardId: board.id,
      organizationId: currentUser.organizationId,
      createdById: currentUser.userId || currentUser.id,
      assigneeId,
      title: dto.title,
      description: dto.description ?? null,
      status: 'assigned',
      priority: dto.priority ?? TaskPriority.MEDIUM,
      dueDate: dto.dueDate ?? null,
    });
    return this.taskRepo.save(task);
  }

  async memberSelfCreate(projectId: string, dto: any, currentUser: any) {
    // Member or PM/Admin can self-create, but autoself-assign to current user and InProgress
    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    const userId = currentUser.userId || currentUser.id;

    // Get or create default board for this project
    const board = await this.getOrCreateDefaultBoard(projectId, currentUser.organizationId, userId);

    const task = this.taskRepo.create({
      projectId,
      boardId: board.id,
      organizationId: currentUser.organizationId,
      createdById: userId,
      assigneeId: userId,
      title: dto.title,
      description: dto.description ?? null,
      status: 'in_progress',
      priority: dto.priority ?? TaskPriority.MEDIUM,
      dueDate: dto.dueDate ?? null,
    });
    const savedTask = await this.taskRepo.save(task);

    // Create corresponding Activity so it appears in member's Activities
    const activity = this.activityRepo.create({
      ticketNumber: this.generateTicketNumber(),
      title: savedTask.title,
      description: savedTask.description ?? null,
      projectId: savedTask.projectId,
      priority: this.mapTaskPriorityToActivityPriority(savedTask.priority),
      createdById: userId,
      updatedById: userId,
      taskId: savedTask.id,
    } as Partial<Activity>);

    const savedActivity = await this.activityRepo.save(activity);

    return { task: savedTask, activity: savedActivity };
  }

  async getMyTasks(currentUser: any, filters: { status?: string; projectId?: string }) {
    const userId = currentUser.userId || currentUser.id;
    const qb = this.taskRepo.createQueryBuilder('t')
      .where('t.assigneeId = :userId', { userId })
      .orderBy('t.updatedAt', 'DESC');

    if (filters?.status) {
      qb.andWhere('t.status = :status', { status: filters.status });
    }

    if (filters?.projectId) {
      qb.andWhere('t.projectId = :projectId', { projectId: filters.projectId });
    }

    return qb.getMany();
  }

  async startTask(taskId: string, currentUser: any) {
    const userId = currentUser.userId || currentUser.id;
    const task = await this.taskRepo.findOne({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');
    if (task.assigneeId !== userId) throw new ForbiddenException('Only assignee can start the task');
    if (task.status !== 'to_do') throw new ForbiddenException('Task is not in To Do state');

    task.status = 'in_progress';
    const savedTask = await this.taskRepo.save(task);

    // Create corresponding Activity so it appears in member's Activities
    const activity = this.activityRepo.create({
      ticketNumber: this.generateTicketNumber(),
      title: task.title,
      description: task.description ?? null,
      projectId: task.projectId,
      priority: this.mapTaskPriorityToActivityPriority(task.priority),
      createdById: userId,
      updatedById: userId,
      taskId: task.id,
    } as Partial<Activity>);

    const savedActivity = await this.activityRepo.save(activity);

    return { task: savedTask, activity: savedActivity };
  }

  async getAllTasks(currentUser: any, filters?: { status?: string; assigneeId?: string }) {
    // Only PM/Admin/PMO can get all tasks
    if (![UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.PMO].includes(currentUser.role)) {
      throw new ForbiddenException('Not allowed');
    }

    const qb = this.taskRepo.createQueryBuilder('t')
      .where('t.organizationId = :orgId', { orgId: currentUser.organizationId });

    if (filters?.status) {
      qb.andWhere('t.status = :status', { status: filters.status });
    }

    if (filters?.assigneeId) {
      qb.andWhere('t.assigneeId = :assigneeId', { assigneeId: filters.assigneeId });
    }

    return qb.orderBy('t.createdAt', 'DESC').getMany();
  }

  async updateStatus(taskId: string, status: string, currentUser: any) {
    const task = await this.taskRepo.findOne({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');

    // Assignee can move their task, PM/Admin can move any within policies
    const userId = currentUser.userId || currentUser.id;
    const isAssignee = task.assigneeId === userId;
    const isManager = [UserRole.ADMIN, UserRole.PROJECT_MANAGER].includes(currentUser.role);

    if (!isAssignee && !isManager) throw new ForbiddenException('Not allowed');

    task.status = status;
    return this.taskRepo.save(task);
  }
}
