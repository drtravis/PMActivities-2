import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, Index } from 'typeorm';
import { User } from './user.entity';
import { Project } from './project.entity';
import { Board } from './board.entity';

// Task status is now dynamic and configurable per organization
// Status values are stored as strings that reference StatusConfiguration entries

// Enhanced priority with Monday.com-style colors
export enum TaskPriority {
  LOW = 'Low',        // Blue
  MEDIUM = 'Medium',  // Purple
  HIGH = 'High',      // Red
  URGENT = 'Urgent',  // Dark red
}

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Board relationship (required for Monday.com-style boards)
  @ManyToOne(() => Board, board => board.tasks)
  board: Board;

  @Index()
  @Column('uuid')
  boardId: string;

  // Project relationship (inherited from board or direct)
  @ManyToOne(() => Project, { nullable: true })
  project?: Project;

  @Index()
  @Column('uuid', { nullable: true })
  projectId?: string;

  @Index()
  @Column('uuid')
  organizationId: string;

  // Optional reference to originating Activity (if task was created from an Activity)
  @Index()
  @Column('uuid', { nullable: true })
  activityId?: string | null;

  @ManyToOne(() => User)
  createdBy: User;

  @Index()
  @Column('uuid')
  createdById: string;

  // Primary assignee/owner (Monday.com-style)
  @ManyToOne(() => User, { nullable: true })
  assignee?: User | null;

  @Index()
  @Column('uuid', { nullable: true })
  assigneeId?: string | null;

  @Column({ length: 200 })
  title: string;

  @Column('text', { nullable: true })
  description?: string | null;

  @Column({ length: 50, default: 'to_do' })
  @Index()
  status: string; // References StatusConfiguration.name

  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  @Index()
  priority: TaskPriority;

  @Column({ type: 'timestamp', nullable: true })
  @Index()
  dueDate?: Date | null;

  // Custom column data (JSON)
  @Column('json', { default: {} })
  customData: Record<string, any>;

  // Tags for filtering and organization
  @Column('simple-array', { nullable: true })
  tags?: string[];

  // Position for drag & drop ordering within board sections
  @Column('integer', { default: 0 })
  position: number;

  // Section grouping (To-Do, Completed, etc.)
  @Column({ default: 'To-Do' })
  @Index()
  section: string;

  // Approval state for PM workflow
  @Column({ default: false })
  isApproved: boolean;

  @ManyToOne(() => User, { nullable: true })
  approvedBy?: User;

  @Column('uuid', { nullable: true })
  approvedById?: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt?: Date;

  // Enhanced for Monday.com-style workflow
  // Tasks are now the primary work items

  // Relationships for audit and approval
  @OneToMany('Approval', 'task')
  approvals: any[];

  @OneToMany('TaskHistory', 'task')
  history: any[];

  @OneToMany('TaskComment', 'task')
  comments: any[];

  @OneToMany('TaskAttachment', 'task')
  attachments: any[];

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper methods for comprehensive workflow functionality
  // Note: Status colors are now managed by StatusConfiguration
  // Use StatusConfigurationService.getStatusMapping() to get colors

  getPriorityColor(): string {
    const colors = {
      [TaskPriority.LOW]: '#579bfc',
      [TaskPriority.MEDIUM]: '#a25ddc',
      [TaskPriority.HIGH]: '#e2445c',
      [TaskPriority.URGENT]: '#bb3354',
    };
    return colors[this.priority] || '#a25ddc';
  }

  isCompleted(): boolean {
    return this.status === 'completed' || this.status === 'closed';
  }

  canBeEditedBy(userId: string, userRole: string): boolean {
    // If approved, only PMs and admins can edit
    if (this.isApproved) {
      return userRole === 'project_manager' || userRole === 'admin';
    }

    // Otherwise, owner can edit
    return this.assigneeId === userId || this.createdById === userId;
  }
}
