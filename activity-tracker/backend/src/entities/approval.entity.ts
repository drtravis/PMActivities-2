import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Task } from './task.entity';
import { Activity } from './activity.entity';

export enum ApprovalState {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REOPENED = 'reopened',
  CLOSED = 'closed'
}

@Entity('approvals')
export class Approval {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Task, { nullable: true })
  task?: Task;

  @Index()
  @Column('uuid', { nullable: true })
  taskId?: string;

  @ManyToOne(() => Activity, { nullable: true })
  activity?: Activity;

  @Index()
  @Column('uuid', { nullable: true })
  activityId?: string;

  @ManyToOne(() => User)
  approver: User;

  @Index()
  @Column('uuid')
  approverId: string;

  @Column({
    type: 'enum',
    enum: ApprovalState,
    default: ApprovalState.PENDING,
  })
  @Index()
  status: ApprovalState;

  @Column('text', { nullable: true })
  comments?: string;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper methods
  isApproved(): boolean {
    return this.status === ApprovalState.APPROVED;
  }

  isRejected(): boolean {
    return this.status === ApprovalState.REJECTED;
  }

  isPending(): boolean {
    return this.status === ApprovalState.PENDING;
  }
}
