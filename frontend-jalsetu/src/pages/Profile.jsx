import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiBriefcase, FiEdit2, FiLock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { authService } from '../services/authService';
import Sidebar from '../components/Sidebar';
import LoadingSpinner from '../components/LoadingSpinner';

const Profile = () => {
    const { user, updateUser } = useAuthStore();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        department: '',
    });

    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                department: user.department || '',
            });
        }
    }, [user]);

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
            const updatedData = await authService.updateProfile(formData);
            await updateUser(updatedData);
            toast.success('Profile updated successfully!');
            setIsEditing(false);
        } catch (err) {
            const errorMessage = err.response?.data?.detail || 'Failed to update profile';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-dark-950">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
                <div className="p-8 max-w-4xl mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <h1 className="text-4xl font-bold gradient-text mb-2">Profile</h1>
                        <p className="text-gray-500">Manage your account information</p>
                    </motion.div>

                    {/* Profile Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="card mb-6"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/50">
                                    <span className="text-white text-3xl font-bold">
                                        {user?.first_name?.[0] || user?.username?.[0] || 'U'}
                                    </span>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">
                                        {user?.first_name && user?.last_name
                                            ? `${user.first_name} ${user.last_name}`
                                            : user?.username}
                                    </h2>
                                    <p className="text-gray-500">{user?.email}</p>
                                </div>
                            </div>
                            {!isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="btn-secondary flex items-center gap-2"
                                >
                                    <FiEdit2 />
                                    Edit Profile
                                </button>
                            )}
                        </div>

                        {isEditing ? (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            First Name
                                        </label>
                                        <input
                                            type="text"
                                            name="first_name"
                                            value={formData.first_name}
                                            onChange={handleChange}
                                            className="input-field"
                                            placeholder="Enter first name"
                                            disabled={isLoading}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Last Name
                                        </label>
                                        <input
                                            type="text"
                                            name="last_name"
                                            value={formData.last_name}
                                            onChange={handleChange}
                                            className="input-field"
                                            placeholder="Enter last name"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Department
                                    </label>
                                    <input
                                        type="text"
                                        name="department"
                                        value={formData.department}
                                        onChange={handleChange}
                                        className="input-field"
                                        placeholder="Enter department"
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="btn-primary flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {isLoading ? (
                                            <>
                                                <LoadingSpinner size="sm" />
                                                Saving...
                                            </>
                                        ) : (
                                            'Save Changes'
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsEditing(false);
                                            setFormData({
                                                first_name: user?.first_name || '',
                                                last_name: user?.last_name || '',
                                                department: user?.department || '',
                                            });
                                        }}
                                        className="btn-ghost"
                                        disabled={isLoading}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                                        <FiUser className="text-primary-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Username</p>
                                        <p className="text-white font-medium">{user?.username}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                        <FiMail className="text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Email</p>
                                        <p className="text-white font-medium">{user?.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                        <FiBriefcase className="text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Department</p>
                                        <p className="text-white font-medium">{user?.department || 'Not specified'}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* Change Password Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="card"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center">
                                    <FiLock className="text-red-400 text-xl" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Password</h3>
                                    <p className="text-sm text-gray-500">Change your account password</p>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate('/change-password')}
                                className="btn-secondary"
                            >
                                Change Password
                            </button>
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
};

export default Profile;
