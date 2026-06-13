import mongoose from 'mongoose';

const chatSessionSchema = new mongoose.Schema({
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: [true, 'Project is required']
    },
    title: {
        type: String,
        required: [true, 'Chat session title is required'],
        trim: true,
        default: 'New Chat'
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'CLOSED'],
        default: 'ACTIVE'
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    last_activity_at: {
        type: Date,
        default: Date.now
    },
    created_at: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for message count
chatSessionSchema.virtual('message_count', {
    ref: 'Message',
    localField: '_id',
    foreignField: 'session',
    count: true
});

// Cascade delete messages when chat session is deleted
chatSessionSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    try {
        const Message = mongoose.model('Message');
        await Message.deleteMany({ session: this._id });
        next();
    } catch (error) {
        next(error);
    }
});

// Indexes
chatSessionSchema.index({ project: 1, created_at: -1 });
chatSessionSchema.index({ created_by: 1 });
chatSessionSchema.index({ status: 1 });

const ChatSession = mongoose.model('ChatSession', chatSessionSchema);

export default ChatSession;
