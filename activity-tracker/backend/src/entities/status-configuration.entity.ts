import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
  Unique,
} from 'typeorm';
import { Organization } from './organization.entity';

export enum StatusType {
  ACTIVITY = 'activity',
  TASK = 'task',
  APPROVAL = 'approval',
}

@Entity('status_configurations')
@Unique(['organizationId', 'type', 'name'])
@Index(['organizationId', 'type'])
export class StatusConfiguration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Organization)
  organization: Organization;

  @Column('uuid')
  @Index()
  organizationId: string;

  @Column({
    type: 'enum',
    enum: StatusType,
  })
  @Index()
  type: StatusType;

  @Column({ length: 50 })
  name: string; // Internal name (e.g., 'in_progress', 'working_on_it')

  @Column({ length: 100 })
  displayName: string; // User-facing name (e.g., 'In Progress', 'Working on it')

  @Column({ length: 7 })
  color: string; // Hex color code

  @Column({ type: 'int', default: 0 })
  order: number; // Display order

  @Column({ default: false })
  isDefault: boolean; // System default status (cannot be deleted)

  @Column({ default: true })
  isActive: boolean; // Whether this status is currently available

  @Column('text', { nullable: true })
  description: string; // Optional description

  // Workflow configuration (JSON)
  @Column('jsonb', { nullable: true })
  workflowRules: {
    allowedTransitions?: string[]; // Which statuses this can transition to
    requiredRole?: string[]; // Roles that can set this status
    autoTransitions?: { // Automatic transitions based on conditions
      condition: string;
      targetStatus: string;
    }[];
  } | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper methods
  canTransitionTo(targetStatus: string): boolean {
    if (!this.workflowRules?.allowedTransitions) {
      return true; // No restrictions
    }
    return this.workflowRules.allowedTransitions.includes(targetStatus);
  }

  canBeSetByRole(role: string): boolean {
    if (!this.workflowRules?.requiredRole) {
      return true; // No role restrictions
    }
    return this.workflowRules.requiredRole.includes(role);
  }
}
