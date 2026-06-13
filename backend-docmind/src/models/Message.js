import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    session: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatSession',
        required: [true, 'Chat session is required']
    },
    role: {
        type: String,
        enum: ['USER', 'ASSISTANT', 'SYSTEM'],
        required: [true, 'Message role is required']
    },
    content: {
        type: String,
        required: [true, 'Message content is required']
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null // null for assistant/system messages
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    citations: [{
        document_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'IngestionDocument'
        },
        document_name: {
            type: String
        },
        page_number: {
            type: Number
        },
        excerpt: {
            type: String
        }
    }],
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: { createdAt: 'timestamp', updatedAt: false }
});

// Indexes
messageSchema.index({ session: 1, timestamp: 1 });
messageSchema.index({ sender: 1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;
