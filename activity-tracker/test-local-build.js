#!/usr/bin/env node

/**
 * Local Development Build Test
 * Tests if the enhanced configuration works with your local setup
 */

const fs = require('fs');
const path = require('path');

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

function checkEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');
  
  if (!fs.existsSync(envPath)) {
    logError('.env file not found in project root');
    return false;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'NODE_ENV',
    'DB_HOST',
    'DB_USERNAME', 
    'DB_NAME',
    'NEXT_PUBLIC_API_URL',
    'JWT_SECRET'
  ];

  const missingVars = [];
  requiredVars.forEach(varName => {
    if (!envContent.includes(`${varName}=`)) {
      missingVars.push(varName);
    }
  });

  if (missingVars.length > 0) {
    logWarning(`Missing environment variables: ${missingVars.join(', ')}`);
    logInfo('These will use default values in development mode');
  } else {
    logSuccess('All required environment variables found in .env');
  }

  // Check database name
  if (envContent.includes('DB_NAME=PMActivity2')) {
    logSuccess('Database name matches local setup (PMActivity2)');
  } else if (envContent.includes('DB_NAME=pmactivities')) {
    logWarning('Database name is set to "pmactivities" - may need to be "PMActivity2" for local development');
  }

  return true;
}

function checkPackageJson() {
  const backendPackagePath = path.join(__dirname, 'backend', 'package.json');
  const frontendPackagePath = path.join(__dirname, 'frontend', 'package.json');

  let allGood = true;

  // Check backend package.json
  if (fs.existsSync(backendPackagePath)) {
    const backendPackage = JSON.parse(fs.readFileSync(backendPackagePath, 'utf8'));
    
    if (backendPackage.scripts && backendPackage.scripts.postinstall) {
      logSuccess('Backend has postinstall script for Azure deployment');
    }

    if (backendPackage.engines && backendPackage.engines.node) {
      logSuccess(`Backend specifies Node.js version: ${backendPackage.engines.node}`);
    }
  } else {
    logError('Backend package.json not found');
    allGood = false;
  }

  // Check frontend package.json
  if (fs.existsSync(frontendPackagePath)) {
    const frontendPackage = JSON.parse(fs.readFileSync(frontendPackagePath, 'utf8'));
    
    if (frontendPackage.scripts && frontendPackage.scripts.postinstall) {
      logSuccess('Frontend has postinstall script for Azure deployment');
    }

    if (frontendPackage.engines && frontendPackage.engines.node) {
      logSuccess(`Frontend specifies Node.js version: ${frontendPackage.engines.node}`);
    }
  } else {
    logError('Frontend package.json not found');
    allGood = false;
  }

  return allGood;
}

function checkConfigFiles() {
  const configFiles = [
    'backend/src/config/environment.config.ts',
    'backend/src/utils/connection-test.ts',
    'backend/web.config',
    'frontend/web.config'
  ];

  let allGood = true;

  configFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      logSuccess(`Configuration file exists: ${file}`);
    } else {
      logError(`Configuration file missing: ${file}`);
      allGood = false;
    }
  });

  return allGood;
}

function checkLocalCompatibility() {
  logInfo('Checking local development compatibility...');

  // Check if enhanced backend config is compatible
  const mainTsPath = path.join(__dirname, 'backend', 'src', 'main.ts');
  if (fs.existsSync(mainTsPath)) {
    const mainTsContent = fs.readFileSync(mainTsPath, 'utf8');
    
    if (mainTsContent.includes('localhost:3000') && mainTsContent.includes('localhost:3001')) {
      logSuccess('Backend CORS includes localhost origins for development');
    } else {
      logWarning('Backend CORS may not include all localhost origins');
    }
  }

  // Check frontend API configuration
  const apiTsPath = path.join(__dirname, 'frontend', 'src', 'lib', 'api.ts');
  if (fs.existsSync(apiTsPath)) {
    const apiTsContent = fs.readFileSync(apiTsPath, 'utf8');
    
    if (apiTsContent.includes('localhost:3001')) {
      logSuccess('Frontend API client configured for local development');
    } else {
      logWarning('Frontend API client may not be configured for localhost');
    }
  }
}

function runLocalBuildTest() {
  log('\n🧪 Testing Local Development Build Compatibility\n', 'blue');

  const results = {
    envFile: checkEnvFile(),
    packageJson: checkPackageJson(),
    configFiles: checkConfigFiles()
  };

  checkLocalCompatibility();

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
    logSuccess('🎉 Your local development setup should work with the enhanced configuration!');
    log('\n📋 To test locally:', 'blue');
    logInfo('1. cd activity-tracker/backend && npm run start:dev');
    logInfo('2. cd activity-tracker/frontend && npm run dev');
    logInfo('3. Check http://localhost:3000 and http://localhost:3001/health');
  } else {
    logWarning('⚠️  Some compatibility issues detected.');
    log('\n🔧 Recommendations:', 'blue');
    logInfo('1. Ensure your .env file has all required variables');
    logInfo('2. Check that your local database is named "PMActivity2"');
    logInfo('3. Verify your local MySQL is running on port 3306');
    logInfo('4. Test the build before deploying to Azure');
  }

  log('\n💡 Additional Notes:', 'blue');
  logInfo('- Enhanced logging will show more details during startup');
  logInfo('- CORS configuration now supports multiple origins');
  logInfo('- Environment validation is relaxed in development mode');
  logInfo('- All Azure-specific features are disabled in development');

  return passedTests === totalTests;
}

// Run tests if this script is executed directly
if (require.main === module) {
  try {
    const success = runLocalBuildTest();
    process.exit(success ? 0 : 1);
  } catch (error) {
    logError(`Test script failed: ${error.message}`);
    process.exit(1);
  }
}

module.exports = { runLocalBuildTest };
