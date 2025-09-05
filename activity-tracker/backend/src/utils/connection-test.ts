import { createConnection } from 'mysql2/promise';
import axios from 'axios';

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: any;
  error?: string;
}

export class ConnectionTester {
  
  /**
   * Test database connection
   */
  static async testDatabase(config: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    ssl?: boolean;
  }): Promise<ConnectionTestResult> {
    try {
      console.log('🔍 Testing database connection...');
      console.log(`  - Host: ${config.host}:${config.port}`);
      console.log(`  - Database: ${config.database}`);
      console.log(`  - Username: ${config.username}`);
      console.log(`  - SSL: ${config.ssl ? 'enabled' : 'disabled'}`);

      const connectionConfig: any = {
        host: config.host,
        port: config.port,
        user: config.username,
        password: config.password,
        database: config.database,
        connectTimeout: 10000,
        acquireTimeout: 10000,
        timeout: 10000,
      };

      if (config.ssl) {
        connectionConfig.ssl = { rejectUnauthorized: false };
      }

      const connection = await createConnection(connectionConfig);

      // Test basic query
      const [rows] = await connection.execute('SELECT 1 as test');
      await connection.end();

      console.log('✅ Database connection successful');
      return {
        success: true,
        message: 'Database connection successful',
        details: {
          host: config.host,
          port: config.port,
          database: config.database,
          testQuery: 'SELECT 1',
          result: rows
        }
      };

    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      return {
        success: false,
        message: 'Database connection failed',
        error: error.message,
        details: {
          host: config.host,
          port: config.port,
          database: config.database,
          errorCode: error.code,
          errorNumber: error.errno
        }
      };
    }
  }

  /**
   * Test frontend connectivity
   */
  static async testFrontendConnectivity(frontendUrls: string[]): Promise<ConnectionTestResult[]> {
    const results: ConnectionTestResult[] = [];

    for (const url of frontendUrls) {
      try {
        console.log(`🔍 Testing frontend connectivity: ${url}`);
        
        const response = await axios.get(url, {
          timeout: 5000,
          validateStatus: (status) => status < 500 // Accept any status < 500
        });

        console.log(`✅ Frontend reachable: ${url} (${response.status})`);
        results.push({
          success: true,
          message: `Frontend reachable: ${url}`,
          details: {
            url,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
          }
        });

      } catch (error) {
        console.error(`❌ Frontend unreachable: ${url} - ${error.message}`);
        results.push({
          success: false,
          message: `Frontend unreachable: ${url}`,
          error: error.message,
          details: {
            url,
            errorCode: error.code,
            timeout: error.code === 'ECONNABORTED'
          }
        });
      }
    }

    return results;
  }

  /**
   * Test email configuration
   */
  static async testEmailConfig(config: {
    host: string;
    port: number;
    user: string;
    password: string;
  }): Promise<ConnectionTestResult> {
    try {
      console.log('🔍 Testing email configuration...');
      console.log(`  - Host: ${config.host}:${config.port}`);
      console.log(`  - User: ${config.user}`);

      // For now, just validate the configuration
      // In a real implementation, you might want to test SMTP connection
      if (!config.host || !config.user || !config.password) {
        throw new Error('Incomplete email configuration');
      }

      console.log('✅ Email configuration valid');
      return {
        success: true,
        message: 'Email configuration is valid',
        details: {
          host: config.host,
          port: config.port,
          user: config.user
        }
      };

    } catch (error) {
      console.error('❌ Email configuration invalid:', error.message);
      return {
        success: false,
        message: 'Email configuration invalid',
        error: error.message
      };
    }
  }

  /**
   * Run comprehensive connectivity tests
   */
  static async runAllTests(config: {
    database: {
      host: string;
      port: number;
      username: string;
      password: string;
      database: string;
      ssl?: boolean;
    };
    frontendUrls: string[];
    email?: {
      host: string;
      port: number;
      user: string;
      password: string;
    };
  }): Promise<{
    database: ConnectionTestResult;
    frontend: ConnectionTestResult[];
    email?: ConnectionTestResult;
    overall: boolean;
  }> {
    console.log('🧪 Running comprehensive connectivity tests...');

    const results = {
      database: await this.testDatabase(config.database),
      frontend: await this.testFrontendConnectivity(config.frontendUrls),
      email: config.email ? await this.testEmailConfig(config.email) : undefined,
      overall: false
    };

    // Determine overall success
    const dbSuccess = results.database.success;
    const frontendSuccess = results.frontend.some(r => r.success); // At least one frontend should be reachable
    const emailSuccess = !config.email || (results.email?.success ?? false);

    results.overall = dbSuccess && frontendSuccess && emailSuccess;

    console.log('📊 Test Results Summary:');
    console.log(`  - Database: ${dbSuccess ? '✅' : '❌'}`);
    console.log(`  - Frontend: ${frontendSuccess ? '✅' : '❌'} (${results.frontend.filter(r => r.success).length}/${results.frontend.length} reachable)`);
    if (config.email) {
      console.log(`  - Email: ${emailSuccess ? '✅' : '❌'}`);
    }
    console.log(`  - Overall: ${results.overall ? '✅ All systems operational' : '❌ Some systems have issues'}`);

    return results;
  }
}
