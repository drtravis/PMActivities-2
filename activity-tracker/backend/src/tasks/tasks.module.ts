import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { TaskCommentsController } from './task-comments.controller';
import { TaskAttachmentsController } from './task-attachments.controller';
import { TaskHistoryController } from './task-history.controller';
import { Task } from '../entities/task.entity';
import { Project } from '../entities/project.entity';
import { User } from '../entities/user.entity';
import { Activity } from '../entities/activity.entity';
import { Board } from '../entities/board.entity';
import { TaskComment } from '../entities/task-comment.entity';
import { TaskAttachment } from '../entities/task-attachment.entity';
import { TaskHistory } from '../entities/task-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    Task,
    Project,
    User,
    Activity,
    Board,
    TaskComment,
    TaskAttachment,
    TaskHistory
  ])],
  controllers: [
    TasksController,
    TaskCommentsController,
    TaskAttachmentsController,
    TaskHistoryController
  ],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
