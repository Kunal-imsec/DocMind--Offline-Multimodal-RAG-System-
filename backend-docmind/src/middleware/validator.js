import { validationResult } from 'express-validator';

// Middleware to handle validation results
export const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const fieldErrors = {};
        errors.array().forEach(error => {
            if (!fieldErrors[error.path]) {
                fieldErrors[error.path] = [];
            }
            fieldErrors[error.path].push(error.msg);
        });

        return res.status(400).json({
            status: 400,
            data: {
                detail: 'Validation failed',
                field_errors: fieldErrors
            }
        });
    }

    next();
};

// Password validation rules
export const passwordRules = {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecialChar: true
};

export const validatePassword = (password) => {
    const errors = [];

    if (password.length < passwordRules.minLength) {
        errors.push(`Password must be at least ${passwordRules.minLength} characters`);
    }

    if (passwordRules.requireUppercase && !/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }

    if (passwordRules.requireLowercase && !/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }

    if (passwordRules.requireNumber && !/\d/.test(password)) {
        errors.push('Password must contain at least one number');
    }

    if (passwordRules.requireSpecialChar && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }

    return errors;
};
