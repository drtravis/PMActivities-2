import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Activity } from '../entities/activity.entity';
import { User } from '../entities/user.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { Task } from '../entities/task.entity';
import { Board } from '../entities/board.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Activity, User, AuditLog, Task, Board])],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
