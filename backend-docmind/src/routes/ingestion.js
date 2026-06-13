import express from 'express';
import { body } from 'express-validator';
import * as ingestionController from '../controllers/ingestionController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import upload, { handleUploadError } from '../middleware/upload.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

// Upload document
router.post('/upload/', [
    authenticate,
    requireRole('SENIOR_ANALYST', 'SUPER_ADMIN'),
    upload.single('file'),
    handleUploadError,
    body('title').notEmpty().withMessage('Title is required'),
    body('classification').optional().isIn(['PUBLIC', 'RESTRICTED', 'CONFIDENTIAL', 'TOP_SECRET'])
        .withMessage('Invalid classification'),
    validate
], ingestionController.uploadDocument);

// Get job status
router.get('/jobs/:jobId/', authenticate, ingestionController.getJobStatus);

export default router;
