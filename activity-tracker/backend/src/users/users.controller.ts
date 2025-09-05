import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { UserRole } from '../entities/user.entity';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  findAll(@Request() req) {
    return this.usersService.findAll(req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.usersService.findOne(id, req.user);
  }

  @Patch(':id/role')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  updateRole(
    @Param('id') id: string,
    @Body() body: { role: UserRole },
    @Request() req
  ) {
    return this.usersService.updateRole(id, body.role, req.user);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  deactivateUser(@Param('id') id: string, @Request() req) {
    return this.usersService.deactivateUser(id, req.user);
  }

  @Post(':id/projects/:projectId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  assignToProject(
    @Param('id') userId: string,
    @Param('projectId') projectId: string,
    @Request() req
  ) {
    return this.usersService.assignToProject(userId, projectId, req.user);
  }

  @Delete(':id/projects/:projectId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  removeFromProject(
    @Param('id') userId: string,
    @Param('projectId') projectId: string,
    @Request() req
  ) {
    return this.usersService.removeFromProject(userId, projectId, req.user);
  }

  // Preferences endpoints
  @Get(':id/preferences')
  getUserPreferences(@Param('id') id: string, @Request() req) {
    return this.usersService.getUserPreferences(id, req.user);
  }

  @Patch('me/preferences')
  updateMyPreferences(@Body() prefs: any, @Request() req) {
    return this.usersService.updateMyPreferences(req.user.id, prefs, req.user);
  }
}
