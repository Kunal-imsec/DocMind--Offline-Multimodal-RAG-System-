import Project from '../models/Project.js';
import ChatSession from '../models/ChatSession.js';
import IngestionDocument from '../models/IngestionDocument.js';

/**
 * @route   GET /api/projects/
 * @desc    List all projects for authenticated user
 * @access  Private
 */
export const listProjects = async (req, res, next) => {
    try {
        // Find projects where user is owner or member
        const projects = await Project.find({
            $or: [
                { owner: req.user._id },
                { members: req.user._id }
            ]
        })
            .sort({ created_at: -1 })
            .populate('owner', 'username email')
            .populate('members', 'username email');

        res.json(projects);
    } catch (error) {
        next(error);
    }
};

/**
 * @route   GET /api/projects/:id/
 * @desc    Get single project
 * @access  Private
 */
export const getProject = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('owner', 'username email')
            .populate('members', 'username email');

        if (!project) {
            return res.status(404).json({
                status: 404,
                data: {
                    detail: 'Project not found'
                }
            });
        }

        // Check if user has access
        const hasAccess = project.members.some(
            member => member._id.toString() === req.user._id.toString()
        ) || project.owner._id.toString() === req.user._id.toString();

        if (!hasAccess) {
            return res.status(403).json({
                status: 403,
                data: {
                    detail: 'You do not have access to this project'
                }
            });
        }

        // Get counts
        const document_count = await IngestionDocument.countDocuments({ project_id: project._id });
        const chat_count = await ChatSession.countDocuments({ project: project._id });

        res.json({
            ...project.toObject(),
            document_count,
            chat_count
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   POST /api/projects/
 * @desc    Create new project
 * @access  Private
 */
export const createProject = async (req, res, next) => {
    try {
        const { name, description, members } = req.body;

        if (!name) {
            return res.status(400).json({
                status: 400,
                data: {
                    detail: 'Project name is required'
                }
            });
        }

        // Create project with owner
        const project = await Project.create({
            name,
            description: description || '',
            owner: req.user._id,
            members: [req.user._id, ...(members || [])]
        });

        await project.populate('owner', 'username email');
        await project.populate('members', 'username email');

        res.status(201).json(project);
    } catch (error) {
        next(error);
    }
};

/**
 * @route   PUT /api/projects/:id/
 * @desc    Full update project
 * @access  Private
 */
export const updateProject = async (req, res, next) => {
    try {
        const { name, description, members, is_archived } = req.body;

        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                status: 404,
                data: {
                    detail: 'Project not found'
                }
            });
        }

        // Check if user is owner
        if (project.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                status: 403,
                data: {
                    detail: 'Only project owner can update the project'
                }
            });
        }

        // Update fields
        project.name = name || project.name;
        project.description = description !== undefined ? description : project.description;
        project.is_archived = is_archived !== undefined ? is_archived : project.is_archived;

        if (members) {
            // Ensure owner is always in members
            const memberSet = new Set([project.owner.toString(), ...members]);
            project.members = Array.from(memberSet);
        }

        await project.save();
        await project.populate('owner', 'username email');
        await project.populate('members', 'username email');

        res.json(project);
    } catch (error) {
        next(error);
    }
};

/**
 * @route   PATCH /api/projects/:id/
 * @desc    Partial update project
 * @access  Private
 */
export const patchProject = async (req, res, next) => {
    try {
        const updates = req.body;

        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                status: 404,
                data: {
                    detail: 'Project not found'
                }
            });
        }

        // Check if user is owner
        if (project.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                status: 403,
                data: {
                    detail: 'Only project owner can update the project'
                }
            });
        }

        // Apply updates
        Object.keys(updates).forEach(key => {
            if (key === 'members') {
                // Ensure owner is always in members
                const memberSet = new Set([project.owner.toString(), ...updates.members]);
                project.members = Array.from(memberSet);
            } else if (key !== 'owner') { // Prevent changing owner
                project[key] = updates[key];
            }
        });

        await project.save();
        await project.populate('owner', 'username email');
        await project.populate('members', 'username email');

        res.json(project);
    } catch (error) {
        next(error);
    }
};

/**
 * @route   DELETE /api/projects/:id/
 * @desc    Delete project
 * @access  Private
 */
export const deleteProject = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                status: 404,
                data: {
                    detail: 'Project not found'
                }
            });
        }

        // Check if user is owner
        if (project.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                status: 403,
                data: {
                    detail: 'Only project owner can delete the project'
                }
            });
        }

        // Delete project (cascade will handle related data)
        await project.deleteOne();

        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

/**
 * @route   GET /api/projects/:id/documents/
 * @desc    Get all documents for a project
 * @access  Private
 */
export const getProjectDocuments = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                status: 404,
                data: {
                    detail: 'Project not found'
                }
            });
        }

        // Check if user has access
        const hasAccess = project.members.some(
            member => member.toString() === req.user._id.toString()
        ) || project.owner.toString() === req.user._id.toString();

        if (!hasAccess) {
            return res.status(403).json({
                status: 403,
                data: {
                    detail: 'You do not have access to this project'
                }
            });
        }

        // Fetch all documents for this project
        const documents = await IngestionDocument.find({ project_id: project._id })
            .populate('uploaded_by', 'username email')
            .sort({ uploaded_at: -1 });

        res.json(documents);
    } catch (error) {
        next(error);
    }
};
