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

export enum ApprovalState {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REVOKED = 'revoked',
}

@Entity('approvals')
export class Approval {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Task)
  task: Task;

  @Index()
  @Column('uuid')
  taskId: string;

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
  state: ApprovalState;

  @Column('text', { nullable: true })
  note?: string;

  @Column('text', { nullable: true })
  rejectionReason?: string;

  // Snapshot of task data at time of approval
  @Column('jsonb', { nullable: true })
  taskSnapshot?: Record<string, any>;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  processedAt?: Date;

  // Helper methods
  isApproved(): boolean {
    return this.state === ApprovalState.APPROVED;
  }

  isRejected(): boolean {
    return this.state === ApprovalState.REJECTED;
  }

  isPending(): boolean {
    return this.state === ApprovalState.PENDING;
  }
}
