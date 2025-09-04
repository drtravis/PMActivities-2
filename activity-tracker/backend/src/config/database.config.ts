import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import {
  Organization,
  User,
  Project,
  Activity,
  Comment,
  AuditLog,
  Task,
  Board,
  Approval,
  TaskHistory,
  TaskComment,
  TaskAttachment,
} from '../entities';
import { StatusConfiguration } from '../entities/status-configuration.entity';

export const getDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => {
  // Support both MySQL connection URL and individual parameters
  const databaseUrl = configService.get('DATABASE_URL');

  // If no database configuration is provided, return a minimal config that won't try to connect
  if (!databaseUrl && !configService.get('DB_HOST')) {
    console.warn('No database configuration found. Using minimal offline config.');
    return {
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'password',
      database: 'pactivities',
      entities: [],
      synchronize: false,
      logging: false,
      retryAttempts: 0,
      retryDelay: 0,
      autoLoadEntities: false,
      // Don't actually try to connect
      extra: {
        connectionLimit: 0,
      },
    };
  }

  if (databaseUrl) {
    try {
      // Parse MySQL connection URL: mysql://user:password@host:port/database
      const url = new URL(databaseUrl);
      console.log('Database config - Host:', url.hostname, 'Database:', url.pathname.slice(1));
      return {
        type: 'mysql',
        host: url.hostname,
        port: parseInt(url.port) || 3306,
        username: url.username,
        password: url.password,
        database: url.pathname.slice(1), // Remove leading slash
        ssl: url.searchParams.get('ssl') === 'true' ? { rejectUnauthorized: false } : false,
      entities: [
        Organization,
        User,
        Project,
        Activity,
        Comment,
        AuditLog,
        Task,
        Board,
        Approval,
        TaskHistory,
        TaskComment,
        TaskAttachment,
        StatusConfiguration,
      ],
        synchronize: configService.get('NODE_ENV') !== 'production',
        dropSchema: configService.get('DB_DROP_SCHEMA') === 'true',
        logging: configService.get('NODE_ENV') === 'development',
        retryAttempts: 3,
        retryDelay: 3000,
      };
    } catch (error) {
      console.error('Error parsing DATABASE_URL:', error);
      throw new Error('Invalid DATABASE_URL format');
    }
  }

  // Fallback to individual parameters for local development
  return {
    type: 'mysql',
    host: configService.get<string>('DB_HOST', 'localhost'),
    port: parseInt(configService.get<string>('DB_PORT', '3306')),
    username: configService.get<string>('DB_USERNAME', 'root'),
    password: configService.get<string>('DB_PASSWORD', 'password'),
    database: configService.get<string>('DB_DATABASE', 'pactivities'),
    entities: [
      Organization,
      User,
      Project,
      Activity,
      Comment,
      AuditLog,
      Task,
      Board,
      Approval,
      TaskHistory,
      TaskComment,
      TaskAttachment,
      StatusConfiguration,
    ],
    synchronize: configService.get('NODE_ENV') !== 'production',
    dropSchema: configService.get('DB_DROP_SCHEMA') === 'true',
    logging: configService.get('NODE_ENV') === 'development',
  };
};
