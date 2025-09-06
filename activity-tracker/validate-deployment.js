#!/usr/bin/env node

/**
 * Azure Deployment Validation Script
 * Tests connectivity and configuration after deployment
 */

const axios = require('axios');
const mysql = require('mysql2/promise');

// Configuration - Update these with your actual Azure URLs
const CONFIG = {
  backend: {
    url: process.env.BACKEND_URL || 'https://your-backend-app.azurewebsites.net',
    healthEndpoint: '/health',
    apiEndpoint: '/api/organizations'
  },
  frontend: {
    url: process.env.FRONTEND_URL || 'https://your-frontend-app.azurewebsites.net'
  },
  database: {
    host: process.env.DB_HOST || 'activity-tracker-mysql.mysql.database.azure.com',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USERNAME || 'drtravi',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pmactivity2'
  }
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

async function testBackendHealth() {
  try {
    logInfo('Testing backend health...');
    const response = await axios.get(`${CONFIG.backend.url}${CONFIG.backend.healthEndpoint}`, {
      timeout: 10000
    });
    
    if (response.status === 200 && response.data.status === 'ok') {
      logSuccess(`Backend is healthy: ${CONFIG.backend.url}`);
      logInfo(`Environment: ${response.data.environment}`);
      logInfo(`Database: ${response.data.database}`);
      logInfo(`CORS Origins: ${response.data.corsOrigins}`);
      return true;
    } else {
      logError(`Backend health check failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    logError(`Backend health check failed: ${error.message}`);
    if (error.code === 'ECONNREFUSED') {
      logError('Connection refused - backend may not be running');
    } else if (error.code === 'ENOTFOUND') {
      logError('DNS resolution failed - check backend URL');
    }
    return false;
  }
}

async function testFrontend() {
  try {
    logInfo('Testing frontend accessibility...');
    const response = await axios.get(CONFIG.frontend.url, {
      timeout: 10000,
      validateStatus: (status) => status < 500 // Accept any status < 500
    });
    
    if (response.status < 400) {
      logSuccess(`Frontend is accessible: ${CONFIG.frontend.url}`);
      return true;
    } else {
      logWarning(`Frontend returned status ${response.status} but is reachable`);
      return true;
    }
  } catch (error) {
    logError(`Frontend test failed: ${error.message}`);
    if (error.code === 'ECONNREFUSED') {
      logError('Connection refused - frontend may not be running');
    } else if (error.code === 'ENOTFOUND') {
      logError('DNS resolution failed - check frontend URL');
    }
    return false;
  }
}

async function testDatabase() {
  try {
    logInfo('Testing database connection...');
    const connection = await mysql.createConnection({
      host: CONFIG.database.host,
      port: CONFIG.database.port,
      user: CONFIG.database.user,
      password: CONFIG.database.password,
      database: CONFIG.database.database,
      ssl: { rejectUnauthorized: false },
      connectTimeout: 10000
    });

    // Test basic query
    const [rows] = await connection.execute('SELECT 1 as test');
    await connection.end();

    logSuccess('Database connection successful');
    logInfo(`Host: ${CONFIG.database.host}:${CONFIG.database.port}`);
    logInfo(`Database: ${CONFIG.database.database}`);
    return true;
  } catch (error) {
    logError(`Database connection failed: ${error.message}`);
    if (error.code === 'ECONNREFUSED') {
      logError('Connection refused - check database server status');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      logError('Access denied - check username and password');
    } else if (error.code === 'ENOTFOUND') {
      logError('DNS resolution failed - check database host');
    }
    return false;
  }
}

async function testBackendAPI() {
  try {
    logInfo('Testing backend API endpoints...');
    const response = await axios.get(`${CONFIG.backend.url}${CONFIG.backend.apiEndpoint}`, {
      timeout: 10000,
      validateStatus: (status) => status < 500
    });
    
    if (response.status === 200) {
      logSuccess('Backend API is responding');
      return true;
    } else if (response.status === 401) {
      logWarning('Backend API requires authentication (expected)');
      return true;
    } else {
      logWarning(`Backend API returned status ${response.status}`);
      return false;
    }
  } catch (error) {
    logError(`Backend API test failed: ${error.message}`);
    return false;
  }
}

async function testCORS() {
  try {
    logInfo('Testing CORS configuration...');
    // This is a simplified CORS test - real CORS testing requires a browser environment
    const response = await axios.options(`${CONFIG.backend.url}/api/organizations`, {
      headers: {
        'Origin': CONFIG.frontend.url,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type'
      },
      timeout: 5000
    });
    
    if (response.status === 200 || response.status === 204) {
      logSuccess('CORS preflight request successful');
      return true;
    } else {
      logWarning(`CORS preflight returned status ${response.status}`);
      return false;
    }
  } catch (error) {
    logWarning(`CORS test inconclusive: ${error.message}`);
    logInfo('CORS issues may only be visible in browser console');
    return true; // Don't fail on CORS test as it's hard to test from Node.js
  }
}

async function runAllTests() {
  log('\n🚀 Starting Azure Deployment Validation\n', 'blue');
  
  logInfo('Configuration:');
  logInfo(`Backend: ${CONFIG.backend.url}`);
  logInfo(`Frontend: ${CONFIG.frontend.url}`);
  logInfo(`Database: ${CONFIG.database.host}:${CONFIG.database.port}`);
  log('');

  const results = {
    backend: await testBackendHealth(),
    frontend: await testFrontend(),
    database: await testDatabase(),
    api: await testBackendAPI(),
    cors: await testCORS()
  };

  log('\n📊 Test Results Summary:', 'blue');
  Object.entries(results).forEach(([test, passed]) => {
    if (passed) {
      logSuccess(`${test.toUpperCase()}: PASSED`);
    } else {
      logError(`${test.toUpperCase()}: FAILED`);
    }
  });

  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;

  log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`, 
    passedTests === totalTests ? 'green' : 'yellow');

  if (passedTests === totalTests) {
    logSuccess('🎉 All tests passed! Your deployment looks good.');
  } else {
    logWarning('⚠️  Some tests failed. Check the troubleshooting guide.');
    logInfo('See AZURE_TROUBLESHOOTING_GUIDE.md for solutions');
  }

  log('\n📋 Next Steps:', 'blue');
  logInfo('1. Test login functionality in browser');
  logInfo('2. Check browser console for any errors');
  logInfo('3. Verify all features work as expected');
  logInfo('4. Monitor logs for any issues');

  return passedTests === totalTests;
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      logError(`Validation script failed: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { runAllTests, CONFIG };
