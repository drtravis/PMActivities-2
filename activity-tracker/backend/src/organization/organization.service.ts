import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../entities/organization.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getOrganizationByUserId(userId: string): Promise<Organization> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['organization'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // If user doesn't have an organization, create one
    if (!user.organization) {
      const organization = new Organization();
      organization.name = 'My Organization';
      organization.logoUrl = null;
      organization.settings = {};
      organization.description = null;
      organization.industry = null;
      organization.size = null;
      organization.timezone = null;
      organization.currency = null;

      const savedOrganization = await this.organizationRepository.save(organization);
      
      // Link user to organization
      user.organization = savedOrganization;
      await this.userRepository.save(user);
      
      return savedOrganization;
    }

    return user.organization;
  }

  async updateOrganization(userId: string, updateData: Partial<Organization>): Promise<Organization> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['organization'],
    });

    if (!user || !user.organization) {
      throw new NotFoundException('Organization not found');
    }

    const organization = user.organization;
    
    // Update organization fields
    if (updateData.name !== undefined) {
      organization.name = updateData.name;
    }
    if (updateData.description !== undefined) {
      organization.description = updateData.description;
    }
    if (updateData.industry !== undefined) {
      organization.industry = updateData.industry;
    }
    if (updateData.size !== undefined) {
      organization.size = updateData.size;
    }
    if (updateData.timezone !== undefined) {
      organization.timezone = updateData.timezone;
    }
    if (updateData.currency !== undefined) {
      organization.currency = updateData.currency;
    }
    if (updateData.logoUrl !== undefined) {
      organization.logoUrl = updateData.logoUrl;
    }
    if (updateData.settings !== undefined) {
      organization.settings = { ...organization.settings, ...updateData.settings };
    }

    return this.organizationRepository.save(organization);
  }

  async getOrganizationUserCount(userId: string): Promise<{ count: number }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || !user.organizationId) {
      throw new NotFoundException('Organization not found');
    }
    const count = await this.userRepository.count({ where: { organizationId: user.organizationId } });
    return { count };
  }

  async getOrganizationUsers(userId: string): Promise<User[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || !user.organizationId) {
      throw new NotFoundException('Organization not found');
    }
    return this.userRepository.find({ 
      where: { organizationId: user.organizationId },
      select: ['id', 'email', 'name', 'role', 'createdAt']
    });
  }
}
