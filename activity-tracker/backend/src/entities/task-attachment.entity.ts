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
  fileName: string;

  @Column({ length: 500 })
  filePath: string;

  @Column('bigint')
  fileSize: number;

  @Column({ length: 100 })
  fileType: string;

  // Optional description or notes about the file
  @Column('text', { nullable: true })
  description?: string;

  // File hash for integrity checking
  @Column({ length: 64, nullable: true })
  fileHash?: string;

  // Whether the file is publicly accessible
  @Column({ default: false })
  isPublic: boolean;

  // Download count for analytics
  @Column('integer', { default: 0 })
  downloadCount: number;

  // Last downloaded timestamp
  @Column({ type: 'timestamp', nullable: true })
  lastDownloadedAt?: Date;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  // Helper methods
  getFileExtension(): string {
    return this.fileName.split('.').pop()?.toLowerCase() || '';
  }

  isImage(): boolean {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
    return imageExtensions.includes(this.getFileExtension());
  }

  isDocument(): boolean {
    const docExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'];
    return docExtensions.includes(this.getFileExtension());
  }

  getFormattedFileSize(): string {
    const bytes = Number(this.fileSize);
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  incrementDownloadCount(): void {
    this.downloadCount += 1;
    this.lastDownloadedAt = new Date();
  }
}
