/**
 * Centralized Application Configuration
 * Single source of truth for all application settings
 * Change once, reflects everywhere
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

// Base configuration object
const config = {
  // Environment
  environment: {
    isDevelopment,
    isProduction,
    isTest,
    nodeEnv: process.env.NODE_ENV || 'development'
  },

  // Application settings
  app: {
    name: 'PMActivities2',
    version: '1.0.0',
    description: 'PMActivities2 - Multi-tenant Activity Tracking Web Application',
    port: {
      backend: process.env.BACKEND_PORT || 3001,
      frontend: process.env.FRONTEND_PORT || 3000
    }
  },

  // Database configuration - Updated to use PMActivity2
  database: {
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3307,
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || 'rootpassword123',
    database: process.env.DB_NAME || 'PMActivity2',
    synchronize: isDevelopment, // Only in development
    logging: isDevelopment,
    entities: ['dist/**/*.entity{.ts,.js}'],
    migrations: ['dist/migrations/*{.ts,.js}'],
    migrationsTableName: 'migrations',
    ssl: isProduction ? { rejectUnauthorized: false } : false
  },

  // API configuration
  api: {
    baseUrl: process.env.API_BASE_URL || `http://localhost:${process.env.BACKEND_PORT || 3001}`,
    prefix: '/api',
    version: 'v1',
    timeout: 30000,
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    }
  },

  // Frontend configuration
  frontend: {
    baseUrl: process.env.FRONTEND_BASE_URL || `http://localhost:${process.env.FRONTEND_PORT || 3000}`,
    apiUrl: process.env.NEXT_PUBLIC_API_URL || `http://localhost:${process.env.BACKEND_PORT || 3001}/api`
  },

  // Authentication
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    sessionTimeout: parseInt(process.env.SESSION_TIMEOUT) || 24 * 60 * 60 * 1000 // 24 hours
  },

  // Email configuration
  email: {
    enabled: process.env.EMAIL_ENABLED === 'true',
    smtp: {
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      }
    },
    from: {
      name: process.env.EMAIL_FROM_NAME || 'PMActivities2',
      address: process.env.EMAIL_FROM_ADDRESS || 'noreply@pmactivities2.com'
    }
  },

  // File upload
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'],
    destination: process.env.UPLOAD_DESTINATION || './uploads'
  },

  // Security
  security: {
    cors: {
      origin: process.env.CORS_ORIGIN || [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:3003'
      ],
      credentials: true
    },
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"]
        }
      }
    }
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
    format: process.env.LOG_FORMAT || 'combined',
    file: {
      enabled: process.env.LOG_FILE_ENABLED === 'true',
      filename: process.env.LOG_FILENAME || 'app.log',
      maxSize: process.env.LOG_MAX_SIZE || '10m',
      maxFiles: process.env.LOG_MAX_FILES || '5'
    }
  },

  // Cache configuration
  cache: {
    enabled: process.env.CACHE_ENABLED === 'true',
    type: process.env.CACHE_TYPE || 'memory', // memory, redis
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || '',
      db: parseInt(process.env.REDIS_DB) || 0
    },
    ttl: parseInt(process.env.CACHE_TTL) || 300 // 5 minutes
  }
};

// Validation function
function validateConfig() {
  const required = [
    'database.host',
    'database.username',
    'database.password',
    'database.database',
    'auth.jwtSecret'
  ];

  for (const path of required) {
    const value = path.split('.').reduce((obj, key) => obj?.[key], config);
    if (!value) {
      throw new Error(`Missing required configuration: ${path}`);
    }
  }
}

// Export configuration
module.exports = {
  config,
  validateConfig,
  
  // Helper functions
  isDevelopment: () => config.environment.isDevelopment,
  isProduction: () => config.environment.isProduction,
  isTest: () => config.environment.isTest,
  
  // Get specific config sections
  getDatabase: () => config.database,
  getApi: () => config.api,
  getAuth: () => config.auth,
  getEmail: () => config.email,
  getSecurity: () => config.security,
  getLogging: () => config.logging,
  getCache: () => config.cache
};
