import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Approval } from '../entities/approval.entity';
import { Activity } from '../entities/activity.entity';
import { Task } from '../entities/task.entity';
import { User } from '../entities/user.entity';
import { ApprovalService } from './approval.service';
import { ApprovalController } from './approval.controller';
import { AuditModule } from './audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Approval, Activity, Task, User]),
    AuditModule,
  ],
  controllers: [ApprovalController],
  providers: [ApprovalService],
  exports: [ApprovalService],
})
export class ApprovalModule {}
