import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Task } from './task.entity';

@Entity('task_comments')
export class TaskComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Task)
  task: Task;

  @Index()
  @Column('uuid')
  taskId: string;

  @ManyToOne(() => User)
  author: User;

  @Index()
  @Column('uuid')
  authorId: string;

  @Column('text')
  body: string;

  // Optional parent comment for threading
  @ManyToOne(() => TaskComment, { nullable: true })
  parentComment?: TaskComment;

  @Column('uuid', { nullable: true })
  parentCommentId?: string;

  // Whether this comment is internal (not visible to external users)
  @Column({ default: false })
  isInternal: boolean;

  // Whether this comment is pinned to the top
  @Column({ default: false })
  isPinned: boolean;

  // Mention data (user IDs mentioned in the comment)
  @Column('simple-array', { nullable: true })
  mentions?: string[];

  // Reaction data (emoji reactions)
  @Column('jsonb', { nullable: true })
  reactions?: Record<string, string[]>; // { "👍": ["userId1", "userId2"], "❤️": ["userId3"] }

  // Edit history
  @Column({ default: false })
  isEdited: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastEditedAt?: Date;

  @ManyToOne(() => User, { nullable: true })
  lastEditedBy?: User;

  @Column('uuid', { nullable: true })
  lastEditedById?: string;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper methods
  getMentionedUsers(): string[] {
    return this.mentions || [];
  }

  addReaction(emoji: string, userId: string): void {
    if (!this.reactions) {
      this.reactions = {};
    }
    
    if (!this.reactions[emoji]) {
      this.reactions[emoji] = [];
    }
    
    if (!this.reactions[emoji].includes(userId)) {
      this.reactions[emoji].push(userId);
    }
  }

  removeReaction(emoji: string, userId: string): void {
    if (!this.reactions || !this.reactions[emoji]) {
      return;
    }
    
    this.reactions[emoji] = this.reactions[emoji].filter(id => id !== userId);
    
    if (this.reactions[emoji].length === 0) {
      delete this.reactions[emoji];
    }
  }

  getReactionCount(emoji: string): number {
    return this.reactions?.[emoji]?.length || 0;
  }

  getTotalReactions(): number {
    if (!this.reactions) return 0;
    
    return Object.values(this.reactions).reduce((total, users) => total + users.length, 0);
  }

  markAsEdited(editedBy: User): void {
    this.isEdited = true;
    this.lastEditedAt = new Date();
    this.lastEditedBy = editedBy;
    this.lastEditedById = editedBy.id;
  }

  extractMentions(body: string): string[] {
    // Extract @mentions from comment body
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const mentions: string[] = [];
    let match;
    
    while ((match = mentionRegex.exec(body)) !== null) {
      mentions.push(match[2]); // Extract user ID from @[Name](userId) format
    }
    
    return mentions;
  }
}
