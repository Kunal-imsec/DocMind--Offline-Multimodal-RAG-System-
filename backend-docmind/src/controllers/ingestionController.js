import IngestionDocument from '../models/IngestionDocument.js';
import Job from '../models/Job.js';
import aiService from '../services/aiService.js';
import fs from 'fs';

/**
 * @route   POST /api/ingestion/upload/
 * @desc    Upload document
 * @access  Private (SENIOR_ANALYST or SUPER_ADMIN)
 */
export const uploadDocument = async (req, res, next) => {
    try {
        const { title, description, classification } = req.body;
        const file = req.file;

        // Validate input
        if (!title) {
            // Clean up uploaded file
            if (file) fs.unlinkSync(file.path);

            return res.status(400).json({
                status: 400,
                data: {
                    detail: 'Title is required'
                }
            });
        }

        if (!file) {
            return res.status(400).json({
                status: 400,
                data: {
                    detail: 'File is required'
                }
            });
        }

        // Create job for processing
        const job = await Job.create({
            status: 'PENDING'
        });

        // Create document
        const document = await IngestionDocument.create({
            title,
            description: description || '',
            classification: classification || 'PUBLIC',
            filename: file.originalname,
            file_size: file.size,
            file_type: file.mimetype,
            file_path: file.path,
            uploaded_by: req.user._id,
            job_id: job.id,
            status: 'PROCESSING'
        });

        // Process document inline (in production, use a queue)
        try {
            job.status = 'RUNNING';
            job.started_at = new Date();
            await job.save();

            // Process document
            const result = await aiService.processDocument(document);

            // Update document status
            document.status = result.status;
            await document.save();

            // Update job status
            job.status = 'COMPLETED';
            job.finished_at = new Date();
            await job.save();
        } catch (error) {
            console.error('Document processing error:', error);

            document.status = 'FAILED';
            await document.save();

            job.status = 'FAILED';
            job.error_message = error.message;
            job.finished_at = new Date();
            await job.save();
        }

        res.status(201).json({
            document_id: document._id,
            version_id: document.version_id,
            job_id: job.id,
            job_status: job.status,
            doc_status: document.status
        });
    } catch (error) {
        // Clean up file if error occurs
        if (req.file) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (err) {
                console.error('Error deleting file:', err);
            }
        }
        next(error);
    }
};

/**
 * @route   GET /api/ingestion/jobs/:jobId/
 * @desc    Get job status
 * @access  Private
 */
export const getJobStatus = async (req, res, next) => {
    try {
        const job = await Job.findOne({ id: req.params.jobId });

        if (!job) {
            return res.status(404).json({
                status: 404,
                data: {
                    detail: 'Job not found'
                }
            });
        }

        res.json({
            id: job.id,
            status: job.status,
            error_message: job.error_message,
            created_at: job.created_at,
            started_at: job.started_at,
            finished_at: job.finished_at
        });
    } catch (error) {
        next(error);
    }
};
