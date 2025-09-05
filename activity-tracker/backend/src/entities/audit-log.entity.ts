import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';

export enum EntityType {
  ORGANIZATION = 'organization',
  USER = 'user',
  PROJECT = 'project',
  ACTIVITY = 'activity',
  TASK = 'task',
  BOARD = 'board',
  COMMENT = 'comment'
}

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  APPROVE = 'approve',
  REJECT = 'reject',
  SUBMIT = 'submit',
  EXPORT = 'export',
  LOGIN = 'login',
  INVITE_USER = 'invite_user',
  ACCEPT_INVITATION = 'accept_invitation'
}

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: EntityType
  })
  entityType: EntityType;

  @Column('uuid')
  entityId: string;

  @Column({
    type: 'enum',
    enum: AuditAction
  })
  action: AuditAction;

  @Column('uuid')
  userId: string;

  @Column('json', { nullable: true })
  oldValues?: Record<string, any>;

  @Column('json', { nullable: true })
  newValues?: Record<string, any>;

  @ManyToOne('User')
  user: any;

  @CreateDateColumn()
  createdAt: Date;
}
