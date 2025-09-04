import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { User, UserRole } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { UnauthorizedException, ConflictException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let organizationRepository: Repository<Organization>;
  let jwtService: JwtService;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedPassword',
    role: UserRole.MEMBER,
    organizationId: 'org1',
    isActive: true,
    invitationToken: null,
    invitationExpires: null,
  };

  const mockOrganization = {
    id: 'org1',
    name: 'Test Organization',
    domain: 'test.com',
    isActive: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Organization),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    organizationRepository = module.get<Repository<Organization>>(getRepositoryToken(Organization));
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('validateUser', () => {
    it('should return user data when credentials are valid', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as any);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
        organizationId: mockUser.organizationId,
      });
    });

    it('should return null when user is not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as any);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      const result = await service.validateUser('test@example.com', 'wrongpassword');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access token and user data', async () => {
      const mockToken = 'jwt-token';
      jest.spyOn(jwtService, 'sign').mockReturnValue(mockToken);

      const result = await service.login(mockUser as any);

      expect(result).toEqual({
        access_token: mockToken,
        user: mockUser,
      });
    });
  });

  describe('inviteUser', () => {
    it('should create invitation token for new user', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(userRepository, 'create').mockReturnValue(mockUser as any);
      jest.spyOn(userRepository, 'save').mockResolvedValue(mockUser as any);

      const result = await service.inviteUser(
        'newuser@example.com',
        'New User',
        UserRole.MEMBER,
        'org1'
      );

      expect(result.invitationToken).toBeDefined();
      expect(result.invitationExpires).toBeDefined();
    });

    it('should throw ConflictException if user already exists', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as any);

      await expect(
        service.inviteUser('test@example.com', 'Test User', UserRole.MEMBER, 'org1')
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('acceptInvitation', () => {
    it('should activate user account with valid token', async () => {
      const userWithToken = {
        ...mockUser,
        invitationToken: 'valid-token',
        invitationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        isActive: false,
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(userWithToken as any);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword' as never);
      jest.spyOn(userRepository, 'save').mockResolvedValue({ ...userWithToken, isActive: true } as any);

      const result = await service.acceptInvitation('valid-token', 'newpassword');

      expect(result.isActive).toBe(true);
      expect(result.invitationToken).toBeNull();
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.acceptInvitation('invalid-token', 'password')
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for expired token', async () => {
      const userWithExpiredToken = {
        ...mockUser,
        invitationToken: 'expired-token',
        invitationExpires: new Date(Date.now() - 1000), // Expired
        isActive: false,
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(userWithExpiredToken as any);

      await expect(
        service.acceptInvitation('expired-token', 'password')
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('createOrganization', () => {
    it('should create organization and admin user', async () => {
      jest.spyOn(organizationRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(organizationRepository, 'create').mockReturnValue(mockOrganization as any);
      jest.spyOn(organizationRepository, 'save').mockResolvedValue(mockOrganization as any);
      jest.spyOn(userRepository, 'create').mockReturnValue(mockUser as any);
      jest.spyOn(userRepository, 'save').mockResolvedValue(mockUser as any);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword' as never);

      const result = await service.createOrganization({
        organizationName: 'Test Organization',
        domain: 'test.com',
        adminName: 'Admin User',
        adminEmail: 'admin@test.com',
        adminPassword: 'password',
      });

      expect(result.organization).toBeDefined();
      expect(result.adminUser).toBeDefined();
      expect(result.adminUser.role).toBe(UserRole.ADMIN);
    });

    it('should throw ConflictException if organization domain exists', async () => {
      jest.spyOn(organizationRepository, 'findOne').mockResolvedValue(mockOrganization as any);

      await expect(
        service.createOrganization({
          organizationName: 'Test Organization',
          domain: 'test.com',
          adminName: 'Admin User',
          adminEmail: 'admin@test.com',
          adminPassword: 'password',
        })
      ).rejects.toThrow(ConflictException);
    });
  });
});
