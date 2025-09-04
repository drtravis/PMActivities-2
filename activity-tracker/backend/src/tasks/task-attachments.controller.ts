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
      fileName: attachment.fileName,
      fileSize: attachment.fileSize,
      fileType: attachment.fileType,
      description: attachment.description,
      downloadUrl: `/api/tasks/${taskId}/attachments/${attachment.id}/download`,
      uploadedBy: {
        id: attachment.uploadedBy.id,
        name: attachment.uploadedBy.name,
        email: attachment.uploadedBy.email,
      },
      createdAt: attachment.createdAt.toISOString(),
      downloadCount: attachment.downloadCount,
      isImage: attachment.isImage(),
      isDocument: attachment.isDocument(),
      formattedFileSize: attachment.getFormattedFileSize(),
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
      fileName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      fileType: file.mimetype,
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
      fileName: attachmentWithUser.fileName,
      fileSize: attachmentWithUser.fileSize,
      fileType: attachmentWithUser.fileType,
      downloadUrl: `/api/tasks/${taskId}/attachments/${attachmentWithUser.id}/download`,
      uploadedBy: {
        id: attachmentWithUser.uploadedBy.id,
        name: attachmentWithUser.uploadedBy.name,
        email: attachmentWithUser.uploadedBy.email,
      },
      createdAt: attachmentWithUser.createdAt.toISOString(),
      formattedFileSize: attachmentWithUser.getFormattedFileSize(),
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

    if (!existsSync(attachment.filePath)) {
      throw new NotFoundException('File not found on disk');
    }

    // Increment download count
    attachment.incrementDownloadCount();
    await this.attachmentRepo.save(attachment);

    // Stream the file
    const fileStream = createReadStream(attachment.filePath);
    
    res.setHeader('Content-Type', attachment.fileType);
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.fileName}"`);
    
    fileStream.pipe(res);
  }
}
