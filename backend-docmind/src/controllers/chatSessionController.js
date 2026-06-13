import ChatSession from '../models/ChatSession.js';
import Project from '../models/Project.js';
import Message from '../models/Message.js';

/**
 * @route   GET /api/chat-sessions/?project=:projectId
 * @desc    List chat sessions for a project
 * @access  Private
 */
export const listChatSessions = async (req, res, next) => {
    try {
        const { project } = req.query;

        if (!project) {
            return res.status(400).json({
                status: 400,
                data: {
                    detail: 'Project ID is required'
                }
            });
        }

        // Check if user has access to project
        const projectDoc = await Project.findById(project);
        if (!projectDoc) {
            return res.status(404).json({
                status: 404,
                data: {
                    detail: 'Project not found'
                }
            });
        }

        const hasAccess = projectDoc.members.some(
            member => member.toString() === req.user._id.toString()
        ) || projectDoc.owner.toString() === req.user._id.toString();

        if (!hasAccess) {
            return res.status(403).json({
                status: 403,
                data: {
                    detail: 'You do not have access to this project'
                }
            });
        }

        const sessions = await ChatSession.find({ project })
            .sort({ last_activity_at: -1 })
            .populate('created_by', 'username email')
            .populate('project', 'name');

        // Get message counts
        const sessionsWithCounts = await Promise.all(
            sessions.map(async (session) => {
                const message_count = await Message.countDocuments({ session: session._id });
                return {
                    ...session.toObject(),
                    message_count
                };
            })
        );

        res.json(sessionsWithCounts);
    } catch (error) {
        next(error);
    }
};

/**
 * @route   POST /api/chat-sessions/
 * @desc    Create new chat session
 * @access  Private
 */
export const createChatSession = async (req, res, next) => {
    try {
        const { project, title } = req.body;

        if (!project) {
            return res.status(400).json({
                status: 400,
                data: {
                    detail: 'Project ID is required'
                }
            });
        }

        // Check if user has access to project
        const projectDoc = await Project.findById(project);
        if (!projectDoc) {
            return res.status(404).json({
                status: 404,
                data: {
                    detail: 'Project not found'
                }
            });
        }

        const hasAccess = projectDoc.members.some(
            member => member.toString() === req.user._id.toString()
        ) || projectDoc.owner.toString() === req.user._id.toString();

        if (!hasAccess) {
            return res.status(403).json({
                status: 403,
                data: {
                    detail: 'You do not have access to this project'
                }
            });
        }

        const session = await ChatSession.create({
            project,
            title: title || 'New Chat',
            created_by: req.user._id
        });

        await session.populate('created_by', 'username email');
        await session.populate('project', 'name');

        res.status(201).json(session);
    } catch (error) {
        next(error);
    }
};

/**
 * @route   PATCH /api/chat-sessions/:id/
 * @desc    Update chat session
 * @access  Private
 */
export const updateChatSession = async (req, res, next) => {
    try {
        const { title, status } = req.body;

        const session = await ChatSession.findById(req.params.id);

        if (!session) {
            return res.status(404).json({
                status: 404,
                data: {
                    detail: 'Chat session not found'
                }
            });
        }

        // Check if user has access to project
        const project = await Project.findById(session.project);
        const hasAccess = project.members.some(
            member => member.toString() === req.user._id.toString()
        ) || project.owner.toString() === req.user._id.toString();

        if (!hasAccess) {
            return res.status(403).json({
                status: 403,
                data: {
                    detail: 'You do not have access to this chat session'
                }
            });
        }

        if (title !== undefined) session.title = title;
        if (status !== undefined) session.status = status;

        await session.save();
        await session.populate('created_by', 'username email');
        await session.populate('project', 'name');

        res.json(session);
    } catch (error) {
        next(error);
    }
};

/**
 * @route   DELETE /api/chat-sessions/:id/
 * @desc    Delete chat session
 * @access  Private
 */
export const deleteChatSession = async (req, res, next) => {
    try {
        const session = await ChatSession.findById(req.params.id);

        if (!session) {
            return res.status(404).json({
                status: 404,
                data: {
                    detail: 'Chat session not found'
                }
            });
        }

        // Check if user has access to project
        const project = await Project.findById(session.project);
        const hasAccess = project.members.some(
            member => member.toString() === req.user._id.toString()
        ) || project.owner.toString() === req.user._id.toString();

        if (!hasAccess) {
            return res.status(403).json({
                status: 403,
                data: {
                    detail: 'You do not have access to this chat session'
                }
            });
        }

        // Delete session (cascade will handle messages)
        await session.deleteOne();

        res.status(204).send();
    } catch (error) {
        next(error);
    }
};
