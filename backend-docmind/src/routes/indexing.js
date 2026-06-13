import express from 'express';
import { body } from 'express-validator';
import * as indexingController from '../controllers/indexingController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

// Rebuild index
router.post('/rebuild/', [
    authenticate,
    requireRole('SUPER_ADMIN', 'IT_ADMIN'),
    body('modality').isIn(['text', 'image', 'audio']).withMessage('Modality must be text, image, or audio'),
    body('mode').optional().isIn(['full', 'incremental']).withMessage('Mode must be full or incremental'),
    validate
], indexingController.rebuildIndex);

// List snapshots
router.get('/snapshots/', authenticate, indexingController.listSnapshots);

// Activate snapshot
router.post('/snapshots/:id/activate/',
    authenticate,
    requireRole('SUPER_ADMIN', 'IT_ADMIN'),
    indexingController.activateSnapshot
);

export default router;
