import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { validatePassword } from '../middleware/validator.js';

// Generate JWT tokens
const generateTokens = (userId) => {
    const accessToken = jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRY || '30m' }
    );

    const refreshToken = jwt.sign(
        { userId },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
    );

    return { accessToken, refreshToken };
};

// Calculate token expiry time
const getAccessExpiresAt = () => {
    const expiryMinutes = parseInt(process.env.JWT_ACCESS_EXPIRY) || 30;
    return new Date(Date.now() + expiryMinutes * 60 * 1000);
};

/**
 * @route   POST /api/auth/signup/
 * @desc    Register new user
 * @access  Public
 */
export const signup = async (req, res, next) => {
    try {
        console.log('=== SIGNUP REQUEST ===');
        console.log('Request body:', JSON.stringify(req.body, null, 2));

        let { email, password, first_name, last_name, full_name, name, department } = req.body;

        // Handle 'full_name' or 'name' field
        const nameToUse = full_name || name;

        if (nameToUse && !first_name && !last_name) {
            console.log('Splitting name:', nameToUse);
            // Split name into first and last name
            const nameParts = nameToUse.trim().split(/\s+/);
            first_name = nameParts[0] || '';
            last_name = nameParts.slice(1).join(' ') || nameParts[0]; // Use first name as last if only one word
            console.log('Split result - first_name:', first_name, 'last_name:', last_name);
        }

        // Validate required fields
        if (!email || !password || !first_name || !last_name) {
            console.log('Validation failed - email:', !!email, 'password:', !!password, 'first_name:', !!first_name, 'last_name:', !!last_name);
            return res.status(400).json({
                status: 400,
                data: {
                    detail: 'Email, password, and name are required'
                }
            });
        }

        // Generate username from full name (e.g., "John Doe" -> "johndoe")
        const username = `${first_name} ${last_name}`.toLowerCase().replace(/\s+/g, '');
        console.log('Generated username:', username);

        // Check if email already exists
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({
                status: 400,
                data: {
                    detail: 'Email already exists'
                }
            });
        }

        // Validate password
        const passwordErrors = validatePassword(password);
        if (passwordErrors.length > 0) {
            return res.status(400).json({
                status: 400,
                data: {
                    detail: 'Password does not meet requirements',
                    field_errors: {
                        password: passwordErrors
                    }
                }
            });
        }

        // Create new user with SUPER_ADMIN role
        const user = await User.create({
            username,
            email,
            password,
            first_name,
            last_name,
            department: department || '',
            role: 'SUPER_ADMIN',
            login_count: 0,
            must_change_password: false
        });

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user._id);

        // Return response with auto-login
        res.status(201).json({
            access: accessToken,
            refresh: refreshToken,
            must_change_password: false,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                login_count: user.login_count
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   POST /api/auth/login/
 * @desc    Login user
 * @access  Public
 */
export const login = async (req, res, next) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({
                status: 400,
                data: {
                    detail: 'Username and password are required'
                }
            });
        }

        // Find user
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({
                status: 401,
                data: {
                    detail: 'Invalid credentials'
                }
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                status: 401,
                data: {
                    detail: 'Invalid credentials'
                }
            });
        }

        // Update login count
        user.login_count += 1;
        await user.save();

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user._id);

        // Return response
        res.json({
            access: accessToken,
            refresh: refreshToken,
            must_change_password: user.must_change_password,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                login_count: user.login_count
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   POST /api/auth/token/refresh/
 * @desc    Refresh access token
 * @access  Public
 */
export const refreshToken = async (req, res, next) => {
    try {
        const { refresh } = req.body;

        if (!refresh) {
            return res.status(400).json({
                status: 400,
                data: {
                    detail: 'Refresh token is required'
                }
            });
        }

        try {
            // Verify refresh token
            const decoded = jwt.verify(refresh, process.env.JWT_REFRESH_SECRET);

            // Generate new access token
            const accessToken = jwt.sign(
                { userId: decoded.userId },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_ACCESS_EXPIRY || '30m' }
            );

            res.json({ access: accessToken });
        } catch (error) {
            return res.status(401).json({
                status: 401,
                data: {
                    detail: 'Invalid or expired refresh token'
                }
            });
        }
    } catch (error) {
        next(error);
    }
};

/**
 * @route   GET /api/auth/me/
 * @desc    Get current user profile
 * @access  Private
 */
export const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);

        res.json({
            id: user._id,
            username: user.username,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            department: user.department,
            access_expires_at: getAccessExpiresAt(),
            login_count: user.login_count
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   PATCH /api/auth/me/
 * @desc    Update user profile
 * @access  Private
 */
export const updateMe = async (req, res, next) => {
    try {
        const { first_name, last_name, department } = req.body;

        const user = await User.findById(req.user._id);

        if (first_name !== undefined) user.first_name = first_name;
        if (last_name !== undefined) user.last_name = last_name;
        if (department !== undefined) user.department = department;

        await user.save();

        res.json({
            id: user._id,
            username: user.username,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            department: user.department
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   POST /api/auth/change-password/
 * @desc    Change password
 * @access  Private
 */
export const changePassword = async (req, res, next) => {
    try {
        const { old_password, new_password } = req.body;

        if (!old_password || !new_password) {
            return res.status(400).json({
                status: 400,
                data: {
                    detail: 'Old password and new password are required'
                }
            });
        }

        const user = await User.findById(req.user._id);

        // Verify old password
        const isMatch = await user.comparePassword(old_password);
        if (!isMatch) {
            return res.status(400).json({
                status: 400,
                data: {
                    detail: 'Current password is incorrect'
                }
            });
        }

        // Validate new password
        const passwordErrors = validatePassword(new_password);
        if (passwordErrors.length > 0) {
            return res.status(400).json({
                status: 400,
                data: {
                    detail: 'Password does not meet requirements',
                    field_errors: {
                        new_password: passwordErrors
                    }
                }
            });
        }

        // Update password
        user.password = new_password;
        user.must_change_password = false;
        await user.save();

        res.json({
            detail: 'Password changed successfully'
        });
    } catch (error) {
        next(error);
    }
};
