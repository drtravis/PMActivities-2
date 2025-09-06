#!/usr/bin/env node

/**
 * Script to clean up and recreate the admin@niha.com user
 * This script will:
 * 1. Login as finalworking@test.com (working admin)
 * 2. Find and deactivate admin@niha.com
 * 3. Create a new admin user with correct details
 */

const axios = require('axios');

const API_BASE = 'https://pmactivities-backend1.icyhill-61db6701.westus2.azurecontainerapps.io';

async function main() {
  try {
    console.log('🔧 Starting user cleanup and recreation...\n');

    // Step 1: Login as the working admin user
    console.log('1️⃣ Logging in as finalworking@test.com...');
    const loginResponse = await axios.post(`${API_BASE}/api/auth/login`, {
      email: 'finalworking@test.com',
      password: 'Password123!'
    });

    const token = loginResponse.data.access_token;
    console.log('✅ Login successful!\n');

    // Set up authenticated API client
    const api = axios.create({
      baseURL: API_BASE,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Step 2: Get all users to find admin@niha.com
    console.log('2️⃣ Fetching all users...');
    const usersResponse = await api.get('/api/users');
    const users = usersResponse.data;
    
    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.name}) - Role: ${user.role} - Active: ${user.isActive}`);
    });

    // Find the problematic user
    const problemUser = users.find(user => user.email === 'admin@niha.com');
    
    if (problemUser) {
      console.log(`\n3️⃣ Found problematic user: ${problemUser.email} (ID: ${problemUser.id})`);
      
      // Step 3: Deactivate the user
      console.log('Deactivating user...');
      await api.delete(`/api/users/${problemUser.id}`);
      console.log('✅ User deactivated successfully!\n');
    } else {
      console.log('\n3️⃣ User admin@niha.com not found (may already be removed)\n');
    }

    // Step 4: Create new admin user
    console.log('4️⃣ Creating new admin user...');
    const newUserResponse = await api.post('/api/auth/invite', {
      email: 'admin@niha.com',
      name: 'Niha Admin',
      role: 'admin'
    });

    console.log('✅ New admin user created successfully!');
    console.log('📧 Email: admin@niha.com');
    console.log('🔑 Password: Password123!');
    console.log('👤 Name: Niha Admin');
    console.log('🎭 Role: admin\n');

    // Step 5: Verify the new user
    console.log('5️⃣ Verifying new user creation...');
    const updatedUsersResponse = await api.get('/api/users');
    const updatedUsers = updatedUsersResponse.data;
    
    const newUser = updatedUsers.find(user => user.email === 'admin@niha.com' && user.isActive);
    if (newUser) {
      console.log('✅ New user verified successfully!');
      console.log(`   ID: ${newUser.id}`);
      console.log(`   Name: ${newUser.name}`);
      console.log(`   Role: ${newUser.role}`);
      console.log(`   Active: ${newUser.isActive}\n`);
    } else {
      console.log('❌ Could not verify new user creation\n');
    }

    console.log('🎉 User cleanup and recreation completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Try logging in with: admin@niha.com / Password123!');
    console.log('2. Test user creation functionality');
    console.log('3. Change password after first login if needed');

  } catch (error) {
    console.error('❌ Error during user cleanup:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Tip: Make sure finalworking@test.com is still active and the password is correct');
    } else if (error.response?.status === 400) {
      console.log('\n💡 Tip: The user might already exist or there might be a validation error');
      console.log('Error details:', error.response.data);
    }
  }
}

// Run the script
main();
