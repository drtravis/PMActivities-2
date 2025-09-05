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

@Entity('task_attachments')
export class TaskAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Task)
  task: Task;

  @Index()
  @Column('uuid')
  taskId: string;

  @ManyToOne(() => User)
  uploadedBy: User;

  @Index()
  @Column('uuid')
  uploadedById: string;

  @Column({ length: 255 })
  filename: string;

  @Column({ length: 255 })
  originalName: string;

  @Column({ length: 100, nullable: true })
  mimeType?: string;

  @Column('integer', { nullable: true })
  fileSize?: number;

  @Column({ length: 500, nullable: true })
  filePath?: string;

  @CreateDateColumn()
  @Index()
  createdAt: Date;
}
