import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  body: string;

  @ManyToOne('Activity', 'comments')
  activity: any;

  @Column('uuid')
  activityId: string;

  @ManyToOne('User', 'comments')
  createdBy: any;

  @Column('uuid')
  createdById: string;

  @CreateDateColumn()
  createdAt: Date;
}
