import express from 'express';
import { body } from 'express-validator';
import * as chatSessionController from '../controllers/chatSessionController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

// List chat sessions
router.get('/', authenticate, chatSessionController.listChatSessions);

// Create chat session
router.post('/', [
    authenticate,
    body('project').notEmpty().withMessage('Project ID is required'),
    validate
], chatSessionController.createChatSession);

// Update chat session
router.patch('/:id/', authenticate, chatSessionController.updateChatSession);

// Delete chat session
router.delete('/:id/', authenticate, chatSessionController.deleteChatSession);

export default router;
