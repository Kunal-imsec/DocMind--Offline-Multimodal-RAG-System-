import api from './api';
import { USE_MOCK_API } from '../config';
import { mockApi } from './mockApi';

export const ingestionService = {
    // Upload document
    uploadDocument: async (formData, onUploadProgress) => {
        if (USE_MOCK_API) {
            return await mockApi.uploadDocument(formData, onUploadProgress);
        }
        const response = await api.post('/ingestion/upload/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress,
        });
        return response.data;
    },

    // Get job status
    getJobStatus: async (jobId) => {
        if (USE_MOCK_API) {
            return await mockApi.getJobStatus(jobId);
        }
        const response = await api.get(`/ingestion/jobs/${jobId}/`);
        return response.data;
    },

    // Poll job status until completion
    pollJobStatus: async (jobId, onUpdate, interval = 2000, maxAttempts = 30) => {
        let attempts = 0;

        return new Promise((resolve, reject) => {
            const poll = setInterval(async () => {
                try {
                    attempts++;
                    const status = await ingestionService.getJobStatus(jobId);

                    if (onUpdate) {
                        onUpdate(status);
                    }

                    if (status.status === 'COMPLETED' || status.status === 'FAILED') {
                        clearInterval(poll);
                        resolve(status);
                    }

                    if (attempts >= maxAttempts) {
                        clearInterval(poll);
                        reject(new Error('Polling timeout'));
                    }
                } catch (error) {
                    clearInterval(poll);
                    reject(error);
                }
            }, interval);
        });
    },
};
