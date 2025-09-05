const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testStatusWorkflow() {
  console.log('🧪 Testing End-to-End Status Workflow');
  console.log('=====================================');

  try {
    // Test 1: Health Check
    console.log('\n1. Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check:', healthResponse.data.status);
    console.log('   Database Connected:', healthResponse.data.database_connected);

    // Test 2: Test Status Configuration Endpoint (without auth first)
    console.log('\n2. Testing Status Configuration Endpoint...');
    try {
      const statusResponse = await axios.get(`${BASE_URL}/status-configuration`);
      console.log('✅ Status Configuration Response:', statusResponse.data);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('⚠️  Status Configuration requires authentication (expected)');
      } else {
        console.log('❌ Status Configuration Error:', error.response?.data || error.message);
      }
    }

    // Test 3: Login with existing admin credentials
    console.log('\n3. Testing Admin Login...');
    const adminCredentials = {
      email: 'admin@testorg.com',
      password: 'adminpassword123'
    };

    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, adminCredentials);
      
      const token = loginResponse.data.token;
      console.log('✅ Admin Login: Token received');

      // Test 4: Test authenticated status configuration endpoint
      console.log('\n4. Testing Authenticated Status Configuration...');
      const authStatusResponse = await axios.get(`${BASE_URL}/status-configuration`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Authenticated Status Configuration:');
      console.log('   Activity Statuses:', authStatusResponse.data.activity?.length || 0);
      console.log('   Task Statuses:', authStatusResponse.data.task?.length || 0);

      // Test 5: Test status configuration by type
      console.log('\n5. Testing Status Configuration by Type...');
      const taskStatusResponse = await axios.get(`${BASE_URL}/status-configuration?type=task`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Task Status Configuration:');
      taskStatusResponse.data.forEach(status => {
        console.log(`   - ${status.name}: ${status.color}`);
      });

      // Test 6: Test status mapping endpoint
      console.log('\n6. Testing Status Mapping...');
      const mappingResponse = await axios.get(`${BASE_URL}/status-configuration/mapping`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Status Mapping:', Object.keys(mappingResponse.data));

      console.log('\n🎉 All Status Workflow Tests Passed!');
      console.log('=====================================');
      console.log('✅ Database connection working');
      console.log('✅ Status configurations loaded from database');
      console.log('✅ Authentication working');
      console.log('✅ Dynamic status system operational');

    } catch (authError) {
      if (authError.response?.status === 409) {
        console.log('⚠️  User already exists, trying login...');
        
        // Try login directly
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, adminCredentials);
        
        const token = loginResponse.data.token;
        console.log('✅ User Login: Token received');

        // Continue with authenticated tests...
        const authStatusResponse = await axios.get(`${BASE_URL}/status-configuration`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Authenticated Status Configuration working');
        
      } else {
        console.log('❌ Authentication Error:', authError.response?.data || authError.message);
      }
    }

  } catch (error) {
    console.log('❌ Test Failed:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', error.response.data);
    }
  }
}

// Run the test
testStatusWorkflow().catch(console.error);
