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
  ASSIGNED = 'assigned',
  COMPLETED = 'completed',
  PRIORITY_CHANGED = 'priority_changed',
  DELETED = 'deleted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  FILE_UPLOADED = 'file_uploaded',
  COMMENTED = 'commented'
}

export interface FieldChange {
  field: string;
  oldValue: any;
  newValue: any;
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

  @Column('json', { nullable: true })
  fieldChanges?: Record<string, any>;

  @Column('text', { nullable: true })
  description?: string;

  @Column('json', { nullable: true })
  changes?: FieldChange[];

  @Column('json', { nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  getChangeDescription(): string {
    if (this.description) return this.description;

    switch (this.changeType) {
      case ChangeType.CREATED:
        return 'Task created';
      case ChangeType.UPDATED:
        return 'Task updated';
      case ChangeType.STATUS_CHANGED:
        return 'Status changed';
      case ChangeType.ASSIGNED:
        return 'Task assigned';
      case ChangeType.COMPLETED:
        return 'Task completed';
      case ChangeType.PRIORITY_CHANGED:
        return 'Priority changed';
      case ChangeType.DELETED:
        return 'Task deleted';
      case ChangeType.APPROVED:
        return 'Task approved';
      case ChangeType.REJECTED:
        return 'Task rejected';
      case ChangeType.FILE_UPLOADED:
        return 'File uploaded';
      case ChangeType.COMMENTED:
        return 'Comment added';
      default:
        return 'Task modified';
    }
  }

  getChangeSummary(): string {
    if (!this.changes || this.changes.length === 0) {
      return this.getChangeDescription();
    }

    const changeDescriptions = this.changes.map(change =>
      `${change.field}: ${change.oldValue} → ${change.newValue}`
    );

    return changeDescriptions.join(', ');
  }
}
