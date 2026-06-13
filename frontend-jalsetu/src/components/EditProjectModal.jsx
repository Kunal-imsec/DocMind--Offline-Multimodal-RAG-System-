import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiEdit2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import projectService from '../services/projectService';
import LoadingSpinner from './LoadingSpinner';

const EditProjectModal = ({ isOpen, onClose, project, onUpdate }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (project) {
            setFormData({
                name: project.name || '',
                description: project.description || ''
            });
        }
    }, [project]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const updatedProject = await projectService.updateProject(project.id, formData);
            toast.success('Project updated successfully!');
            if (onUpdate) {
                onUpdate(updatedProject);
            }
            onClose();
        } catch (error) {
            console.error('Error updating project:', error);
            toast.error('Failed to update project');
        } finally {
            setIsLoading(false);
        }
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
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', duration: 0.3 }}
                            className="bg-raycast-surface border border-raycast-border rounded-raycast-lg shadow-raycast-lg max-w-md w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-raycast-border">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-raycast-orange to-raycast-red flex items-center justify-center">
                                        <FiEdit2 className="text-white text-sm" />
                                    </div>
                                    <h2 className="text-lg font-bold text-raycast-text">Edit Project</h2>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.1, rotate: 90 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={onClose}
                                    className="p-1.5 rounded-lg hover:bg-raycast-surface-hover transition-colors"
                                >
                                    <FiX className="text-raycast-text-secondary text-lg" />
                                </motion.button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="p-4 space-y-4">
                                {/* Project Name */}
                                <div>
                                    <label className="block text-xs font-medium text-raycast-text-secondary mb-1.5">
                                        Project Name
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="input-field text-sm"
                                        placeholder="Enter project name"
                                        disabled={isLoading}
                                        required
                                    />
                                </div>

                                {/* Project Description */}
                                <div>
                                    <label className="block text-xs font-medium text-raycast-text-secondary mb-1.5">
                                        Description
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        className="input-field text-sm resize-none"
                                        placeholder="Enter project description"
                                        rows={4}
                                        disabled={isLoading}
                                    />
                                </div>

                                {/* Buttons */}
                                <div className="flex gap-2 pt-2">
                                    <motion.button
                                        type="submit"
                                        disabled={isLoading}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isLoading ? (
                                            <>
                                                <LoadingSpinner size="sm" />
                                                <span>Saving...</span>
                                            </>
                                        ) : (
                                            'Save Changes'
                                        )}
                                    </motion.button>
                                    <motion.button
                                        type="button"
                                        onClick={onClose}
                                        disabled={isLoading}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="btn-ghost px-4"
                                    >
                                        Cancel
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

export default EditProjectModal;
