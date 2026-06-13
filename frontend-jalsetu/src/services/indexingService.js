import api from './api';
import { USE_MOCK_API } from '../config';
import { mockApi } from './mockApi';

export const indexingService = {
    /**
     * Rebuild index
     * Roles: SUPER_ADMIN or IT_ADMIN
     * @param {Object} data - { modality: 'text'|'image'|'audio', mode: 'full'|'incremental', notes: '...' }
     * @returns {Promise} Response with snapshot details
     */
    rebuildIndex: async (data) => {
        if (USE_MOCK_API) {
            return await mockApi.rebuildIndex(data);
        }
        const response = await api.post('/indexes/rebuild/', data);
        return response.data;
    },

    /**
     * Get index snapshots
     * @param {string} modality - Optional filter: 'text'|'image'|'audio'
     * @returns {Promise} List of snapshot objects
     */
    getSnapshots: async (modality = null) => {
        if (USE_MOCK_API) {
            return await mockApi.getSnapshots(modality);
        }
        const params = modality ? { modality } : {};
        const response = await api.get('/indexes/snapshots/', { params });
        return response.data;
    },
};
