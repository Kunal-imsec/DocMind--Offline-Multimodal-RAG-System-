import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertTriangle, FiX } from 'react-icons/fi';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, itemName, itemType }) => {
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
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            className="bg-raycast-surface border border-raycast-border rounded-raycast-lg shadow-2xl max-w-md w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-raycast-border">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                                        <FiAlertTriangle className="text-red-500 text-lg" />
                                    </div>
                                    <h2 className="text-lg font-semibold text-raycast-text">
                                        Delete {itemType}?
                                    </h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-raycast-surface-hover rounded-lg transition-colors"
                                >
                                    <FiX className="text-raycast-text-secondary" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-4">
                                <p className="text-sm text-raycast-text-secondary mb-2">
                                    Are you sure you want to delete <span className="font-semibold text-raycast-text">"{itemName}"</span>?
                                </p>
                                <p className="text-xs text-raycast-text-tertiary">
                                    This action cannot be undone. All associated data will be permanently removed.
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-2 p-4 border-t border-raycast-border">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={onClose}
                                    className="px-4 py-2 rounded-lg text-sm font-medium text-raycast-text hover:bg-raycast-surface-hover transition-colors"
                                >
                                    Cancel
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={onConfirm}
                                    className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition-colors"
                                >
                                    Delete {itemType}
                                </motion.button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

export default DeleteConfirmModal;
