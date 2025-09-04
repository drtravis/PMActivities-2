import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StatusConfiguration, StatusType } from '../entities/status-configuration.entity';

export interface CreateStatusConfigDto {
  type: StatusType;
  name: string;
  displayName: string;
  color: string;
  description?: string;
  workflowRules?: any;
}

export interface UpdateStatusConfigDto {
  displayName?: string;
  color?: string;
  description?: string;
  isActive?: boolean;
  order?: number;
  workflowRules?: any;
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
      order: { type: 'ASC', order: 'ASC' },
    });
  }

  async getByType(organizationId: string, type: StatusType): Promise<StatusConfiguration[]> {
    return this.statusConfigRepo.find({
      where: { organizationId, type },
      order: { order: 'ASC' },
    });
  }

  async getActiveByType(organizationId: string, type: StatusType): Promise<StatusConfiguration[]> {
    return this.statusConfigRepo.find({
      where: { organizationId, type, isActive: true },
      order: { order: 'ASC' },
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
      order: (maxOrder?.maxOrder || 0) + 1,
      isDefault: false,
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

    if (statusConfig.isDefault) {
      throw new BadRequestException('Cannot delete default status configuration');
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
        status.order = i + 1;
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
      // Unified Task/Activity statuses - comprehensive workflow statuses (always default)
      { type: StatusType.TASK, name: 'to_do', displayName: 'To Do', color: '#c4c4c4', order: 1 },
      { type: StatusType.TASK, name: 'assigned', displayName: 'Assigned', color: '#9cd326', order: 2 },
      { type: StatusType.TASK, name: 'in_progress', displayName: 'In Progress', color: '#fdab3d', order: 3 },
      { type: StatusType.TASK, name: 'completed', displayName: 'Completed', color: '#00c875', order: 4 },
      { type: StatusType.TASK, name: 'backlog', displayName: 'Backlog', color: '#a25ddc', order: 5 },
      { type: StatusType.TASK, name: 'on_hold', displayName: 'On Hold', color: '#ff642e', order: 6 },
      { type: StatusType.TASK, name: 'in_review', displayName: 'In Review', color: '#037f4c', order: 7 },
      { type: StatusType.TASK, name: 'approved', displayName: 'Approved', color: '#00c875', order: 8 },
      { type: StatusType.TASK, name: 'closed', displayName: 'Closed', color: '#808080', order: 9 },

      // Activity statuses - same as task statuses for consistency (always default)
      { type: StatusType.ACTIVITY, name: 'to_do', displayName: 'To Do', color: '#c4c4c4', order: 1 },
      { type: StatusType.ACTIVITY, name: 'assigned', displayName: 'Assigned', color: '#9cd326', order: 2 },
      { type: StatusType.ACTIVITY, name: 'in_progress', displayName: 'In Progress', color: '#fdab3d', order: 3 },
      { type: StatusType.ACTIVITY, name: 'completed', displayName: 'Completed', color: '#00c875', order: 4 },
      { type: StatusType.ACTIVITY, name: 'backlog', displayName: 'Backlog', color: '#a25ddc', order: 5 },
      { type: StatusType.ACTIVITY, name: 'on_hold', displayName: 'On Hold', color: '#ff642e', order: 6 },
      { type: StatusType.ACTIVITY, name: 'in_review', displayName: 'In Review', color: '#037f4c', order: 7 },
      { type: StatusType.ACTIVITY, name: 'approved', displayName: 'Approved', color: '#00c875', order: 8 },
      { type: StatusType.ACTIVITY, name: 'closed', displayName: 'Closed', color: '#808080', order: 9 },

      // Approval workflow statuses
      { type: StatusType.APPROVAL, name: 'pending', displayName: 'Pending', color: '#fdab3d', order: 1 },
      { type: StatusType.APPROVAL, name: 'in_review', displayName: 'In Review', color: '#037f4c', order: 2 },
      { type: StatusType.APPROVAL, name: 'approved', displayName: 'Approved', color: '#00c875', order: 3 },
      { type: StatusType.APPROVAL, name: 'rejected', displayName: 'Rejected', color: '#e2445c', order: 4 },
      { type: StatusType.APPROVAL, name: 'closed', displayName: 'Closed', color: '#808080', order: 5 },
    ];

    for (const config of defaultConfigs) {
      const statusConfig = this.statusConfigRepo.create({
        organizationId,
        ...config,
        isDefault: true, // Mark as default - cannot be deleted
        isActive: true,
        description: this.getDefaultStatusDescription(config.name),
      });
      await this.statusConfigRepo.save(statusConfig);
    }
  }

  // Helper method to get status mapping for frontend
  async getStatusMapping(organizationId: string): Promise<{
    activity: Record<string, { displayName: string; color: string }>;
    task: Record<string, { displayName: string; color: string }>;
    approval: Record<string, { displayName: string; color: string }>;
  }> {
    const statuses = await this.getByOrganization(organizationId);
    
    const mapping = {
      activity: {} as Record<string, { displayName: string; color: string }>,
      task: {} as Record<string, { displayName: string; color: string }>,
      approval: {} as Record<string, { displayName: string; color: string }>,
    };

    for (const status of statuses) {
      if (status.isActive) {
        mapping[status.type][status.name] = {
          displayName: status.displayName,
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

    // Check if user role can set the target status
    if (!toConfig.canBeSetByRole(userRole)) {
      return false;
    }

    // Check if transition is allowed
    if (!fromConfig.canTransitionTo(toStatus)) {
      return false;
    }

    return true;
  }

  private getDefaultStatusDescription(name: string): string {
    const descriptions: Record<string, string> = {
      'to_do': 'Task created but not yet started',
      'assigned': 'Allocated to a person/team, waiting to start',
      'in_progress': 'Someone is actively working on it',
      'completed': 'Work finished, no further action',
      'backlog': 'Parked for later prioritization',
      'on_hold': 'Cannot move forward due to dependencies or external factors',
      'in_review': 'Under review or evaluation',
      'approved': 'Approved and ready for next phase',
      'closed': 'Fully wrapped up, no further updates expected',
    };
    return descriptions[name] || '';
  }
}
