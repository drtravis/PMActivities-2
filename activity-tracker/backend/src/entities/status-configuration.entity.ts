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

@Entity('status_configuration')
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

  @Column({ length: 100 })
  name: string; // Status name (e.g., 'To Do', 'In Progress')

  @Column({ length: 7, default: '#6B7280' })
  color: string; // Hex color code

  @Column({ type: 'int', default: 0 })
  orderIndex: number; // Display order (matches database column name)

  @Column({ default: true })
  isActive: boolean; // Whether this status is currently available

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper methods
  getDisplayName(): string {
    return this.name; // Use name as display name
  }

  isSystemDefault(): boolean {
    // Check if this is a system default status (organizationId is null or default-org)
    return !this.organizationId || this.organizationId === 'default-org';
  }
}
