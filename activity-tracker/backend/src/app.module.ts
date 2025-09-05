import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { getDatabaseConfig } from './config/database.config';
import { AuthModule } from './auth/auth.module';
import { ActivitiesModule } from './activities/activities.module';
import { CommentsModule } from './comments/comments.module';
import { ReportsModule } from './reports/reports.module';
import { AuditModule } from './common/audit.module';
import { ApprovalModule } from './common/approval.module';
import { TasksModule } from './tasks/tasks.module';
import { BoardsModule } from './boards/boards.module';
import { OrganizationModule } from './organization/organization.module';
import { ProjectsModule } from './projects/projects.module';
import { UsersModule } from './users/users.module';
import { StatusConfigurationModule } from './status-configuration/status-configuration.module';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { PerformanceInterceptor } from './common/interceptors/performance.interceptor';
import { CacheInterceptor } from './common/interceptors/cache.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Re-enable database connection with robust error handling
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        try {
          console.log('Configuring database connection...');
          const config = getDatabaseConfig(configService);
          console.log('Database configuration successful');
          return config;
        } catch (error) {
          console.error('Database configuration failed:', error);
          // Return minimal config to prevent crash but still allow connection attempts
          return {
            type: 'mysql' as const,
            host: configService.get<string>('DB_HOST') || 'pactivities-db.mysql.database.azure.com',
            port: parseInt(configService.get<string>('DB_PORT') || '3306'),
            username: configService.get<string>('DB_USERNAME') || 'travisai',
            password: configService.get<string>('DB_PASSWORD') || 'Haritha#12',
            database: configService.get<string>('DB_DATABASE') || 'PMActivity2',
            entities: [],
            synchronize: false,
            logging: false,
            retryAttempts: 3,
            retryDelay: 3000,
            ssl: {
              rejectUnauthorized: false
            }
          };
        }
      },
    }),
    // Gradually re-enable core modules
    OrganizationModule,
    ProjectsModule,
    UsersModule,
    // Keep other modules disabled for now
    AuthModule,
    ActivitiesModule, // ENABLED: Keep activities for now
    CommentsModule, // ENABLED: Comments system
    ReportsModule, // ENABLED: Reports and analytics
    TasksModule,
    BoardsModule, // ENABLED: Monday.com-style task boards
    AuditModule, // ENABLED: Audit logging
    ApprovalModule, // ENABLED: Approval workflow system
    StatusConfigurationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    // Enable interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: PerformanceInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
