import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Request,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Response } from 'express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync, createReadStream, unlinkSync } from 'fs';
import { Task, TaskAttachment, TaskHistory, ChangeType, User } from '../entities';

@Controller('tasks')
@UseGuards(AuthGuard('jwt'))
export class TaskAttachmentsController {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(TaskAttachment)
    private readonly attachmentRepo: Repository<TaskAttachment>,
    @InjectRepository(TaskHistory)
    private readonly historyRepo: Repository<TaskHistory>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // GET /tasks/:taskId/attachments - Get all attachments for a task
  @Get(':taskId/attachments')
  async getTaskAttachments(@Param('taskId') taskId: string, @Request() req: any) {
    const userId = req.user.userId || req.user.id;

    // Verify user has access to this task
    const task = await this.taskRepo.findOne({
      where: { id: taskId },
      relations: ['project', 'project.members'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check if user has access to this task
    const hasAccess = task.assigneeId === userId || 
                     task.createdById === userId ||
                     task.project?.members?.some((member: any) => member.userId === userId);

    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this task');
    }

    const attachments = await this.attachmentRepo.find({
      where: { taskId },
      relations: ['uploadedBy'],
      order: { createdAt: 'DESC' },
    });

    return attachments.map(attachment => ({
      id: attachment.id,
      filename: attachment.filename,
      originalName: attachment.originalName,
      fileSize: attachment.fileSize,
      mimeType: attachment.mimeType,
      downloadUrl: `/api/tasks/${taskId}/attachments/${attachment.id}/download`,
      uploadedBy: {
        id: attachment.uploadedBy.id,
        name: attachment.uploadedBy.name,
        email: attachment.uploadedBy.email,
      },
      createdAt: attachment.createdAt.toISOString(),
    }));
  }

  // POST /tasks/:taskId/attachments - Upload a new attachment
  @Post(':taskId/attachments')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const taskId = req.params.taskId;
        const uploadPath = join(process.cwd(), 'uploads', 'tasks', taskId);
        
        if (!existsSync(uploadPath)) {
          mkdirSync(uploadPath, { recursive: true });
        }
        
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const timestamp = Date.now();
        const ext = extname(file.originalname);
        const filename = `${timestamp}-${file.originalname}`;
        cb(null, filename);
      },
    }),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
      // Allow most common file types
      const allowedTypes = /\.(jpg|jpeg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar)$/i;
      if (allowedTypes.test(file.originalname)) {
        cb(null, true);
      } else {
        cb(new BadRequestException('File type not allowed'), false);
      }
    },
  }))
  async uploadTaskAttachment(
    @Param('taskId') taskId: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    const userId = req.user.userId || req.user.id;

    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Verify user has access to this task
    const task = await this.taskRepo.findOne({
      where: { id: taskId },
      relations: ['project', 'project.members'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check if user has access to this task
    const hasAccess = task.assigneeId === userId || 
                     task.createdById === userId ||
                     task.project?.members?.some((member: any) => member.userId === userId);

    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this task');
    }

    // Get the current user
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Create the attachment record
    const attachment = this.attachmentRepo.create({
      taskId,
      uploadedById: userId,
      filename: file.filename,
      originalName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
    });

    const savedAttachment = await this.attachmentRepo.save(attachment);

    // Create activity log entry
    await this.historyRepo.save({
      taskId,
      actorId: userId,
      changeType: ChangeType.FILE_UPLOADED,
      description: `${user.name} uploaded file: ${file.originalname}`,
      changes: [],
    });

    // Load the attachment with uploadedBy relation
    const attachmentWithUser = await this.attachmentRepo.findOne({
      where: { id: savedAttachment.id },
      relations: ['uploadedBy'],
    });

    if (!attachmentWithUser) {
      throw new NotFoundException('Attachment not found after creation');
    }

    return {
      id: attachmentWithUser.id,
      filename: attachmentWithUser.filename,
      originalName: attachmentWithUser.originalName,
      fileSize: attachmentWithUser.fileSize,
      mimeType: attachmentWithUser.mimeType,
      downloadUrl: `/api/tasks/${taskId}/attachments/${attachmentWithUser.id}/download`,
      uploadedBy: {
        id: attachmentWithUser.uploadedBy.id,
        name: attachmentWithUser.uploadedBy.name,
        email: attachmentWithUser.uploadedBy.email,
      },
      createdAt: attachmentWithUser.createdAt.toISOString(),
    };
  }

  // GET /tasks/:taskId/attachments/:attachmentId/download - Download an attachment
  @Get(':taskId/attachments/:attachmentId/download')
  async downloadAttachment(
    @Param('taskId') taskId: string,
    @Param('attachmentId') attachmentId: string,
    @Request() req: any,
    @Res() res: Response,
  ) {
    const userId = req.user.userId || req.user.id;

    // Verify user has access to this task
    const task = await this.taskRepo.findOne({
      where: { id: taskId },
      relations: ['project', 'project.members'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check if user has access to this task
    const hasAccess = task.assigneeId === userId || 
                     task.createdById === userId ||
                     task.project?.members?.some((member: any) => member.userId === userId);

    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this task');
    }

    const attachment = await this.attachmentRepo.findOne({
      where: { id: attachmentId, taskId },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    if (!attachment.filePath || !existsSync(attachment.filePath)) {
      throw new NotFoundException('File not found on disk');
    }

    // Stream the file
    const fileStream = createReadStream(attachment.filePath);

    res.setHeader('Content-Type', attachment.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalName}"`);

    fileStream.pipe(res);
  }

  // DELETE /tasks/:taskId/attachments/:attachmentId - Delete an attachment
  @Delete(':taskId/attachments/:attachmentId')
  async deleteAttachment(
    @Param('taskId') taskId: string,
    @Param('attachmentId') attachmentId: string,
    @Request() req: any,
  ) {
    const userId = req.user.userId || req.user.id;

    // Verify user has access to this task
    const task = await this.taskRepo.findOne({
      where: { id: taskId },
      relations: ['project', 'project.members'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check if user has access to this task
    const hasAccess = task.assigneeId === userId ||
                     task.createdById === userId ||
                     task.project?.members?.some((member: any) => member.userId === userId);

    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this task');
    }

    const attachment = await this.attachmentRepo.findOne({
      where: { id: attachmentId, taskId },
      relations: ['uploadedBy'],
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    // Only the uploader or task owner can delete attachments
    if (attachment.uploadedById !== userId && task.createdById !== userId) {
      throw new ForbiddenException('Only the uploader or task owner can delete attachments');
    }

    // Delete the file from disk
    if (attachment.filePath && existsSync(attachment.filePath)) {
      try {
        unlinkSync(attachment.filePath);
      } catch (error) {
        console.error('Error deleting file from disk:', error);
        // Continue with database deletion even if file deletion fails
      }
    }

    // Delete the attachment record
    await this.attachmentRepo.remove(attachment);

    // Create activity log entry
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (user) {
      await this.historyRepo.save({
        taskId,
        actorId: userId,
        changeType: ChangeType.UPDATED, // Using UPDATED since FILE_DELETED was removed
        description: `${user.name} deleted file: ${attachment.originalName}`,
        fieldChanges: { action: 'file_deleted', filename: attachment.originalName },
      });
    }

    return {
      success: true,
      message: 'Attachment deleted successfully',
    };
  }
}
