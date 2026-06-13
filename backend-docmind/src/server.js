import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

// Import routes
import authRoutes from './routes/auth.js';
import ingestionRoutes from './routes/ingestion.js';
import indexingRoutes from './routes/indexing.js';
import projectRoutes from './routes/projects.js';
import chatSessionRoutes from './routes/chatSessions.js';
import messageRoutes from './routes/messages.js';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'DocMind Backend API is running',
        timestamp: new Date().toISOString()
    });
});

// API Routes (all with /api prefix)
app.use('/api/auth', authRoutes);
app.use('/api/ingestion', ingestionRoutes);
app.use('/api/indexes', indexingRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/chat-sessions', chatSessionRoutes);
app.use('/api/chat-messages', messageRoutes);

// 404 handler
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   DocMind Backend API Server                              ║
║                                                           ║
║   Server running on port ${PORT}                              ║
║   Environment: ${process.env.NODE_ENV || 'development'}                           ║
║                                                           ║
║   API Base URL: http://localhost:${PORT}/api                 ║
║   Health Check: http://localhost:${PORT}/health              ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
    // Close server & exit process
    process.exit(1);
});

export default app;
