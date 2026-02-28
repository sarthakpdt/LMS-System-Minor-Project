# API Testing Guide

## Step 1: Check if backend is running
Open browser and go to: http://localhost:5000/
You should see: "EduTrack API is running..."

## Step 2: Test Signup in Browser Console
Open browser console (F12 -> Console tab) and paste:

```javascript
fetch('http://localhost:5000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    role: 'student',
    studentId: 'STD001',
    department: 'CS',
    semester: '1',
    phone: '1234567890'
  })
})
.then(res => res.json())
.then(data => console.log('Response:', data))
.catch(err => console.error('Error:', err))
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Registration successful!",
  "token": "eyJ0eXAi...",
  "user": {
    "id": "...",
    "name": "Test User",
    "email": "test@example.com",
    "role": "student"
  }
}
```

## Step 3: Test Login in Browser Console
```javascript
fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'password123'
  })
})
.then(res => res.json())
.then(data => console.log('Response:', data))
.catch(err => console.error('Error:', err))
```

**Expected Response:**
```json
{
  "success": true,
  "token": "eyJ0eXAi...",
  "user": {
    "id": "...",
    "name": "Test User",
    "email": "test@example.com",
    "role": "student"
  }
}
```

## Common Issues & Solutions

### Issue: 400 Bad Request on register
**Possible causes:**
1. ✅ Missing fields (name, email, password) - Check console logs "Frontend sending signup data:"
2. ✅ Email already exists - Try different email
3. ✅ Spaces in fields not being trimmed

**Solution:** Check browser console for exact error message in "Signup response:" log

### Issue: Login response missing user field
**Possible causes:**
1. ✅ Old code cached in browser - Press Ctrl+Shift+R to hard refresh
2. ✅ Backend not returning correct structure

**Solution:** Check console logs "Login full response:" to see actual structure

## Debug Steps

1. Open browser DevTools (F12)
2. Go to Console tab
3. Try to sign up in the app
4. Look for logs:
   - "Frontend sending signup data:" - Shows what frontend is sending
   - "Signup response:" - Shows what backend returns
   - "Login full response:" - Shows login response structure

Share these console logs if there are still issues!
