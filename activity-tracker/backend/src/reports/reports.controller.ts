import { Controller, Get, Query, UseGuards, Request, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { ReportsService } from './reports.service';
import { UserRole } from '../entities/user.entity';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('reports')
@UseGuards(AuthGuard('jwt'))
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('activity-status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.PMO)
  async getActivityStatusReport(@Request() req, @Query() filters: any) {
    return this.reportsService.getActivityStatusReport(req.user.organizationId, filters);
  }

  @Get('member-performance')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.PMO)
  async getMemberPerformanceReport(@Request() req, @Query() filters: any) {
    return this.reportsService.getMemberPerformanceReport(req.user.organizationId, filters);
  }

  @Get('approval-aging')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.PMO)
  async getApprovalAgingReport(@Request() req) {
    return this.reportsService.getApprovalAgingReport(req.user.organizationId);
  }

  @Get('export/activities/csv')
  async exportActivitiesCSV(
    @Request() req,
    @Query() filters: any,
    @Res() res: Response
  ) {
    const csvData = await this.reportsService.exportActivitiesCSV(req.user.organizationId, filters);
    
    const filename = `activities-export-${new Date().toISOString().split('T')[0]}.csv`;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvData);
  }
}
