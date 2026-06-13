import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const basename = path.basename(file.originalname, ext);
        cb(null, `${basename}-${uniqueSuffix}${ext}`);
    }
});

// File filter for allowed types
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        // Documents
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
        'text/plain',
        // Images
        'image/jpeg',
        'image/jpg',
        'image/png',
        // Audio
        'audio/wav',
        'audio/mpeg', // mp3
        'audio/mp4', // m4a
        'audio/flac',
        'audio/ogg',
        'audio/aac',
        'audio/x-ms-wma', // wma
        'audio/opus',
        'audio/webm',
        'video/mp4' // for audio in mp4 container
    ];

    const allowedExtensions = [
        '.pdf', '.docx', '.txt',
        '.jpg', '.jpeg', '.png',
        '.wav', '.mp3', '.m4a', '.flac', '.ogg', '.aac', '.wma', '.opus', '.webm', '.mp4'
    ];

    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed types: PDF, DOCX, TXT, JPG, JPEG, PNG, WAV, MP3, M4A, FLAC, OGG, AAC, WMA, OPUS, WEBM, MP4`), false);
    }
};

// Configure multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 52428800 // 50MB default
    }
});

// Error handler for multer errors
export const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                status: 400,
                data: {
                    detail: 'File size exceeds maximum limit of 50MB'
                }
            });
        }
        return res.status(400).json({
            status: 400,
            data: {
                detail: err.message
            }
        });
    } else if (err) {
        return res.status(400).json({
            status: 400,
            data: {
                detail: err.message
            }
        });
    }
    next();
};

export default upload;
