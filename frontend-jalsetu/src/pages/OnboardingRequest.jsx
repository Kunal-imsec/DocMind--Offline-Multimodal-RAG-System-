import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUserPlus, FiMail, FiUser, FiBriefcase } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import LoadingSpinner from '../components/LoadingSpinner';

const OnboardingRequest = () => {
    const [formData, setFormData] = useState({
        email: '',
        full_name: '',
        requested_role: 'ANALYST',
        department: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const roles = [
        { value: 'ANALYST', label: 'Analyst' },
        { value: 'SENIOR_ANALYST', label: 'Senior Analyst' },
        { value: 'ADMIN', label: 'Admin' },
    ];

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await authService.submitOnboardingRequest(formData);
            toast.success('Onboarding request submitted successfully!');
            navigate('/login');
        } catch (err) {
            const errorMessage =
                err.response?.data?.detail ||
                err.response?.data?.email?.[0] ||
                'Failed to submit onboarding request';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-dark-950 relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-primary-600/20 to-transparent rounded-full blur-3xl animate-pulse-slow"></div>
                <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-primary-700/20 to-transparent rounded-full blur-3xl animate-pulse-slow"></div>
            </div>

            {/* Onboarding Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card max-w-md w-full mx-4 relative z-10"
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/50">
                        <FiUserPlus className="text-white text-3xl" />
                    </div>
                    <h1 className="text-3xl font-bold gradient-text mb-2">Request Access</h1>
                    <p className="text-gray-500">Submit a request to join the DocMind platform</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                        <div className="relative">
                            <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                name="full_name"
                                value={formData.full_name}
                                onChange={handleChange}
                                className="input-field pl-11"
                                placeholder="Enter your full name"
                                required
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                        <div className="relative">
                            <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="input-field pl-11"
                                placeholder="Enter your email"
                                required
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Department</label>
                        <div className="relative">
                            <FiBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                                className="input-field pl-11"
                                placeholder="Enter your department"
                                required
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Requested Role</label>
                        <select
                            name="requested_role"
                            value={formData.requested_role}
                            onChange={handleChange}
                            className="input-field"
                            required
                            disabled={isLoading}
                        >
                            {roles.map((role) => (
                                <option key={role.value} value={role.value}>
                                    {role.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>
                                <LoadingSpinner size="sm" />
                                <span>Submitting...</span>
                            </>
                        ) : (
                            'Submit Request'
                        )}
                    </button>
                </form>

                {/* Back to Login */}
                <div className="mt-6 text-center">
                    <p className="text-gray-500 text-sm">
                        Already have an account?{' '}
                        <button
                            onClick={() => navigate('/login')}
                            className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
                        >
                            Sign In
                        </button>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default OnboardingRequest;
