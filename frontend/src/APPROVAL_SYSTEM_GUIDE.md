# Student Approval System & Faculty Authentication - Implementation Guide

## Overview
This document describes the student approval workflow and faculty authentication system implemented in the EduTrack LMS.

## Key Features Implemented

### 1. Faculty Authentication System
- **Separate login/signup pages for teachers** with emerald/teal gradient design
- **Teacher-specific fields:**
  - Employee ID
  - Department
  - Specialization
  - Qualification (Ph.D., M.Tech, etc.)
  - Phone, DOB, Email
- **Auto-login after signup** for teachers (no approval needed)
- **Protected routes** requiring teacher authentication

### 2. Student Approval Workflow

#### Student Signup Process:
1. Student fills comprehensive signup form with:
   - **Personal:** Name, Email, Phone, Date of Birth
   - **Academic:** Student ID, Department, Semester
   - **New Fields:** Academic Year (2024-2025, etc.), Course/Program (B.Tech, M.Tech, etc.)
2. Account created with `approvalStatus: 'pending'`
3. Student receives success message: "Account created! Please wait for admin approval"
4. Student **cannot login** until approved

#### Student Login Process:
1. Student enters credentials
2. System checks:
   - Email and password match
   - Role is 'student'
   - **Approval status is 'approved'**
3. If pending: Show error "Your account is pending admin approval. Please wait for approval."
4. If rejected: Show error "Your account has been rejected. Please contact administration."
5. If approved: Login successful

#### Admin Approval Process:
1. Admin navigates to "Student Approvals" page
2. Sees list of all pending student registrations
3. Each card shows:
   - **Personal Information:** Email, Phone, DOB
   - **Academic Details:** Student ID, Department, Course
   - **Semester Details:** Current Semester, Academic Year
4. Admin can:
   - **Approve:** Sets `approvalStatus: 'approved'`, student can now login
   - **Reject:** Sets `approvalStatus: 'rejected'`, student cannot login

### 3. Role-Based Authentication

**User Types:**
```typescript
interface StudentUser {
  role: 'student';
  studentId: string;
  department: string;
  semester: string;
  year: string;        // NEW: Academic year
  course: string;      // NEW: Course/Program
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedAt?: string;
  approvedBy?: string;
}

interface TeacherUser {
  role: 'teacher';
  employeeId: string;
  department: string;
  specialization: string;
  qualification: string;
}
```

## File Structure

### New Files Created:
- `/components/auth/TeacherAuth.tsx` - Faculty login/signup page
- `/components/auth/ProtectedTeacherRoute.tsx` - Teacher route protection
- `/components/admin/StudentApprovals.tsx` - Admin approval management

### Modified Files:
- `/contexts/AuthContext.tsx` - Updated to support multi-role auth and approval
- `/components/auth/StudentAuth.tsx` - Added year and course fields
- `/routes.ts` - Added teacher protection and approval route
- `/components/layouts/AdminLayout.tsx` - Added Student Approvals link
- `/components/layouts/TeacherLayout.tsx` - Added user info and logout
- `/components/RoleSwitcher.tsx` - Added multi-role logout support

## User Flows

### Student Registration Flow:
```
1. Click "Student" in role switcher
2. Click "Sign Up" tab
3. Fill form:
   - Name, Email, Student ID, Phone
   - Department, Semester, Year, Course
   - Date of Birth
   - Password & Confirm Password
4. Submit → Account created (status: pending)
5. See success message
6. Try to login → Error: "Pending approval"
7. Wait for admin approval
8. Admin approves
9. Login successful → Access dashboard
```

### Teacher Registration Flow:
```
1. Click "Teacher" in role switcher
2. Click "Sign Up" tab
3. Fill form:
   - Name, Email, Employee ID, Phone
   - Department, Specialization, Qualification
   - Date of Birth
   - Password & Confirm Password
4. Submit → Account created & auto-login
5. Access teacher dashboard immediately
```

### Admin Approval Flow:
```
1. Login as Admin
2. Click "Student Approvals" in sidebar
3. See list of pending students
4. Review student details
5. Click "Approve" or "Reject"
6. Student notified via login attempt
```

## One-Time Approval Per Semester

### Current Implementation:
- Approval is required **once** when student first signs up
- After approval, student can login for entire semester/year
- No re-approval needed for subsequent logins

### Future Enhancement (Per Semester):
To implement per-semester approval:

1. **Add semester tracking:**
```typescript
interface StudentUser {
  // ... existing fields
  lastApprovedSemester: string; // e.g., "2024-2025-1"
  currentSemester: string;
}
```

2. **Check on login:**
```typescript
const login = async (email, password, role) => {
  const student = findStudent(email);
  
  if (student.role === 'student') {
    const currentSemKey = `${student.year}-${student.semester}`;
    
    if (student.lastApprovedSemester !== currentSemKey) {
      return { success: false, message: 'Please register for new semester' };
    }
  }
  
  // Continue login...
};
```

3. **Semester change workflow:**
- Student updates semester/year in profile
- Triggers new approval request
- Admin approves for new semester

## Data Storage

### LocalStorage Keys:
- `lms_users` - All user accounts (students + teachers)
- `lms_current_user` - Currently logged-in user

### Student Data Structure:
```json
{
  "id": "1708012345678",
  "role": "student",
  "name": "John Doe",
  "email": "john@university.edu",
  "password": "hashed_password",
  "studentId": "STU202400123",
  "department": "Computer Science",
  "semester": "3",
  "year": "2024-2025",
  "course": "B.Tech",
  "phone": "+1 (555) 123-4567",
  "dateOfBirth": "2000-01-01",
  "approvalStatus": "pending",
  "approvedAt": null,
  "approvedBy": null
}
```

### Teacher Data Structure:
```json
{
  "id": "1708012345679",
  "role": "teacher",
  "name": "Dr. Sarah Johnson",
  "email": "sarah.j@university.edu",
  "password": "hashed_password",
  "employeeId": "FAC202400456",
  "department": "Computer Science",
  "specialization": "Data Science",
  "qualification": "Ph.D.",
  "phone": "+1 (555) 987-6543",
  "dateOfBirth": "1985-05-15"
}
```

## Testing Instructions

### Test Student Approval:
1. **Create Student Account:**
   - Switch to Student role
   - Sign up with test data
   - Note the email/password

2. **Try Login (Should Fail):**
   - Try to login with credentials
   - Should see "Pending approval" message

3. **Approve as Admin:**
   - Switch to Admin role
   - Go to "Student Approvals"
   - Click "Approve" on your student

4. **Login Successfully:**
   - Switch back to Student role
   - Login with same credentials
   - Should access student dashboard

### Test Teacher Account:
1. **Create Teacher Account:**
   - Switch to Teacher role
   - Sign up with test data
   
2. **Auto-Login:**
   - Should automatically login
   - Access teacher dashboard immediately

## Integration with Backend

When connecting to MongoDB backend:

### Update AuthContext:
```typescript
const signup = async (userData) => {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  
  const data = await response.json();
  
  if (userData.role === 'student') {
    // Don't auto-login, return message
    return { 
      success: true, 
      message: 'Please wait for admin approval' 
    };
  }
  
  // Auto-login for teachers
  setUser(data.user);
  return { success: true };
};
```

### Backend Endpoints Needed:
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login with approval check
- `GET /api/admin/pending-students` - Get pending approvals
- `PATCH /api/admin/approve-student/:id` - Approve student
- `PATCH /api/admin/reject-student/:id` - Reject student

## Security Considerations

### Current (Demo):
- ❌ Passwords stored in plain text
- ❌ No encryption
- ❌ Client-side only validation

### Production Requirements:
- ✅ Hash passwords with bcrypt
- ✅ Use JWT tokens
- ✅ Server-side approval validation
- ✅ Email notifications for approval status
- ✅ Rate limiting on login attempts
- ✅ Admin audit logs
- ✅ Role-based access control (RBAC)

## Notifications

### Email Notifications (Future):
1. **Student Signup:**
   - Send to: Student email
   - Content: "Account created. Waiting for approval."

2. **Admin Notification:**
   - Send to: Admin email
   - Content: "New student registration pending approval"

3. **Approval:**
   - Send to: Student email
   - Content: "Your account has been approved. You can now login."

4. **Rejection:**
   - Send to: Student email
   - Content: "Registration rejected. Contact admin for details."

## UI/UX Features

### Student Auth Page:
- 🎨 Indigo/Purple/Pink gradient background
- ✨ Animated floating elements
- 📱 Responsive design
- ✅ Real-time validation
- 🔔 Toast notifications
- 🎯 Tab-based login/signup toggle

### Teacher Auth Page:
- 🎨 Emerald/Teal/Cyan gradient background
- 👨‍🏫 Teacher-specific branding
- ✨ Same animations as student page
- ✅ All same features, different colors

### Admin Approval Page:
- 📋 Card-based layout for each student
- 🔍 Complete student information display
- ✅ One-click approve/reject
- 📊 Organized by personal, academic, semester sections
- 🎨 Visual status badges

## Troubleshooting

### Student can't login after signup:
- **Check approval status** in localStorage → `lms_users`
- Admin must approve from "Student Approvals" page

### Teacher gets login error:
- **Verify role in login form** - must select teacher
- Check if account exists in `lms_users`

### Approval page shows no students:
- **Create a student account** first
- Don't approve it yet
- Check admin panel

## Next Steps

1. ✅ Connect to MongoDB backend
2. ✅ Add email notifications
3. ✅ Implement password reset
4. ✅ Add bulk approval actions
5. ✅ Create admin dashboard widget for pending count
6. ✅ Add search/filter to approval page
7. ✅ Implement semester rollover automation
8. ✅ Add student re-enrollment for new semester
9. ✅ Create approval history logs
10. ✅ Add export functionality for approved students
