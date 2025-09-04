import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { Organization } from './entities/organization.entity';
import * as bcrypt from 'bcryptjs';

async function createMem1User() {
  const app = await NestFactory.create(AppModule);
  const userRepository = app.get<Repository<User>>(getRepositoryToken(User));
  const organizationRepository = app.get<Repository<Organization>>(getRepositoryToken(Organization));

  try {
    // Get the test organization
    const organization = await organizationRepository.findOne({ 
      where: { name: 'Test Organization' } 
    });

    if (!organization) {
      console.error('❌ Test Organization not found. Please run setup-test-users first.');
      await app.close();
      return;
    }

    // Check if mem1@test.com already exists
    const existingUser = await userRepository.findOne({ 
      where: { email: 'mem1@test.com' } 
    });

    if (existingUser) {
      console.log('ℹ️ User mem1@test.com already exists');
      console.log('Login credentials: mem1@test.com / member123');
      await app.close();
      return;
    }

    // Create mem1@test.com user
    const hashedPassword = await bcrypt.hash('member123', 10);
    const mem1User = userRepository.create({
      email: 'mem1@test.com',
      name: 'Member 1',
      password: hashedPassword,
      role: UserRole.MEMBER,
      organizationId: organization.id,
      isActive: true,
    });

    await userRepository.save(mem1User);
    console.log('✅ Created user: mem1@test.com / member123 (Member)');

    console.log('\n🎉 User created successfully!');
    console.log('You can now login with:');
    console.log('- mem1@test.com / member123 (Member)');

  } catch (error) {
    console.error('❌ Error creating mem1 user:', error.message);
  }

  await app.close();
}

createMem1User();
