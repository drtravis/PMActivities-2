import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { Organization } from './entities/organization.entity';
import * as bcrypt from 'bcryptjs';

async function fixPMUser() {
  const app = await NestFactory.create(AppModule);
  const userRepository = app.get('UserRepository') as Repository<User>;
  const organizationRepository = app.get('OrganizationRepository') as Repository<Organization>;

  try {
    // Find the organization
    const organization = await organizationRepository.findOne({ 
      where: { name: 'Test Organization' } 
    });

    if (!organization) {
      console.log('❌ Organization not found. Creating organization first...');
      await app.close();
      return;
    }

    // Check if PM user exists
    let pmUser = await userRepository.findOne({ 
      where: { email: 'pm@test.com' } 
    });

    if (pmUser) {
      // Update existing PM user to be active with correct password
      const hashedPassword = await bcrypt.hash('pm123', 10);
      pmUser.password = hashedPassword;
      pmUser.isActive = true;
      pmUser.role = UserRole.PROJECT_MANAGER;
      pmUser.organizationId = organization.id;
      await userRepository.save(pmUser);
      console.log('✅ Updated PM user: pm@test.com / pm123');
    } else {
      // Create new PM user
      const hashedPassword = await bcrypt.hash('pm123', 10);
      pmUser = userRepository.create({
        email: 'pm@test.com',
        name: 'Project Manager',
        password: hashedPassword,
        role: UserRole.PROJECT_MANAGER,
        organizationId: organization.id,
        isActive: true,
      });
      await userRepository.save(pmUser);
      console.log('✅ Created PM user: pm@test.com / pm123');
    }

    // Also check/create member user
    let memberUser = await userRepository.findOne({ 
      where: { email: 'member@test.com' } 
    });

    if (!memberUser) {
      const hashedPassword = await bcrypt.hash('member123', 10);
      memberUser = userRepository.create({
        email: 'member@test.com',
        name: 'Member User',
        password: hashedPassword,
        role: UserRole.MEMBER,
        organizationId: organization.id,
        isActive: true,
      });
      await userRepository.save(memberUser);
      console.log('✅ Created Member user: member@test.com / member123');
    }

    console.log('\n🎉 All test users are ready!');
    console.log('Login credentials:');
    console.log('- admin@test.com / admin123 (Admin)');
    console.log('- pm@test.com / pm123 (Project Manager)');
    console.log('- member@test.com / member123 (Member)');

  } catch (error) {
    console.error('❌ Error fixing PM user:', error.message);
  }

  await app.close();
}

fixPMUser();
