import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Verify JWT token and attach user to request
export const authenticate = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                status: 401,
                data: {
                    detail: 'No authentication token provided'
                }
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from database
            const user = await User.findById(decoded.userId);

            if (!user) {
                return res.status(401).json({
                    status: 401,
                    data: {
                        detail: 'User not found'
                    }
                });
            }

            // Attach user to request
            req.user = user;
            next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    status: 401,
                    data: {
                        detail: 'Token expired'
                    }
                });
            }

            return res.status(401).json({
                status: 401,
                data: {
                    detail: 'Invalid token'
                }
            });
        }
    } catch (error) {
        return res.status(500).json({
            status: 500,
            data: {
                detail: 'Authentication error'
            }
        });
    }
};

// Check if user has required role
export const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                status: 401,
                data: {
                    detail: 'Authentication required'
                }
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                status: 403,
                data: {
                    detail: 'Insufficient permissions'
                }
            });
        }

        next();
    };
};

// Check if user is project member
export const isProjectMember = async (req, res, next) => {
    try {
        const projectId = req.params.projectId || req.body.project;

        if (!projectId) {
            return res.status(400).json({
                status: 400,
                data: {
                    detail: 'Project ID is required'
                }
            });
        }

        const Project = (await import('../models/Project.js')).default;
        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({
                status: 404,
                data: {
                    detail: 'Project not found'
                }
            });
        }

        // Check if user is owner or member
        const isMember = project.members.some(
            memberId => memberId.toString() === req.user._id.toString()
        );

        if (!isMember && project.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                status: 403,
                data: {
                    detail: 'You are not a member of this project'
                }
            });
        }

        req.project = project;
        next();
    } catch (error) {
        return res.status(500).json({
            status: 500,
            data: {
                detail: 'Error checking project membership'
            }
        });
    }
};
