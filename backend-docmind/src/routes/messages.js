import express from 'express';
import { body } from 'express-validator';
import * as messageController from '../controllers/messageController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

// List messages
router.get('/', authenticate, messageController.listMessages);

// Send message
router.post('/', [
    authenticate,
    body('session').notEmpty().withMessage('Session ID is required'),
    body('content').notEmpty().withMessage('Message content is required'),
    validate
], messageController.sendMessage);

// Update message
router.patch('/:id/', authenticate, messageController.updateMessage);

// Delete message
router.delete('/:id/', authenticate, messageController.deleteMessage);

export default router;
