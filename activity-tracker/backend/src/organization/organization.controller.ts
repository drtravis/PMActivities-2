import { Controller, Get, Put, Post, Body, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../entities/user.entity';
import { OrganizationService } from './organization.service';
import * as fs from 'fs';
import * as path from 'path';

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

  @Post('logo')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('logo'))
  async uploadLogo(@Request() req, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return { success: false, message: 'No file uploaded' };
    }

    try {
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'logos');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Generate unique filename
      const filename = `${Date.now()}-${file.originalname}`;
      const filePath = path.join(uploadsDir, filename);
      const logoUrl = `/uploads/logos/${filename}`;

      // Save file to disk
      fs.writeFileSync(filePath, file.buffer);

      // Update organization with logo URL
      await this.organizationService.updateOrganization(req.user.id, { logoUrl });

      return {
        success: true,
        logoUrl,
        message: 'Logo uploaded successfully'
      };
    } catch (error) {
      console.error('Error uploading logo:', error);
      return {
        success: false,
        message: 'Failed to upload logo'
      };
    }
  }
}
