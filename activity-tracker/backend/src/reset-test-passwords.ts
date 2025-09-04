import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, In, ILike } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcryptjs';

async function resetTestPasswords() {
  const app = await NestFactory.create(AppModule);
  const userRepository = app.get<Repository<User>>(getRepositoryToken(User));

  const emails = ['admin@test.com', 'pm@test.com', 'member@test.com'];
  const newPassword = 'Test#123';

  try {
    const users = await userRepository.find({
      where: [
        { email: In(emails) },
        { name: ILike('%test%') },
      ],
    });

    if (!users.length) {
      console.log('No test users found to update.');
      await app.close();
      return;
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    for (const user of users) {
      user.password = hashed;
      user.isActive = true;
    }

    await userRepository.save(users);

    console.log(`✅ Updated ${users.length} test user(s) to password: ${newPassword}`);
    console.log('Users updated:');
    for (const u of users) {
      console.log(` - ${u.email} (${u.name})`);
    }
  } catch (err: any) {
    console.error('❌ Error resetting test passwords:', err?.message || err);
  } finally {
    await app.close();
  }
}

resetTestPasswords();
