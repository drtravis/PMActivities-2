import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { ApprovalService } from './approval.service';
import { ApprovalState } from '../entities/approval.entity';

@Controller('approvals')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApprovalController {
  constructor(private readonly approvalService: ApprovalService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.PMO, UserRole.PROJECT_MANAGER)
  async getAllApprovals(
    @Request() req,
    @Query('status') status?: ApprovalState,
    @Query('entityType') entityType?: 'activity' | 'task',
    @Query('approverId') approverId?: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
  ) {
    const filters = {
      organizationId: req.user.organizationId,
      status,
      entityType,
      approverId,
      limit,
      offset,
    };

    return this.approvalService.getApprovals(filters);
  }

  @Get('pending')
  @Roles(UserRole.ADMIN, UserRole.PMO, UserRole.PROJECT_MANAGER)
  async getPendingApprovals(@Request() req) {
    return this.approvalService.getPendingApprovals(req.user.organizationId, req.user.id);
  }

  @Get('my-requests')
  @Roles(UserRole.ADMIN, UserRole.PMO, UserRole.PROJECT_MANAGER, UserRole.MEMBER)
  async getMyApprovalRequests(@Request() req) {
    return this.approvalService.getApprovalRequestsByUser(req.user.organizationId, req.user.id);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.PMO, UserRole.PROJECT_MANAGER)
  async getApprovalStats(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters = {
      organizationId: req.user.organizationId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    return this.approvalService.getApprovalStats(filters);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.PMO, UserRole.PROJECT_MANAGER, UserRole.MEMBER)
  async getApprovalById(@Param('id') id: string, @Request() req) {
    return this.approvalService.getApprovalById(id, req.user);
  }

  @Post(':id/approve')
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  async approveRequest(
    @Param('id') id: string,
    @Body() body: { comments?: string },
    @Request() req,
  ) {
    return this.approvalService.approve(id, req.user, body.comments);
  }

  @Post(':id/reject')
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  async rejectRequest(
    @Param('id') id: string,
    @Body() body: { comments: string },
    @Request() req,
  ) {
    return this.approvalService.reject(id, req.user, body.comments);
  }

  @Put(':id/reassign')
  @Roles(UserRole.ADMIN, UserRole.PMO)
  async reassignApproval(
    @Param('id') id: string,
    @Body() body: { newApproverId: string; comments?: string },
    @Request() req,
  ) {
    return this.approvalService.reassign(id, body.newApproverId, req.user, body.comments);
  }

  @Get('activity/:activityId')
  @Roles(UserRole.ADMIN, UserRole.PMO, UserRole.PROJECT_MANAGER, UserRole.MEMBER)
  async getActivityApprovals(@Param('activityId') activityId: string, @Request() req) {
    return this.approvalService.getApprovalsByEntity('activity', activityId, req.user);
  }

  @Get('task/:taskId')
  @Roles(UserRole.ADMIN, UserRole.PMO, UserRole.PROJECT_MANAGER, UserRole.MEMBER)
  async getTaskApprovals(@Param('taskId') taskId: string, @Request() req) {
    return this.approvalService.getApprovalsByEntity('task', taskId, req.user);
  }

  @Get('aging-report')
  @Roles(UserRole.ADMIN, UserRole.PMO, UserRole.PROJECT_MANAGER)
  async getApprovalAgingReport(@Request() req) {
    return this.approvalService.getApprovalAgingReport(req.user.organizationId);
  }

  @Post('bulk-approve')
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  async bulkApprove(
    @Body() body: { approvalIds: string[]; comments?: string },
    @Request() req,
  ) {
    return this.approvalService.bulkApprove(body.approvalIds, req.user, body.comments);
  }

  @Post('bulk-reject')
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  async bulkReject(
    @Body() body: { approvalIds: string[]; comments: string },
    @Request() req,
  ) {
    return this.approvalService.bulkReject(body.approvalIds, req.user, body.comments);
  }
}
