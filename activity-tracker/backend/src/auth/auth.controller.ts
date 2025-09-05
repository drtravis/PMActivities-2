import { Controller, Post, Body, UseGuards, Request, Get, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UserRole } from '../entities/user.entity';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: { email: string; password: string }) {
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    // AuthService throws specific messages on failure; no need to override here
    return this.authService.login(user);
  }

  @Post('invite')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  async inviteUser(
    @Request() req,
    @Body() inviteDto: { email: string; name: string; role: UserRole; projectIds?: string[] }
  ) {
    return this.authService.inviteUser(req.user, inviteDto.email, inviteDto.name, inviteDto.role, inviteDto.projectIds);
  }

  @Post('accept-invitation')
  async acceptInvitation(@Body() acceptDto: { token: string; password: string }) {
    return this.authService.acceptInvitation(acceptDto.token, acceptDto.password);
  }

  @Post('create-organization')
  async createOrganization(@Body() createOrgDto: {
    organizationName: string;
    adminEmail: string;
    adminName: string;
    adminPassword: string;
  }) {
    return this.authService.createOrganization(
      createOrgDto.organizationName,
      createOrgDto.adminEmail,
      createOrgDto.adminName,
      createOrgDto.adminPassword
    );
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  getProfile(@Request() req) {
    return req.user;
  }

  @Get('default-password')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER)
  getDefaultPassword() {
    return { password: this.authService.getDefaultPassword() };
  }

  @Post('change-password')
  @UseGuards(AuthGuard('jwt'))
  async changePassword(
    @Request() req,
    @Body() body: { currentPassword: string; newPassword: string }
  ) {
    if (!body?.currentPassword || !body?.newPassword) {
      throw new BadRequestException('Current password and new password are required');
    }
    await this.authService.changePassword(req.user.id, body.currentPassword, body.newPassword);
    return { message: 'Password changed successfully' };
  }

  @Post('register')
  async register(@Body() registerDto: {
    email: string;
    password: string;
    name: string;
    role?: UserRole;
  }) {
    // For now, redirect to create-organization since we don't have standalone registration
    throw new BadRequestException('Registration not available. Please use organization creation instead.');
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  async logout(@Request() req) {
    // Since we're using stateless JWT, logout is handled client-side
    // This endpoint exists for API consistency
    return { message: 'Logged out successfully' };
  }

  @Post('refresh')
  @UseGuards(AuthGuard('jwt'))
  async refresh(@Request() req) {
    // Generate a new token with extended expiry
    return this.authService.login(req.user);
  }
}

