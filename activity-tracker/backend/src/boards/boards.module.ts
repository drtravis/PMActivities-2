import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoardsController } from './boards.controller';
import { BoardsService } from './boards.service';
import { Board, Task, Project, User, TaskHistory, Approval } from '../entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([Board, Task, Project, User, TaskHistory, Approval]),
  ],
  controllers: [BoardsController],
  providers: [BoardsService],
  exports: [BoardsService],
})
export class BoardsModule {}
