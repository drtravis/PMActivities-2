import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { User, UserRole } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { Project } from '../entities/project.entity';
import { StatusConfigurationService } from '../status-configuration/status-configuration.service';


@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    private jwtService: JwtService,
    private statusConfigService: StatusConfigurationService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['organization'],
    });

    if (!user) {
      throw new UnauthorizedException('No account found with this email');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated. Please contact your administrator.');
    }

    const passwordMatches = await bcrypt.compare(password, user.password || '');
    if (!passwordMatches) {
      throw new UnauthorizedException('Incorrect password');
    }

    const { password: _pw, ...result } = user as any;
    return result;
  }

  private validatePasswordStrength(password: string): string[] {
    const errors: string[] = [];
    if (!password || password.length < 8) errors.push('at least 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('one uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('one lowercase letter');
    if (!/\d/.test(password)) errors.push('one number');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('one special character');
    return errors;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const matches = await bcrypt.compare(currentPassword, user.password || '');
    if (!matches) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (currentPassword === newPassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    const pwErrors = this.validatePasswordStrength(newPassword);
    if (pwErrors.length) {
      throw new BadRequestException(`Password must contain ${pwErrors.join(', ')}`);
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
      },
    };
  }

  async inviteUser(inviterUser: User, email: string, name: string, role: UserRole, projectIds?: string[]): Promise<User> {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Use hardcoded password for simplicity
    const defaultPassword = 'Password123!';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const user = this.userRepository.create({
      email,
      name,
      role,
      organizationId: inviterUser.organizationId,
      password: hashedPassword,
      isActive: true, // User is immediately active
      invitationToken: null,
      invitationExpiresAt: null,
    });

    const savedUser = await this.userRepository.save(user);

    // Assign user to projects if provided
    if (projectIds && projectIds.length > 0) {
      const projects = await this.projectRepository.find({
        where: { id: In(projectIds) },
      });
      if (projects.length > 0) {
        // Load user with projects relation
        const userWithProjects = await this.userRepository.findOne({
          where: { id: savedUser.id },
          relations: ['projects']
        });
        if (userWithProjects) {
          userWithProjects.projects = projects;
          await this.userRepository.save(userWithProjects);
        }
      }
    }

    return savedUser;
  }

  async acceptInvitation(token: string, password: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { invitationToken: token },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid invitation token');
    }

    if (user.invitationExpiresAt && user.invitationExpiresAt < new Date()) {
      throw new UnauthorizedException('Invitation token has expired');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    user.isActive = true;
    user.invitationToken = null;
    user.invitationExpiresAt = null;

    return await this.userRepository.save(user);
  }

  async createOrganization(organizationName: string, adminEmail: string, adminName: string, adminPassword: string): Promise<{ organization: Organization; user: User; access_token: string }> {
    // Check if organization already exists
    const existingOrg = await this.organizationRepository.findOne({ where: { name: organizationName } });
    if (existingOrg) {
      throw new BadRequestException('Organization with this name already exists');
    }

    // Check if admin user already exists
    const existingUser = await this.userRepository.findOne({ where: { email: adminEmail } });
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Create organization
    const organization = this.organizationRepository.create({ name: organizationName });
    const savedOrganization = await this.organizationRepository.save(organization) as Organization;

    // Create admin user
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const adminUser = this.userRepository.create({
      email: adminEmail,
      name: adminName,
      password: hashedPassword,
      role: UserRole.ADMIN,
      organizationId: savedOrganization.id,
      isActive: true,
    });

    const savedUser = await this.userRepository.save(adminUser) as User;

    // Initialize default status configurations for the new organization
    await this.statusConfigService.initializeDefaults(savedOrganization.id);

    // Generate JWT token for auto-login
    const payload = {
      email: savedUser.email,
      sub: savedUser.id,
      organizationId: savedUser.organizationId,
      role: savedUser.role
    };
    const access_token = this.jwtService.sign(payload);

    return { organization: savedOrganization, user: savedUser, access_token };
  }

  getDefaultPassword(): string {
    return 'Password123!';
  }
}
