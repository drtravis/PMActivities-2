#!/usr/bin/env node

/**
 * Configuration Validator
 * Validates that all required configuration is properly set
 */

const fs = require('fs');
const path = require('path');

// Colors for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function validateEnvironmentFile() {
  const envPath = path.join(process.cwd(), '.env');
  
  if (!fs.existsSync(envPath)) {
    log('red', '❌ .env file not found');
    log('yellow', '💡 Run: cp .env.local .env');
    return false;
  }
  
  log('green', '✅ .env file exists');
  
  // Read and validate environment variables
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'NODE_ENV',
    'BACKEND_PORT',
    'FRONTEND_PORT',
    'DB_HOST',
    'DB_PORT',
    'DB_USERNAME',
    'DB_PASSWORD',
    'DB_NAME',
    'NEXT_PUBLIC_API_URL',
    'JWT_SECRET'
  ];
  
  const missingVars = [];
  
  for (const varName of requiredVars) {
    if (!envContent.includes(`${varName}=`)) {
      missingVars.push(varName);
    }
  }
  
  if (missingVars.length > 0) {
    log('red', `❌ Missing environment variables: ${missingVars.join(', ')}`);
    return false;
  }
  
  log('green', '✅ All required environment variables are present');
  return true;
}

function validateConfigFiles() {
  const configFiles = [
    'config/app.config.js',
    'activity-tracker/frontend/src/config/app.config.ts'
  ];
  
  let allValid = true;
  
  for (const configFile of configFiles) {
    const configPath = path.join(process.cwd(), configFile);
    
    if (!fs.existsSync(configPath)) {
      log('red', `❌ Configuration file not found: ${configFile}`);
      allValid = false;
    } else {
      log('green', `✅ Configuration file exists: ${configFile}`);
    }
  }
  
  return allValid;
}

function validateDockerSetup() {
  const dockerComposePath = path.join(process.cwd(), 'docker-compose.local.yml');
  
  if (!fs.existsSync(dockerComposePath)) {
    log('red', '❌ docker-compose.local.yml not found');
    return false;
  }
  
  log('green', '✅ Docker Compose configuration exists');
  return true;
}

function validateDirectoryStructure() {
  const requiredDirs = [
    'activity-tracker/backend',
    'activity-tracker/frontend',
    'config',
    'scripts',
    'database/init'
  ];
  
  let allValid = true;
  
  for (const dir of requiredDirs) {
    const dirPath = path.join(process.cwd(), dir);
    
    if (!fs.existsSync(dirPath)) {
      log('red', `❌ Directory not found: ${dir}`);
      allValid = false;
    } else {
      log('green', `✅ Directory exists: ${dir}`);
    }
  }
  
  return allValid;
}

function validatePackageFiles() {
  const packageFiles = [
    'activity-tracker/backend/package.json',
    'activity-tracker/frontend/package.json'
  ];
  
  let allValid = true;
  
  for (const packageFile of packageFiles) {
    const packagePath = path.join(process.cwd(), packageFile);
    
    if (!fs.existsSync(packagePath)) {
      log('red', `❌ Package file not found: ${packageFile}`);
      allValid = false;
    } else {
      try {
        const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        
        if (packageFile.includes('backend')) {
          // Check for required backend dependencies
          const requiredDeps = ['mysql2', '@nestjs/typeorm', 'typeorm'];
          const missing = requiredDeps.filter(dep => !packageContent.dependencies[dep]);
          
          if (missing.length > 0) {
            log('red', `❌ Backend missing dependencies: ${missing.join(', ')}`);
            allValid = false;
          } else {
            log('green', `✅ Backend dependencies are valid`);
          }
        }
        
        if (packageFile.includes('frontend')) {
          // Check for required frontend dependencies
          const requiredDeps = ['next', 'react', 'axios'];
          const missing = requiredDeps.filter(dep => !packageContent.dependencies[dep]);
          
          if (missing.length > 0) {
            log('red', `❌ Frontend missing dependencies: ${missing.join(', ')}`);
            allValid = false;
          } else {
            log('green', `✅ Frontend dependencies are valid`);
          }
        }
        
      } catch (error) {
        log('red', `❌ Invalid JSON in ${packageFile}`);
        allValid = false;
      }
    }
  }
  
  return allValid;
}

function main() {
  log('blue', '🔍 Validating PMActivities2 Configuration...');
  log('blue', '================================================');
  
  const validations = [
    { name: 'Environment File', fn: validateEnvironmentFile },
    { name: 'Configuration Files', fn: validateConfigFiles },
    { name: 'Docker Setup', fn: validateDockerSetup },
    { name: 'Directory Structure', fn: validateDirectoryStructure },
    { name: 'Package Files', fn: validatePackageFiles }
  ];
  
  let allValid = true;
  
  for (const validation of validations) {
    log('blue', `\n📋 Checking ${validation.name}...`);
    const isValid = validation.fn();
    allValid = allValid && isValid;
  }
  
  log('blue', '\n================================================');
  
  if (allValid) {
    log('green', '🎉 All validations passed! Your setup is ready.');
    log('blue', '\n🚀 Next steps:');
    log('blue', '   1. Run: ./scripts/start-local.sh (or scripts\\start-local.bat on Windows)');
    log('blue', '   2. Start backend: cd activity-tracker/backend && npm run start:dev');
    log('blue', '   3. Start frontend: cd activity-tracker/frontend && npm run dev');
  } else {
    log('red', '❌ Some validations failed. Please fix the issues above.');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  validateEnvironmentFile,
  validateConfigFiles,
  validateDockerSetup,
  validateDirectoryStructure,
  validatePackageFiles
};
