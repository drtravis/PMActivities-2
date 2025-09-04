import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';

export enum EntityType {
  USER = 'user',
  ACTIVITY = 'activity',
  PROJECT = 'project',
  COMMENT = 'comment',
  ORGANIZATION = 'organization'
}

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  SUBMIT = 'submit',
  APPROVE = 'approve',
  REJECT = 'reject',
  LOGIN = 'login',
  LOGOUT = 'logout',
  INVITE_USER = 'invite_user',
  ACCEPT_INVITATION = 'accept_invitation',
  VIEW = 'view',
  EXPORT = 'export',
  BULK_UPDATE = 'bulk_update',
  PASSWORD_CHANGE = 'password_change',
  ROLE_CHANGE = 'role_change',
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

  @Column('jsonb', { nullable: true })
  details: Record<string, any>;

  @ManyToOne('User')
  user: any;

  @Column('uuid')
  userId: string;

  @CreateDateColumn()
  timestamp: Date;
}
