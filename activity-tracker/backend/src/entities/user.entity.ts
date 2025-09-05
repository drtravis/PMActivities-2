import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, ManyToMany, JoinTable, Index } from 'typeorm';
import { Organization } from './organization.entity';
import { Board } from './board.entity';
import { Task } from './task.entity';
import { Activity } from './activity.entity';
import { Comment } from './comment.entity';
import { Project } from './project.entity';
import { Approval } from './approval.entity';
import { TaskHistory } from './task-history.entity';

export enum UserRole {
  ADMIN = 'admin',
  PMO = 'pmo',
  PROJECT_MANAGER = 'project_manager',
  MEMBER = 'member'
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ length: 200 })
  name: string;

  @Column({ nullable: true })
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.MEMBER
  })
  @Index()
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'varchar', nullable: true })
  invitationToken: string | null;

  @Column({ type: 'timestamp', nullable: true })
  invitationExpiresAt: Date | null;

  @ManyToOne(() => Organization, organization => organization.users)
  organization: Organization;

  @Column('uuid')
  @Index()
  organizationId: string;

  @OneToMany(() => Activity, activity => activity.createdBy)
  createdActivities: Activity[];

  @OneToMany(() => Activity, activity => activity.approvedBy)
  approvedActivities: Activity[];

  @ManyToMany(() => Activity, activity => activity.assignees)
  assignedActivities: Activity[];

  @OneToMany(() => Comment, comment => comment.createdBy)
  comments: Comment[];

  @ManyToMany(() => Project, project => project.members)
  projects: Project[];

  @OneToMany(() => Board, board => board.owner)
  ownedBoards: Board[];

  @OneToMany(() => Task, task => task.assignee)
  assignedTasks: Task[];

  @OneToMany(() => Task, task => task.createdBy)
  createdTasks: Task[];

  @OneToMany(() => Approval, approval => approval.approver)
  approvals: Approval[];

  @OneToMany(() => TaskHistory, taskHistory => taskHistory.actor)
  taskHistoryEntries: TaskHistory[];

  // User preferences (e.g., member view settings)
  @Column('json', { nullable: true })
  preferences: Record<string, any> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
