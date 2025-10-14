const axios = require('axios');

async function testBackend() {
  try {
    console.log('🔍 Testing backend connection...');
    
    // Test 1: Check if backend is running
    const healthResponse = await axios.get('http://localhost:3000/health');
    console.log('✅ Backend health check:', healthResponse.data);
    
    // Test 2: Try to login
    console.log('\n🔍 Testing login...');
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      email: 'admin@smdvital.com',
      password: 'Admin123!'
    });
    
    console.log('✅ Login successful:', {
      success: loginResponse.data.success,
      user: loginResponse.data.data?.user?.email,
      hasToken: !!loginResponse.data.data?.accessToken
    });
    
    const token = loginResponse.data.data?.accessToken;
    
    if (token) {
      // Test 3: Try to get users with token
      console.log('\n🔍 Testing users API with token...');
      const usersResponse = await axios.get('http://localhost:3000/api/v1/admin-panel/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ Users API response:', {
        success: usersResponse.data.success,
        totalUsers: usersResponse.data.data?.pagination?.total,
        usersCount: usersResponse.data.data?.data?.length
      });
      
      // Test 4: Try to get doctors with token
      console.log('\n🔍 Testing doctors API with token...');
      const doctorsResponse = await axios.get('http://localhost:3000/api/v1/admin-panel/doctors', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ Doctors API response:', {
        success: doctorsResponse.data.success,
        totalDoctors: doctorsResponse.data.data?.pagination?.total,
        doctorsCount: doctorsResponse.data.data?.doctors?.length
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing backend:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

testBackend();
