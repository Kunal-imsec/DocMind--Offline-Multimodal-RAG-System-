import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUploadCloud, FiFile, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const FileUploadZone = ({ onFileSelect, acceptedFileTypes, maxSize = 100 * 1024 * 1024 }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [error, setError] = useState(null);

    const onDrop = useCallback(
        (acceptedFiles, rejectedFiles) => {
            setError(null);

            if (rejectedFiles.length > 0) {
                const rejection = rejectedFiles[0];
                if (rejection.errors[0]?.code === 'file-too-large') {
                    setError(`File is too large. Maximum size is ${maxSize / (1024 * 1024)}MB`);
                } else if (rejection.errors[0]?.code === 'file-invalid-type') {
                    setError('Invalid file type. Please upload a supported file.');
                } else {
                    setError('File upload failed. Please try again.');
                }
                return;
            }

            if (acceptedFiles.length > 0) {
                const file = acceptedFiles[0];
                setSelectedFile(file);
                onFileSelect(file);
            }
        },
        [onFileSelect, maxSize]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: acceptedFileTypes,
        maxSize,
        multiple: false,
    });

    const removeFile = () => {
        setSelectedFile(null);
        onFileSelect(null);
        setError(null);
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="w-full">
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${isDragActive
                    ? 'border-primary-500 bg-primary-500/10'
                    : error
                        ? 'border-red-500 bg-red-500/5'
                        : 'border-dark-600 hover:border-primary-500/50 bg-dark-800/50'
                    }`}
            >
                <input {...getInputProps()} />
                <motion.div
                    initial={{ scale: 1 }}
                    animate={{ scale: isDragActive ? 1.05 : 1 }}
                    className="flex flex-col items-center gap-4"
                >
                    <div
                        className={`w-16 h-16 rounded-full flex items-center justify-center ${isDragActive ? 'bg-primary-500/20' : 'bg-dark-700'
                            }`}
                    >
                        <FiUploadCloud
                            className={`text-3xl ${isDragActive ? 'text-primary-400' : 'text-gray-400'}`}
                        />
                    </div>
                    <div>
                        <p className="text-lg font-medium text-white mb-1">
                            {isDragActive ? 'Drop the file here' : 'Drag & drop a file here'}
                        </p>
                        <p className="text-sm text-gray-500">or click to browse</p>
                    </div>
                    <p className="text-xs text-gray-600">
                        Supported: PDF, DOCX, Images (JPEG, PNG), Audio (WAV, MP3, M4A, FLAC, OGG)
                    </p>
                </motion.div>
            </div>

            {/* Error Message */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm"
                    >
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Selected File Preview */}
            <AnimatePresence>
                {selectedFile && !error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-4 p-4 glass rounded-lg flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-primary-500/20 flex items-center justify-center">
                                <FiFile className="text-primary-400 text-xl" />
                            </div>
                            <div>
                                <p className="font-medium text-white">{selectedFile.name}</p>
                                <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                            </div>
                        </div>
                        <button
                            onClick={removeFile}
                            className="p-2 hover:bg-red-500/10 rounded-lg text-red-400 transition-colors"
                        >
                            <FiX className="text-xl" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FileUploadZone;
