import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, Index } from 'typeorm';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  content: string;

  @ManyToOne('Activity', 'comments')
  activity: any;

  @Column('uuid')
  @Index()
  activityId: string;

  @ManyToOne('User', 'comments')
  createdBy: any;

  @Column('uuid')
  createdById: string;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
