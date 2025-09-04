import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { Project } from '../entities/project.entity';

export async function seedDatabase(dataSource: DataSource) {
  const organizationRepository = dataSource.getRepository(Organization);
  const userRepository = dataSource.getRepository(User);
  const projectRepository = dataSource.getRepository(Project);

  // Create test organization
  let organization = await organizationRepository.findOne({ where: { name: 'Test Organization' } });
  if (!organization) {
    organization = organizationRepository.create({
      name: 'Test Organization',
      settings: {},
    });
    await organizationRepository.save(organization);
  }

  // Create test users
  const testUsers = [
    {
      email: 'admin@test.com',
      name: 'Admin User',
      role: UserRole.ADMIN,
      password: 'admin123',
    },
    {
      email: 'pm@test.com',
      name: 'Project Manager',
      role: UserRole.PROJECT_MANAGER,
      password: 'pm123',
    },
    {
      email: 'member@test.com',
      name: 'Member User',
      role: UserRole.MEMBER,
      password: 'member123',
    },
  ];

  for (const userData of testUsers) {
    const existingUser = await userRepository.findOne({ where: { email: userData.email } });
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = userRepository.create({
        email: userData.email,
        name: userData.name,
        role: userData.role,
        password: hashedPassword,
        isActive: true,
        organization,
      });
      await userRepository.save(user);
      console.log(`Created test user: ${userData.email} (${userData.role})`);
    }
  }

  // Create default project
  let defaultProject = await projectRepository.findOne({ where: { name: 'Default Project' } });
  if (!defaultProject) {
    const adminUser = await userRepository.findOne({ where: { email: 'admin@test.com' } });
    defaultProject = projectRepository.create({
      name: 'Default Project',
      description: 'Default project for task management',
      organizationId: organization.id,
      ownerId: adminUser?.id || organization.id,
    });
    await projectRepository.save(defaultProject);
    console.log(`Created default project: ${defaultProject.id}`);
  }
}
