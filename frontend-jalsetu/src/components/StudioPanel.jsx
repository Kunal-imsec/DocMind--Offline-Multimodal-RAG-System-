import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronRight, FiPlus, FiMessageSquare, FiChevronDown, FiFolder, FiTrash2, FiMoreVertical, FiEdit2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import DeleteConfirmModal from './DeleteConfirmModal';
import EditProjectModal from './EditProjectModal';

const StudioPanel = ({
    chats,
    currentChat,
    currentProject,
    projects,
    isCollapsed,
    onToggleCollapse,
    onSelectChat,
    onSelectProject,
    onCreateChat,
    onCreateProject,
    onDeleteChat,
    onDeleteProject
}) => {
    const [isCreating, setIsCreating] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isChatListExpanded, setIsChatListExpanded] = useState(true);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, item: null, type: null });
    const [hoveredChatId, setHoveredChatId] = useState(null);
    const [hoveredProjectId, setHoveredProjectId] = useState(null);
    const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const handleCreateChat = async () => {
        setIsCreating(true);
        try {
            await onCreateChat();
            toast.success('New chat created!');
        } catch (error) {
            toast.error('Failed to create chat');
            console.error('Error creating chat:', error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteClick = (e, item, type) => {
        e.stopPropagation();
        setDeleteModal({ isOpen: true, item, type });
    };

    const handleConfirmDelete = async () => {
        const { item, type } = deleteModal;
        try {
            if (type === 'chat' && onDeleteChat) {
                await onDeleteChat(item.id);
                toast.success('Chat deleted successfully');
            } else if (type === 'project' && onDeleteProject) {
                await onDeleteProject(item.id);
                toast.success('Project deleted successfully');
            }
        } catch (error) {
            toast.error(`Failed to delete ${type}`);
            console.error(`Error deleting ${type}:`, error);
        } finally {
            setDeleteModal({ isOpen: false, item: null, type: null });
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <>
            <motion.div
                initial={false}
                animate={{ width: isCollapsed ? 60 : 320 }}
                transition={{ duration: 0.3 }}
                className="glass border-l border-dark-600 flex flex-col overflow-hidden"
            >
                {!isCollapsed ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col h-full"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-dark-600 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-white">Studio</h2>
                            <button
                                onClick={onToggleCollapse}
                                className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                                title="Minimize panel"
                            >
                                <FiChevronRight className="text-xl text-gray-400" />
                            </button>
                        </div>

                        {/* Project Selector Dropdown */}
                        <div className="p-4 border-b border-dark-600">
                            <div className="flex items-center gap-2">
                                {/* Project Selector */}
                                <div className="relative flex-1">
                                    <button
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        className="w-full glass-light rounded-lg p-3 flex items-center justify-between hover:bg-dark-700/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <FiFolder className="text-primary-400 flex-shrink-0" />
                                            <span className="text-sm text-white truncate">
                                                {currentProject?.name || '____'}
                                            </span>
                                        </div>
                                        <FiChevronDown className={`text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {/* Dropdown Menu */}
                                    <AnimatePresence>
                                        {isDropdownOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="absolute top-full left-0 right-0 mt-2 glass rounded-lg shadow-xl z-10 max-h-60 overflow-y-auto"
                                            >
                                                {projects?.length === 0 ? (
                                                    <div className="p-4 text-center text-gray-500 text-sm">
                                                        No projects yet
                                                    </div>
                                                ) : (
                                                    projects?.map((project) => (
                                                        <div
                                                            key={project.id}
                                                            onMouseEnter={() => setHoveredProjectId(project.id)}
                                                            onMouseLeave={() => setHoveredProjectId(null)}
                                                            className="relative group"
                                                        >
                                                            <button
                                                                onClick={() => {
                                                                    onSelectProject(project);
                                                                    setIsDropdownOpen(false);
                                                                }}
                                                                className={`w-full p-3 text-left hover:bg-dark-700/50 transition-colors border-b border-dark-600 last:border-b-0 ${currentProject?.id === project.id ? 'bg-primary-600/20' : ''
                                                                    }`}
                                                            >
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-sm text-white truncate">
                                                                            {project.name || '____'}
                                                                        </p>
                                                                        <p className="text-xs text-gray-500 mt-1">
                                                                            {project.document_count} documents • {formatDate(project.updated_at)}
                                                                        </p>
                                                                    </div>
                                                                    {/* Delete Button for Project */}
                                                                    <motion.button
                                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                                        animate={{
                                                                            opacity: hoveredProjectId === project.id ? 1 : 0,
                                                                            scale: hoveredProjectId === project.id ? 1 : 0.8
                                                                        }}
                                                                        transition={{ duration: 0.15 }}
                                                                        onClick={(e) => handleDeleteClick(e, project, 'project')}
                                                                        className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                                                                        title="Delete project"
                                                                    >
                                                                        <motion.div
                                                                            whileHover={{ scale: 1.1, rotate: 5 }}
                                                                            whileTap={{ scale: 0.9 }}
                                                                        >
                                                                            <FiTrash2 className="text-gray-500 hover:text-red-500 transition-colors text-sm" />
                                                                        </motion.div>
                                                                    </motion.button>
                                                                </div>
                                                            </button>
                                                        </div>
                                                    ))
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* 3-Dot Menu for Current Project */}
                                {currentProject && (
                                    <div className="relative">
                                        <motion.button
                                            whileHover={{ scale: 1.1, rotate: 90 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => setIsProjectMenuOpen(!isProjectMenuOpen)}
                                            className="p-3 glass-light rounded-lg hover:bg-dark-700/50 transition-colors"
                                            title="Project options"
                                        >
                                            <FiMoreVertical className="text-gray-400" />
                                        </motion.button>

                                        {/* 3-Dot Menu Dropdown */}
                                        <AnimatePresence>
                                            {isProjectMenuOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="absolute top-full right-0 mt-2 glass rounded-lg shadow-xl z-20 min-w-[180px] overflow-hidden"
                                                >
                                                    <motion.button
                                                        whileHover={{ backgroundColor: 'rgba(255, 107, 53, 0.1)' }}
                                                        onClick={() => {
                                                            setIsEditModalOpen(true);
                                                            setIsProjectMenuOpen(false);
                                                        }}
                                                        className="w-full p-3 text-left flex items-center gap-2 border-b border-dark-600 transition-colors"
                                                    >
                                                        <FiEdit2 className="text-raycast-orange" />
                                                        <span className="text-sm text-white">Edit Project</span>
                                                    </motion.button>
                                                    <motion.button
                                                        whileHover={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                                                        onClick={() => {
                                                            handleDeleteClick(null, currentProject, 'project');
                                                            setIsProjectMenuOpen(false);
                                                        }}
                                                        className="w-full p-3 text-left flex items-center gap-2 transition-colors"
                                                    >
                                                        <FiTrash2 className="text-red-500" />
                                                        <span className="text-sm text-white">Delete Project</span>
                                                    </motion.button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* New Project and New Chat Buttons */}
                        <div className="p-4 border-b border-dark-600 space-y-2">
                            {/* New Project Button */}
                            {onCreateProject && (
                                <button
                                    onClick={onCreateProject}
                                    className="w-full glass-light hover:bg-dark-700/50 rounded-lg p-3 flex items-center justify-center gap-2 transition-colors"
                                >
                                    <FiPlus className="text-lg text-primary-400" />
                                    <span className="text-sm text-white">New Project</span>
                                </button>
                            )}

                            <button
                                onClick={handleCreateChat}
                                disabled={isCreating}
                                className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <FiPlus className="text-lg" />
                                <span>{isCreating ? 'Creating...' : 'New Chat'}</span>
                            </button>
                        </div>

                        {/* Chat History List with Expand/Collapse */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            <button
                                onClick={() => setIsChatListExpanded(!isChatListExpanded)}
                                className="w-full flex items-center justify-between mb-3 hover:bg-dark-700/30 rounded p-2 transition-colors"
                            >
                                <h3 className="text-xs font-semibold text-gray-500 uppercase">
                                    All Chats
                                </h3>
                                <FiChevronDown className={`text-gray-500 transition-transform ${isChatListExpanded ? '' : 'rotate-180'
                                    }`} />
                            </button>

                            <AnimatePresence>
                                {isChatListExpanded && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-2"
                                    >
                                        {chats.length === 0 ? (
                                            <div className="text-center text-gray-500 text-sm py-8">
                                                <FiMessageSquare className="text-4xl mx-auto mb-2 opacity-50" />
                                                <p>No chats yet</p>
                                                <p className="text-xs mt-1">Create a new chat to start</p>
                                            </div>
                                        ) : (
                                            chats.map((chat) => (
                                                <motion.div
                                                    key={chat.id}
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    onMouseEnter={() => setHoveredChatId(chat.id)}
                                                    onMouseLeave={() => setHoveredChatId(null)}
                                                    className="relative"
                                                >
                                                    <button
                                                        onClick={() => onSelectChat(chat)}
                                                        className={`w-full text-left glass-light rounded-lg p-3 hover:bg-dark-700/50 transition-colors ${currentChat?.id === chat.id ? 'ring-2 ring-primary-500' : ''
                                                            }`}
                                                    >
                                                        <div className="flex items-start gap-2">
                                                            <FiMessageSquare className="text-purple-400 mt-1 flex-shrink-0" />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm text-white font-medium truncate">
                                                                    {chat.name}
                                                                </p>
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    {chat.message_count} messages
                                                                </p>
                                                                <p className="text-xs text-gray-600 mt-0.5">
                                                                    {formatDate(chat.created_at)}
                                                                </p>
                                                            </div>
                                                            {/* Delete Button for Chat */}
                                                            <motion.button
                                                                initial={{ opacity: 0, scale: 0.8 }}
                                                                animate={{
                                                                    opacity: hoveredChatId === chat.id ? 1 : 0,
                                                                    scale: hoveredChatId === chat.id ? 1 : 0.8
                                                                }}
                                                                transition={{ duration: 0.15 }}
                                                                onClick={(e) => handleDeleteClick(e, chat, 'chat')}
                                                                className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                                                                title="Delete chat"
                                                            >
                                                                <motion.div
                                                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                                                    whileTap={{ scale: 0.9 }}
                                                                >
                                                                    <FiTrash2 className="text-gray-500 hover:text-red-500 transition-colors text-sm" />
                                                                </motion.div>
                                                            </motion.button>
                                                        </div>
                                                    </button>
                                                </motion.div>
                                            ))
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                ) : (
                    /* Collapsed State - Vertical Sidebar */
                    <div className="flex flex-col items-center justify-between h-full py-4">
                        <div className="flex flex-col items-center gap-4">
                            <div className="vertical-text text-sm font-semibold text-gray-400">
                                STUDIO
                            </div>
                            <div className="text-gray-500 text-xs">
                                {chats.length}
                            </div>
                        </div>
                        <button
                            onClick={onToggleCollapse}
                            className="p-2 hover:bg-dark-700 rounded-lg transition-colors rotate-180"
                            title="Expand panel"
                        >
                            <FiChevronRight className="text-xl text-gray-400" />
                        </button>
                    </div>
                )}
            </motion.div>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, item: null, type: null })}
                onConfirm={handleConfirmDelete}
                itemName={deleteModal.item?.name || '____'}
                itemType={deleteModal.type || ''}
            />

            {/* Edit Project Modal */}
            <EditProjectModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                project={currentProject}
                onUpdate={(updatedProject) => {
                    // Update the current project in the parent component
                    if (onSelectProject) {
                        onSelectProject(updatedProject);
                    }
                }}
            />
        </>
    );
};

export default StudioPanel;

