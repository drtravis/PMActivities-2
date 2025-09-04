import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AuthService } from './auth/auth.service';
import { UserRole } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcryptjs';

async function setupTestUsers() {
  const app = await NestFactory.create(AppModule);
  const authService = app.get(AuthService);
  const userRepository = app.get('UserRepository') as Repository<User>;

  try {
    // Create test organization and admin user
    const { organization, user: adminUser } = await authService.createOrganization(
      'Test Organization',
      'admin@test.com',
      'Admin User',
      'admin123'
    );
    console.log('✅ Created admin user: admin@test.com / admin123');

    // Create PM user directly with password
    const hashedPMPassword = await bcrypt.hash('pm123', 10);
    const pmUser = userRepository.create({
      email: 'pm@test.com',
      name: 'Project Manager',
      password: hashedPMPassword,
      role: UserRole.PROJECT_MANAGER,
      organizationId: organization.id,
      isActive: true,
    });
    await userRepository.save(pmUser);
    console.log('✅ Created PM user: pm@test.com / pm123');

    // Create member user directly with password
    const hashedMemberPassword = await bcrypt.hash('member123', 10);
    const memberUser = userRepository.create({
      email: 'member@test.com',
      name: 'Member User',
      password: hashedMemberPassword,
      role: UserRole.MEMBER,
      organizationId: organization.id,
      isActive: true,
    });
    await userRepository.save(memberUser);
    console.log('✅ Created member user: member@test.com / member123');

    console.log('\n🎉 Test users created successfully!');
    console.log('You can now login with:');
    console.log('- admin@test.com / admin123 (Admin)');
    console.log('- pm@test.com / pm123 (Project Manager)');
    console.log('- member@test.com / member123 (Member)');

  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('ℹ️ Test users already exist. You can login with:');
      console.log('- admin@test.com / admin123 (Admin)');
      console.log('- pm@test.com / pm123 (Project Manager)');
      console.log('- member@test.com / member123 (Member)');
    } else {
      console.error('❌ Error creating test users:', error.message);
    }
  }

  await app.close();
}

setupTestUsers();
