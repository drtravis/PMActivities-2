import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../entities/user.entity';
import { OrganizationService } from './organization.service';

@Controller('organization')
@UseGuards(JwtAuthGuard)
export class OrganizationController {
  constructor(private organizationService: OrganizationService) {}

  @Get()
  async getOrganization(@Request() req) {
    return this.organizationService.getOrganizationByUserId(req.user.id);
  }

  @Put()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateOrganization(@Request() req, @Body() updateData: any) {
    return this.organizationService.updateOrganization(req.user.id, updateData);
  }

  @Get('users/count')
  async getOrganizationUserCount(@Request() req) {
    return this.organizationService.getOrganizationUserCount(req.user.id);
  }

  @Get('users')
  async getOrganizationUsers(@Request() req) {
    return this.organizationService.getOrganizationUsers(req.user.id);
  }
}
