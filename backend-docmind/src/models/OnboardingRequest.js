import mongoose from 'mongoose';

const onboardingRequestSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    full_name: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true
    },
    requested_role: {
        type: String,
        required: [true, 'Requested role is required'],
        enum: ['SUPER_ADMIN', 'IT_ADMIN', 'SENIOR_ANALYST', 'ANALYST', 'VIEWER']
    },
    department: {
        type: String,
        required: [true, 'Department is required'],
        trim: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'PENDING'
    },
    remark: {
        type: String,
        trim: true,
        default: ''
    },
    decided_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    decided_at: {
        type: Date,
        default: null
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: false }
});

// Index for efficient querying
onboardingRequestSchema.index({ status: 1, created_at: -1 });
onboardingRequestSchema.index({ email: 1 });

const OnboardingRequest = mongoose.model('OnboardingRequest', onboardingRequestSchema);

export default OnboardingRequest;
