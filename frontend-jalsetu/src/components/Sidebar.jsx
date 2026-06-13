import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiHome,
    FiUpload,
    FiUser,
    FiUsers,
    FiLogOut,
    FiMenu,
    FiX,
    FiFileText,
} from 'react-icons/fi';
import useAuthStore from '../store/authStore';

const Sidebar = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const menuItems = [
        { path: '/dashboard', icon: FiHome, label: 'Dashboard' },
        { path: '/upload', icon: FiUpload, label: 'Upload Document' },
        { path: '/profile', icon: FiUser, label: 'Profile' },
    ];

    return (
        <motion.div
            initial={false}
            animate={{ width: isCollapsed ? 64 : 240 }}
            transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
            className="h-screen flex flex-col bg-raycast-bg border-r border-raycast-border relative"
        >
            {/* Header */}
            <div className="p-2 flex items-center justify-between border-b border-raycast-border flex-shrink-0">
                <AnimatePresence mode="wait">
                    {!isCollapsed && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                            className="flex items-center gap-2"
                        >
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-raycast-orange to-raycast-red flex items-center justify-center">
                                <FiFileText className="text-white text-base" />
                            </div>
                            <div>
                                <h1 className="text-sm font-semibold text-raycast-text">DocMind</h1>
                                <p className="text-xs text-raycast-text-tertiary">Document System</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-1.5 hover:bg-raycast-surface rounded-lg transition-all duration-150 active:scale-95"
                >
                    {isCollapsed ? (
                        <FiMenu className="text-base text-raycast-text-secondary" />
                    ) : (
                        <FiX className="text-base text-raycast-text-secondary" />
                    )}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 min-h-0 p-2 space-y-1 overflow-y-auto">
                {menuItems.map((item, index) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 group relative ${isActive
                                ? 'bg-raycast-surface text-raycast-text'
                                : 'text-raycast-text-secondary hover:bg-raycast-surface/50 hover:text-raycast-text'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                {isActive && (
                                    <motion.div
                                        layoutId="activeIndicator"
                                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-raycast-orange rounded-r"
                                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                    />
                                )}
                                <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                >
                                    <item.icon className="text-lg flex-shrink-0" />
                                </motion.div>
                                <AnimatePresence mode="wait">
                                    {!isCollapsed && (
                                        <motion.span
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            transition={{ duration: 0.2 }}
                                            className="text-sm font-medium"
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* User Profile & Logout */}
            <div className="p-1.5 border-t border-raycast-border space-y-1 flex-shrink-0">
                {user && (
                    <motion.div
                        className="mb-1 p-2 rounded-lg bg-raycast-surface/50"
                        whileHover={{ backgroundColor: 'rgba(44, 44, 46, 0.8)' }}
                        transition={{ duration: 0.15 }}
                    >
                        <AnimatePresence mode="wait">
                            {!isCollapsed ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-raycast-orange to-raycast-red flex items-center justify-center flex-shrink-0">
                                            <span className="text-white font-semibold text-xs">
                                                {user.first_name?.[0] || user.username?.[0] || 'U'}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-xs text-raycast-text truncate">
                                                {user.first_name || user.username}
                                            </p>
                                            <p className="text-xs text-raycast-text-tertiary truncate">{user.email}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="w-7 h-7 rounded-full bg-gradient-to-br from-raycast-orange to-raycast-red flex items-center justify-center mx-auto"
                                >
                                    <span className="text-white font-semibold text-xs">
                                        {user.first_name?.[0] || user.username?.[0] || 'U'}
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-raycast-red hover:bg-raycast-red/10 transition-all duration-150 active:scale-95 group"
                >
                    <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    >
                        <FiLogOut className="text-lg flex-shrink-0" />
                    </motion.div>
                    <AnimatePresence mode="wait">
                        {!isCollapsed && (
                            <motion.span
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                                className="text-sm font-medium"
                            >
                                Logout
                            </motion.span>
                        )}
                    </AnimatePresence>
                </button>
            </div>
        </motion.div>
    );
};

export default Sidebar;
