import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { StatusConfigurationService } from './status-configuration.service';
import type { CreateStatusConfigDto, UpdateStatusConfigDto } from './status-configuration.service';
import { StatusType } from '../entities/status-configuration.entity';

@Controller('status-configuration')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StatusConfigurationController {
  constructor(private statusConfigService: StatusConfigurationService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.PMO, UserRole.PROJECT_MANAGER)
  async getAll(@Request() req, @Query('type') type?: StatusType) {
    const organizationId = req.user.organizationId;
    
    if (type) {
      return this.statusConfigService.getByType(organizationId, type);
    }
    
    return this.statusConfigService.getByOrganization(organizationId);
  }

  @Get('active')
  async getActive(@Request() req, @Query('type') type?: StatusType) {
    const organizationId = req.user.organizationId;
    
    if (type) {
      return this.statusConfigService.getActiveByType(organizationId, type);
    }
    
    const allStatuses = await this.statusConfigService.getByOrganization(organizationId);
    return allStatuses.filter(s => s.isActive);
  }

  @Get('mapping')
  async getMapping(@Request() req) {
    const organizationId = req.user.organizationId;
    return this.statusConfigService.getStatusMapping(organizationId);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Request() req, @Body() dto: CreateStatusConfigDto) {
    const organizationId = req.user.organizationId;
    return this.statusConfigService.create(organizationId, dto);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateStatusConfigDto
  ) {
    const organizationId = req.user.organizationId;
    return this.statusConfigService.update(id, organizationId, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async delete(@Request() req, @Param('id') id: string) {
    const organizationId = req.user.organizationId;
    await this.statusConfigService.delete(id, organizationId);
    return { message: 'Status configuration deleted successfully' };
  }

  @Put('reorder/:type')
  @Roles(UserRole.ADMIN)
  async reorder(
    @Request() req,
    @Param('type') type: StatusType,
    @Body() body: { statusIds: string[] }
  ) {
    const organizationId = req.user.organizationId;
    await this.statusConfigService.reorder(organizationId, type, body.statusIds);
    return { message: 'Status order updated successfully' };
  }

  @Post('initialize-defaults')
  @Roles(UserRole.ADMIN)
  async initializeDefaults(@Request() req) {
    const organizationId = req.user.organizationId;
    await this.statusConfigService.initializeDefaults(organizationId);
    return { message: 'Default status configurations initialized' };
  }

  @Post('validate-transition')
  async validateTransition(
    @Request() req,
    @Body() body: {
      type: StatusType;
      fromStatus: string;
      toStatus: string;
    }
  ) {
    const organizationId = req.user.organizationId;
    const userRole = req.user.role;
    const isValid = await this.statusConfigService.validateTransition(
      organizationId,
      body.type,
      body.fromStatus,
      body.toStatus,
      userRole
    );
    return { isValid };
  }

  @Post('bulk-update')
  @Roles(UserRole.ADMIN)
  async bulkUpdate(
    @Request() req,
    @Body() body: { updates: Array<{ id: string; data: UpdateStatusConfigDto }> }
  ) {
    const organizationId = req.user.organizationId;
    const results = await Promise.all(
      body.updates.map(update =>
        this.statusConfigService.update(update.id, organizationId, update.data)
      )
    );
    return { message: 'Bulk update completed', results };
  }

  @Get('usage-stats')
  @Roles(UserRole.ADMIN, UserRole.PMO)
  async getUsageStats(@Request() req, @Query('type') type?: StatusType) {
    const organizationId = req.user.organizationId;
    return this.statusConfigService.getUsageStats(organizationId, type);
  }

}
