import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const ingestionDocumentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Document title is required'],
        trim: true
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    classification: {
        type: String,
        enum: ['PUBLIC', 'RESTRICTED', 'CONFIDENTIAL', 'TOP_SECRET'],
        default: 'PUBLIC'
    },
    filename: {
        type: String,
        required: true
    },
    file_size: {
        type: Number,
        required: true
    },
    file_type: {
        type: String,
        required: true
    },
    file_path: {
        type: String,
        required: true
    },
    version_id: {
        type: String,
        default: () => uuidv4()
    },
    status: {
        type: String,
        enum: ['PROCESSING', 'READY', 'FAILED'],
        default: 'PROCESSING'
    },
    job_id: {
        type: String,
        default: null
    },
    uploaded_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    project_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        default: null
    },
    uploaded_at: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: { createdAt: 'uploaded_at', updatedAt: false }
});

// Indexes
ingestionDocumentSchema.index({ uploaded_by: 1, uploaded_at: -1 });
ingestionDocumentSchema.index({ project_id: 1 });
ingestionDocumentSchema.index({ status: 1 });
ingestionDocumentSchema.index({ job_id: 1 });

const IngestionDocument = mongoose.model('IngestionDocument', ingestionDocumentSchema);

export default IngestionDocument;
