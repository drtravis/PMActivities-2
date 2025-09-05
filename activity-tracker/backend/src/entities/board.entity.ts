import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Project } from './project.entity';
import { Task } from './task.entity';

export interface CustomColumn {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'date' | 'boolean';
  required?: boolean;
  defaultValue?: any;
  options?: string[]; // For select type
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface BoardSettings {
  defaultView: 'board' | 'table';
  groupBy: 'status' | 'priority' | 'assignee' | 'none';
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  hiddenColumns: string[];
  filters: Record<string, any>;
}

@Entity('boards')
export class Board {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  name: string;

  @Column('text', { nullable: true })
  description?: string;

  // Board can be personal (no project) or project-based
  @ManyToOne(() => Project, { nullable: true })
  project?: Project;

  @Index()
  @Column('uuid', { nullable: true })
  projectId?: string;

  @ManyToOne(() => User)
  owner: User;

  @Index()
  @Column('uuid')
  ownerId: string;

  @Column('uuid')
  @Index()
  organizationId: string;

  // JSON schema for custom columns
  @Column('json', { default: [] })
  customColumns: CustomColumn[];

  // Board settings and preferences
  @Column('json', { default: {} })
  settings: BoardSettings;

  // Default board template
  @Column({ default: false })
  isTemplate: boolean;

  @OneToMany(() => Task, task => task.board)
  tasks: Task[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper method to get default columns
  getDefaultColumns(): CustomColumn[] {
    return [
      {
        id: 'title',
        name: 'Task',
        type: 'text',
        required: true,
      },
      {
        id: 'assignee',
        name: 'Assigned To',
        type: 'text',
      },
      {
        id: 'status',
        name: 'Status',
        type: 'select',
        options: ['Not Started', 'Working on it', 'Stuck', 'Done'],
        defaultValue: 'Not Started',
      },
      {
        id: 'priority',
        name: 'Priority',
        type: 'select',
        options: ['Low', 'Medium', 'High', 'Urgent'],
        defaultValue: 'Medium',
      },
      {
        id: 'dueDate',
        name: 'Due date',
        type: 'date',
      },
      {
        id: 'lastUpdated',
        name: 'Last updated',
        type: 'date',
      },
    ];
  }

  // Helper method to validate custom column data
  validateColumnData(columnId: string, value: any): boolean {
    const column = this.customColumns.find(col => col.id === columnId);
    if (!column) return false;

    if (column.required && (value === null || value === undefined || value === '')) {
      return false;
    }

    switch (column.type) {
      case 'number':
        if (typeof value !== 'number') return false;
        if (column.validation?.min !== undefined && value < column.validation.min) return false;
        if (column.validation?.max !== undefined && value > column.validation.max) return false;
        break;
      case 'select':
        if (column.options && !column.options.includes(value)) return false;
        break;
      case 'date':
        if (value && !Date.parse(value)) return false;
        break;
      case 'text':
        if (typeof value !== 'string') return false;
        if (column.validation?.pattern) {
          const regex = new RegExp(column.validation.pattern);
          if (!regex.test(value)) return false;
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') return false;
        break;
    }

    return true;
  }
}
