import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronLeft, FiUpload, FiFile, FiTrash2, FiDownload, FiMoreVertical, FiEye, FiPlay, FiPause, FiFileText, FiImage, FiMusic } from 'react-icons/fi';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';

const DocumentsPanel = ({
    documents,
    isCollapsed,
    onToggleCollapse,
    onUploadDocument,
    onDeleteDocument
}) => {
    const [isUploading, setIsUploading] = useState(false);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [playingAudioId, setPlayingAudioId] = useState(null);
    const [audioElement, setAudioElement] = useState(null);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: async (acceptedFiles) => {
            if (acceptedFiles.length === 0) return;

            setIsUploading(true);
            try {
                for (const file of acceptedFiles) {
                    await onUploadDocument(file);
                }
                toast.success('Document(s) uploaded successfully!');
            } catch (error) {
                toast.error('Failed to upload document');
                console.error('Upload error:', error);
            } finally {
                setIsUploading(false);
            }
        },
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'audio/wav': ['.wav'],
            'audio/mpeg': ['.mp3'],
            'audio/mp4': ['.m4a'],
            'audio/flac': ['.flac'],
            'audio/ogg': ['.ogg'],
        },
        disabled: isUploading,
    });

    // Helper function to detect file type
    const getFileType = (filename) => {
        const ext = filename.split('.').pop().toLowerCase();
        if (['mp3', 'wav', 'm4a', 'flac', 'ogg'].includes(ext)) return 'audio';
        if (['jpg', 'jpeg', 'png'].includes(ext)) return 'image';
        if (['pdf'].includes(ext)) return 'pdf';
        if (['docx', 'doc'].includes(ext)) return 'document';
        return 'file';
    };

    // Helper function to get file icon
    const getFileIcon = (filename) => {
        const type = getFileType(filename);
        switch (type) {
            case 'audio': return FiMusic;
            case 'image': return FiImage;
            case 'pdf': return FiFileText;
            case 'document': return FiFileText;
            default: return FiFile;
        }
    };

    // Handle audio playback
    const handlePlayAudio = (doc) => {
        if (playingAudioId === doc.id) {
            // Pause current audio
            if (audioElement) {
                audioElement.pause();
            }
            setPlayingAudioId(null);
            setAudioElement(null);
        } else {
            // Stop previous audio if any
            if (audioElement) {
                audioElement.pause();
            }

            // Create and play new audio
            const audio = new Audio(doc.file_url || URL.createObjectURL(doc.file));
            audio.play();
            audio.onended = () => {
                setPlayingAudioId(null);
                setAudioElement(null);
            };
            setPlayingAudioId(doc.id);
            setAudioElement(audio);
        }
    };

    // Handle view file
    const handleViewFile = (doc) => {
        const fileType = getFileType(doc.filename);

        if (fileType === 'image' || fileType === 'pdf') {
            // Open in new window/tab
            const url = doc.file_url || (doc.file ? URL.createObjectURL(doc.file) : null);
            if (url) {
                window.open(url, '_blank');
            } else {
                toast.error('File URL not available');
            }
        } else {
            toast.info('Preview not available for this file type');
        }
        setOpenMenuId(null);
    };

    // Handle delete with menu close
    const handleDeleteFile = (docId) => {
        onDeleteDocument(docId);
        setOpenMenuId(null);
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            if (audioElement) {
                audioElement.pause();
                audioElement.src = '';
            }
        };
    }, [audioElement]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (openMenuId && !event.target.closest('.menu-container')) {
                setOpenMenuId(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openMenuId]);

    return (
        <motion.div
            initial={false}
            animate={{ width: isCollapsed ? 60 : 320 }}
            transition={{ duration: 0.3 }}
            className="glass border-r border-dark-600 flex flex-col overflow-hidden"
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
                        <h2 className="text-lg font-bold text-white">Sources</h2>
                        <button
                            onClick={onToggleCollapse}
                            className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                            title="Minimize panel"
                        >
                            <FiChevronLeft className="text-xl text-gray-400" />
                        </button>
                    </div>

                    {/* Upload Zone */}
                    <div className="p-4 border-b border-dark-600">
                        <div
                            {...getRootProps()}
                            className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${isDragActive
                                ? 'border-primary-500 bg-primary-500/10'
                                : 'border-dark-600 hover:border-primary-500/50 hover:bg-dark-700/50'
                                } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <input {...getInputProps()} />
                            <FiUpload className="text-3xl text-primary-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-400">
                                {isUploading ? 'Uploading...' : 'Drop files or click to upload'}
                            </p>
                        </div>
                    </div>

                    {/* Documents List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {documents.length === 0 ? (
                            <div className="text-center text-gray-500 text-sm py-8">
                                <FiFile className="text-4xl mx-auto mb-2 opacity-50" />
                                <p>No documents yet</p>
                                <p className="text-xs mt-1">Upload files to get started</p>
                            </div>
                        ) : (
                            documents.map((doc) => {
                                const FileIcon = getFileIcon(doc.filename);
                                const fileType = getFileType(doc.filename);
                                const isAudio = fileType === 'audio';
                                const isPlaying = playingAudioId === doc.id;

                                return (
                                    <motion.div
                                        key={doc.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="glass-light rounded-lg p-3 hover:bg-dark-700/50 transition-colors relative"
                                    >
                                        <div className="flex items-center gap-2">
                                            {/* Play Button for Audio Files */}
                                            {isAudio && (
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => handlePlayAudio(doc)}
                                                    className="p-2 rounded-lg bg-primary-500/20 hover:bg-primary-500/30 transition-colors flex-shrink-0"
                                                    title={isPlaying ? 'Pause' : 'Play'}
                                                >
                                                    {isPlaying ? (
                                                        <FiPause className="text-primary-400 text-base" />
                                                    ) : (
                                                        <FiPlay className="text-primary-400 text-base" />
                                                    )}
                                                </motion.button>
                                            )}

                                            {/* File Icon */}
                                            <FileIcon className={`${isAudio ? 'text-purple-400' : 'text-blue-400'} mt-1 flex-shrink-0`} />

                                            {/* File Info */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-white font-medium truncate">
                                                    {doc.filename}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {formatFileSize(doc.file_size)}
                                                </p>
                                            </div>

                                            {/* 3-Dot Menu */}
                                            <div className="relative flex-shrink-0 menu-container">
                                                <motion.button
                                                    whileHover={{ scale: 1.1, rotate: 90 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => setOpenMenuId(openMenuId === doc.id ? null : doc.id)}
                                                    className="p-2 rounded-lg hover:bg-dark-600 transition-colors"
                                                    title="More options"
                                                >
                                                    <FiMoreVertical className="text-gray-400" />
                                                </motion.button>

                                                {/* Dropdown Menu */}
                                                <AnimatePresence>
                                                    {openMenuId === doc.id && (
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                                            transition={{ type: 'spring', duration: 0.2 }}
                                                            className="absolute right-0 bottom-full mb-1 glass rounded-lg shadow-xl z-50 min-w-[140px] overflow-hidden border border-dark-600"
                                                        >
                                                            <motion.button
                                                                whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', scale: 1.02 }}
                                                                whileTap={{ scale: 0.98 }}
                                                                onClick={() => handleViewFile(doc)}
                                                                className="w-full p-2.5 text-left flex items-center gap-2 border-b border-dark-600 transition-colors"
                                                            >
                                                                <FiEye className="text-blue-400 text-sm" />
                                                                <span className="text-xs text-white">View</span>
                                                            </motion.button>
                                                            <motion.button
                                                                whileHover={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', scale: 1.02 }}
                                                                whileTap={{ scale: 0.98 }}
                                                                onClick={() => handleDeleteFile(doc.id)}
                                                                className="w-full p-2.5 text-left flex items-center gap-2 transition-colors"
                                                            >
                                                                <FiTrash2 className="text-red-500 text-sm" />
                                                                <span className="text-xs text-white">Delete</span>
                                                            </motion.button>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </div>
                </motion.div>
            ) : (
                /* Collapsed State - Vertical Sidebar */
                <div className="flex flex-col items-center justify-between h-full py-4">
                    <div className="flex flex-col items-center gap-4">
                        <div className="vertical-text text-sm font-semibold text-gray-400">
                            SOURCES
                        </div>
                        <div className="text-gray-500 text-xs">
                            {documents.length}
                        </div>
                    </div>
                    <button
                        onClick={onToggleCollapse}
                        className="p-2 hover:bg-dark-700 rounded-lg transition-colors rotate-180"
                        title="Expand panel"
                    >
                        <FiChevronLeft className="text-xl text-gray-400" />
                    </button>
                </div>
            )}
        </motion.div>
    );
};

export default DocumentsPanel;
