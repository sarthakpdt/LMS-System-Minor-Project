# MongoDB Database Structure - EduTrack LMS

## Overview
MongoDB is a NoSQL document database. Instead of traditional SQL tables, it uses **Collections** to store **Documents** (JSON-like objects).

---

## Database: SchoolData

### 📊 Collections (Tables)

We have **3 main collections** instead of one generic User table:

```
SchoolData (Database)
├── Students (Collection)
├── Teachers (Collection)
├── Admins (Collection)
└── Users (Legacy - DO NOT USE)
```

---

## Collection 1: Students

**Purpose:** Store all student data with approval workflow

**Path:** `SchoolData.Students`

### Schema Structure:

```javascript
{
  _id: ObjectId,                    // MongoDB auto-generated ID
  
  // ===== BASIC INFO =====
  name: String,                     // "John Doe" (required)
  email: String,                    // "john@example.com" (required, unique)
  password: String,                 // hashed password (required)
  phone: String,                    // "9876543210" (required)
  dateOfBirth: Date,               // "2005-01-15"
  
  // ===== STUDENT SPECIFIC =====
  studentId: String,               // "STD2024001" (required, unique)
  department: String,              // "CS", "EE", "ME", "CE" (required)
  semester: String,                // "1", "2", "3", ... "8" (required)
  enrollmentYear: Number,          // 2024
  
  // ===== APPROVAL STATUS (IMPORTANT) =====
  approvalStatus: String,          // "pending", "approved", "rejected" (default: "pending")
  approvedBy: ObjectId,            // Reference to Admin who approved (null if pending)
  approvalDate: Date,              // When admin approved/rejected
  rejectionReason: String,         // Why student was rejected
  
  // ===== ACADEMIC =====
  gpa: Number,                     // 0 to 4.0 (default: 0)
  courses: [
    {
      courseId: ObjectId,          // Reference to Course
      courseCode: String,          // "CS101"
      courseName: String,          // "Data Structures"
      marks: Number,               // Marks scored
      grade: String                // "A", "B", "C", etc.
    }
  ],
  
  // ===== ACCOUNT STATUS =====
  isActive: Boolean,               // true/false (default: true)
  createdAt: Date,                 // Auto-set on creation
  updatedAt: Date                  // Auto-updated
}
```

### Example Student Document:

```json
{
  "_id": {"$oid": "65a1b2c3d4e5f6g7h8i9j0k1"},
  "name": "Tushar Parihar",
  "email": "tushar@example.com",
  "password": "$2a$10$hashedPasswordHere...",
  "phone": "9876543210",
  "studentId": "STD2024001",
  "department": "CS",
  "semester": "3",
  "enrollmentYear": 2023,
  "approvalStatus": "pending",
  "approvedBy": null,
  "approvalDate": null,
  "rejectionReason": null,
  "gpa": 3.8,
  "isActive": true,
  "createdAt": "2024-02-28T10:15:30Z",
  "updatedAt": "2024-02-28T10:15:30Z"
}
```

---

## Collection 2: Teachers

**Purpose:** Store all teacher data with approval workflow

**Path:** `SchoolData.Teachers`

### Schema Structure:

```javascript
{
  _id: ObjectId,
  
  // ===== BASIC INFO =====
  name: String,                    // (required)
  email: String,                   // (required, unique)
  password: String,                // hashed (required)
  phone: String,                   // (required)
  dateOfBirth: Date,
  
  // ===== TEACHER SPECIFIC =====
  employeeId: String,              // "EMP2024001" (required, unique)
  department: String,              // "CS", "EE", "ME", "CE" (required)
  specialization: String,          // "AI/ML", "Web Development"
  qualification: String,           // "B.Tech", "M.Tech", "Ph.D"
  
  // ===== APPROVAL STATUS =====
  approvalStatus: String,          // "pending", "approved", "rejected"
  approvedBy: ObjectId,            // Reference to Admin
  approvalDate: Date,
  
  // ===== TEACHING =====
  assignedCourses: [
    {
      courseId: ObjectId,
      courseCode: String,          // "CS101"
      courseName: String,
      semester: String
    }
  ],
  assignedStudents: [ObjectId],    // Array of Student IDs
  
  // ===== ACCOUNT STATUS =====
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Collection 3: Admins

**Purpose:** Store admin accounts with permissions and tracking

**Path:** `SchoolData.Admins`

### Schema Structure:

```javascript
{
  _id: ObjectId,
  
  // ===== BASIC INFO =====
  name: String,                    // "Principal Name" (required)
  email: String,                   // (required, unique)
  password: String,                // hashed (required)
  phone: String,                   // (required)
  
  // ===== ADMIN INFO =====
  employeeId: String,              // "ADM2024001" (required, unique)
  adminType: String,               // "super-admin", "department-admin", "academic-admin"
  department: String,              // "CS", "EE", "All"
  
  // ===== PERMISSIONS =====
  permissions: [
    String                         // "approve-students", "approve-teachers", etc.
  ],
  
  // ===== ACTIVITY TRACKING =====
  approvedStudents: [ObjectId],    // Array of approved Student IDs
  approvedTeachers: [ObjectId],    // Array of approved Teacher IDs
  
  // ===== ACCOUNT STATUS =====
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Example Admin Document:

```json
{
  "_id": {"$oid": "65a1b2c3d4e5f6g7h8i9j0k1"},
  "name": "Principal",
  "email": "admin@school.com",
  "password": "$2a$10$hashedPasswordHere...",
  "phone": "9876543210",
  "employeeId": "ADM2024001",
  "adminType": "super-admin",
  "department": "All",
  "permissions": [
    "approve-students",
    "approve-teachers",
    "manage-courses",
    "manage-assessments",
    "view-analytics",
    "manage-users",
    "delete-accounts"
  ],
  "approvedStudents": ["65a1b2c3d4e5f6g7h8i9j0k2", "65a1b2c3d4e5f6g7h8i9j0k3"],
  "approvedTeachers": ["65a1b2c3d4e5f6g7h8i9j0k4"],
  "isActive": true,
  "lastLogin": "2024-02-28T12:30:00Z",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-02-28T12:30:00Z"
}
```

---

## 🔄 Student Approval Workflow

### Step 1: Student Signup
Student signs up → Document created with **approvalStatus: "pending"**

```bash
Student Document Created:
{
  name: "Tushar",
  email: "tushar@example.com",
  studentId: "STD001",
  approvalStatus: "pending"      ← ← ← PENDING HERE
}
```

### Step 2: Admin Reviews
Admin goes to **Student Approvals** page

```
GET /api/admin/students/pending
Returns: All students with approvalStatus: "pending"
```

### Step 3: Admin Approves (or rejects)

```bash
POST /api/admin/students/:studentId/approve
Body: { adminId: "admin_id" }

Updates:
{
  approvalStatus: "approved",    ← ← ← CHANGED TO APPROVED
  approvedBy: ObjectId(adminId),
  approvalDate: Date.now(),
}
```

### Step 4: Student Can Login
When student tries to login:

```javascript
// In authController.js login function
if (role === 'student' && user.approvalStatus !== 'approved') {
  return res.status(403).json({ 
    message: 'Your account is pending. Please wait for admin approval.' 
  });
}
// If approvalStatus == "approved", student can login
```

---

## 📊 Database Relationships

### Visual: How Collections Connect

```
Students Collection
├── approvedBy: ObjectId ─────→ Admins Collection
└── courses[].courseId ────────→ Courses Collection (future)

Teachers Collection
├── approvedBy: ObjectId ─────→ Admins Collection
├── assignedCourses[].courseId → Courses Collection
└── assignedStudents[] ────────→ Students Collection

Admins Collection
├── approvedStudents[] ────────→ Students Collection
└── approvedTeachers[] ────────→ Teachers Collection
```

---

## 🔐 MongoDB Queries (Examples)

### Find all pending students
```javascript
db.students.find({ approvalStatus: "pending" })
```

### Find approved students
```javascript
db.students.find({ approvalStatus: "approved" })
```

### Approve a student (Update)
```javascript
db.students.updateOne(
  { _id: ObjectId("...") },
  { 
    $set: {
      approvalStatus: "approved",
      approvedBy: ObjectId("admin_id"),
      approvalDate: new Date()
    }
  }
)
```

### Add to admin's approval list
```javascript
db.admins.updateOne(
  { _id: ObjectId("admin_id") },
  { $push: { approvedStudents: ObjectId("student_id") } }
)
```

### Find students by department
```javascript
db.students.find({ department: "CS" })
```

---

## ❓ Why Separate Collections?

### BEFORE (Bad - Single User Table)
```javascript
{
  role: "student",
  studentId: "...",      // Only for students
  employeeId: "...",     // Only for teachers/admins
  permissions: [...],    // Only for admins
  semester: "...",       // Only for students
  // WASTE: has null fields for unused roles
}
```

### AFTER (Good - Separate Collections)
```javascript
// Students Collection - Only has student-specific fields
// Teachers Collection - Only has teacher-specific fields
// Admins Collection - Only has admin-specific fields
// ✅ NO NULL FIELDS - Cleaner data
```

---

## 🔑 Key Indexes (for performance)

```javascript
// Students Collection
db.students.createIndex({ email: 1 }, { unique: true })
db.students.createIndex({ studentId: 1 }, { unique: true })
db.students.createIndex({ approvalStatus: 1 })

// Teachers Collection
db.teachers.createIndex({ email: 1 }, { unique: true })
db.teachers.createIndex({ employeeId: 1 }, { unique: true })
db.teachers.createIndex({ approvalStatus: 1 })

// Admins Collection
db.admins.createIndex({ email: 1 }, { unique: true })
db.admins.createIndex({ employeeId: 1 }, { unique: true })
```

---

## 📝 API Endpoints Setup

### Authentication Routes
```
POST /api/auth/register    - Register (creates in respective collection)
POST /api/auth/login       - Login (queries from respective collection)
```

### Admin Approval Routes
```
GET  /api/admin/students/pending     - Get pending students
POST /api/admin/students/:id/approve - Approve student
POST /api/admin/students/:id/reject  - Reject student
GET  /api/admin/teachers/pending     - Get pending teachers
POST /api/admin/teachers/:id/approve - Approve teacher
```

---

## ✅ Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Collections** | 1 (Users) | 3 (Students, Teachers, Admins) |
| **Approval System** | Missing | ✅ Full workflow |
| **Data Integrity** | Low | High |
| **Query Speed** | Slow (filters all users) | Fast (queries specific collection) |
| **Code Clarity** | Confusing | Clear |
| **Future Scalability** | Hard | Easy |

Now students await admin approval before they can login! 🎉
