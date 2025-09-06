#!/usr/bin/env node

/**
 * Script to create a fresh organization with admin@nihatech.com
 * This will bypass any existing user issues
 */

const axios = require('axios');

const API_BASE = 'https://pmactivities-backend1.icyhill-61db6701.westus2.azurecontainerapps.io';

async function createFreshOrganization() {
  console.log('🏢 Creating fresh organization for Nihatech...\n');

  try {
    // Create a new organization with admin@nihatech.com as admin
    console.log('🔧 Creating organization...');
    const response = await axios.post(`${API_BASE}/api/auth/create-organization`, {
      organizationName: 'Nihatech Solutions',
      adminEmail: 'admin@nihatech.com',
      adminName: 'Nihatech Admin',
      adminPassword: 'Password123!'
    });

    console.log('✅ Organization created successfully!');
    console.log('🏢 Organization: Nihatech Solutions');
    console.log('👤 Admin User: Nihatech Admin');
    console.log('📧 Email: admin@nihatech.com');
    console.log('🔑 Password: Password123!');
    console.log('🎭 Role: admin\n');

    // The response should include an access token for auto-login
    if (response.data.access_token) {
      console.log('🎯 Auto-login token received!');
      console.log('✅ You should now be able to login immediately\n');

      // Test the login to verify
      console.log('🔍 Verifying login...');
      const loginTest = await axios.post(`${API_BASE}/api/auth/login`, {
        email: 'admin@nihatech.com',
        password: 'Password123!'
      });

      console.log('✅ Login verification successful!');
      console.log(`   User: ${loginTest.data.user.name}`);
      console.log(`   Role: ${loginTest.data.user.role}`);
      console.log(`   Organization: ${loginTest.data.user.organizationId}\n`);

      console.log('🎉 SUCCESS! Everything is ready:');
      console.log('1. Go to the application');
      console.log('2. Login with: admin@nihatech.com / Password123!');
      console.log('3. You should now be able to create users without 400 errors');
      console.log('4. The user creation functionality should work properly\n');

    } else {
      console.log('⚠️  No auto-login token received, but organization was created.');
      console.log('Try logging in manually with the credentials above.\n');
    }

  } catch (error) {
    console.log('❌ Error creating organization:');
    console.log('   Status:', error.response?.status);
    console.log('   Error:', error.response?.data);

    if (error.response?.data?.message?.includes('already exists')) {
      console.log('\n💡 Organization or user already exists. This means:');
      console.log('1. The admin@nihatech.com user already exists');
      console.log('2. Try logging in with: admin@nihatech.com / Password123!');
      console.log('3. If login fails, the password might be different');
      console.log('4. Or the user might be in a different organization\n');

      // Try to login anyway
      console.log('🔍 Trying to login with existing credentials...');
      try {
        const loginTest = await axios.post(`${API_BASE}/api/auth/login`, {
          email: 'admin@nihatech.com',
          password: 'Password123!'
        });

        console.log('✅ Login successful with existing user!');
        console.log(`   User: ${loginTest.data.user.name}`);
        console.log(`   Role: ${loginTest.data.user.role}\n`);
        console.log('🎉 You can proceed with using the existing account!');

      } catch (loginError) {
        console.log('❌ Login failed with existing user');
        console.log('💡 The user exists but password might be different');
        console.log('   Try different passwords or contact system admin\n');
      }
    }
  }
}

createFreshOrganization();
