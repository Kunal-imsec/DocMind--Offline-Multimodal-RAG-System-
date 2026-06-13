import mongoose from 'mongoose';

const indexSnapshotSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Snapshot name is required'],
        trim: true
    },
    modality: {
        type: String,
        enum: ['text', 'image', 'audio'],
        required: [true, 'Modality is required']
    },
    version: {
        type: String,
        required: true
    },
    index_path: {
        type: String,
        required: true
    },
    id_mapping_path: {
        type: String,
        required: true
    },
    doc_count: {
        type: Number,
        default: 0
    },
    is_active: {
        type: Boolean,
        default: false
    },
    built_at: {
        type: Date,
        default: Date.now
    },
    built_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    notes: {
        type: String,
        trim: true,
        default: ''
    }
}, {
    timestamps: { createdAt: 'built_at', updatedAt: false }
});

// Indexes
indexSnapshotSchema.index({ modality: 1, built_at: -1 });
indexSnapshotSchema.index({ is_active: 1 });

const IndexSnapshot = mongoose.model('IndexSnapshot', indexSnapshotSchema);

export default IndexSnapshot;
