import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiLock, FiUser, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { authService } from '../services/authService';
import LoadingSpinner from '../components/LoadingSpinner';
import ForgotPasswordModal from '../components/ForgotPasswordModal';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [failedAttempts, setFailedAttempts] = useState(0);
    const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await authService.login(username, password);
            const { access, refresh, user, must_change_password } = response;

            // Set authentication
            await setAuth(user, access, refresh);

            toast.success('Login successful!');

            // Redirect based on must_change_password flag
            if (must_change_password) {
                navigate('/change-password', { state: { firstLogin: true } });
            } else {
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
            }
        } catch (err) {
            const errorMessage =
                err.response?.data?.detail ||
                err.response?.data?.message ||
                'Invalid username or password';
            setError(errorMessage);
            setFailedAttempts(prev => prev + 1);
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

            {/* Login Card */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-raycast-surface border border-raycast-border rounded-raycast-lg p-6 max-w-md w-full mx-4 relative z-10 shadow-raycast-lg"
            >
                {/* Logo & Title */}
                <div className="text-center mb-6">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-raycast-orange to-raycast-red flex items-center justify-center mx-auto mb-3">
                        <FiLock className="text-white text-xl" />
                    </div>
                    <h1 className="text-xl font-bold text-raycast-text mb-1">Welcome to DocMind</h1>
                    <p className="text-xs text-raycast-text-tertiary">Sign in to access the document management system</p>
                </div>

                {/* Error Alert */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mb-4 p-3 bg-raycast-red/10 border border-raycast-red/30 rounded-raycast flex items-start gap-2"
                    >
                        <FiAlertCircle className="text-raycast-red text-base flex-shrink-0 mt-0.5" />
                        <p className="text-raycast-red text-xs">{error}</p>
                    </motion.div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-raycast-text-secondary mb-1.5">Username</label>
                        <div className="relative">
                            <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-white text-base z-10 pointer-events-none" />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="input-field pl-14 text-sm"
                                placeholder="Enter your username"
                                required
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-raycast-text-secondary mb-1.5">Password</label>
                        <div className="relative">
                            <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-white text-base z-10 pointer-events-none" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-field pl-14 text-sm"
                                placeholder="Enter your password"
                                required
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-5"
                    >
                        {isLoading ? (
                            <>
                                <LoadingSpinner size="sm" />
                                <span>Signing in...</span>
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                {/* Forgot Password Button - Shows after first failed attempt */}
                {failedAttempts > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-4 text-center"
                    >
                        <button
                            onClick={() => setIsForgotPasswordOpen(true)}
                            className="text-raycast-orange hover:text-raycast-orange-hover text-xs font-medium transition-colors"
                        >
                            Forgot Password?
                        </button>
                    </motion.div>
                )}

                {/* Sign Up Link */}
                <div className="mt-5 text-center">
                    <p className="text-raycast-text-tertiary text-xs">
                        Don't have an account?{' '}
                        <button
                            onClick={() => navigate('/signup')}
                            className="text-raycast-orange hover:text-raycast-orange-hover font-medium transition-colors"
                        >
                            Sign Up
                        </button>
                    </p>
                </div>
            </motion.div>

            {/* Forgot Password Modal */}
            <ForgotPasswordModal
                isOpen={isForgotPasswordOpen}
                onClose={() => setIsForgotPasswordOpen(false)}
            />
        </div>
    );
};

export default Login;
