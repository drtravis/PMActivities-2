import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AuthService } from './auth/auth.service';
import { UserRole } from './entities/user.entity';

async function createTestUsers() {
  const app = await NestFactory.create(AppModule);
  const authService = app.get(AuthService);

  try {
    // Create test organization and admin user
    await authService.createOrganization(
      'Test Organization',
      'admin@test.com',
      'Admin User',
      'admin123'
    );
    console.log('Created admin user: admin@test.com / admin123');

    // Create test PM user
    const adminUser = await authService.validateUser('admin@test.com', 'admin123');
    if (adminUser) {
      await authService.inviteUser(adminUser, 'pm@test.com', 'Project Manager', UserRole.PROJECT_MANAGER);
      console.log('Created PM user: pm@test.com / (check invitation)');

      await authService.inviteUser(adminUser, 'member@test.com', 'Member User', UserRole.MEMBER);
      console.log('Created member user: member@test.com / (check invitation)');
    }

    console.log('\nTest users created successfully!');
    console.log('You can now login with:');
    console.log('- admin@test.com / admin123 (Admin)');
    console.log('- pm@test.com / (invitation required)');
    console.log('- member@test.com / (invitation required)');

  } catch (error) {
    console.error('Error creating test users:', error.message);
  }

  await app.close();
}

createTestUsers();
