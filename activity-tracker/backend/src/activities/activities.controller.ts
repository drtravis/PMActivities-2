import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ActivitiesService } from './activities.service';
import { UserRole } from '../entities/user.entity';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('activities')
@UseGuards(AuthGuard('jwt'))
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  create(@Body() createActivityDto: any, @Request() req) {
    return this.activitiesService.create(createActivityDto, req.user);
  }

  @Get()
  findAll(@Request() req, @Query() filters: any) {
    return this.activitiesService.findAll(req.user, filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.activitiesService.findOne(id, req.user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateActivityDto: any, @Request() req) {
    return this.activitiesService.update(id, updateActivityDto, req.user);
  }

  @Post(':id/submit')
  submit(@Param('id') id: string, @Request() req) {
    return this.activitiesService.submit(id, req.user);
  }

  @Post(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  approve(@Param('id') id: string, @Body() body: { comment?: string }, @Request() req) {
    return this.activitiesService.approve(id, req.user, body.comment);
  }

  @Post(':id/reject')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  reject(@Param('id') id: string, @Body() body: { comment: string }, @Request() req) {
    return this.activitiesService.reject(id, req.user, body.comment);
  }

  @Post(':id/reopen')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  reopen(@Param('id') id: string, @Body() body: { comment?: string }, @Request() req) {
    return this.activitiesService.reopen(id, req.user, body.comment);
  }

  @Post(':id/close')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  close(@Param('id') id: string, @Body() body: { comment?: string }, @Request() req) {
    return this.activitiesService.close(id, req.user, body.comment);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.activitiesService.remove(id, req.user);
  }
}
