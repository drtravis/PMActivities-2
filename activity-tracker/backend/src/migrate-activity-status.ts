import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';

/**
 * Migration script to update Activity.status enum values from old format to unified format
 * 
 * Old values: 'in_progress', 'on_hold', 'completed', 'stopped'
 * New values: 'Not Started', 'Working on it', 'Stuck', 'Done', 'Blocked', 'Canceled'
 */

const statusMapping = {
  'in_progress': 'Working on it',
  'on_hold': 'Blocked',
  'completed': 'Done',
  'stopped': 'Canceled'
};

async function migrateActivityStatus() {
  const configService = new ConfigService();

  const dataSourceOptions: DataSourceOptions = {
    type: 'postgres',
    host: configService.get('DB_HOST', 'localhost'),
    port: configService.get('DB_PORT', 5432),
    username: configService.get('DB_USERNAME', 'postgres'),
    password: configService.get('DB_PASSWORD', 'password'),
    database: configService.get('DB_NAME', 'activity_tracker'),
    entities: [],
    synchronize: false,
    logging: true,
  };

  const dataSource = new DataSource(dataSourceOptions);
  
  try {
    await dataSource.initialize();
    console.log('Database connection established');

    // First, add new enum values to the database
    console.log('Adding new enum values...');
    await dataSource.query(`
      ALTER TYPE "activity_status_enum" ADD VALUE IF NOT EXISTS 'Not Started';
      ALTER TYPE "activity_status_enum" ADD VALUE IF NOT EXISTS 'Working on it';
      ALTER TYPE "activity_status_enum" ADD VALUE IF NOT EXISTS 'Stuck';
      ALTER TYPE "activity_status_enum" ADD VALUE IF NOT EXISTS 'Done';
      ALTER TYPE "activity_status_enum" ADD VALUE IF NOT EXISTS 'Blocked';
      ALTER TYPE "activity_status_enum" ADD VALUE IF NOT EXISTS 'Canceled';
    `);

    // Update existing records
    console.log('Updating existing activity records...');
    
    for (const [oldValue, newValue] of Object.entries(statusMapping)) {
      const result = await dataSource.query(
        `UPDATE activities SET status = $1 WHERE status = $2`,
        [newValue, oldValue]
      );
      console.log(`Updated ${result.affectedRows || 0} records from '${oldValue}' to '${newValue}'`);
    }

    // Update any remaining 'not_started' to 'Not Started' (if exists)
    const notStartedResult = await dataSource.query(
      `UPDATE activities SET status = $1 WHERE status = $2`,
      ['Not Started', 'not_started']
    );
    console.log(`Updated ${notStartedResult.affectedRows || 0} records from 'not_started' to 'Not Started'`);

    // Note: We cannot remove old enum values in PostgreSQL without recreating the type
    // The old values will remain in the enum but won't be used
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

// Run the migration
if (require.main === module) {
  migrateActivityStatus()
    .then(() => {
      console.log('Activity status migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration error:', error);
      process.exit(1);
    });
}

export { migrateActivityStatus };
