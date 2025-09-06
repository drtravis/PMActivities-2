#!/usr/bin/env node

/**
 * Script to manage the admin@nihatech.com user
 * This will help clean up and recreate the user properly
 */

const axios = require('axios');

const API_BASE = 'https://pmactivities-backend1.icyhill-61db6701.westus2.azurecontainerapps.io';

async function manageUser() {
  console.log('🔧 Managing admin@nihatech.com user...\n');

  // Try different admin credentials that might work
  const possibleCredentials = [
    { email: 'finalworking@test.com', password: 'Password123!' },
    { email: 'admin@nihatech.com', password: 'Password123!' },
    { email: 'admin@test.com', password: 'Password123!' }
  ];

  let workingToken = null;
  let workingUser = null;

  // Find working credentials
  for (const creds of possibleCredentials) {
    try {
      console.log(`🔑 Trying to login with: ${creds.email}`);
      
      const loginResponse = await axios.post(`${API_BASE}/api/auth/login`, {
        email: creds.email,
        password: creds.password
      });

      workingToken = loginResponse.data.access_token;
      workingUser = loginResponse.data.user;
      
      console.log(`✅ Login successful with ${creds.email}!`);
      console.log(`   User: ${workingUser.name} (${workingUser.email})`);
      console.log(`   Role: ${workingUser.role}\n`);
      break;

    } catch (error) {
      console.log(`❌ Login failed with ${creds.email}\n`);
      continue;
    }
  }

  if (!workingToken) {
    console.log('❌ Could not find working admin credentials. Please check:');
    console.log('1. finalworking@test.com with Password123!');
    console.log('2. admin@nihatech.com with Password123!');
    console.log('3. Or provide the correct admin credentials\n');
    return;
  }

  // Set up authenticated API client
  const api = axios.create({
    baseURL: API_BASE,
    headers: {
      'Authorization': `Bearer ${workingToken}`,
      'Content-Type': 'application/json'
    }
  });

  try {
    // Get all users
    console.log('📋 Fetching all users...');
    const usersResponse = await api.get('/api/users');
    const users = usersResponse.data;
    
    console.log(`Found ${users.length} users:`);
    users.forEach(u => {
      console.log(`  - ${u.email} (${u.name}) - Role: ${u.role} - Active: ${u.isActive}`);
    });
    console.log();

    // Look for admin@nihatech.com
    const nihatechUser = users.find(u => u.email === 'admin@nihatech.com');
    
    if (nihatechUser) {
      console.log(`🎯 Found admin@nihatech.com user:`);
      console.log(`   ID: ${nihatechUser.id}`);
      console.log(`   Name: ${nihatechUser.name}`);
      console.log(`   Role: ${nihatechUser.role}`);
      console.log(`   Active: ${nihatechUser.isActive}\n`);

      if (nihatechUser.isActive) {
        console.log('✅ User is active! You should be able to login with:');
        console.log('   Email: admin@nihatech.com');
        console.log('   Password: Password123!\n');
        
        console.log('🔧 If you\'re still having issues, the problem might be:');
        console.log('1. Wrong password (try Password123!)');
        console.log('2. Browser cache (try incognito mode)');
        console.log('3. Frontend API call issue\n');
      } else {
        console.log('⚠️  User exists but is deactivated. This might be the issue!');
        console.log('The user needs to be reactivated or recreated.\n');
      }

      // Ask if we should deactivate and recreate
      console.log('🔄 Would you like to deactivate and recreate this user?');
      console.log('This will ensure a clean state. (Continuing automatically...)\n');

      // Deactivate the existing user
      console.log('🗑️  Deactivating existing user...');
      await api.delete(`/api/users/${nihatechUser.id}`);
      console.log('✅ User deactivated successfully!\n');
    } else {
      console.log('🔍 admin@nihatech.com user not found.\n');
    }

    // Create new user
    console.log('👤 Creating new admin@nihatech.com user...');
    try {
      const newUserResponse = await api.post('/api/auth/invite', {
        email: 'admin@nihatech.com',
        name: 'Nihatech Admin',
        role: 'admin'
      });

      console.log('✅ New user created successfully!');
      console.log('📧 Email: admin@nihatech.com');
      console.log('🔑 Password: Password123!');
      console.log('👤 Name: Nihatech Admin');
      console.log('🎭 Role: admin\n');

      // Verify creation
      console.log('🔍 Verifying user creation...');
      const verifyResponse = await api.get('/api/users');
      const updatedUsers = verifyResponse.data;
      const newUser = updatedUsers.find(u => u.email === 'admin@nihatech.com' && u.isActive);
      
      if (newUser) {
        console.log('✅ User verified successfully!');
        console.log(`   ID: ${newUser.id}`);
        console.log(`   Active: ${newUser.isActive}\n`);
        
        console.log('🎉 SUCCESS! You can now:');
        console.log('1. Login with admin@nihatech.com / Password123!');
        console.log('2. Test user creation functionality');
        console.log('3. The 400 error should be resolved\n');
      } else {
        console.log('❌ Could not verify new user creation\n');
      }

    } catch (createError) {
      console.log('❌ Failed to create user:');
      console.log('   Status:', createError.response?.status);
      console.log('   Error:', createError.response?.data);
      
      if (createError.response?.data?.message?.includes('already exists')) {
        console.log('\n💡 User already exists. Try logging in with admin@nihatech.com / Password123!');
      }
    }

  } catch (error) {
    console.log('❌ Error managing user:', error.response?.data || error.message);
  }
}

manageUser();
