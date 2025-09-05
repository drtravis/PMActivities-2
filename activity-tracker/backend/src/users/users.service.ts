import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { Project } from '../entities/project.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
  ) {}

  async findAll(currentUser: User): Promise<User[]> {
    // Only Admin, PMO and PM can list users
    if (![UserRole.ADMIN, UserRole.PMO, UserRole.PROJECT_MANAGER].includes(currentUser.role)) {
      throw new ForbiddenException('You do not have permission to list users');
    }

    if (currentUser.role === UserRole.ADMIN) {
      // Admin sees all users in organization
      return await this.userRepository.find({
        where: { organizationId: currentUser.organizationId, isActive: true },
        relations: ['projects'],
        select: ['id', 'email', 'name', 'role', 'isActive', 'createdAt'],
      });
    } else {
      // PM sees users in their projects
      const pmWithProjects = await this.userRepository.findOne({
        where: { id: currentUser.id },
        relations: ['projects', 'projects.members'],
      });

      const userIds = new Set<string>();
      pmWithProjects?.projects.forEach(project => {
        project.members.forEach(member => userIds.add(member.id));
      });

      if (userIds.size === 0) {
        return [];
      }

      return await this.userRepository.find({
        where: { id: In(Array.from(userIds)) },
        relations: ['projects'],
        select: ['id', 'email', 'name', 'role', 'isActive', 'createdAt'],
      });
    }
  }

  async findOne(id: string, currentUser: User): Promise<User> {
    // Users can view their own profile, Admin can view any user
    if (currentUser.role !== UserRole.ADMIN && currentUser.id !== id) {
      throw new ForbiddenException('You can only view your own profile');
    }

    const user = await this.userRepository.findOne({
      where: { id, organizationId: currentUser.organizationId },
      relations: ['projects'],
      select: ['id', 'email', 'name', 'role', 'isActive', 'createdAt'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateRole(id: string, role: UserRole, currentUser: User): Promise<User> {
    // Only Admin can update user roles
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only Admin can update user roles');
    }

    const user = await this.userRepository.findOne({
      where: { id, organizationId: currentUser.organizationId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.role = role;
    return await this.userRepository.save(user);
  }

  async deactivateUser(id: string, currentUser: User): Promise<User> {
    // Only Admin can deactivate users
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only Admin can deactivate users');
    }

    const user = await this.userRepository.findOne({
      where: { id, organizationId: currentUser.organizationId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isActive = false;
    return await this.userRepository.save(user);
  }

  async assignToProject(userId: string, projectId: string, currentUser: User): Promise<User> {
    // Only Admin and PM can assign users to projects
    if (![UserRole.ADMIN, UserRole.PROJECT_MANAGER].includes(currentUser.role)) {
      throw new ForbiddenException('You do not have permission to assign users to projects');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId, organizationId: currentUser.organizationId },
      relations: ['projects'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const project = await this.projectRepository.findOne({
      where: { id: projectId, organizationId: currentUser.organizationId },
      relations: ['members'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check if user is already assigned to project
    const isAlreadyAssigned = user.projects.some(p => p.id === projectId);
    if (!isAlreadyAssigned) {
      user.projects.push(project);
      await this.userRepository.save(user);
    }

    return user;
  }

  async removeFromProject(userId: string, projectId: string, currentUser: User): Promise<User> {
    // Only Admin and PM can remove users from projects
    if (![UserRole.ADMIN, UserRole.PROJECT_MANAGER].includes(currentUser.role)) {
      throw new ForbiddenException('You do not have permission to remove users from projects');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId, organizationId: currentUser.organizationId },
      relations: ['projects'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.projects = user.projects.filter(p => p.id !== projectId);
    return await this.userRepository.save(user);
  }

  // Preferences
  async getUserPreferences(userId: string, currentUser: User) {
    // Users can access their own preferences, Admin/PM can read others in org
    if (currentUser.id !== userId && ![UserRole.ADMIN, UserRole.PROJECT_MANAGER].includes(currentUser.role)) {
      throw new ForbiddenException('You can only access your own preferences');
    }
    const user = await this.userRepository.findOne({ where: { id: userId, organizationId: currentUser.organizationId } });
    if (!user) throw new NotFoundException('User not found');
    return user.preferences || {};
  }

  async updateMyPreferences(meId: string, prefs: any, currentUser: User) {
    if (currentUser.id !== meId) {
      throw new ForbiddenException('Cannot update preferences for another user');
    }
    const user = await this.userRepository.findOne({ where: { id: meId, organizationId: currentUser.organizationId } });
    if (!user) throw new NotFoundException('User not found');
    user.preferences = { ...(user.preferences || {}), ...prefs };
    await this.userRepository.save(user);
    return user.preferences;
  }
}
