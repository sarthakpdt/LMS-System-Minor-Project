# Student Authentication System - Implementation Guide

## Overview
A comprehensive authentication system has been implemented for the Student portal with creative login/signup pages.

## Features Implemented

### 1. Authentication Context (`/contexts/AuthContext.tsx`)
- Manages user authentication state globally
- Provides login, signup, and logout functions
- Stores user data in localStorage for persistence
- Auto-loads user on app initialization

### 2. Student Auth Page (`/components/auth/StudentAuth.tsx`)
**Design Features:**
- Beautiful gradient background (indigo → purple → pink)
- Animated floating background elements
- Responsive two-column layout
- Tab-based toggle between Login and Sign Up

**Login Form Fields:**
- Email Address
- Password (with show/hide toggle)
- Remember Me checkbox
- Forgot Password link
- Demo account helper text

**Signup Form Fields:**
- Full Name
- Email Address
- Student ID
- Phone Number
- Department (dropdown selection)
- Current Semester (dropdown selection)
- Date of Birth
- Password (with show/hide toggle)
- Confirm Password
- Terms of Service agreement

**Form Features:**
- Real-time validation
- Loading states with spinner
- Error messages
- Success/Error toast notifications
- Auto-login after signup

### 3. Protected Routes (`/components/auth/ProtectedRoute.tsx`)
- Wraps student routes to require authentication
- Automatically redirects to login if not authenticated
- Seamlessly switches to dashboard once logged in

### 4. Student Layout Updates
- Displays logged-in user's name and department
- Shows user initials in avatar
- Logout button with confirmation toast
- User info persists across sessions

### 5. Role Switcher Integration
- Auto-logout when switching from student role to admin/teacher
- Prevents unauthorized access across roles

## How It Works

### First Time User Flow:
1. User clicks "Student" panel
2. StudentAuth page appears with Login tab active
3. User switches to "Sign Up" tab
4. Fills out all required information
5. Clicks "Create Account"
6. Account is created and stored in localStorage
7. User is automatically logged in
8. Redirected to Student Dashboard

### Returning User Flow:
1. User clicks "Student" panel
2. If previously logged in, goes directly to dashboard
3. If not logged in, sees Login page
4. Enters email and password
5. Clicks "Sign In"
6. Redirected to Student Dashboard

### Data Storage:
- User accounts stored in: `localStorage.lms_users`
- Current session stored in: `localStorage.lms_current_user`
- Data persists across browser sessions

## Integration with Backend

Currently using localStorage for demo purposes. To connect with your MongoDB backend:

1. **Update AuthContext (`/contexts/AuthContext.tsx`):**
   - Replace localStorage calls with API calls to your backend
   - Use the endpoints from `/API_ENDPOINTS.md`
   - Example:
   ```typescript
   const login = async (email: string, password: string) => {
     const response = await fetch('http://localhost:5000/api/auth/login', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ email, password })
     });
     const data = await response.json();
     if (data.token) {
       localStorage.setItem('token', data.token);
       setUser(data.user);
       return true;
     }
     return false;
   };
   ```

2. **Add JWT Token Management:**
   - Store JWT token from backend
   - Include token in Authorization header for protected requests
   - Implement token refresh logic

3. **Connect to Backend Endpoints:**
   - `POST /api/auth/register` - for signup
   - `POST /api/auth/login` - for login
   - `GET /api/auth/me` - to get current user
   - `POST /api/auth/logout` - for logout

## Toast Notifications

The system uses Sonner for beautiful toast notifications:
- ✅ Success messages (green)
- ❌ Error messages (red)
- ℹ️ Info messages (blue)

Triggered on:
- Successful login
- Failed login
- Successful signup
- Failed signup (duplicate email)
- Validation errors
- Logout

## Security Notes

**Current Implementation (Demo):**
- Passwords stored in plain text in localStorage
- No encryption
- Client-side only validation

**Production Requirements (When connecting to backend):**
- Use HTTPS only
- Hash passwords with bcrypt on server
- Implement JWT tokens
- Add rate limiting
- Enable CSRF protection
- Add two-factor authentication (optional)
- Implement password strength requirements
- Add email verification

## Customization

### To change theme colors:
Edit the gradient in `/components/auth/StudentAuth.tsx`:
```typescript
className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500"
```

### To add more departments:
Edit the Select options in the signup form:
```typescript
<SelectItem value="Your Department">Your Department</SelectItem>
```

### To modify validation rules:
Update the validation logic in `handleSignup` and `handleLogin` functions

## Testing

**Quick Test:**
1. Click "Student" in role switcher
2. Click "Sign Up" tab
3. Fill in sample data:
   - Name: John Doe
   - Email: john@university.edu
   - Student ID: STU202400123
   - Phone: +1 (555) 123-4567
   - Department: Computer Science
   - Semester: 3
   - DOB: 2000-01-01
   - Password: test123
4. Click "Create Account"
5. Verify redirect to dashboard
6. Check user info in sidebar
7. Click "Logout"
8. Try logging in with same credentials

## Files Modified/Created

**Created:**
- `/contexts/AuthContext.tsx` - Authentication state management
- `/components/auth/StudentAuth.tsx` - Login/Signup UI
- `/components/auth/ProtectedRoute.tsx` - Route protection

**Modified:**
- `/App.tsx` - Added AuthProvider and Toaster
- `/routes.ts` - Added ProtectedRoute wrapper
- `/components/layouts/StudentLayout.tsx` - Added user info and logout
- `/components/RoleSwitcher.tsx` - Added logout on role switch
- `/components/ui/sonner.tsx` - Simplified for non-Next.js use

## Next Steps for Full Production

1. ✅ Connect to MongoDB backend (see `/BACKEND_SETUP.md`)
2. ✅ Implement JWT authentication
3. ✅ Add email verification
4. ✅ Add password reset functionality
5. ✅ Implement profile editing
6. ✅ Add user avatar upload
7. ✅ Enable social login (Google, etc.)
8. ✅ Add activity logging
9. ✅ Implement session management
10. ✅ Add security headers and CORS
