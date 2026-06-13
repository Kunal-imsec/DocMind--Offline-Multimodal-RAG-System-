# 🧪 Simplified User System Testing Guide

## Quick Start

The application now uses a **simplified user system** without roles or admin features.

### Test Credentials

Login with the default admin user or create your own:

| Username | Password |
|----------|----------|
| `admin` | `Admin@123` |

**Or simply sign up** to create a new user account!

---

## How to Switch Between Mock and Real API

### Using Mock API (Current - For Testing)

In `src/config.js`:
```javascript
export const USE_MOCK_API = true;
```

### Using Real Backend API (For Production)

In `src/config.js`:
```javascript
export const USE_MOCK_API = false;
export const API_BASE_URL = 'http://localhost:8000/api'; // Update if needed
```

**That's it!** Just change the flag and restart the dev server.

---

## Testing Scenarios

### 1. Sign Up Flow
- **Navigate**: Go to Sign Up page
- **Fill**: Full name, email, department, password
- **Submit**: Creates user account directly
- **Expected**: Automatically logged in and redirected to Dashboard

### 2. Login Flow
- **Try**: Login with `admin` / `Admin@123`
- **Expected**: Redirects to Dashboard
- **Try**: Login with any created user
- **Expected**: Redirects to Dashboard

### 3. Dashboard
- **View**: Stats cards (Total Projects, Total Documents)
- **View**: Quick action cards (Upload Document, View Profile)
- **Create**: New project

### 4. Profile Management
- **Edit**: First name, last name, department
- **Save**: Changes persist in mock storage
- **Navigate**: Click "Change Password"

### 5. Password Change
- **Test**: Real-time validation
- **Requirements**: 8+ chars, uppercase, lowercase, number, special char
- **Success**: Shows success toast

### 6. Document Upload
- **Upload**: Any file (PDF, DOCX, TXT, images, audio)
- **Watch**: Progress bar (0-100%)
- **Watch**: Job status polling (RUNNING → COMPLETED/FAILED)
- **Note**: Mock API randomly returns COMPLETED (90%) or FAILED (10%)

---

## What Works in Mock Mode

✅ **Full Authentication**
- Login with credentials
- Sign up new users
- Token storage (localStorage/electron-store)
- Auto-logout on invalid token
- Password change flow

✅ **Profile Management**
- View user info
- Edit profile fields
- Changes persist in session

✅ **Document Upload**
- File validation
- Upload progress
- Job status polling
- Success/failure simulation

✅ **Project Management**
- Create projects
- View projects
- Delete projects
- Chat with documents

✅ **Equal Access**
- All users have access to all features
- No role-based restrictions
- No approval workflows

---

## Switching to Real Backend

When your backend is ready:

1. **Update config**:
   ```javascript
   // src/config.js
   export const USE_MOCK_API = false;
   export const API_BASE_URL = 'http://localhost:8000/api';
   ```

2. **Restart dev server**:
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

3. **Test with real data**:
   - Sign up new users
   - Upload actual documents
   - Verify API responses

---

## Troubleshooting

**Q: Login not working?**
- Check you're using exact credentials (case-sensitive)
- Verify `USE_MOCK_API = true` in `src/config.js`

**Q: Want to reset mock data?**
- Refresh the page or restart the app
- Mock data resets on each reload

---

## Next Steps

1. ✅ Test all features with mock API
2. ✅ Verify UI/UX flows
3. ✅ Test signup and login
4. 🔄 Start backend API
5. 🔄 Switch to `USE_MOCK_API = false`
6. 🔄 Test with real backend

Enjoy testing! 🚀
