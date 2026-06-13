import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiCheck, FiX, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import LoadingSpinner from '../components/LoadingSpinner';
import { authService } from '../services/authService';

const OnboardingManagement = () => {
    const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [remarkInput, setRemarkInput] = useState({});

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const data = await authService.getOnboardingRequests();
            setRequests(data);
        } catch (err) {
            toast.error('Failed to fetch onboarding requests');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDecision = async (id, action) => {
        const remark = remarkInput[id] || '';

        if (!remark.trim()) {
            toast.error('Please provide a remark');
            return;
        }

        setProcessingId(id);

        try {
            await authService.decideOnboardingRequest(id, action, remark);
            toast.success(
                action === 'APPROVE'
                    ? 'Request approved successfully!'
                    : 'Request rejected successfully!'
            );
            fetchRequests(); // Refresh list
            setRemarkInput((prev) => ({ ...prev, [id]: '' }));
        } catch (err) {
            const errorMessage = err.response?.data?.detail || 'Failed to process request';
            toast.error(errorMessage);
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            PENDING: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'Pending' },
            APPROVED: { color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Approved' },
            REJECTED: { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Rejected' },
        };
        const badge = badges[status] || badges.PENDING;
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${badge.color}`}>
                {badge.label}
            </span>
        );
    };

    if (isLoading) {
        return (
            <div className="flex h-screen bg-dark-950">
                <Sidebar />
                <main className="flex-1 flex items-center justify-center">
                    <LoadingSpinner size="lg" />
                </main>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-dark-950">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
                <div className="p-8">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <h1 className="text-4xl font-bold gradient-text mb-2">Onboarding Management</h1>
                        <p className="text-gray-500">Review and approve access requests</p>
                    </motion.div>

                    {/* Requests List */}
                    {requests.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="card text-center py-12"
                        >
                            <FiUsers className="text-6xl text-gray-600 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2">No Requests Found</h3>
                            <p className="text-gray-500">There are no onboarding requests at this time.</p>
                        </motion.div>
                    ) : (
                        <div className="space-y-4">
                            {requests.map((request, index) => (
                                <motion.div
                                    key={request.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="card"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-xl font-bold text-white">{request.full_name}</h3>
                                                {getStatusBadge(request.status)}
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                                <div>
                                                    <span className="text-gray-500">Email:</span>{' '}
                                                    <span className="text-gray-300">{request.email}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Requested Role:</span>{' '}
                                                    <span className="text-gray-300">{request.requested_role}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Department:</span>{' '}
                                                    <span className="text-gray-300">{request.department}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Requested:</span>{' '}
                                                    <span className="text-gray-300">
                                                        {new Date(request.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {request.status === 'PENDING' && (
                                        <div className="mt-4 pt-4 border-t border-dark-600">
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Remark *
                                            </label>
                                            <textarea
                                                value={remarkInput[request.id] || ''}
                                                onChange={(e) =>
                                                    setRemarkInput((prev) => ({
                                                        ...prev,
                                                        [request.id]: e.target.value,
                                                    }))
                                                }
                                                className="input-field resize-none mb-3"
                                                rows="2"
                                                placeholder="Enter your remark..."
                                                disabled={processingId === request.id}
                                            />
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => handleDecision(request.id, 'APPROVE')}
                                                    disabled={processingId === request.id}
                                                    className="btn-primary flex items-center gap-2 disabled:opacity-50"
                                                >
                                                    {processingId === request.id ? (
                                                        <LoadingSpinner size="sm" />
                                                    ) : (
                                                        <FiCheck />
                                                    )}
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleDecision(request.id, 'REJECT')}
                                                    disabled={processingId === request.id}
                                                    className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-6 rounded-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
                                                >
                                                    {processingId === request.id ? (
                                                        <LoadingSpinner size="sm" />
                                                    ) : (
                                                        <FiX />
                                                    )}
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {request.status !== 'PENDING' && request.remark && (
                                        <div className="mt-4 pt-4 border-t border-dark-600">
                                            <p className="text-sm text-gray-500 mb-1">Admin Remark:</p>
                                            <p className="text-gray-300">{request.remark}</p>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default OnboardingManagement;
