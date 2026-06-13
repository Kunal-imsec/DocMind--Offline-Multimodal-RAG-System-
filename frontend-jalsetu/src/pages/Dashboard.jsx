import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams, useLocation } from 'react-router-dom';
import { FiFileText, FiUpload, FiUsers, FiPlus, FiFolder } from 'react-icons/fi';
import useAuthStore from '../store/authStore';
import useProjectStore from '../store/projectStore';
import Sidebar from '../components/Sidebar';
import ProjectCard from '../components/ProjectCard';
import CreateProjectModal from '../components/CreateProjectModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import projectService from '../services/projectService';
import toast from 'react-hot-toast';

const Dashboard = () => {
    const { user } = useAuthStore();
    const { projects, setProjects, addProject, deleteProject } = useProjectStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, project: null });
    const location = useLocation();

    // Check if modal should be opened from URL parameter
    useEffect(() => {
        if (searchParams.get('openModal') === 'true') {
            setIsModalOpen(true);
            // Remove the query parameter from URL
            searchParams.delete('openModal');
            setSearchParams(searchParams);
        }
    }, [searchParams, setSearchParams]);

    // Load projects on mount and whenever we navigate back to dashboard
    useEffect(() => {
        const loadProjects = async () => {
            try {
                setIsLoading(true);
                const userProjects = await projectService.getProjects();
                // Sort by updated_at descending (most recent first)
                const sortedProjects = userProjects.sort((a, b) =>
                    new Date(b.updated_at) - new Date(a.updated_at)
                );
                setProjects(sortedProjects);
            } catch (error) {
                console.error('Error loading projects:', error);
                toast.error('Failed to load projects');
            } finally {
                setIsLoading(false);
            }
        };

        loadProjects();
    }, [location.pathname]); // Reload when navigating to dashboard

    // Handle create project
    const handleCreateProject = async (data) => {
        try {
            const newProject = await projectService.createProject(data);
            addProject(newProject);
        } catch (error) {
            console.error('Error creating project:', error);
            throw error;
        }
    };

    // Handle delete project
    const handleDeleteProject = (project) => {
        setDeleteModal({ isOpen: true, project });
    };

    // Confirm delete project
    const handleConfirmDelete = async () => {
        const { project } = deleteModal;
        try {
            await projectService.deleteProject(project.id);
            deleteProject(project.id);
            toast.success('Project deleted successfully');
        } catch (error) {
            console.error('Error deleting project:', error);
            toast.error('Failed to delete project');
        } finally {
            setDeleteModal({ isOpen: false, project: null });
        }
    };

    const quickActions = [
        {
            icon: FiUpload,
            title: 'Upload Document',
            description: 'Upload and process new documents',
            path: '/upload',
            color: 'orange',
        },
        {
            icon: FiFileText,
            title: 'View Profile',
            description: 'Manage your account settings',
            path: '/profile',
            color: 'purple',
        },
    ];

    return (
        <div className="flex h-screen bg-raycast-bg">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
                <div className="p-6 max-w-7xl">
                    {/* Welcome Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mb-6"
                    >
                        <h1 className="text-2xl font-bold text-raycast-text mb-1">
                            Welcome back, {user?.first_name || user?.username}!
                        </h1>
                        <p className="text-sm text-raycast-text-secondary">
                            Manage your projects, documents and collaborate with your team
                        </p>
                    </motion.div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.3 }}
                            className="bg-raycast-surface border border-raycast-border rounded-raycast-lg p-3.5"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-raycast-text-tertiary mb-1">Total Projects</p>
                                    <p className="text-2xl font-bold text-raycast-text">{projects.length}</p>
                                </div>
                                <div className="w-10 h-10 rounded-lg bg-raycast-orange/10 flex items-center justify-center">
                                    <FiFolder className="text-raycast-orange text-lg" />
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15, duration: 0.3 }}
                            className="bg-raycast-surface border border-raycast-border rounded-raycast-lg p-3.5"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-raycast-text-tertiary mb-1">Total Documents</p>
                                    <p className="text-2xl font-bold text-raycast-text">
                                        {projects.reduce((sum, p) => sum + p.document_count, 0)}
                                    </p>
                                </div>
                                <div className="w-10 h-10 rounded-lg bg-raycast-blue/10 flex items-center justify-center">
                                    <FiFileText className="text-raycast-blue text-lg" />
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Create New Project Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25, duration: 0.3 }}
                        className="mb-6"
                    >
                        <h2 className="text-lg font-semibold text-raycast-text mb-3">Create Project</h2>
                        <motion.div
                            whileHover={{ scale: 1.01, y: -1 }}
                            whileTap={{ scale: 0.99 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            onClick={() => setIsModalOpen(true)}
                            className="bg-raycast-surface border border-raycast-border hover:border-raycast-border-strong rounded-raycast-lg p-3.5 cursor-pointer group max-w-md transition-all duration-150"
                        >
                            <div className="flex items-center gap-3">
                                <motion.div
                                    whileHover={{ rotate: 90 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                    className="w-12 h-12 rounded-lg bg-gradient-to-br from-raycast-orange to-raycast-red flex items-center justify-center"
                                >
                                    <FiPlus className="text-white text-xl" />
                                </motion.div>
                                <div>
                                    <h3 className="text-sm font-semibold text-raycast-text mb-0.5 group-hover:text-raycast-orange transition-colors duration-150">
                                        New Project
                                    </h3>
                                    <p className="text-xs text-raycast-text-tertiary">
                                        Create a new project to organize your documents and chats
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Featured Projects Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.3 }}
                        className="mb-6"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-semibold text-raycast-text">Featured Projects</h2>
                            {projects.length > 0 && (
                                <span className="text-xs text-raycast-text-tertiary">
                                    {projects.length} {projects.length === 1 ? 'project' : 'projects'}
                                </span>
                            )}
                        </div>

                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="spinner w-8 h-8 border-2 rounded-full"></div>
                            </div>
                        ) : projects.length === 0 ? (
                            <div className="bg-raycast-surface border border-raycast-border rounded-raycast-lg text-center py-12">
                                <FiFolder className="text-5xl text-raycast-text-quaternary mx-auto mb-3" />
                                <p className="text-sm text-raycast-text-secondary mb-1">No projects yet</p>
                                <p className="text-xs text-raycast-text-tertiary">
                                    Create your first project to get started
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {projects.map((project, index) => (
                                    <motion.div
                                        key={project.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.35 + index * 0.05, duration: 0.3 }}
                                    >
                                        <ProjectCard project={project} onDelete={handleDeleteProject} />
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>

                    {/* Quick Actions */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.3 }}
                    >
                        <h2 className="text-lg font-semibold text-raycast-text mb-3">Quick Actions</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {quickActions.map((action, index) => (
                                <motion.a
                                    key={action.path}
                                    href={action.path}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    whileHover={{ scale: 1.01, y: -1 }}
                                    whileTap={{ scale: 0.99 }}
                                    transition={{
                                        delay: 0.45 + index * 0.05,
                                        type: 'spring',
                                        stiffness: 400,
                                        damping: 25
                                    }}
                                    className="bg-raycast-surface border border-raycast-border hover:border-raycast-border-strong rounded-raycast-lg p-3.5 cursor-pointer group transition-all duration-150"
                                >
                                    <div
                                        className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${action.color === 'orange' ? 'bg-raycast-orange/10' :
                                            action.color === 'blue' ? 'bg-raycast-blue/10' :
                                                action.color === 'purple' ? 'bg-raycast-purple/10' :
                                                    'bg-raycast-surface'
                                            }`}
                                    >
                                        <action.icon className={`text-lg ${action.color === 'orange' ? 'text-raycast-orange' :
                                            action.color === 'blue' ? 'text-raycast-blue' :
                                                action.color === 'purple' ? 'text-raycast-purple' :
                                                    'text-raycast-text'
                                            }`} />
                                    </div>
                                    <h3 className="text-sm font-semibold text-raycast-text mb-0.5">{action.title}</h3>
                                    <p className="text-xs text-raycast-text-tertiary">{action.description}</p>
                                </motion.a>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </main>

            {/* Create Project Modal */}
            <CreateProjectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onCreateProject={handleCreateProject}
            />

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, project: null })}
                onConfirm={handleConfirmDelete}
                itemName={deleteModal.project?.name || ''}
                itemType="project"
            />
        </div>
    );
};

export default Dashboard;
