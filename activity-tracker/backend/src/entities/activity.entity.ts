import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Project } from './project.entity';
import { Comment } from './comment.entity';

// Activity status is now dynamic and configurable per organization
// Status values are stored as strings that reference StatusConfiguration entries

export enum ApprovalState {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  CLOSED = 'closed',
  REOPENED = 'reopened',
  REJECTED = 'rejected'
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

@Entity('activities')
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  ticketNumber: string;

  @Column({ length: 200 })
  title: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ type: 'date', nullable: true })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @Column({ length: 50, default: 'to_do' })
  @Index()
  status: string; // References StatusConfiguration.name

  @Column({
    type: 'enum',
    enum: ApprovalState,
    default: ApprovalState.DRAFT
  })
  @Index()
  approvalState: ApprovalState;

  @Column({
    type: 'enum',
    enum: Priority,
    default: Priority.MEDIUM
  })
  priority: Priority;

  @Column('simple-array', { nullable: true })
  tags: string[];

  @ManyToOne(() => Project, project => project.activities)
  project: Project;

  @Column('uuid')
  projectId: string;

  @ManyToOne(() => User, user => user.createdActivities)
  createdBy: User;

  @Column('uuid')
  createdById: string;

  @ManyToOne(() => User, user => user.createdActivities)
  updatedBy: User;

  @Column('uuid')
  updatedById: string;

  @ManyToOne(() => User, user => user.approvedActivities, { nullable: true })
  approvedBy: User;

  @Column('uuid', { nullable: true })
  approvedById: string;

  @Column({ nullable: true })
  approvedAt: Date;

  @ManyToMany(() => User, user => user.assignedActivities)
  @JoinTable({
    name: 'activity_assignees',
    joinColumn: { name: 'activityId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' }
  })
  assignees: User[];

  @OneToMany(() => Comment, comment => comment.activity)
  comments: Comment[];

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Optional back-reference to originating Task (if activity was created from a Task)
  @Index()
  @Column('uuid', { nullable: true })
  taskId: string | null;
}
