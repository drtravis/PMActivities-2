import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProjectsService } from './projects.service';
import { UserRole } from '../entities/user.entity';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('projects')
@UseGuards(AuthGuard('jwt'))
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() createProjectDto: any, @Request() req) {
    return this.projectsService.create(createProjectDto, req.user);
  }

  @Get()
  findAll(@Request() req) {
    return this.projectsService.findAll(req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.projectsService.findOne(id, req.user);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  update(@Param('id') id: string, @Body() updateProjectDto: any, @Request() req) {
    return this.projectsService.update(id, updateProjectDto, req.user);
  }

  @Post(':id/members')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  addMember(
    @Param('id') projectId: string,
    @Body() body: { userId: string },
    @Request() req
  ) {
    return this.projectsService.addMember(projectId, body.userId, req.user);
  }

  @Delete(':id/members/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  removeMember(
    @Param('id') projectId: string,
    @Param('userId') userId: string,
    @Request() req
  ) {
    return this.projectsService.removeMember(projectId, userId, req.user);
  }

  @Get(':id/members')
  getMembers(@Param('id') projectId: string, @Request() req) {
    return this.projectsService.getProjectMembers(projectId, req.user);
  }

  @Get('user/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  getProjectsForUser(@Param('userId') userId: string, @Request() req) {
    return this.projectsService.getProjectsForUser(userId, req.user);
  }
}
