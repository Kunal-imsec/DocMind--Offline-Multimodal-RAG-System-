# DocMind Desktop Application

A modern desktop application for document management built with Electron, React, Vite, and Tailwind CSS, featuring a Raycast-inspired UI.

## 🚀 Quick Start

### Installation
```bash
npm install
```

### Development (with Mock API)
```bash
# Terminal 1: Start Vite dev server
npm run dev

# Terminal 2: Start Electron
npm run electron:dev
```

### Test Credentials (Mock API)
- **Default User**: `admin` / `Admin@123`
- **Or Sign Up**: Create your own user account!

See [TESTING.md](./TESTING.md) for complete testing guide.

---

## 📋 Features

- 🔐 **Simple Authentication** - Login and signup without approval workflows
- 📄 **Document Upload** - Drag-and-drop file upload with progress tracking
- 👥 **User Management** - Profile management with easy signup
- 🎨 **Modern UI** - Raycast-inspired dark theme with glassmorphism
- 💾 **Persistent Storage** - Secure credential storage with electron-store
- 🧪 **Mock API** - Test without backend using mock data
- 📁 **Project Management** - Organize documents in projects
- 💬 **Chat Interface** - Chat with your documents using AI

---

## ⚙️ Configuration

### Switch Between Mock and Real API

**Mock API (Testing - Default)**
```javascript
// src/config.js
export const USE_MOCK_API = true;
```

**Real Backend API (Production)**
```javascript
// src/config.js
export const USE_MOCK_API = false;
export const API_BASE_URL = 'http://localhost:8000/api';
```

---

## 🛠️ Tech Stack

- **Electron** - Desktop application framework
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Zustand** - State management
- **Axios** - HTTP client
- **Framer Motion** - Animation library
- **React Router** - Client-side routing
- **React Hot Toast** - Toast notifications
- **React Dropzone** - File upload

---

## 📁 Project Structure

```
frontend-jalsetu/
├── electron/              # Electron main process
│   ├── main.js           # Main process entry
│   └── preload.js        # Preload script
├── src/
│   ├── components/       # Reusable components
│   ├── pages/            # Application pages
│   ├── services/         # API services
│   │   ├── api.js        # Axios instance
│   │   ├── authService.js
│   │   ├── projectService.js
│   │   └── mockApi.js    # Mock API for testing
│   ├── store/            # State management
│   ├── config.js         # App configuration
│   ├── App.jsx           # Main app component
│   └── index.css         # Global styles
├── TESTING.md            # Testing guide
└── README.md
```

---

## 🏗️ Building for Production

```bash
# Build React app
npm run build

# Build Electron app
npm run electron:build
```

The built application will be in the `release` folder.

---

## 📚 Documentation

- [TESTING.md](./TESTING.md) - Complete testing guide with mock credentials

---

## 🔌 API Integration

The application integrates with the DocMind backend API:

- **Base URL**: `/api/`
- **Auth Endpoints**: `/auth/login/`, `/auth/signup/`, `/auth/token/refresh/`, `/auth/me/`
- **Project Endpoints**: `/projects/`, `/projects/{id}/`
- **Document Endpoints**: `/projects/{id}/documents/`

See `src/services/` for full API integration.

---

## 🎨 UI Features

- Raycast-inspired dark theme (#0f172a)
- Glassmorphism effects with backdrop blur
- Orange/red gradient accents (#ff6b35 → #f7931e)
- Smooth animations with Framer Motion
- Collapsible sidebar navigation
- Toast notifications
- Loading states
- Responsive design

---

## 🚀 Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development**:
   ```bash
   npm run dev          # Terminal 1
   npm run electron:dev # Terminal 2
   ```

3. **Sign up or login**:
   - Use `admin` / `Admin@123` or create a new account

4. **Start using**:
   - Create projects
   - Upload documents
   - Chat with your documents

---

## 📝 License

MIT
