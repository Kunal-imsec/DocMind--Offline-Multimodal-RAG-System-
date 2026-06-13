import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiFolder, FiFileText, FiMessageSquare, FiClock, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const ProjectCard = ({ project, onDelete }) => {
    const navigate = useNavigate();
    const [isHovered, setIsHovered] = useState(false);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        if (onDelete) {
            onDelete(project);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01, y: -2 }}
            whileTap={{ scale: 0.99 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => navigate(`/projects/${project.id}`)}
            className="bg-raycast-surface border border-raycast-border rounded-raycast-lg p-3.5 cursor-pointer group hover:border-raycast-border-strong transition-all duration-150 relative"
        >
            {/* Delete Button */}
            <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.8 }}
                transition={{ duration: 0.15 }}
                onClick={handleDelete}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-raycast-surface hover:bg-red-500/10 border border-raycast-border hover:border-red-500/50 transition-colors z-10"
                title="Delete project"
            >
                <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                >
                    <FiTrash2 className="text-raycast-text-tertiary hover:text-red-500 transition-colors text-sm" />
                </motion.div>
            </motion.button>

            <div className="flex items-start gap-3">
                <motion.div
                    whileHover={{ rotate: 5, scale: 1.1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    className="w-10 h-10 rounded-lg bg-gradient-to-br from-raycast-orange to-raycast-red flex items-center justify-center flex-shrink-0"
                >
                    <FiFolder className="text-white text-lg" />
                </motion.div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-raycast-text mb-0.5 truncate group-hover:text-raycast-orange transition-colors duration-150">
                        {project.name || '____'}
                    </h3>
                    <p className="text-xs text-raycast-text-tertiary line-clamp-2 mb-2.5">
                        {project.description || '____'}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-raycast-text-tertiary">
                        <div className="flex items-center gap-1">
                            <FiFileText className="text-raycast-blue text-sm" />
                            <span>{project.document_count}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <FiMessageSquare className="text-raycast-purple text-sm" />
                            <span>{project.chat_count}</span>
                        </div>
                        <div className="flex items-center gap-1 ml-auto">
                            <FiClock className="text-raycast-text-quaternary text-sm" />
                            <span>{formatDate(project.updated_at)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ProjectCard;

