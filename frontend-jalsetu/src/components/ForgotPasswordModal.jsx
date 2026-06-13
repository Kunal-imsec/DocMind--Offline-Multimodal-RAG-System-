import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiMail, FiUser, FiLock, FiEye, FiEyeOff, FiAlertCircle, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import LoadingSpinner from './LoadingSpinner';

const ForgotPasswordModal = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState({
        email: '',
        full_name: '',
        new_password: '',
        confirm_password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Password strength calculation
    const calculatePasswordStrength = (password) => {
        if (!password) return { score: 0, label: '', color: '' };

        let score = 0;
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^a-zA-Z0-9]/.test(password)) score++;

        if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500' };
        if (score <= 4) return { score, label: 'Medium', color: 'bg-yellow-500' };
        return { score, label: 'Strong', color: 'bg-green-500' };
    };

    const passwordStrength = calculatePasswordStrength(formData.new_password);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
        // Clear error for this field
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: '',
            });
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // Email validation
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        // Full name validation
        if (!formData.full_name.trim()) {
            newErrors.full_name = 'Full name is required';
        }

        // Password validation
        if (!formData.new_password) {
            newErrors.new_password = 'New password is required';
        } else if (formData.new_password.length < 8) {
            newErrors.new_password = 'Password must be at least 8 characters';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(formData.new_password)) {
            newErrors.new_password = 'Password must contain uppercase, lowercase, and number';
        }

        // Confirm password validation
        if (!formData.confirm_password) {
            newErrors.confirm_password = 'Please confirm your password';
        } else if (formData.new_password !== formData.confirm_password) {
            newErrors.confirm_password = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            await authService.resetPassword({
                email: formData.email,
                full_name: formData.full_name,
                new_password: formData.new_password,
            });

            toast.success('Password reset successfully! You can now login with your new password.');

            // Reset form
            setFormData({
                email: '',
                full_name: '',
                new_password: '',
                confirm_password: '',
            });
            setErrors({});
            onClose();
        } catch (err) {
            const errorMessage =
                err.response?.data?.detail ||
                err.response?.data?.message ||
                'Failed to reset password';

            if (errorMessage.toLowerCase().includes('email')) {
                setErrors({ email: 'Email not found or name does not match' });
            } else if (errorMessage.toLowerCase().includes('name')) {
                setErrors({ full_name: 'Name does not match the email' });
            }
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            email: '',
            full_name: '',
            new_password: '',
            confirm_password: '',
        });
        setErrors({});
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', duration: 0.3 }}
                            className="bg-raycast-surface border border-raycast-border rounded-raycast-lg p-6 max-w-md w-full shadow-raycast-lg relative"
                        >
                            {/* Close Button */}
                            <button
                                onClick={handleClose}
                                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-raycast-surface-hover transition-colors"
                            >
                                <FiX className="text-raycast-text-tertiary text-lg" />
                            </button>

                            {/* Header */}
                            <div className="mb-6">
                                <h2 className="text-lg font-bold text-raycast-text mb-1">Reset Password</h2>
                                <p className="text-xs text-raycast-text-tertiary">Enter your details to reset your password</p>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Email */}
                                <div>
                                    <label className="block text-xs font-medium text-raycast-text-secondary mb-1.5">Email</label>
                                    <div className="relative">
                                        <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-white text-base z-10 pointer-events-none" />
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className={`input-field pl-14 text-sm ${errors.email ? 'border-raycast-red' : ''}`}
                                            placeholder="Enter your email"
                                            disabled={isLoading}
                                        />
                                    </div>
                                    {errors.email && (
                                        <p className="text-raycast-red text-xs mt-1 flex items-center gap-1">
                                            <FiAlertCircle className="text-xs" />
                                            {errors.email}
                                        </p>
                                    )}
                                </div>

                                {/* Full Name */}
                                <div>
                                    <label className="block text-xs font-medium text-raycast-text-secondary mb-1.5">Full Name</label>
                                    <div className="relative">
                                        <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-white text-base z-10 pointer-events-none" />
                                        <input
                                            type="text"
                                            name="full_name"
                                            value={formData.full_name}
                                            onChange={handleChange}
                                            className={`input-field pl-14 text-sm ${errors.full_name ? 'border-raycast-red' : ''}`}
                                            placeholder="Enter your full name"
                                            disabled={isLoading}
                                        />
                                    </div>
                                    {errors.full_name && (
                                        <p className="text-raycast-red text-xs mt-1 flex items-center gap-1">
                                            <FiAlertCircle className="text-xs" />
                                            {errors.full_name}
                                        </p>
                                    )}
                                </div>

                                {/* New Password */}
                                <div>
                                    <label className="block text-xs font-medium text-raycast-text-secondary mb-1.5">New Password</label>
                                    <div className="relative">
                                        <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-white text-base z-10 pointer-events-none" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            name="new_password"
                                            value={formData.new_password}
                                            onChange={handleChange}
                                            className={`input-field pl-14 pr-10 text-sm ${errors.new_password ? 'border-raycast-red' : ''}`}
                                            placeholder="Create a new password"
                                            disabled={isLoading}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-raycast-text-tertiary hover:text-raycast-text-secondary transition-colors"
                                        >
                                            {showPassword ? <FiEyeOff className="text-sm" /> : <FiEye className="text-sm" />}
                                        </button>
                                    </div>
                                    {formData.new_password && !errors.new_password && (
                                        <div className="mt-2">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs text-raycast-text-tertiary">Password strength:</span>
                                                <span className={`text-xs font-medium ${passwordStrength.label === 'Weak' ? 'text-red-500' :
                                                    passwordStrength.label === 'Medium' ? 'text-yellow-500' :
                                                        'text-green-500'
                                                    }`}>
                                                    {passwordStrength.label}
                                                </span>
                                            </div>
                                            <div className="h-1 bg-raycast-surface-hover rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${passwordStrength.color} transition-all duration-300`}
                                                    style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    {errors.new_password && (
                                        <p className="text-raycast-red text-xs mt-1 flex items-center gap-1">
                                            <FiAlertCircle className="text-xs" />
                                            {errors.new_password}
                                        </p>
                                    )}
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label className="block text-xs font-medium text-raycast-text-secondary mb-1.5">Confirm Password</label>
                                    <div className="relative">
                                        <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-white text-base z-10 pointer-events-none" />
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            name="confirm_password"
                                            value={formData.confirm_password}
                                            onChange={handleChange}
                                            className={`input-field pl-14 pr-10 text-sm ${errors.confirm_password ? 'border-raycast-red' : ''}`}
                                            placeholder="Confirm your new password"
                                            disabled={isLoading}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-raycast-text-tertiary hover:text-raycast-text-secondary transition-colors"
                                        >
                                            {showConfirmPassword ? <FiEyeOff className="text-sm" /> : <FiEye className="text-sm" />}
                                        </button>
                                    </div>
                                    {formData.confirm_password && formData.new_password === formData.confirm_password && !errors.confirm_password && (
                                        <p className="text-green-500 text-xs mt-1 flex items-center gap-1">
                                            <FiCheck className="text-xs" />
                                            Passwords match
                                        </p>
                                    )}
                                    {errors.confirm_password && (
                                        <p className="text-raycast-red text-xs mt-1 flex items-center gap-1">
                                            <FiAlertCircle className="text-xs" />
                                            {errors.confirm_password}
                                        </p>
                                    )}
                                </div>

                                {/* Buttons */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        disabled={isLoading}
                                        className="btn-secondary flex-1 text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm"
                                    >
                                        {isLoading ? (
                                            <>
                                                <LoadingSpinner size="sm" />
                                                <span>Resetting...</span>
                                            </>
                                        ) : (
                                            'Reset Password'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ForgotPasswordModal;
