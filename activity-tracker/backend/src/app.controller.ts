import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 3001,
      database_configured: !!process.env.DATABASE_URL || !!(process.env.DB_HOST && process.env.DB_DATABASE),
      database_connected: 'attempting', // Re-enabled database connection
      version: '2.3.0', // Updated version - database re-enabled
      uptime: process.uptime(),
      mode: 'progressive-restore', // Gradually restoring functionality
      modules_enabled: ['OrganizationModule', 'ProjectsModule', 'UsersModule'],
    };
  }

  @Get('test')
  test() {
    return {
      message: 'Backend is working!',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: '2.0.0', // Updated version to verify deployment
    };
  }

  @Get('db-connect')
  async testDatabaseConnection() {
    const mysql = require('mysql2/promise');

    try {
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        return {
          status: 'error',
          message: 'DATABASE_URL not configured',
          timestamp: new Date().toISOString(),
        };
      }

      const url = new URL(databaseUrl);

      const connection = await mysql.createConnection({
        host: url.hostname,
        port: parseInt(url.port) || 3306,
        user: url.username,
        password: url.password,
        database: url.pathname.slice(1),
        ssl: url.searchParams.get('ssl') === 'true' ? { rejectUnauthorized: false } : false,
        connectTimeout: 10000,
      });

      const [rows] = await connection.execute('SELECT 1 as test, NOW() as server_time');
      await connection.end();

      return {
        status: 'success',
        message: 'Database connection successful!',
        host: url.hostname,
        database: url.pathname.slice(1),
        result: rows[0],
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        code: error.code,
        errno: error.errno,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('db-setup')
  async setupDatabase() {
    const mysql = require('mysql2/promise');

    try {
      // Try to connect with admin credentials to create a new user
      const adminUrl = process.env.DATABASE_URL?.replace('travisai:', 'travisai:'); // Use same credentials for now

      if (!adminUrl) {
        return {
          status: 'error',
          message: 'DATABASE_URL not configured',
          timestamp: new Date().toISOString(),
        };
      }

      const url = new URL(adminUrl);

      const connection = await mysql.createConnection({
        host: url.hostname,
        port: parseInt(url.port) || 3306,
        user: url.username,
        password: url.password,
        ssl: url.searchParams.get('ssl') === 'true' ? { rejectUnauthorized: false } : false,
        connectTimeout: 10000,
      });

      // Try to create database and user
      const commands = [
        `CREATE DATABASE IF NOT EXISTS pactivities`,
        `CREATE USER IF NOT EXISTS 'pactivities_app'@'%' IDENTIFIED BY 'SecureAppPass123!'`,
        `GRANT ALL PRIVILEGES ON pactivities.* TO 'pactivities_app'@'%'`,
        `FLUSH PRIVILEGES`
      ];

      const results: Array<{command: string, status: string, message?: string}> = [];
      for (const command of commands) {
        try {
          await connection.execute(command);
          results.push({ command, status: 'success' });
        } catch (error: any) {
          results.push({ command, status: 'error', message: error.message });
        }
      }

      await connection.end();

      return {
        status: 'completed',
        message: 'Database setup attempted',
        results,
        next_step: 'Update DATABASE_URL to: mysql://pactivities_app:SecureAppPass123!@pactivities-db.mysql.database.azure.com:3306/pactivities?ssl=true',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        code: error.code,
        errno: error.errno,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('test-db')
  async testDatabase() {
    const mysql = require('mysql2/promise');

    try {
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        return {
          status: 'error',
          message: 'DATABASE_URL not configured',
          timestamp: new Date().toISOString(),
        };
      }

      // Parse the DATABASE_URL
      const url = new URL(databaseUrl);

      console.log('Attempting database connection to:', url.hostname);

      const connection = await mysql.createConnection({
        host: url.hostname,
        port: parseInt(url.port) || 3306,
        user: url.username,
        password: url.password,
        database: url.pathname.slice(1),
        ssl: url.searchParams.get('ssl') === 'true' ? { rejectUnauthorized: false } : false,
        connectTimeout: 10000,
        acquireTimeout: 10000,
      });

      // Test the connection
      const [rows] = await connection.execute('SELECT 1 as test, NOW() as current_time');
      await connection.end();

      return {
        status: 'success',
        message: 'Database connection successful!',
        host: url.hostname,
        database: url.pathname.slice(1),
        test_result: rows[0],
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Database connection error:', error);
      return {
        status: 'error',
        message: error.message,
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
