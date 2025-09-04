import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatusConfiguration } from '../entities/status-configuration.entity';
import { StatusConfigurationService } from './status-configuration.service';
import { StatusConfigurationController } from './status-configuration.controller';

@Module({
  imports: [TypeOrmModule.forFeature([StatusConfiguration])],
  controllers: [StatusConfigurationController],
  providers: [StatusConfigurationService],
  exports: [StatusConfigurationService],
})
export class StatusConfigurationModule {}
