import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { seedDatabase } from './database/seed';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Get the DataSource from TypeORM
  const dataSource = app.get(DataSource);
  
  console.log('Seeding database with test users...');
  await seedDatabase(dataSource);
  console.log('Database seeding completed!');
  
  await app.close();
}

bootstrap().catch(console.error);
