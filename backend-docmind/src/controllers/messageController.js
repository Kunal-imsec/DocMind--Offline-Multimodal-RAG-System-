import Message from '../models/Message.js';
import ChatSession from '../models/ChatSession.js';
import Project from '../models/Project.js';
import aiService from '../services/aiService.js';

/**
 * @route   GET /api/chat-messages/?session=:chatId
 * @desc    Get all messages in a chat session
 * @access  Private
 */
export const listMessages = async (req, res, next) => {
    try {
        const { session } = req.query;

        if (!session) {
            return res.status(400).json({
                status: 400,
                data: {
                    detail: 'Session ID is required'
                }
            });
        }

        // Check if session exists and user has access
        const chatSession = await ChatSession.findById(session).populate('project');
        if (!chatSession) {
            return res.status(404).json({
                status: 404,
                data: {
                    detail: 'Chat session not found'
                }
            });
        }

        const project = await Project.findById(chatSession.project._id);
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

        const messages = await Message.find({ session })
            .sort({ timestamp: 1 })
            .populate('sender', 'username email')
            .populate('citations.document_id', 'title filename');

        res.json(messages);
    } catch (error) {
        next(error);
    }
};

/**
 * @route   POST /api/chat-messages/
 * @desc    Send message (triggers AI response)
 * @access  Private
 */
export const sendMessage = async (req, res, next) => {
    try {
        const { session, content, metadata } = req.body;

        if (!session || !content) {
            return res.status(400).json({
                status: 400,
                data: {
                    detail: 'Session ID and content are required'
                }
            });
        }

        // Check if session exists and user has access
        const chatSession = await ChatSession.findById(session).populate('project');
        if (!chatSession) {
            return res.status(404).json({
                status: 404,
                data: {
                    detail: 'Chat session not found'
                }
            });
        }

        const project = await Project.findById(chatSession.project._id);
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

        // Create user message
        const userMessage = await Message.create({
            session,
            role: 'USER',
            content,
            sender: req.user._id,
            metadata: metadata || null
        });

        await userMessage.populate('sender', 'username email');

        // Generate AI response
        try {
            const aiResponse = await aiService.generateResponse(content, chatSession.project._id);

            // Create assistant message
            const assistantMessage = await Message.create({
                session,
                role: 'ASSISTANT',
                content: aiResponse.content,
                sender: null,
                citations: aiResponse.citations || []
            });

            await assistantMessage.populate('citations.document_id', 'title filename');

            // Update chat session last activity
            chatSession.last_activity_at = new Date();
            await chatSession.save();

            // Return both messages
            res.json({
                user: userMessage,
                assistant: assistantMessage
            });
        } catch (error) {
            console.error('AI Response Error:', error);

            // Create error message
            const errorMessage = await Message.create({
                session,
                role: 'SYSTEM',
                content: 'Sorry, I encountered an error processing your request. Please try again.',
                sender: null
            });

            res.json({
                user: userMessage,
                assistant: errorMessage
            });
        }
    } catch (error) {
        next(error);
    }
};

/**
 * @route   PATCH /api/chat-messages/:id/
 * @desc    Update message
 * @access  Private
 */
export const updateMessage = async (req, res, next) => {
    try {
        const { content, metadata } = req.body;

        const message = await Message.findById(req.params.id);

        if (!message) {
            return res.status(404).json({
                status: 404,
                data: {
                    detail: 'Message not found'
                }
            });
        }

        // Only allow updating own messages
        if (message.sender && message.sender.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                status: 403,
                data: {
                    detail: 'You can only update your own messages'
                }
            });
        }

        if (content !== undefined) message.content = content;
        if (metadata !== undefined) message.metadata = metadata;

        await message.save();
        await message.populate('sender', 'username email');

        res.json(message);
    } catch (error) {
        next(error);
    }
};

/**
 * @route   DELETE /api/chat-messages/:id/
 * @desc    Delete message
 * @access  Private
 */
export const deleteMessage = async (req, res, next) => {
    try {
        const message = await Message.findById(req.params.id);

        if (!message) {
            return res.status(404).json({
                status: 404,
                data: {
                    detail: 'Message not found'
                }
            });
        }

        // Only allow deleting own messages
        if (message.sender && message.sender.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                status: 403,
                data: {
                    detail: 'You can only delete your own messages'
                }
            });
        }

        await message.deleteOne();

        res.status(204).send();
    } catch (error) {
        next(error);
    }
};
