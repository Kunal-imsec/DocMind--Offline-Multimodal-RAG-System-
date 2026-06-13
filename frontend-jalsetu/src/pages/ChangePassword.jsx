import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiLock, FiCheck, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import LoadingSpinner from '../components/LoadingSpinner';

const ChangePassword = () => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const isFirstLogin = location.state?.firstLogin || false;

    // Password strength validation
    const passwordValidation = {
        minLength: newPassword.length >= 8,
        hasUpper: /[A-Z]/.test(newPassword),
        hasLower: /[a-z]/.test(newPassword),
        hasNumber: /[0-9]/.test(newPassword),
        hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    };

    const isPasswordValid = Object.values(passwordValidation).every(Boolean);
    const passwordsMatch = newPassword === confirmPassword && newPassword !== '';

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isPasswordValid) {
            toast.error('Password does not meet requirements');
            return;
        }

        if (!passwordsMatch) {
            toast.error('Passwords do not match');
            return;
        }

        setIsLoading(true);

        try {
            await authService.changePassword(oldPassword, newPassword);
            toast.success('Password changed successfully!');
            navigate('/dashboard');
        } catch (err) {
            const errorMessage =
                err.response?.data?.detail ||
                err.response?.data?.old_password?.[0] ||
                err.response?.data?.new_password?.[0] ||
                'Failed to change password';
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

            {/* Change Password Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card max-w-md w-full mx-4 relative z-10"
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/50">
                        <FiLock className="text-white text-3xl" />
                    </div>
                    <h1 className="text-3xl font-bold gradient-text mb-2">
                        {isFirstLogin ? 'Set Your Password' : 'Change Password'}
                    </h1>
                    <p className="text-gray-500">
                        {isFirstLogin
                            ? 'Please set a new password for your account'
                            : 'Update your account password'}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            {isFirstLogin ? 'Temporary Password' : 'Current Password'}
                        </label>
                        <input
                            type="password"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            className="input-field"
                            placeholder="Enter current password"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="input-field"
                            placeholder="Enter new password"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Confirm New Password
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="input-field"
                            placeholder="Confirm new password"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    {/* Password Requirements */}
                    <div className="p-4 glass-light rounded-lg space-y-2">
                        <p className="text-sm font-medium text-gray-300 mb-2">Password Requirements:</p>
                        {[
                            { key: 'minLength', label: 'At least 8 characters' },
                            { key: 'hasUpper', label: 'One uppercase letter' },
                            { key: 'hasLower', label: 'One lowercase letter' },
                            { key: 'hasNumber', label: 'One number' },
                            { key: 'hasSpecial', label: 'One special character' },
                        ].map(({ key, label }) => (
                            <div key={key} className="flex items-center gap-2 text-sm">
                                {passwordValidation[key] ? (
                                    <FiCheck className="text-green-400" />
                                ) : (
                                    <FiX className="text-gray-600" />
                                )}
                                <span
                                    className={passwordValidation[key] ? 'text-green-400' : 'text-gray-500'}
                                >
                                    {label}
                                </span>
                            </div>
                        ))}
                        <div className="flex items-center gap-2 text-sm">
                            {passwordsMatch ? (
                                <FiCheck className="text-green-400" />
                            ) : (
                                <FiX className="text-gray-600" />
                            )}
                            <span className={passwordsMatch ? 'text-green-400' : 'text-gray-500'}>
                                Passwords match
                            </span>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !isPasswordValid || !passwordsMatch}
                        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>
                                <LoadingSpinner size="sm" />
                                <span>Changing Password...</span>
                            </>
                        ) : (
                            'Change Password'
                        )}
                    </button>
                </form>

                {!isFirstLogin && (
                    <div className="mt-6 text-center">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default ChangePassword;
