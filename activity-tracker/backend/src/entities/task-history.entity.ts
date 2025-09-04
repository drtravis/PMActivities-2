import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Task } from './task.entity';

export enum ChangeType {
  CREATED = 'created',
  UPDATED = 'updated',
  STATUS_CHANGED = 'status_changed',
  PRIORITY_CHANGED = 'priority_changed',
  ASSIGNED = 'assigned',
  UNASSIGNED = 'unassigned',
  MOVED = 'moved',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  DELETED = 'deleted',
  RESTORED = 'restored',
  CUSTOM_FIELD_CHANGED = 'custom_field_changed',
  COMMENTED = 'commented',
  FILE_UPLOADED = 'file_uploaded',
  FILE_DELETED = 'file_deleted',
}

export interface FieldChange {
  field: string;
  oldValue: any;
  newValue: any;
  displayName?: string;
}

@Entity('task_history')
export class TaskHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Task)
  task: Task;

  @Index()
  @Column('uuid')
  taskId: string;

  @ManyToOne(() => User)
  actor: User;

  @Index()
  @Column('uuid')
  actorId: string;

  @Column({
    type: 'enum',
    enum: ChangeType,
  })
  @Index()
  changeType: ChangeType;

  // Detailed change information
  @Column('jsonb')
  changes: FieldChange[];

  // Optional description of the change
  @Column('text', { nullable: true })
  description?: string;

  // IP address for audit purposes
  @Column({ nullable: true })
  ipAddress?: string;

  // User agent for audit purposes
  @Column('text', { nullable: true })
  userAgent?: string;

  // Additional metadata
  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  // Helper methods
  getChangeDescription(): string {
    if (this.description) return this.description;

    switch (this.changeType) {
      case ChangeType.CREATED:
        return 'Task created';
      case ChangeType.STATUS_CHANGED:
        const statusChange = this.changes.find(c => c.field === 'status');
        return statusChange 
          ? `Status changed from "${statusChange.oldValue}" to "${statusChange.newValue}"`
          : 'Status changed';
      case ChangeType.PRIORITY_CHANGED:
        const priorityChange = this.changes.find(c => c.field === 'priority');
        return priorityChange
          ? `Priority changed from "${priorityChange.oldValue}" to "${priorityChange.newValue}"`
          : 'Priority changed';
      case ChangeType.ASSIGNED:
        return 'Task assigned';
      case ChangeType.UNASSIGNED:
        return 'Task unassigned';
      case ChangeType.MOVED:
        const sectionChange = this.changes.find(c => c.field === 'section');
        return sectionChange
          ? `Moved from "${sectionChange.oldValue}" to "${sectionChange.newValue}"`
          : 'Task moved';
      case ChangeType.APPROVED:
        return 'Task approved';
      case ChangeType.REJECTED:
        return 'Task rejected';
      case ChangeType.COMMENTED:
        return 'Comment added';
      case ChangeType.FILE_UPLOADED:
        return 'File uploaded';
      case ChangeType.FILE_DELETED:
        return 'File deleted';
      default:
        return 'Task updated';
    }
  }

  getChangeSummary(): string {
    const changeCount = this.changes.length;
    if (changeCount === 0) return 'No changes';
    if (changeCount === 1) return `1 field changed`;
    return `${changeCount} fields changed`;
  }

  static createForTaskCreation(task: Task, actor: User, metadata?: Record<string, any>): Partial<TaskHistory> {
    return {
      taskId: task.id,
      actorId: actor.id,
      changeType: ChangeType.CREATED,
      changes: [
        {
          field: 'title',
          oldValue: null,
          newValue: task.title,
          displayName: 'Title',
        },
        {
          field: 'status',
          oldValue: null,
          newValue: task.status,
          displayName: 'Status',
        },
      ],
      description: 'Task created',
      metadata,
    };
  }

  static createForFieldChange(
    task: Task,
    actor: User,
    field: string,
    oldValue: any,
    newValue: any,
    displayName?: string,
    metadata?: Record<string, any>
  ): Partial<TaskHistory> {
    const changeType = field === 'status' ? ChangeType.STATUS_CHANGED :
                      field === 'priority' ? ChangeType.PRIORITY_CHANGED :
                      ChangeType.UPDATED;

    return {
      taskId: task.id,
      actorId: actor.id,
      changeType,
      changes: [
        {
          field,
          oldValue,
          newValue,
          displayName: displayName || field,
        },
      ],
      metadata,
    };
  }
}
