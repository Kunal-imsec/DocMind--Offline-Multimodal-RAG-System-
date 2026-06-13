import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUserPlus, FiMail, FiUser, FiLock, FiEye, FiEyeOff, FiAlertCircle, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import LoadingSpinner from '../components/LoadingSpinner';
import useAuthStore from '../store/authStore';

const SignUp = () => {
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);

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

    const passwordStrength = calculatePasswordStrength(formData.password);

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

        // Full name validation
        if (!formData.full_name.trim()) {
            newErrors.full_name = 'Full name is required';
        }

        // Email validation
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(formData.password)) {
            newErrors.password = 'Password must contain uppercase, lowercase, and number';
        }

        // Confirm password validation
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
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
            // Sign up the user
            const response = await authService.signup({
                full_name: formData.full_name,
                email: formData.email,
                password: formData.password,
            });

            const { access, refresh, user } = response;

            // Set authentication
            await setAuth(user, access, refresh);

            toast.success('Account created successfully!');

            // Auto-create a new project and redirect to workspace
            try {
                const projectService = (await import('../services/projectService')).default;
                const newProject = await projectService.createProject({
                    name: null,
                    description: null
                });
                navigate(`/projects/${newProject.id}`);
            } catch (projectErr) {
                console.error('Failed to create project:', projectErr);
                // Fallback to dashboard if project creation fails
                navigate('/dashboard');
            }
        } catch (err) {
            const errorMessage =
                err.response?.data?.detail ||
                err.response?.data?.email?.[0] ||
                err.response?.data?.message ||
                'Failed to create account';

            if (errorMessage.toLowerCase().includes('email')) {
                setErrors({ email: 'This email is already registered' });
            }
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-raycast-bg relative overflow-hidden">
            {/* Subtle Background Gradient */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-raycast-orange/5 to-transparent rounded-full blur-3xl"></div>
                <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-raycast-red/5 to-transparent rounded-full blur-3xl"></div>
            </div>

            {/* Sign Up Card */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-raycast-surface border border-raycast-border rounded-raycast-lg p-6 max-w-md w-full mx-4 relative z-10 shadow-raycast-lg"
            >
                {/* Logo & Title */}
                <div className="text-center mb-6">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-raycast-orange to-raycast-red flex items-center justify-center mx-auto mb-3">
                        <FiUserPlus className="text-white text-xl" />
                    </div>
                    <h1 className="text-xl font-bold text-raycast-text mb-1">Create Account</h1>
                    <p className="text-xs text-raycast-text-tertiary">Sign up to get started with DocMind</p>
                </div>

                {/* Sign Up Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
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

                    {/* Password */}
                    <div>
                        <label className="block text-xs font-medium text-raycast-text-secondary mb-1.5">Password</label>
                        <div className="relative">
                            <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-white text-base z-10 pointer-events-none" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className={`input-field pl-14 pr-10 text-sm ${errors.password ? 'border-raycast-red' : ''}`}
                                placeholder="Create a password"
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
                        {formData.password && !errors.password && (
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
                        {errors.password && (
                            <p className="text-raycast-red text-xs mt-1 flex items-center gap-1">
                                <FiAlertCircle className="text-xs" />
                                {errors.password}
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
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className={`input-field pl-14 pr-10 text-sm ${errors.confirmPassword ? 'border-raycast-red' : ''}`}
                                placeholder="Confirm your password"
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
                        {formData.confirmPassword && formData.password === formData.confirmPassword && !errors.confirmPassword && (
                            <p className="text-green-500 text-xs mt-1 flex items-center gap-1">
                                <FiCheck className="text-xs" />
                                Passwords match
                            </p>
                        )}
                        {errors.confirmPassword && (
                            <p className="text-raycast-red text-xs mt-1 flex items-center gap-1">
                                <FiAlertCircle className="text-xs" />
                                {errors.confirmPassword}
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-5"
                    >
                        {isLoading ? (
                            <>
                                <LoadingSpinner size="sm" />
                                <span>Creating account...</span>
                            </>
                        ) : (
                            'Create Account'
                        )}
                    </button>
                </form>

                {/* Back to Login */}
                <div className="mt-5 text-center">
                    <p className="text-raycast-text-tertiary text-xs">
                        Already have an account?{' '}
                        <button
                            onClick={() => navigate('/login')}
                            className="text-raycast-orange hover:text-raycast-orange-hover font-medium transition-colors"
                        >
                            Sign In
                        </button>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default SignUp;
