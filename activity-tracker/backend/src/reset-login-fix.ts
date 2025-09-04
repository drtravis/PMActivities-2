import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { Organization } from './entities/organization.entity';
import * as bcrypt from 'bcryptjs';

async function resetLoginFix() {
  const app = await NestFactory.create(AppModule);
  const userRepository = app.get<Repository<User>>(getRepositoryToken(User));
  const organizationRepository = app.get<Repository<Organization>>(getRepositoryToken(Organization));

  try {
    console.log('🔧 Resetting login system and fixing user accounts...');

    // Get or create test organization
    let organization = await organizationRepository.findOne({ 
      where: { name: 'Test Organization' } 
    });

    if (!organization) {
      organization = organizationRepository.create({
        name: 'Test Organization',
        settings: {},
      });
      await organizationRepository.save(organization);
      console.log('✅ Created Test Organization');
    }

    // Define test users with correct passwords
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
      {
        email: 'mem1@test.com',
        name: 'Member 1',
        role: UserRole.MEMBER,
        password: 'member123',
      },
    ];

    // Reset/create each user
    for (const userData of testUsers) {
      let user = await userRepository.findOne({ where: { email: userData.email } });
      
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      if (user) {
        // Update existing user
        user.password = hashedPassword;
        user.isActive = true;
        user.role = userData.role;
        user.organizationId = organization.id;
        user.name = userData.name;
        await userRepository.save(user);
        console.log(`✅ Updated user: ${userData.email} / ${userData.password} (${userData.role})`);
      } else {
        // Create new user
        user = userRepository.create({
          email: userData.email,
          name: userData.name,
          role: userData.role,
          password: hashedPassword,
          isActive: true,
          organizationId: organization.id,
        });
        await userRepository.save(user);
        console.log(`✅ Created user: ${userData.email} / ${userData.password} (${userData.role})`);
      }
    }

    console.log('\n🎉 Login system reset complete!');
    console.log('You can now login with any of these accounts:');
    console.log('- admin@test.com / admin123 (Admin)');
    console.log('- pm@test.com / pm123 (Project Manager)');
    console.log('- member@test.com / member123 (Member)');
    console.log('- mem1@test.com / member123 (Member)');
    console.log('\n💡 Wait a few minutes for rate limiting to reset, then try logging in.');

  } catch (error) {
    console.error('❌ Error resetting login system:', error.message);
  }

  await app.close();
}

resetLoginFix();
