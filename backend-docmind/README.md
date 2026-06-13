# DocMind Backend API

Complete MERN backend for DocMind - A document management and AI-powered chat application.

## Features

- **Authentication & Authorization**
  - JWT-based authentication (access & refresh tokens)
  - Role-based access control (SUPER_ADMIN, IT_ADMIN, SENIOR_ANALYST, ANALYST, VIEWER)
  - User onboarding workflow with approval system
  - Password management and validation

- **Document Ingestion**
  - Multi-format file upload (PDF, DOCX, TXT, Images, Audio)
  - Document classification levels (PUBLIC, RESTRICTED, CONFIDENTIAL, TOP_SECRET)
  - Async job processing with status tracking
  - File validation and size limits (50MB max)

- **Search Indexing**
  - Multi-modal indexing (text, image, audio)
  - Index snapshot management
  - Full and incremental rebuild modes

- **Project Management**
  - CRUD operations for projects
  - Member management
  - Archive functionality

- **Chat System**
  - Chat sessions within projects
  - AI-powered responses with citations
  - Message history and metadata support
  - Real-time activity tracking

## Tech Stack

- **Runtime**: Node.js with ES Modules
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **File Upload**: Multer
- **Validation**: express-validator
- **Security**: bcryptjs for password hashing

## Installation

1. **Clone the repository**
   ```bash
   cd backend-docmind
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   
   Copy `.env.example` to `.env` and configure:
   ```bash
   cp .env.example .env
   ```

   Update the following variables in `.env`:
   ```env
   # MongoDB connection string
   MONGODB_URI=mongodb://localhost:27017/docmind
   
   # JWT secrets (change these in production!)
   JWT_SECRET=your-super-secret-jwt-key
   JWT_REFRESH_SECRET=your-super-secret-refresh-key
   
   # Server configuration
   PORT=5000
   FRONTEND_URL=http://localhost:5173
   ```

4. **Start MongoDB**
   
   Make sure MongoDB is running on your system:
   ```bash
   # If using local MongoDB
   mongod
   
   # Or use MongoDB Atlas (cloud)
   # Update MONGODB_URI in .env with your Atlas connection string
   ```

5. **Run the server**
   
   Development mode (with auto-reload):
   ```bash
   npm run dev
   ```
   
   Production mode:
   ```bash
   npm start
   ```

## API Documentation

Base URL: `http://localhost:5000/api`

All protected routes require `Authorization: Bearer <access_token>` header.

### Authentication (`/api/auth/`)

#### Login
```http
POST /api/auth/login/
Content-Type: application/json

{
  "username": "admin",
  "password": "password123"
}
```

**Response:**
```json
{
  "access": "eyJhbGc...",
  "refresh": "eyJhbGc...",
  "must_change_password": false,
  "user": {
    "id": "...",
    "username": "admin",
    "email": "admin@docmind.com",
    "role": "SUPER_ADMIN",
    "login_count": 5
  }
}
```

#### Refresh Token
```http
POST /api/auth/token/refresh/
Content-Type: application/json

{
  "refresh": "eyJhbGc..."
}
```

#### Get Profile
```http
GET /api/auth/me/
Authorization: Bearer <access_token>
```

#### Update Profile
```http
PATCH /api/auth/me/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "department": "Engineering"
}
```

#### Change Password
```http
POST /api/auth/change-password/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "old_password": "oldpass123",
  "new_password": "NewPass123!"
}
```

### Onboarding (`/api/auth/onboarding-requests/`)

#### Create Request
```http
POST /api/auth/onboarding-requests/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "email": "newuser@example.com",
  "full_name": "New User",
  "requested_role": "ANALYST",
  "department": "Research"
}
```

#### List Requests (SUPER_ADMIN only)
```http
GET /api/auth/onboarding-requests/
Authorization: Bearer <access_token>
```

#### Approve/Reject Request (SUPER_ADMIN only)
```http
POST /api/auth/onboarding-requests/:id/decide/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "action": "APPROVE",
  "remark": "Approved for analyst role"
}
```

### Document Ingestion (`/api/ingestion/`)

#### Upload Document (SENIOR_ANALYST or SUPER_ADMIN only)
```http
POST /api/ingestion/upload/
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

title: "Water Quality Report"
description: "Q4 2024 analysis"
classification: "CONFIDENTIAL"
file: <binary file data>
```

**Supported file types:**
- Documents: PDF, DOCX, TXT
- Images: JPG, JPEG, PNG
- Audio: WAV, MP3, M4A, FLAC, OGG, AAC, WMA, OPUS, WEBM, MP4

#### Get Job Status
```http
GET /api/ingestion/jobs/:jobId/
Authorization: Bearer <access_token>
```

### Indexing (`/api/indexes/`)

#### Rebuild Index (SUPER_ADMIN or IT_ADMIN only)
```http
POST /api/indexes/rebuild/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "modality": "text",
  "mode": "full",
  "notes": "Monthly index rebuild"
}
```

#### List Snapshots
```http
GET /api/indexes/snapshots/?modality=text
Authorization: Bearer <access_token>
```

### Projects (`/api/projects/`)

#### List Projects
```http
GET /api/projects/
Authorization: Bearer <access_token>
```

#### Create Project
```http
POST /api/projects/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Water Quality Analysis",
  "description": "Analyzing water samples from various sources",
  "members": ["user_id_1", "user_id_2"]
}
```

#### Update Project
```http
PATCH /api/projects/:id/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Updated Project Name"
}
```

#### Delete Project
```http
DELETE /api/projects/:id/
Authorization: Bearer <access_token>
```

### Chat Sessions (`/api/chat-sessions/`)

#### List Chat Sessions
```http
GET /api/chat-sessions/?project=:projectId
Authorization: Bearer <access_token>
```

#### Create Chat Session
```http
POST /api/chat-sessions/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "project": "project_id",
  "title": "Analysis Discussion"
}
```

### Chat Messages (`/api/chat-messages/`)

#### List Messages
```http
GET /api/chat-messages/?session=:sessionId
Authorization: Bearer <access_token>
```

#### Send Message (triggers AI response)
```http
POST /api/chat-messages/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "session": "session_id",
  "content": "What are the key findings in the water quality report?"
}
```

**Response:**
```json
{
  "user": {
    "id": "...",
    "content": "What are the key findings?",
    "role": "USER",
    "timestamp": "2025-12-09T10:30:00Z"
  },
  "assistant": {
    "id": "...",
    "content": "Based on the documents, the key findings show...",
    "role": "ASSISTANT",
    "timestamp": "2025-12-09T10:30:05Z",
    "citations": [
      {
        "document_id": "...",
        "document_name": "water_report.pdf",
        "page_number": 3,
        "excerpt": "pH levels ranged from 8.2 to 9.1"
      }
    ]
  }
}
```

## Project Structure

```
backend-docmind/
├── src/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── models/
│   │   ├── User.js               # User model with authentication
│   │   ├── OnboardingRequest.js  # Onboarding workflow
│   │   ├── Project.js            # Project management
│   │   ├── IngestionDocument.js  # Document storage
│   │   ├── ChatSession.js        # Chat sessions
│   │   ├── Message.js            # Chat messages
│   │   ├── Job.js                # Async job tracking
│   │   └── IndexSnapshot.js      # Search index snapshots
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── onboardingController.js
│   │   ├── ingestionController.js
│   │   ├── indexingController.js
│   │   ├── projectController.js
│   │   ├── chatSessionController.js
│   │   └── messageController.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── ingestion.js
│   │   ├── indexing.js
│   │   ├── projects.js
│   │   ├── chatSessions.js
│   │   └── messages.js
│   ├── middleware/
│   │   ├── auth.js               # JWT authentication
│   │   ├── upload.js             # File upload handling
│   │   ├── errorHandler.js       # Error handling
│   │   └── validator.js          # Input validation
│   ├── services/
│   │   └── aiService.js          # AI integration (placeholder)
│   └── server.js                 # Main application entry
├── uploads/                      # Uploaded files
├── indexes/                      # Search index files
├── .env                          # Environment variables
├── .env.example                  # Environment template
├── .gitignore
├── package.json
└── README.md
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/docmind` |
| `JWT_SECRET` | JWT access token secret | - |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | - |
| `JWT_ACCESS_EXPIRY` | Access token expiry | `30m` |
| `JWT_REFRESH_EXPIRY` | Refresh token expiry | `7d` |
| `UPLOAD_DIR` | File upload directory | `./uploads` |
| `MAX_FILE_SIZE` | Max file size in bytes | `52428800` (50MB) |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |

## User Roles

- **SUPER_ADMIN**: Full system access, can manage users and all resources
- **IT_ADMIN**: Can manage indexes and technical configurations
- **SENIOR_ANALYST**: Can upload documents and perform analysis
- **ANALYST**: Can view and analyze documents
- **VIEWER**: Read-only access

## Development

### Running in Development Mode

```bash
npm run dev
```

This uses `nodemon` to automatically restart the server on file changes.

### Creating the First Admin User

Since there's no signup endpoint, you'll need to create the first admin user directly in MongoDB:

```javascript
// Connect to MongoDB and run this in mongo shell or MongoDB Compass
db.users.insertOne({
  username: "admin",
  email: "admin@docmind.com",
  password: "$2a$10$YourHashedPasswordHere", // Use bcrypt to hash
  first_name: "Admin",
  last_name: "User",
  role: "SUPER_ADMIN",
  department: "Administration",
  login_count: 0,
  must_change_password: false,
  created_at: new Date(),
  updated_at: new Date()
})
```

Or use the onboarding system after creating one admin manually.

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Use strong JWT secrets
3. Configure MongoDB Atlas for production database
4. Set up proper CORS origins
5. Use environment-specific configuration
6. Enable HTTPS
7. Set up proper logging and monitoring
8. Configure file storage to use cloud services (S3, Azure Blob)

## AI Service Integration

The current implementation includes a placeholder AI service. To integrate a real AI service:

1. Open `src/services/aiService.js`
2. Replace the `generateResponse` method with your AI API calls
3. Implement OCR, Whisper, and CLIP integrations in the respective methods
4. Add your AI API keys to `.env`

Example for OpenAI integration:
```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.AI_API_KEY
});

async generateResponse(query, projectId) {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: query }]
  });
  
  return {
    content: response.choices[0].message.content,
    citations: [] // Add citation logic
  };
}
```

## License

ISC

## Support

For issues and questions, please contact the development team.
