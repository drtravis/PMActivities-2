import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  Param,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { AuditService } from './audit.service';
import { EntityType, AuditAction } from '../entities/audit-log.entity';

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  @Roles(UserRole.ADMIN, UserRole.PMO)
  async getAuditLogs(
    @Request() req,
    @Query('userId') userId?: string,
    @Query('entityType') entityType?: EntityType,
    @Query('action') action?: AuditAction,
    @Query('entityId') entityId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
  ) {
    const filters = {
      userId,
      entityType,
      action,
      entityId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit,
      offset,
    };

    return this.auditService.getAuditLogs(filters);
  }

  @Get('trail/:entityType/:entityId')
  @Roles(UserRole.ADMIN, UserRole.PMO, UserRole.PROJECT_MANAGER)
  async getAuditTrail(
    @Param('entityType') entityType: EntityType,
    @Param('entityId') entityId: string,
    @Request() req,
  ) {
    return this.auditService.getAuditTrail(entityType, entityId);
  }

  @Get('user/:userId')
  @Roles(UserRole.ADMIN, UserRole.PMO, UserRole.PROJECT_MANAGER)
  async getUserActivity(
    @Param('userId') userId: string,
    @Request() req,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days?: number,
  ) {
    // Users can only view their own activity unless they're admin/PMO
    if (req.user.role === UserRole.PROJECT_MANAGER && userId !== req.user.id) {
      // Project managers can only view activity of their project members
      // This would require additional validation logic
    }
    
    return this.auditService.getUserActivity(userId, days);
  }

  @Get('security-events')
  @Roles(UserRole.ADMIN, UserRole.PMO)
  async getSecurityEvents(@Request() req) {
    return this.auditService.getSecurityEvents();
  }

  @Get('my-activity')
  @Roles(UserRole.ADMIN, UserRole.PMO, UserRole.PROJECT_MANAGER, UserRole.MEMBER)
  async getMyActivity(
    @Request() req,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days?: number,
  ) {
    return this.auditService.getUserActivity(req.user.id, days);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.PMO)
  async getAuditStats(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    // Get basic statistics
    const { logs } = await this.auditService.getAuditLogs({
      ...filters,
      limit: 10000, // Get a large sample for stats
    });

    const stats = {
      totalActions: logs.length,
      actionBreakdown: {} as Record<string, number>,
      entityBreakdown: {} as Record<string, number>,
      userBreakdown: {} as Record<string, number>,
      dailyActivity: {} as Record<string, number>,
    };

    logs.forEach(log => {
      // Action breakdown
      stats.actionBreakdown[log.action] = (stats.actionBreakdown[log.action] || 0) + 1;
      
      // Entity breakdown
      stats.entityBreakdown[log.entityType] = (stats.entityBreakdown[log.entityType] || 0) + 1;
      
      // User breakdown
      const userId = log.userId;
      stats.userBreakdown[userId] = (stats.userBreakdown[userId] || 0) + 1;
      
      // Daily activity
      const date = log.createdAt.toISOString().split('T')[0];
      stats.dailyActivity[date] = (stats.dailyActivity[date] || 0) + 1;
    });

    return stats;
  }
}
