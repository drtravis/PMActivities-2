import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, ManyToMany, JoinTable, Index } from 'typeorm';
import { User } from './user.entity';
import { Activity } from './activity.entity';
import { Organization } from './organization.entity';
import { Board } from './board.entity';
import { Task } from './task.entity';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @ManyToOne(() => Organization, organization => organization.projects)
  organization: Organization;

  @Column('uuid')
  @Index()
  organizationId: string;

  @ManyToOne(() => User)
  owner: User;

  @Column('uuid')
  @Index()
  ownerId: string;

  @ManyToMany(() => User, user => user.projects)
  @JoinTable({
    name: 'project_members',
    joinColumn: { name: 'projectId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' }
  })
  members: User[];

  @OneToMany(() => Activity, activity => activity.project)
  activities: Activity[];

  @OneToMany(() => Board, board => board.project)
  boards: Board[];

  @OneToMany(() => Task, task => task.project)
  tasks: Task[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
