import express from 'express';
import { body } from 'express-validator';
import * as projectController from '../controllers/projectController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

// List all projects
router.get('/', authenticate, projectController.listProjects);

// Get single project
router.get('/:id/', authenticate, projectController.getProject);

// Get project documents
router.get('/:id/documents/', authenticate, projectController.getProjectDocuments);

// Create project
router.post('/', [
    authenticate,
    body('name').notEmpty().withMessage('Project name is required'),
    validate
], projectController.createProject);

// Full update project
router.put('/:id/', authenticate, projectController.updateProject);

// Partial update project
router.patch('/:id/', authenticate, projectController.patchProject);

// Delete project
router.delete('/:id/', authenticate, projectController.deleteProject);

export default router;
