# Troubleshooting: Classes Not Showing in Teacher Login

## Issue
The teacher login page shows "Choose a class" dropdown but no classes appear, even though 2 classes were created in the admin panel.

## Debugging Steps

### 1. Check Browser Console
1. Open teacher login page
2. Press F12 to open Developer Tools
3. Go to Console tab
4. Look for error messages or API responses
5. You should see logs like:
   ```
   Making request to /api/classes with config: {...}
   Available classes response: {...}
   Classes array: [...]
   Set available classes: X classes
   ```

### 2. Check Network Tab
1. In Developer Tools, go to Network tab
2. Refresh the teacher login page
3. Look for a request to `/api/classes`
4. Check the response:
   - Status should be 200
   - Response should contain `{ classes: [...] }`

### 3. Test API Directly
Run the debug script:
```bash
node debug-classes-api.js
```

Or test in browser console:
```javascript
fetch('/api/classes')
  .then(r => r.json())
  .then(data => console.log('Classes:', data))
  .catch(err => console.error('Error:', err));
```

### 4. Check Backend Server
1. Make sure your backend server is running
2. Check backend logs for errors
3. Verify the `/api/classes` endpoint exists
4. Test endpoint directly: `http://localhost:5000/api/classes`

## Common Issues & Solutions

### Issue 1: API Endpoint Not Found (404)
**Symptoms:** Network tab shows 404 error for `/api/classes`
**Solution:** 
- Check if backend has `/api/classes` route
- Verify backend server is running
- Check if route requires different path

### Issue 2: Authentication Required (401)
**Symptoms:** Network tab shows 401 error
**Solution:**
- API might require authentication
- Try logging in as admin first
- Check if endpoint needs auth token

### Issue 3: Empty Response
**Symptoms:** API returns `{ classes: [] }`
**Solution:**
- No classes exist in database
- Create classes in admin panel first
- Check database connection

### Issue 4: Wrong Response Format
**Symptoms:** API returns data but not in expected format
**Solution:**
- Check if response has `classes` property
- Verify response structure matches frontend expectations

## Quick Fixes

### Fix 1: Update API Endpoint
If backend uses different endpoint:
```typescript
// In TeacherPortal.tsx, change:
const response = await axios.get('/api/classes');
// To:
const response = await axios.get('/api/admin/classes'); // or whatever your endpoint is
```

### Fix 2: Add Authentication
If API requires auth:
```typescript
const token = localStorage.getItem('adminToken'); // or appropriate token
const response = await axios.get('/api/classes', {
  headers: { Authorization: `Bearer ${token}` }
});
```

### Fix 3: Handle Different Response Format
If API returns different structure:
```typescript
// Instead of:
setAvailableClasses(response.data.classes || []);
// Use:
setAvailableClasses(response.data || []); // if classes are directly in data
```

## Debug Component
I've added a debug component to the teacher portal that shows:
- API request status
- Response data
- Number of classes found
- Error messages

Look for the debug box in the top-right corner of the teacher login page.

## Expected Working Flow
1. Teacher visits login page
2. Page loads and calls `/api/classes`
3. API returns: `{ classes: [{ classCode: "BCU-MCA-1-1", course: "MCA", ... }] }`
4. Dropdown populates with class options
5. Teacher selects class and logs in

## Next Steps
1. Check browser console for errors
2. Verify API endpoint exists and returns data
3. Test with the debug component
4. Check backend logs
5. Verify classes exist in database

If none of these steps reveal the issue, please share:
- Browser console errors
- Network tab response for `/api/classes`
- Backend server logs
- Database content (if accessible)