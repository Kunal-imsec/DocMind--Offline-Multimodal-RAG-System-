import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Project name is required'],
        trim: true,
        maxlength: [200, 'Project name cannot exceed 200 characters']
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    is_archived: {
        type: Boolean,
        default: false
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for document count
projectSchema.virtual('document_count', {
    ref: 'IngestionDocument',
    localField: '_id',
    foreignField: 'project_id',
    count: true
});

// Virtual for chat count
projectSchema.virtual('chat_count', {
    ref: 'ChatSession',
    localField: '_id',
    foreignField: 'project',
    count: true
});

// Cascade delete chat sessions and documents when project is deleted
projectSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    try {
        // Delete all chat sessions (which will cascade delete messages)
        const ChatSession = mongoose.model('ChatSession');
        await ChatSession.deleteMany({ project: this._id });

        // Delete all documents
        const IngestionDocument = mongoose.model('IngestionDocument');
        await IngestionDocument.deleteMany({ project_id: this._id });

        next();
    } catch (error) {
        next(error);
    }
});

// Indexes
projectSchema.index({ owner: 1, created_at: -1 });
projectSchema.index({ members: 1 });
projectSchema.index({ is_archived: 1 });

const Project = mongoose.model('Project', projectSchema);

export default Project;
