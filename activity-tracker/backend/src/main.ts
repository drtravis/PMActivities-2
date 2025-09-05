import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import * as express from 'express';
import * as path from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
    console.log('🚀 Starting PMActivities2 Backend...');
    console.log('📊 Environment Details:');
    console.log('  - NODE_ENV:', process.env.NODE_ENV || 'development');
    console.log('  - PORT:', process.env.PORT || '3001');
    console.log('  - Database URL configured:', !!process.env.DATABASE_URL);
    console.log('  - DB_HOST:', process.env.DB_HOST || 'localhost (default)');
    console.log('  - DB_NAME:', process.env.DB_NAME || 'PMActivity2 (default)');
    console.log('  - FRONTEND_URL:', process.env.FRONTEND_URL || 'Not set (using localhost origins)');
    console.log('  - CORS_ORIGIN:', process.env.CORS_ORIGIN || 'Not set (using localhost origins)');
    console.log('  - JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '⚠️  Using default (dev only)');

    const app = await NestFactory.create(AppModule);
    console.log('✅ NestJS app created successfully');

    // Serve static files from uploads directory
    app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
  
  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }));

  // Rate limiting (disabled in E2E mode)
  const E2E = process.env.E2E_MODE === 'true';
  if (!E2E) {
    app.use(rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    }));

    // Stricter rate limiting for auth endpoints
    app.use('/auth/login', rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // limit each IP to 5 login attempts per windowMs
      message: 'Too many login attempts, please try again later.',
      skipSuccessfulRequests: true,
    }));
  }
  
  // Set global API prefix
  app.setGlobalPrefix('api');

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    disableErrorMessages: process.env.NODE_ENV === 'production',
  }));
  
  // Enhanced CORS configuration with better debugging
  const corsOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://localhost:3004',
    'http://localhost:3005',
    'http://localhost:3006',
    'http://localhost:3007',
    process.env.FRONTEND_URL,
    process.env.CORS_ORIGIN
  ].filter(Boolean);

  // Split CORS_ORIGIN if it contains multiple URLs
  if (process.env.CORS_ORIGIN && process.env.CORS_ORIGIN.includes(',')) {
    corsOrigins.push(...process.env.CORS_ORIGIN.split(',').map(url => url.trim()));
  }

  console.log('🌐 CORS Origins configured:', corsOrigins);

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Trust proxy for accurate IP addresses
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log('🎉 Application started successfully!');
  console.log(`🌐 Server running on port ${port}`);
  console.log(`📍 Health check: http://localhost:${port}/health`);
  console.log(`🔗 API base: http://localhost:${port}/api`);

  // Add health check endpoint
  try {
    app.getHttpAdapter().get('/health', (req, res) => {
      res.json({
        status: 'ok',
        message: 'PMActivities Backend is running',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        port: port,
        corsOrigins: corsOrigins?.length || 0,
        database: process.env.DB_HOST ? 'configured' : 'not configured'
      });
    });
  } catch (error) {
    console.warn('⚠️  Could not set up health check endpoint:', error.message);
  }

  } catch (error) {
    console.error('❌ Failed to start application:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

bootstrap().catch(error => {
  console.error('Bootstrap failed:', error);
  process.exit(1);
});
