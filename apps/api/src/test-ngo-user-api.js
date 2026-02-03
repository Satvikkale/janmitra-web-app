/**
 * NGO User Registration & Login Testing Guide
 * 
 * IMPORTANT: Before testing NGO User registration, ensure that:
 * 1. The NGO is registered in the system
 * 2. The NGO is verified/approved by admin (isVerified: true)
 * 
 * Steps to test:
 * 1. First register an NGO through /auth/register-ngo
 * 2. Admin approves the NGO (sets isVerified: true)
 * 3. Then NGO users can register using that NGO name
 */

// Step 1: Get available verified NGOs
// curl -X GET http://localhost:3001/auth/available-ngos

// Step 2: Register NGO User (will fail if NGO doesn't exist or not verified)
// curl -X POST http://localhost:3001/auth/register-ngo-user \
//   -H "Content-Type: application/json" \
//   -d '{
//     "ngoName": "Green Earth Foundation",
//     "name": "Rajesh Kumar",
//     "position": "Field Coordinator", 
//     "mobileNo": "9876543210",
//     "password": "password123"
//   }'

// Step 3: Login NGO User
// curl -X POST http://localhost:3001/auth/login \
//   -H "Content-Type: application/json" \
//   -d '{
//     "identifier": "Rajesh Kumar",
//     "password": "password123",
//     "userType": "ngo-user",
//     "ngoName": "Green Earth Foundation"
//   }'

console.log('✅ NGO User Validation System:');
console.log('- NGO users can only register if their NGO exists and is verified');
console.log('- Registration dropdown shows only verified NGOs');
console.log('- Login requires NGO name + user name + password');
console.log('');
console.log('📋 Test Endpoints:');
console.log('1. GET /auth/available-ngos - Get verified NGOs');
console.log('2. POST /auth/register-ngo-user - Register NGO user');
console.log('3. POST /auth/login - Login with NGO user credentials');