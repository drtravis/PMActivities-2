import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CommentsService } from './comments.service';

@Controller('comments')
@UseGuards(AuthGuard('jwt'))
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  create(@Body() createCommentDto: { activityId: string; body: string }, @Request() req) {
    return this.commentsService.create(createCommentDto.activityId, createCommentDto.body, req.user);
  }

  @Get('activity/:activityId')
  findByActivity(@Param('activityId') activityId: string, @Request() req) {
    return this.commentsService.findByActivity(activityId, req.user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCommentDto: { body: string }, @Request() req) {
    return this.commentsService.update(id, updateCommentDto.body, req.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.commentsService.remove(id, req.user);
  }
}
