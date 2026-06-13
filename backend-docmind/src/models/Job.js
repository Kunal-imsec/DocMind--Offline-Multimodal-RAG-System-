import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const jobSchema = new mongoose.Schema({
    id: {
        type: String,
        default: () => uuidv4(),
        unique: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED'],
        default: 'PENDING'
    },
    error_message: {
        type: String,
        default: null
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    started_at: {
        type: Date,
        default: null
    },
    finished_at: {
        type: Date,
        default: null
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: false }
});

// Index for efficient querying
jobSchema.index({ id: 1 });
jobSchema.index({ status: 1 });

const Job = mongoose.model('Job', jobSchema);

export default Job;
