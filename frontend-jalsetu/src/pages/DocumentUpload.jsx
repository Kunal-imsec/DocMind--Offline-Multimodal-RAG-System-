import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiUploadCloud, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import FileUploadZone from '../components/FileUploadZone';
import LoadingSpinner from '../components/LoadingSpinner';
import { ingestionService } from '../services/ingestionService';

const DocumentUpload = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        classification: 'PUBLIC',
    });
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
    const [jobStatus, setJobStatus] = useState(null);

    const classifications = [
        { value: 'PUBLIC', label: 'Public' },
        { value: 'RESTRICTED', label: 'Restricted' },
        { value: 'CONFIDENTIAL', label: 'Confidential' },
        { value: 'TOP_SECRET', label: 'Top Secret' },
    ];

    const acceptedFileTypes = {
        'application/pdf': ['.pdf'],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        'image/jpeg': ['.jpg', '.jpeg'],
        'image/png': ['.png'],
        'audio/wav': ['.wav'],
        'audio/mpeg': ['.mp3'],
        'audio/mp4': ['.m4a'],
        'audio/flac': ['.flac'],
        'audio/ogg': ['.ogg'],
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleFileSelect = (file) => {
        setSelectedFile(file);
        if (file && !formData.title) {
            setFormData((prev) => ({
                ...prev,
                title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedFile) {
            toast.error('Please select a file to upload');
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);
        setUploadResult(null);
        setJobStatus(null);

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('file', selectedFile);
            formDataToSend.append('title', formData.title);
            formDataToSend.append('description', formData.description);
            formDataToSend.append('classification', formData.classification);

            const result = await ingestionService.uploadDocument(
                formDataToSend,
                (progressEvent) => {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    setUploadProgress(percentCompleted);
                }
            );

            setUploadResult(result);
            toast.success('Document uploaded successfully!');

            // Poll job status if job_id is returned
            if (result.job_id) {
                setJobStatus({ status: 'RUNNING' });
                try {
                    const finalStatus = await ingestionService.pollJobStatus(
                        result.job_id,
                        (status) => {
                            setJobStatus(status);
                        }
                    );

                    if (finalStatus.status === 'COMPLETED') {
                        toast.success('Document processing completed!');
                    } else if (finalStatus.status === 'FAILED') {
                        toast.error(`Processing failed: ${finalStatus.error_message || 'Unknown error'}`);
                    }
                } catch (pollError) {
                    console.error('Polling error:', pollError);
                    toast.error('Failed to track processing status');
                }
            }

            // Reset form
            setSelectedFile(null);
            setFormData({
                title: '',
                description: '',
                classification: 'PUBLIC',
            });
        } catch (err) {
            const errorMessage =
                err.response?.data?.detail ||
                err.response?.data?.file?.[0] ||
                'Failed to upload document';
            toast.error(errorMessage);
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    return (
        <div className="flex h-screen bg-raycast-bg">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
                <div className="p-6 max-w-3xl mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mb-6"
                    >
                        <h1 className="text-2xl font-bold text-raycast-text mb-1">Upload Document</h1>
                        <p className="text-sm text-raycast-text-secondary">Upload and process documents for ingestion</p>
                    </motion.div>

                    {/* Upload Form */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.3 }}
                        className="bg-raycast-surface border border-raycast-border rounded-raycast-lg p-5"
                    >
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* File Upload Zone */}
                            <FileUploadZone
                                onFileSelect={handleFileSelect}
                                acceptedFileTypes={acceptedFileTypes}
                            />

                            {/* Title */}
                            <div>
                                <label className="block text-xs font-medium text-raycast-text-secondary mb-1.5">
                                    Document Title *
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    className="input-field text-sm"
                                    placeholder="Enter document title"
                                    required
                                    disabled={isUploading}
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-medium text-raycast-text-secondary mb-1.5">
                                    Description (Optional)
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="input-field resize-none text-sm"
                                    rows="3"
                                    placeholder="Enter document description"
                                    disabled={isUploading}
                                />
                            </div>

                            {/* Classification */}
                            <div>
                                <label className="block text-xs font-medium text-raycast-text-secondary mb-1.5">
                                    Classification *
                                </label>
                                <select
                                    name="classification"
                                    value={formData.classification}
                                    onChange={handleChange}
                                    className="input-field text-sm"
                                    required
                                    disabled={isUploading}
                                >
                                    {classifications.map((cls) => (
                                        <option key={cls.value} value={cls.value}>
                                            {cls.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Upload Progress */}
                            {isUploading && (
                                <div className="p-3 bg-raycast-elevated rounded-raycast">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs text-raycast-text-secondary">Uploading...</span>
                                        <span className="text-xs text-raycast-orange font-medium">{uploadProgress}%</span>
                                    </div>
                                    <div className="w-full bg-raycast-bg rounded-full h-1.5">
                                        <div
                                            className="bg-raycast-orange h-1.5 rounded-full transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}

                            {/* Job Status */}
                            {jobStatus && (
                                <div className="p-3 bg-raycast-elevated rounded-raycast">
                                    <div className="flex items-center gap-2">
                                        {jobStatus.status === 'RUNNING' || jobStatus.status === 'PENDING' ? (
                                            <>
                                                <LoadingSpinner size="sm" />
                                                <span className="text-xs text-raycast-text-secondary">Processing document...</span>
                                            </>
                                        ) : jobStatus.status === 'COMPLETED' ? (
                                            <>
                                                <FiCheckCircle className="text-raycast-green text-base" />
                                                <span className="text-xs text-raycast-green">Processing completed!</span>
                                            </>
                                        ) : (
                                            <>
                                                <FiAlertCircle className="text-raycast-red text-base" />
                                                <span className="text-xs text-raycast-red">
                                                    Processing failed: {jobStatus.error_message || 'Unknown error'}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isUploading || !selectedFile}
                                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm mt-5"
                            >
                                {isUploading ? (
                                    <>
                                        <LoadingSpinner size="sm" />
                                        <span>Uploading...</span>
                                    </>
                                ) : (
                                    <>
                                        <FiUploadCloud />
                                        <span>Upload Document</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </motion.div>
                </div>
            </main>
        </div>
    );
};

export default DocumentUpload;
