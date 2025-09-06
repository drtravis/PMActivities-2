import { ConfigService } from '@nestjs/config';

export interface EnvironmentConfig {
  nodeEnv: string;
  port: number;
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    ssl: boolean;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  cors: {
    origins: string[];
  };
  upload: {
    destination: string;
    maxFileSize: number;
  };
  email: {
    enabled: boolean;
    host: string;
    port: number;
    user: string;
    password: string;
    fromName: string;
    fromAddress: string;
  };
}

export function getEnvironmentConfig(configService: ConfigService): EnvironmentConfig {
  // Helper function to parse CORS origins
  const parseCorsOrigins = (): string[] => {
    const origins: string[] = [];

    // Add localhost origins for development
    if (configService.get('NODE_ENV') !== 'production') {
      origins.push(
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:3003',
        'http://localhost:3004'
      );
    }

    // Add FRONTEND_URL if set
    const frontendUrl = configService.get<string>('FRONTEND_URL');
    if (frontendUrl) {
      origins.push(frontendUrl);
    }

    // Add CORS_ORIGIN (can be comma-separated)
    const corsOrigin = configService.get<string>('CORS_ORIGIN');
    if (corsOrigin) {
      if (corsOrigin.includes(',')) {
        origins.push(...corsOrigin.split(',').map((url: string) => url.trim()));
      } else {
        origins.push(corsOrigin);
      }
    }

    return [...new Set(origins.filter(Boolean))]; // Remove duplicates and empty values
  };

  const config: EnvironmentConfig = {
    nodeEnv: configService.get('NODE_ENV', 'development'),
    port: parseInt(configService.get('PORT', '3001')),
    
    database: {
      host: configService.get('DB_HOST', 'activity-tracker-mysql.mysql.database.azure.com'),
      port: parseInt(configService.get('DB_PORT', '3306')),
      username: configService.get('DB_USERNAME', 'drtravi'),
      password: configService.get('DB_PASSWORD', ''),
      database: configService.get('DB_NAME', 'pmactivity2'), // Standardized database name
      ssl: configService.get('NODE_ENV') === 'production' && configService.get('DB_SSL', 'true') === 'true',
    },
    
    jwt: {
      secret: configService.get('JWT_SECRET', 'default-secret-change-in-production'),
      expiresIn: configService.get('JWT_EXPIRES_IN', '7d'),
    },
    
    cors: {
      origins: parseCorsOrigins(),
    },
    
    upload: {
      destination: configService.get('UPLOAD_DEST', './uploads'),
      maxFileSize: parseInt(configService.get('MAX_FILE_SIZE', '10485760')), // 10MB
    },
    
    email: {
      enabled: configService.get('EMAIL_ENABLED', 'false') === 'true',
      host: configService.get('SMTP_HOST', 'localhost'),
      port: parseInt(configService.get('SMTP_PORT', '587')),
      user: configService.get('SMTP_USER', ''),
      password: configService.get('SMTP_PASS', ''),
      fromName: configService.get('EMAIL_FROM_NAME', 'PMActivities'),
      fromAddress: configService.get('EMAIL_FROM_ADDRESS', 'noreply@pmactivities.com'),
    },
  };

  return config;
}

export function validateEnvironmentConfig(config: EnvironmentConfig): void {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate required fields - stricter in production
  if (config.nodeEnv === 'production') {
    if (!config.jwt.secret || config.jwt.secret === 'default-secret-change-in-production') {
      errors.push('JWT_SECRET must be set to a secure value in production');
    }

    if (!config.database.host || config.database.host === 'localhost') {
      errors.push('DB_HOST must be set to production database in production');
    }

    if (!config.database.password) {
      errors.push('DB_PASSWORD is required in production');
    }

    if (config.cors.origins.length === 0) {
      errors.push('At least one CORS origin must be configured in production');
    }
  } else {
    // Development warnings only
    if (!config.jwt.secret || config.jwt.secret === 'default-secret-change-in-production') {
      warnings.push('Using default JWT_SECRET (development only)');
    }

    if (!config.database.password) {
      warnings.push('DB_PASSWORD not set (may be required for your local database)');
    }
  }

  // Always validate these
  if (!config.database.host) {
    errors.push('DB_HOST is required');
  }

  if (!config.database.username) {
    errors.push('DB_USERNAME is required');
  }

  if (config.email.enabled) {
    if (!config.email.host) {
      errors.push('SMTP_HOST is required when email is enabled');
    }
    if (!config.email.user) {
      errors.push('SMTP_USER is required when email is enabled');
    }
    if (!config.email.password) {
      errors.push('SMTP_PASS is required when email is enabled');
    }
  }

  // Display warnings in development
  if (warnings.length > 0) {
    console.warn('⚠️  Development Configuration Warnings:');
    warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  // Handle errors
  if (errors.length > 0) {
    console.error('❌ Environment Configuration Errors:');
    errors.forEach(error => console.error(`  - ${error}`));

    if (config.nodeEnv === 'production') {
      throw new Error('Invalid environment configuration for production');
    } else {
      console.warn('⚠️  Configuration errors detected (continuing in development mode)');
    }
  }
}

export function logEnvironmentConfig(config: EnvironmentConfig): void {
  console.log('🔧 Environment Configuration:');
  console.log(`  - Environment: ${config.nodeEnv}`);
  console.log(`  - Port: ${config.port}`);
  console.log(`  - Database Host: ${config.database.host}:${config.database.port}`);
  console.log(`  - Database Name: ${config.database.database}`);
  console.log(`  - Database SSL: ${config.database.ssl ? 'enabled' : 'disabled'}`);
  console.log(`  - JWT Expires In: ${config.jwt.expiresIn}`);
  console.log(`  - CORS Origins: ${config.cors.origins.length} configured`);
  config.cors.origins.forEach(origin => console.log(`    - ${origin}`));
  console.log(`  - File Upload Max Size: ${(config.upload.maxFileSize / 1024 / 1024).toFixed(1)}MB`);
  console.log(`  - Email Enabled: ${config.email.enabled ? 'yes' : 'no'}`);
  if (config.email.enabled) {
    console.log(`  - Email Host: ${config.email.host}:${config.email.port}`);
  }
}
