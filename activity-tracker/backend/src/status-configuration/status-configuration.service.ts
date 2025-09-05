import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StatusConfiguration, StatusType } from '../entities/status-configuration.entity';

export interface CreateStatusConfigDto {
  type: StatusType;
  name: string;
  color?: string;
}

export interface UpdateStatusConfigDto {
  name?: string;
  color?: string;
  isActive?: boolean;
  orderIndex?: number;
}

@Injectable()
export class StatusConfigurationService {
  constructor(
    @InjectRepository(StatusConfiguration)
    private statusConfigRepo: Repository<StatusConfiguration>,
  ) {}

  async getByOrganization(organizationId: string): Promise<StatusConfiguration[]> {
    return this.statusConfigRepo.find({
      where: { organizationId },
      order: { type: 'ASC', orderIndex: 'ASC' },
    });
  }

  async getByType(organizationId: string, type: StatusType): Promise<StatusConfiguration[]> {
    return this.statusConfigRepo.find({
      where: { organizationId, type },
      order: { orderIndex: 'ASC' },
    });
  }

  async getActiveByType(organizationId: string, type: StatusType): Promise<StatusConfiguration[]> {
    return this.statusConfigRepo.find({
      where: { organizationId, type, isActive: true },
      order: { orderIndex: 'ASC' },
    });
  }

  async create(organizationId: string, dto: CreateStatusConfigDto): Promise<StatusConfiguration> {
    // Check if name already exists for this type
    const existing = await this.statusConfigRepo.findOne({
      where: { organizationId, type: dto.type, name: dto.name },
    });

    if (existing) {
      throw new BadRequestException(`Status with name '${dto.name}' already exists for ${dto.type}`);
    }

    // Get next order number
    const maxOrder = await this.statusConfigRepo
      .createQueryBuilder('sc')
      .select('MAX(sc.order)', 'maxOrder')
      .where('sc.organizationId = :organizationId AND sc.type = :type', {
        organizationId,
        type: dto.type,
      })
      .getRawOne();

    const statusConfig = this.statusConfigRepo.create({
      organizationId,
      ...dto,
      orderIndex: (maxOrder?.maxOrder || 0) + 1,
      isActive: true,
    });

    return this.statusConfigRepo.save(statusConfig);
  }

  async update(id: string, organizationId: string, dto: UpdateStatusConfigDto): Promise<StatusConfiguration> {
    const statusConfig = await this.statusConfigRepo.findOne({
      where: { id, organizationId },
    });

    if (!statusConfig) {
      throw new NotFoundException('Status configuration not found');
    }

    Object.assign(statusConfig, dto);
    return this.statusConfigRepo.save(statusConfig);
  }

  async delete(id: string, organizationId: string): Promise<void> {
    const statusConfig = await this.statusConfigRepo.findOne({
      where: { id, organizationId },
    });

    if (!statusConfig) {
      throw new NotFoundException('Status configuration not found');
    }

    if (statusConfig.isSystemDefault()) {
      throw new BadRequestException('Cannot delete system default status configuration');
    }

    await this.statusConfigRepo.remove(statusConfig);
  }

  async reorder(organizationId: string, type: StatusType, statusIds: string[]): Promise<void> {
    const statuses = await this.statusConfigRepo.find({
      where: { organizationId, type },
    });

    for (let i = 0; i < statusIds.length; i++) {
      const status = statuses.find(s => s.id === statusIds[i]);
      if (status) {
        status.orderIndex = i + 1;
        await this.statusConfigRepo.save(status);
      }
    }
  }

  async initializeDefaults(organizationId: string): Promise<void> {
    // Check if defaults already exist
    const existing = await this.statusConfigRepo.count({
      where: { organizationId },
    });

    if (existing > 0) {
      return; // Already initialized
    }

    const defaultConfigs = [
      // Task statuses - simplified for our database schema
      { type: StatusType.TASK, name: 'To Do', color: '#6B7280', orderIndex: 1 },
      { type: StatusType.TASK, name: 'Working on it', color: '#3B82F6', orderIndex: 2 },
      { type: StatusType.TASK, name: 'Stuck', color: '#EF4444', orderIndex: 3 },
      { type: StatusType.TASK, name: 'Done', color: '#10B981', orderIndex: 4 },

      // Activity statuses - simplified for our database schema
      { type: StatusType.ACTIVITY, name: 'To Do', color: '#6B7280', orderIndex: 1 },
      { type: StatusType.ACTIVITY, name: 'In Progress', color: '#3B82F6', orderIndex: 2 },
      { type: StatusType.ACTIVITY, name: 'In Review', color: '#F59E0B', orderIndex: 3 },
      { type: StatusType.ACTIVITY, name: 'Done', color: '#10B981', orderIndex: 4 },
    ];

    for (const config of defaultConfigs) {
      const statusConfig = this.statusConfigRepo.create({
        organizationId,
        ...config,
        isActive: true,
      });
      await this.statusConfigRepo.save(statusConfig);
    }
  }

  // Helper method to get status mapping for frontend
  async getStatusMapping(organizationId: string): Promise<{
    activity: Record<string, { displayName: string; color: string }>;
    task: Record<string, { displayName: string; color: string }>;
  }> {
    const statuses = await this.getByOrganization(organizationId);
    
    const mapping = {
      activity: {} as Record<string, { displayName: string; color: string }>,
      task: {} as Record<string, { displayName: string; color: string }>,
    };

    for (const status of statuses) {
      if (status.isActive) {
        mapping[status.type][status.name] = {
          displayName: status.getDisplayName(),
          color: status.color,
        };
      }
    }

    return mapping;
  }

  // Validate status transition
  async validateTransition(
    organizationId: string,
    type: StatusType,
    fromStatus: string,
    toStatus: string,
    userRole: string
  ): Promise<boolean> {
    const fromConfig = await this.statusConfigRepo.findOne({
      where: { organizationId, type, name: fromStatus, isActive: true },
    });

    const toConfig = await this.statusConfigRepo.findOne({
      where: { organizationId, type, name: toStatus, isActive: true },
    });

    if (!fromConfig || !toConfig) {
      return false;
    }

    // Simplified validation - all transitions allowed for now
    // TODO: Add role-based and workflow validation if needed

    return true;
  }

  async getUsageStats(organizationId: string, type?: StatusType) {
    const query = this.statusConfigRepo.createQueryBuilder('status')
      .where('status.organizationId = :organizationId', { organizationId });

    if (type) {
      query.andWhere('status.type = :type', { type });
    }

    const statuses = await query.getMany();

    // This would require additional queries to count actual usage
    // For now, return basic statistics
    const stats = {
      totalStatuses: statuses.length,
      activeStatuses: statuses.filter(s => s.isActive).length,
      inactiveStatuses: statuses.filter(s => !s.isActive).length,
      byType: {} as Record<string, number>,
    };

    statuses.forEach(status => {
      stats.byType[status.type] = (stats.byType[status.type] || 0) + 1;
    });

    return stats;
  }

}
