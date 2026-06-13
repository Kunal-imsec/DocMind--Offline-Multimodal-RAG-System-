import OnboardingRequest from '../models/OnboardingRequest.js';
import User from '../models/User.js';
import { validatePassword } from '../middleware/validator.js';

/**
 * @route   POST /api/auth/onboarding-requests/
 * @desc    Create onboarding request
 * @access  Private
 */
export const createOnboardingRequest = async (req, res, next) => {
    try {
        const { email, full_name, requested_role, department } = req.body;

        // Validate input
        if (!email || !full_name || !requested_role || !department) {
            return res.status(400).json({
                status: 400,
                data: {
                    detail: 'All fields are required'
                }
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                status: 400,
                data: {
                    detail: 'User with this email already exists'
                }
            });
        }

        // Check if request already exists
        const existingRequest = await OnboardingRequest.findOne({
            email,
            status: 'PENDING'
        });
        if (existingRequest) {
            return res.status(400).json({
                status: 400,
                data: {
                    detail: 'Onboarding request already pending for this email'
                }
            });
        }

        // Create request
        const request = await OnboardingRequest.create({
            email,
            full_name,
            requested_role,
            department
        });

        res.status(201).json(request);
    } catch (error) {
        next(error);
    }
};

/**
 * @route   GET /api/auth/onboarding-requests/
 * @desc    List all onboarding requests
 * @access  Private (SUPER_ADMIN only)
 */
export const listOnboardingRequests = async (req, res, next) => {
    try {
        const requests = await OnboardingRequest.find()
            .sort({ created_at: -1 })
            .populate('decided_by', 'username email');

        res.json(requests);
    } catch (error) {
        next(error);
    }
};

/**
 * @route   GET /api/auth/onboarding-requests/:id/
 * @desc    Get single onboarding request
 * @access  Private (SUPER_ADMIN only)
 */
export const getOnboardingRequest = async (req, res, next) => {
    try {
        const request = await OnboardingRequest.findById(req.params.id)
            .populate('decided_by', 'username email');

        if (!request) {
            return res.status(404).json({
                status: 404,
                data: {
                    detail: 'Onboarding request not found'
                }
            });
        }

        res.json(request);
    } catch (error) {
        next(error);
    }
};

/**
 * @route   POST /api/auth/onboarding-requests/:id/decide/
 * @desc    Approve or reject onboarding request
 * @access  Private (SUPER_ADMIN only)
 */
export const decideOnboardingRequest = async (req, res, next) => {
    try {
        const { action, remark } = req.body;

        if (!action || !['APPROVE', 'REJECT'].includes(action)) {
            return res.status(400).json({
                status: 400,
                data: {
                    detail: 'Action must be either APPROVE or REJECT'
                }
            });
        }

        const request = await OnboardingRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({
                status: 404,
                data: {
                    detail: 'Onboarding request not found'
                }
            });
        }

        if (request.status !== 'PENDING') {
            return res.status(400).json({
                status: 400,
                data: {
                    detail: 'This request has already been processed'
                }
            });
        }

        // Update request
        request.status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
        request.remark = remark || '';
        request.decided_by = req.user._id;
        request.decided_at = new Date();
        await request.save();

        // If approved, create user
        if (action === 'APPROVE') {
            // Generate temporary password
            const tempPassword = Math.random().toString(36).slice(-10) + 'A1!';

            // Split full name
            const nameParts = request.full_name.trim().split(' ');
            const first_name = nameParts[0];
            const last_name = nameParts.slice(1).join(' ');

            // Create username from email
            const username = request.email.split('@')[0];

            const user = await User.create({
                username,
                email: request.email,
                password: tempPassword,
                first_name,
                last_name,
                role: request.requested_role,
                department: request.department,
                must_change_password: true
            });

            // TODO: Send email with temporary password
            console.log(`
        ========================================
        NEW USER CREATED
        ========================================
        Email: ${user.email}
        Username: ${user.username}
        Temporary Password: ${tempPassword}
        Role: ${user.role}
        ========================================
        Please send this information to the user.
        They must change their password on first login.
        ========================================
      `);

            return res.json({
                detail: 'Onboarding request approved and user created',
                request,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                },
                temporary_password: tempPassword // Remove in production
            });
        }

        res.json({
            detail: 'Onboarding request rejected',
            request
        });
    } catch (error) {
        next(error);
    }
};
