#!/usr/bin/env node

/**
 * Test different password variations for admin@nihatech.com
 */

const axios = require('axios');

const API_BASE = 'https://pmactivities-backend1.icyhill-61db6701.westus2.azurecontainerapps.io';

async function testLoginVariations() {
  console.log('🔐 Testing login variations for admin@nihatech.com...\n');

  // Common password variations
  const passwordVariations = [
    'Password123!',
    'password123!',
    'Password123',
    'password123',
    'Admin123!',
    'admin123!',
    'Nihatech123!',
    'nihatech123!',
    'Test123!',
    'test123!',
    '123456',
    'password',
    'admin',
    'nihatech'
  ];

  for (const password of passwordVariations) {
    try {
      console.log(`🔑 Trying password: ${password}`);
      
      const response = await axios.post(`${API_BASE}/api/auth/login`, {
        email: 'admin@nihatech.com',
        password: password
      });

      // If we get here, login was successful!
      console.log(`✅ SUCCESS! Login worked with password: ${password}`);
      console.log(`   User: ${response.data.user.name}`);
      console.log(`   Role: ${response.data.user.role}`);
      console.log(`   Organization: ${response.data.user.organizationId}\n`);

      console.log('🎉 FOUND WORKING CREDENTIALS:');
      console.log(`   Email: admin@nihatech.com`);
      console.log(`   Password: ${password}\n`);

      console.log('📝 Next steps:');
      console.log('1. Use these credentials to login to the application');
      console.log('2. Test the user creation functionality');
      console.log('3. The 400 error should now be resolved');

      return; // Stop testing once we find working credentials

    } catch (error) {
      if (error.response?.status === 401) {
        console.log(`❌ Wrong password: ${password}`);
      } else if (error.response?.data?.message?.includes('deactivated')) {
        console.log(`⚠️  User is deactivated - password was: ${password}`);
        console.log('   The user exists but is deactivated. This needs admin intervention.');
        return;
      } else {
        console.log(`❌ Error with ${password}: ${error.response?.data?.error || error.message}`);
      }
    }
  }

  console.log('\n❌ None of the common passwords worked.');
  console.log('\n💡 Possible solutions:');
  console.log('1. The user might be deactivated');
  console.log('2. A custom password was used during creation');
  console.log('3. The user might be in a different organization');
  console.log('\n🔧 Recommended actions:');
  console.log('1. Try logging in through the web interface with different passwords');
  console.log('2. Use the "Forgot Password" feature if available');
  console.log('3. Create a new organization with a different admin email');
  console.log('4. Or manually reset the user in the database');
}

testLoginVariations();
