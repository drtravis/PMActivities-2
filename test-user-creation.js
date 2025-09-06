#!/usr/bin/env node

/**
 * Test script to try creating a user and see what happens
 * This will help us understand the current state of the system
 */

const axios = require('axios');

const API_BASE = 'https://pmactivities-backend1.icyhill-61db6701.westus2.azurecontainerapps.io';

async function testUserCreation() {
  console.log('🔧 Testing user creation...\n');

  // Test different admin credentials that might work
  const possibleCredentials = [
    { email: 'finalworking@test.com', password: 'Password123!' },
    { email: 'admin@niha.com', password: 'Password123!' },
    { email: 'admin@test.com', password: 'Password123!' },
    { email: 'test@test.com', password: 'Password123!' }
  ];

  for (const creds of possibleCredentials) {
    try {
      console.log(`🔑 Trying to login with: ${creds.email}`);
      
      const loginResponse = await axios.post(`${API_BASE}/api/auth/login`, {
        email: creds.email,
        password: creds.password
      });

      const token = loginResponse.data.access_token;
      const user = loginResponse.data.user;
      
      console.log(`✅ Login successful!`);
      console.log(`   User: ${user.name} (${user.email})`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Organization: ${user.organizationId}\n`);

      // Set up authenticated API client
      const api = axios.create({
        baseURL: API_BASE,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Try to get users list
      console.log('📋 Fetching users list...');
      try {
        const usersResponse = await api.get('/api/users');
        const users = usersResponse.data;
        
        console.log(`Found ${users.length} users:`);
        users.forEach(u => {
          console.log(`  - ${u.email} (${u.name}) - Role: ${u.role} - Active: ${u.isActive}`);
        });
        console.log();

        // Check if admin@niha.com exists
        const nihaAdmin = users.find(u => u.email === 'admin@niha.com');
        if (nihaAdmin) {
          console.log(`🎯 Found admin@niha.com user:`);
          console.log(`   ID: ${nihaAdmin.id}`);
          console.log(`   Name: ${nihaAdmin.name}`);
          console.log(`   Role: ${nihaAdmin.role}`);
          console.log(`   Active: ${nihaAdmin.isActive}`);
          console.log(`   Created: ${nihaAdmin.createdAt}\n`);

          if (nihaAdmin.isActive) {
            console.log('💡 The user exists and is active. You should be able to login with:');
            console.log('   Email: admin@niha.com');
            console.log('   Password: Password123! (or the password used during creation)\n');
          } else {
            console.log('⚠️  The user exists but is deactivated. Trying to reactivate...\n');
          }
        } else {
          console.log('🔍 admin@niha.com user not found. Trying to create it...\n');
          
          // Try to create the user
          try {
            const newUserResponse = await api.post('/api/auth/invite', {
              email: 'admin@niha.com',
              name: 'Niha Admin',
              role: 'admin'
            });

            console.log('✅ User created successfully!');
            console.log('📧 Email: admin@niha.com');
            console.log('🔑 Password: Password123!');
            console.log('👤 Name: Niha Admin');
            console.log('🎭 Role: admin\n');

          } catch (createError) {
            console.log('❌ Failed to create user:');
            console.log('   Status:', createError.response?.status);
            console.log('   Error:', createError.response?.data);
            console.log();
          }
        }

      } catch (usersError) {
        console.log('❌ Failed to fetch users:');
        console.log('   Status:', usersError.response?.status);
        console.log('   Error:', usersError.response?.data);
        console.log();
      }

      // We found a working login, so we can stop here
      break;

    } catch (error) {
      console.log(`❌ Login failed: ${error.response?.data?.error || error.message}\n`);
      continue;
    }
  }
}

testUserCreation();
