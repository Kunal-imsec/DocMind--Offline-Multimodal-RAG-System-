import express from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/authController.js';
import * as onboardingController from '../controllers/onboardingController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

// Auth routes
router.post('/signup/', [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    validate
], authController.signup);

router.post('/login/', [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
    validate
], authController.login);

router.post('/token/refresh/', [
    body('refresh').notEmpty().withMessage('Refresh token is required'),
    validate
], authController.refreshToken);

router.get('/me/', authenticate, authController.getMe);

router.patch('/me/', authenticate, authController.updateMe);

router.post('/change-password/', [
    authenticate,
    body('old_password').notEmpty().withMessage('Old password is required'),
    body('new_password').notEmpty().withMessage('New password is required'),
    validate
], authController.changePassword);

// Onboarding routes
router.post('/onboarding-requests/', [
    authenticate,
    body('email').isEmail().withMessage('Valid email is required'),
    body('full_name').notEmpty().withMessage('Full name is required'),
    body('requested_role').isIn(['SUPER_ADMIN', 'IT_ADMIN', 'SENIOR_ANALYST', 'ANALYST', 'VIEWER'])
        .withMessage('Invalid role'),
    body('department').notEmpty().withMessage('Department is required'),
    validate
], onboardingController.createOnboardingRequest);

router.get('/onboarding-requests/',
    authenticate,
    requireRole('SUPER_ADMIN'),
    onboardingController.listOnboardingRequests
);

router.get('/onboarding-requests/:id/',
    authenticate,
    requireRole('SUPER_ADMIN'),
    onboardingController.getOnboardingRequest
);

router.post('/onboarding-requests/:id/decide/', [
    authenticate,
    requireRole('SUPER_ADMIN'),
    body('action').isIn(['APPROVE', 'REJECT']).withMessage('Action must be APPROVE or REJECT'),
    validate
], onboardingController.decideOnboardingRequest);

export default router;
