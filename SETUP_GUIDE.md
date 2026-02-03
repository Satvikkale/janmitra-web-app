# 🚀 NGO Management System - Setup & Troubleshooting Guide

## 🔧 Quick Setup Instructions

### 1. Start the Database
Make sure MongoDB is running on your system.

### 2. Setup API Server
```bash
cd apps/api

# Install dependencies (if not done)
pnpm install

# Create admin user (REQUIRED)
pnpm run seed:admin

# Create test NGO data (OPTIONAL)
pnpm run seed:ngos

# Start the API server
pnpm run start:dev
```

### 3. Setup Web Application
```bash
cd apps/web

# Install dependencies (if not done) 
pnpm install

# Start the web server
pnpm run dev
```

### 4. Access the Application
- **Web App**: http://localhost:3000
- **API**: http://localhost:4000
- **API Docs**: http://localhost:4000/docs

## 🔐 Login Credentials

### Admin User (Created by seed:admin)
- **Email**: `admin@janmitra.com`
- **Password**: `admin123`
- **User Type**: Admin

### Test NGO Users (Created by seed:ngos)
- **Password**: `ngo123` (for all test NGOs)
- **User Type**: NGO
- **Emails**: 
  - `contact@hopefoundation.org`
  - `info@educationfirst.org`
  - `contact@greenearth.org`
  - `support@womenempowerment.org`
  - `info@ruraldevtrust.org`

## 🎯 How to Access NGO Management

1. **Login as Admin**:
   - Go to http://localhost:3000/auth/login
   - Select "Admin" user type
   - Use admin credentials above

2. **Navigate to NGO Management**:
   - Click "Admin" in the navbar OR go to `/admin-dashboard`
   - Click the "Manage NGOs" card
   - You'll see the NGO management interface

3. **Manage NGOs**:
   - Switch between "Pending" and "Verified" tabs
   - Verify or reject pending NGOs
   - View detailed NGO information

## 🛠 Troubleshooting Common Issues

### Issue: "401 Unauthorized" Error

**Cause**: Not logged in or token expired
**Solutions**:
1. Make sure you're logged in as an admin user
2. Check if you selected "Admin" user type during login
3. Try logging out and logging back in
4. Clear browser local storage and login again

### Issue: "Failed to fetch NGO data"

**Cause**: API server not running or connection issues
**Solutions**:
1. Ensure API server is running on port 4000
2. Check if MongoDB is running
3. Verify the API endpoint is accessible: http://localhost:4000/v1/orgs/ngos
4. Check browser console for detailed error messages

### Issue: "No NGOs found"

**Cause**: No NGO data in database
**Solutions**:
1. Run the NGO seed script: `pnpm run seed:ngos` (in apps/api)
2. Check if the database is properly connected
3. Verify MongoDB has the `orgs` collection with NGO data

### Issue: Login Page Errors

**Cause**: Incorrect API endpoint or server issues
**Solutions**:
1. Ensure `.env.local` has correct API URL: `NEXT_PUBLIC_API_BASE=http://localhost:4000/v1`
2. Verify API server is running
3. Check API server logs for authentication errors

## 🔍 Debugging Steps

### 1. Check API Server Status
```bash
curl http://localhost:4000/v1/auth/login
# Should return method not allowed (405) - means server is running
```

### 2. Check Database Connection
```bash
# In API server terminal, look for:
# "API http://localhost:4000" - means server started
# MongoDB connection logs
```

### 3. Test Admin Login via API
```bash
curl -X POST http://localhost:4000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin@janmitra.com","password":"admin123","userType":"admin"}'
```

### 4. Check Browser Storage
1. Open browser dev tools (F12)
2. Go to Application/Storage tab
3. Check Local Storage for:
   - `jm_access` (JWT token)
   - `jm_refresh` (refresh token)
   - `userData` (user information)
   - `userType` (admin/ngo)

## 📊 System Architecture

```
Frontend (Next.js - Port 3000)
    ↓ HTTP Requests
API Server (NestJS - Port 4000)
    ↓ Database Queries
MongoDB Database
    ↓ Collections
    - users (admin users)
    - orgs (NGO data)
```

## 🔐 Authentication Flow

1. User login → API generates JWT tokens
2. Tokens stored in browser localStorage
3. API calls include Bearer token in Authorization header
4. API validates JWT and role permissions
5. Auto-refresh on token expiry

## 📋 Database Schema

### Users Collection (Admin Users)
```typescript
{
  name: string,
  email: string,
  phone: string,
  passwordHash: string,
  roles: ['admin', 'platform_admin']
}
```

### Orgs Collection (NGO Data)
```typescript
{
  name: string,
  type: 'NGO',
  subtype: string,
  city: string,
  categories: string[],
  contactPersonName: string,
  contactEmail: string,
  contactPhone: string,
  address: string,
  registrationNumber: string,
  establishedYear: number,
  website: string,
  isVerified: boolean,
  passwordHash: string,
  roles: ['ngo']
}
```

## 🚑 Emergency Reset

If everything is broken, run these commands:

```bash
# Stop all servers
# Clear browser local storage manually

# Restart API server
cd apps/api
pnpm run start:dev

# In another terminal, recreate admin user
pnpm run seed:admin

# Restart web server
cd apps/web
pnpm run dev

# Login again with admin@janmitra.com / admin123
```

## 📝 Environment Variables

### apps/web/.env.local
```
NEXT_PUBLIC_API_BASE=http://localhost:4000/v1
```

### apps/api/.env (if needed)
```
JWT_SECRET=your_jwt_secret_here
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=7d
MONGODB_URI=mongodb://localhost:27017/janmitra
PORT=4000
```

## 🎉 Success Indicators

You know everything is working when:
- ✅ Admin login works
- ✅ NGO management page loads without errors
- ✅ You can see pending and verified NGOs
- ✅ Verify/Reject actions work
- ✅ No 401 errors in browser console

## 📞 Need Help?

If you're still having issues:
1. Check the browser console for error messages
2. Check API server terminal logs
3. Verify all services are running on correct ports
4. Ensure MongoDB is accessible
5. Try the emergency reset procedure above