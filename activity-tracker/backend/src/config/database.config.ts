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

// Import centralized configuration
const { config, validateConfig } = require('../../../../config/app.config.js');

export const getDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => {
  // Validate centralized configuration
  try {
    validateConfig();
  } catch (error) {
    console.warn('Configuration validation failed:', error.message);
  }

  // Use centralized database configuration
  const dbConfig = config.database;

  // Support both MySQL connection URL and individual parameters
  const databaseUrl = configService.get('DATABASE_URL');

  // If no database configuration is provided, use centralized config defaults
  if (!databaseUrl && !configService.get('DB_HOST') && !dbConfig.host) {
    console.warn('No database configuration found. Using minimal offline config.');
    return {
      type: 'mysql',
      host: 'activity-tracker-mysql.mysql.database.azure.com',
      port: 3306,
      username: 'drtravi',
      password: '',
      database: 'pmactivity2',
      entities: [],
      synchronize: false,
      logging: false,
      retryAttempts: 0,
      retryDelay: 0,
      autoLoadEntities: false,
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

  // Use centralized configuration with environment variable fallbacks
  return {
    type: dbConfig.type as any,
    host: configService.get<string>('DB_HOST', 'activity-tracker-mysql.mysql.database.azure.com'),
    port: parseInt(configService.get<string>('DB_PORT') || '3306'),
    username: configService.get<string>('DB_USERNAME', 'drtravi'),
    password: configService.get<string>('DB_PASSWORD', ''),
    database: configService.get<string>('DB_NAME', 'pmactivity2'),
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
    synchronize: dbConfig.synchronize,
    dropSchema: configService.get('DB_DROP_SCHEMA') === 'true',
    logging: dbConfig.logging,
    ssl: dbConfig.ssl,
    retryAttempts: 3,
    retryDelay: 3000,
    extra: {
      connectionLimit: 10,
      acquireTimeout: 60000,
      timeout: 60000,
    },
  };
};
