import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { Activity, ApprovalState, Priority } from '../entities/activity.entity';
import { User, UserRole } from '../entities/user.entity';
import { Project } from '../entities/project.entity';
import { AuditLog } from '../entities/audit-log.entity';

describe('ActivitiesService', () => {
  let service: ActivitiesService;
  let activityRepository: Repository<Activity>;
  let userRepository: Repository<User>;
  let projectRepository: Repository<Project>;
  let auditLogRepository: Repository<AuditLog>;

  const mockUser = {
    id: 'user1',
    email: 'test@example.com',
    name: 'Test User',
    role: UserRole.MEMBER,
    organizationId: 'org1',
    isActive: true,
  };

  const mockProject = {
    id: 'project1',
    name: 'Test Project',
    organizationId: 'org1',
    isActive: true,
  };

  const mockActivity = {
    id: 'activity1',
    title: 'Test Activity',
    description: 'Test Description',
    status: ActivityStatus.IN_PROGRESS,
    approvalState: ApprovalState.DRAFT,
    priority: Priority.MEDIUM,
    projectId: 'project1',
    createdById: 'user1',
    startDate: new Date(),
    endDate: null,
    project: mockProject,
    createdBy: mockUser,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivitiesService,
        {
          provide: getRepositoryToken(Activity),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Project),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(AuditLog),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ActivitiesService>(ActivitiesService);
    activityRepository = module.get<Repository<Activity>>(getRepositoryToken(Activity));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    projectRepository = module.get<Repository<Project>>(getRepositoryToken(Project));
    auditLogRepository = module.get<Repository<AuditLog>>(getRepositoryToken(AuditLog));
  });

  describe('create', () => {
    const createActivityDto = {
      title: 'New Activity',
      description: 'New Description',
      projectId: 'project1',
      priority: Priority.HIGH,
      startDate: new Date(),
      endDate: null,
    };

    it('should create a new activity', async () => {
      jest.spyOn(projectRepository, 'findOne').mockResolvedValue(mockProject as any);
      jest.spyOn(activityRepository, 'create').mockReturnValue(mockActivity as any);
      jest.spyOn(activityRepository, 'save').mockResolvedValue(mockActivity as any);
      jest.spyOn(auditLogRepository, 'create').mockReturnValue({} as any);
      jest.spyOn(auditLogRepository, 'save').mockResolvedValue({} as any);

      const result = await service.create(createActivityDto, mockUser as any);

      expect(result).toEqual(mockActivity);
      expect(activityRepository.create).toHaveBeenCalledWith({
        ...createActivityDto,
        createdById: mockUser.id,
      });
    });

    it('should throw NotFoundException if project does not exist', async () => {
      jest.spyOn(projectRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.create(createActivityDto, mockUser as any)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user cannot access project', async () => {
      const differentOrgProject = { ...mockProject, organizationId: 'org2' };
      jest.spyOn(projectRepository, 'findOne').mockResolvedValue(differentOrgProject as any);

      await expect(
        service.create(createActivityDto, mockUser as any)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAll', () => {
    it('should return activities for user organization', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockActivity]),
      };

      jest.spyOn(activityRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.findAll(mockUser as any, {});

      expect(result).toEqual([mockActivity]);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('project.organizationId = :organizationId', {
        organizationId: mockUser.organizationId,
      });
    });

    it('should apply status filter when provided', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockActivity]),
      };

      jest.spyOn(activityRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      await service.findAll(mockUser as any, { status: ActivityStatus.COMPLETED });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('activity.status = :status', {
        status: ActivityStatus.COMPLETED,
      });
    });
  });

  describe('submit', () => {
    it('should submit activity for approval', async () => {
      const draftActivity = { ...mockActivity, approvalState: ApprovalState.DRAFT };
      jest.spyOn(service, 'findOne').mockResolvedValue(draftActivity as any);
      jest.spyOn(activityRepository, 'save').mockResolvedValue({
        ...draftActivity,
        approvalState: ApprovalState.SUBMITTED,
      } as any);
      jest.spyOn(auditLogRepository, 'create').mockReturnValue({} as any);
      jest.spyOn(auditLogRepository, 'save').mockResolvedValue({} as any);

      const result = await service.submit('activity1', mockUser as any);

      expect(result.approvalState).toBe(ApprovalState.SUBMITTED);
    });

    it('should throw ForbiddenException if activity is not in draft state', async () => {
      const submittedActivity = { ...mockActivity, approvalState: ApprovalState.SUBMITTED };
      jest.spyOn(service, 'findOne').mockResolvedValue(submittedActivity as any);

      await expect(
        service.submit('activity1', mockUser as any)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('approve', () => {
    it('should approve activity when user is project manager or admin', async () => {
      const pmUser = { ...mockUser, role: UserRole.PROJECT_MANAGER };
      const submittedActivity = { ...mockActivity, approvalState: ApprovalState.SUBMITTED };
      
      jest.spyOn(service, 'findOne').mockResolvedValue(submittedActivity as any);
      jest.spyOn(activityRepository, 'save').mockResolvedValue({
        ...submittedActivity,
        approvalState: ApprovalState.APPROVED,
      } as any);
      jest.spyOn(auditLogRepository, 'create').mockReturnValue({} as any);
      jest.spyOn(auditLogRepository, 'save').mockResolvedValue({} as any);

      const result = await service.approve('activity1', pmUser as any);

      expect(result.approvalState).toBe(ApprovalState.APPROVED);
    });

    it('should throw ForbiddenException if user is not authorized to approve', async () => {
      const submittedActivity = { ...mockActivity, approvalState: ApprovalState.SUBMITTED };
      jest.spyOn(service, 'findOne').mockResolvedValue(submittedActivity as any);

      await expect(
        service.approve('activity1', mockUser as any)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if activity is not submitted', async () => {
      const pmUser = { ...mockUser, role: UserRole.PROJECT_MANAGER };
      const draftActivity = { ...mockActivity, approvalState: ApprovalState.DRAFT };
      jest.spyOn(service, 'findOne').mockResolvedValue(draftActivity as any);

      await expect(
        service.approve('activity1', pmUser as any)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('reject', () => {
    it('should reject activity when user is project manager or admin', async () => {
      const pmUser = { ...mockUser, role: UserRole.PROJECT_MANAGER };
      const submittedActivity = { ...mockActivity, approvalState: ApprovalState.SUBMITTED };
      
      jest.spyOn(service, 'findOne').mockResolvedValue(submittedActivity as any);
      jest.spyOn(activityRepository, 'save').mockResolvedValue({
        ...submittedActivity,
        approvalState: ApprovalState.REJECTED,
      } as any);
      jest.spyOn(auditLogRepository, 'create').mockReturnValue({} as any);
      jest.spyOn(auditLogRepository, 'save').mockResolvedValue({} as any);

      const result = await service.reject('activity1', pmUser as any, 'Needs more details');

      expect(result.approvalState).toBe(ApprovalState.REJECTED);
    });
  });

  describe('update', () => {
    it('should allow creator to update draft activity', async () => {
      const draftActivity = { ...mockActivity, approvalState: ApprovalState.DRAFT };
      jest.spyOn(service, 'findOne').mockResolvedValue(draftActivity as any);
      jest.spyOn(activityRepository, 'save').mockResolvedValue({
        ...draftActivity,
        title: 'Updated Title',
      } as any);
      jest.spyOn(auditLogRepository, 'create').mockReturnValue({} as any);
      jest.spyOn(auditLogRepository, 'save').mockResolvedValue({} as any);

      const result = await service.update('activity1', { title: 'Updated Title' }, mockUser as any);

      expect(result.title).toBe('Updated Title');
    });

    it('should throw ForbiddenException if activity is approved and user tries to edit', async () => {
      const approvedActivity = { ...mockActivity, approvalState: ApprovalState.APPROVED };
      jest.spyOn(service, 'findOne').mockResolvedValue(approvedActivity as any);

      await expect(
        service.update('activity1', { title: 'Updated Title' }, mockUser as any)
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
