// Global error handler middleware
export const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const fieldErrors = {};
        Object.keys(err.errors).forEach(key => {
            fieldErrors[key] = [err.errors[key].message];
        });

        return res.status(400).json({
            status: 400,
            data: {
                detail: 'Validation error',
                field_errors: fieldErrors
            }
        });
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return res.status(400).json({
            status: 400,
            data: {
                detail: `${field} already exists`,
                field_errors: {
                    [field]: [`This ${field} is already in use`]
                }
            }
        });
    }

    // Mongoose cast error (invalid ObjectId)
    if (err.name === 'CastError') {
        return res.status(400).json({
            status: 400,
            data: {
                detail: 'Invalid ID format'
            }
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            status: 401,
            data: {
                detail: 'Invalid token'
            }
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            status: 401,
            data: {
                detail: 'Token expired'
            }
        });
    }

    // Default error
    const status = err.status || 500;
    res.status(status).json({
        status: status,
        data: {
            detail: err.message || 'Internal server error'
        }
    });
};

// 404 handler
export const notFound = (req, res) => {
    res.status(404).json({
        status: 404,
        data: {
            detail: 'Route not found'
        }
    });
};
