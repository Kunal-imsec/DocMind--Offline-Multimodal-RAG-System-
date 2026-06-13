# Troubleshooting Real API Connection

## Current Configuration ✅

Your frontend is correctly configured:
- `USE_MOCK_API = false` ✅
- `API_BASE_URL = 'http://localhost:8000/api'` ✅

All API endpoints match the backend specification exactly.

---

## Common Issues & Solutions

### 1. Backend Server Not Running

**Symptom**: "Network Error" or "Failed to fetch" in browser console

**Solution**:
```bash
# Start your Django backend server
cd path/to/backend
python manage.py runserver
```

**Verify**: Open `http://localhost:8000/api/` in your browser. You should see the Django REST Framework browsable API.

---

### 2. CORS Not Configured

**Symptom**: CORS policy error in browser console like:
```
Access to XMLHttpRequest at 'http://localhost:8000/api/auth/login/' 
from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Solution**: Add CORS configuration to your Django backend.

#### Install django-cors-headers:
```bash
pip install django-cors-headers
```

#### Update Django settings.py:
```python
INSTALLED_APPS = [
    # ...
    'corsheaders',
    # ...
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Add this BEFORE CommonMiddleware
    'django.middleware.common.CommonMiddleware',
    # ...
]

# For development - allow all origins
CORS_ALLOW_ALL_ORIGINS = True

# OR for production - specify allowed origins
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Vite dev server
    "http://localhost:3000",  # If using different port
    "file://",  # For Electron app
]

# Allow credentials (cookies, authorization headers)
CORS_ALLOW_CREDENTIALS = True
```

---

### 3. Wrong Backend URL

**Symptom**: 404 errors or connection refused

**Check**:
1. Is your backend running on port 8000? (Check terminal where Django is running)
2. Try accessing `http://localhost:8000/api/auth/login/` in Postman or browser

**Solution**: Update the URL in `src/config.js` if your backend uses a different port or host.

---

### 4. JWT Token Issues

**Symptom**: Login works but subsequent requests fail with 401

**Check**:
1. Open browser DevTools (F12)
2. Go to Network tab
3. Look at failed request headers - is `Authorization: Bearer <token>` present?

**Solution**: The frontend already handles this correctly. If you see this issue, it's likely:
- Token expired (backend JWT settings too short)
- Token format mismatch

---

## Testing Steps

### Step 1: Test Backend Directly

Use the Streamlit script you provided or test with curl:

```bash
# Test login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}'
```

Expected response:
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "must_change_password": false,
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "role": "SUPER_ADMIN",
    ...
  }
}
```

### Step 2: Check Electron App Console

1. Open your Electron app
2. Press `Ctrl+Shift+I` (or `Cmd+Option+I` on Mac) to open DevTools
3. Go to Console tab
4. Try to login
5. Look for errors (red text)

Common errors:
- `ERR_CONNECTION_REFUSED` → Backend not running
- `CORS policy` → CORS not configured
- `401 Unauthorized` → Wrong credentials or token issue
- `404 Not Found` → Wrong URL or endpoint

### Step 3: Check Network Tab

1. Open DevTools (F12)
2. Go to Network tab
3. Try to login
4. Click on the `login/` request
5. Check:
   - **Request URL**: Should be `http://localhost:8000/api/auth/login/`
   - **Request Headers**: Should have `Content-Type: application/json`
   - **Request Payload**: Should have username and password
   - **Response**: Check status code and response body

---

## Quick Fix: Use 127.0.0.1 Instead of localhost

Some systems have issues with `localhost` resolution. Try changing:

```javascript
// In src/config.js
export const API_BASE_URL = 'http://127.0.0.1:8000/api';
```

---

## Verify API Endpoints

All these endpoints should work (test with Postman or curl):

### Public Endpoints (no auth required):
- `POST /api/auth/login/` - Login
- `POST /api/auth/onboarding-requests/` - Submit onboarding request

### Protected Endpoints (require Bearer token):
- `POST /api/auth/token/refresh/` - Refresh token
- `GET /api/auth/me/` - Get current user
- `PATCH /api/auth/me/` - Update profile
- `POST /api/auth/change-password/` - Change password
- `GET /api/auth/onboarding-requests/` - List requests (SUPER_ADMIN)
- `POST /api/auth/onboarding-requests/{id}/decide/` - Approve/reject (SUPER_ADMIN)
- `POST /api/ingestion/upload/` - Upload document (SENIOR_ANALYST, SUPER_ADMIN)
- `GET /api/ingestion/jobs/{job_id}/` - Get job status

---

## Still Not Working?

**Share the following information**:

1. **Error message** from browser console (F12 → Console tab)
2. **Network request details** (F12 → Network tab → Click on failed request)
3. **Backend logs** (from your Django terminal)
4. **Backend URL** you're using (is it really `http://localhost:8000`?)

Then I can provide more specific help!

---

## Rollback to Mock API

If you need to continue development while fixing backend issues:

```javascript
// In src/config.js
export const USE_MOCK_API = true;
```

Restart the dev server and you'll be back to using mock data.
