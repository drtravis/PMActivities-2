import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../entities/project.entity';
import { User, UserRole } from '../entities/user.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createProjectDto: any, user: User): Promise<Project> {
    // Only Admin can create projects
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only Admin can create projects');
    }

    const project = this.projectRepository.create({
      name: createProjectDto.name,
      description: createProjectDto.description,
      organizationId: user.organizationId,
      ownerId: user.id,
      members: [],
    });

    return await this.projectRepository.save(project);
  }

  async findAll(user: User): Promise<Project[]> {
    if (user.role === UserRole.ADMIN || user.role === UserRole.PMO) {
      // Admin/PMO see all projects in organization
      return await this.projectRepository.find({
        where: { organizationId: user.organizationId },
        relations: ['owner', 'members'],
      });
    } else {
      // PM and Members see only projects they're assigned to
      const userWithProjects = await this.userRepository.findOne({
        where: { id: user.id },
        relations: ['projects', 'projects.owner', 'projects.members'],
      });
      return userWithProjects?.projects || [];
    }
  }

  async findOne(id: string, user: User): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id, organizationId: user.organizationId },
      relations: ['owner', 'members', 'activities'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check access (Admin and PMO bypass membership)
    if (![UserRole.ADMIN, UserRole.PMO].includes(user.role)) {
      const hasAccess = project.members.some(member => member.id === user.id) || 
                       project.ownerId === user.id;
      if (!hasAccess) {
        throw new ForbiddenException('You do not have access to this project');
      }
    }

    return project;
  }

  async update(id: string, updateProjectDto: any, user: User): Promise<Project> {
    const project = await this.findOne(id, user);

    // Only Admin or Project Owner can update
    if (user.role !== UserRole.ADMIN && project.ownerId !== user.id) {
      throw new ForbiddenException('You cannot update this project');
    }

    Object.assign(project, updateProjectDto);
    return await this.projectRepository.save(project);
  }

  async addMember(projectId: string, userId: string, user: User): Promise<Project> {
    const project = await this.findOne(projectId, user);

    // Only Admin or PM can add members
    if (![UserRole.ADMIN, UserRole.PROJECT_MANAGER].includes(user.role)) {
      throw new ForbiddenException('Only Admin or Project Manager can add members');
    }

    const memberToAdd = await this.userRepository.findOne({
      where: { id: userId, organizationId: user.organizationId },
    });

    if (!memberToAdd) {
      throw new NotFoundException('User not found');
    }

    // Check if user is already a member
    const isAlreadyMember = project.members.some(member => member.id === userId);
    if (!isAlreadyMember) {
      project.members.push(memberToAdd);
      await this.projectRepository.save(project);
    }

    return project;
  }

  async removeMember(projectId: string, userId: string, user: User): Promise<Project> {
    const project = await this.findOne(projectId, user);

    // Only Admin or PM can remove members
    if (![UserRole.ADMIN, UserRole.PROJECT_MANAGER].includes(user.role)) {
      throw new ForbiddenException('Only Admin or Project Manager can remove members');
    }

    project.members = project.members.filter(member => member.id !== userId);
    return await this.projectRepository.save(project);
  }

  async getProjectMembers(projectId: string, user: User): Promise<User[]> {
    const project = await this.findOne(projectId, user);
    return project.members;
  }

  async getProjectsForUser(userId: string, currentUser: User): Promise<Project[]> {
    // Only Admin can get projects for any user
    if (currentUser.role !== UserRole.ADMIN && currentUser.id !== userId) {
      throw new ForbiddenException('You can only view your own projects');
    }

    const userWithProjects = await this.userRepository.findOne({
      where: { id: userId, organizationId: currentUser.organizationId },
      relations: ['projects', 'projects.owner', 'projects.members'],
    });

    return userWithProjects?.projects || [];
  }
}
