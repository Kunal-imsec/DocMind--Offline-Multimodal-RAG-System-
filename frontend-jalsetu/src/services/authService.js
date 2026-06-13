import api from './api';
import { USE_MOCK_API } from '../config';
import { mockApi } from './mockApi';

export const authService = {
    // Login
    login: async (username, password) => {
        if (USE_MOCK_API) {
            return await mockApi.login(username, password);
        }
        const response = await api.post('/auth/login/', { username, password });
        // Backend returns: { access, refresh, must_change_password, user }
        return response.data;
    },

    // Refresh token
    refreshToken: async (refreshToken) => {
        if (USE_MOCK_API) {
            return await mockApi.refreshToken(refreshToken);
        }
        const response = await api.post('/auth/token/refresh/', { refresh: refreshToken });
        return response.data;
    },

    // Get current user profile
    getProfile: async () => {
        if (USE_MOCK_API) {
            return await mockApi.getProfile();
        }
        const response = await api.get('/auth/me/');
        return response.data;
    },

    // Update profile
    updateProfile: async (data) => {
        if (USE_MOCK_API) {
            return await mockApi.updateProfile(data);
        }
        const response = await api.patch('/auth/me/', data);
        return response.data;
    },

    // Change password
    changePassword: async (oldPassword, newPassword) => {
        if (USE_MOCK_API) {
            return await mockApi.changePassword(oldPassword, newPassword);
        }
        const response = await api.post('/auth/change-password/', {
            old_password: oldPassword,
            new_password: newPassword,
        });
        return response.data;
    },

    // Sign up
    // NOTE: This endpoint is not yet implemented in the backend
    // Use onboarding requests instead for user registration
    signup: async (data) => {
        if (USE_MOCK_API) {
            return await mockApi.signup(data);
        }
        const response = await api.post('/auth/signup/', data);
        return response.data;
    },

    // Reset password
    // NOTE: This endpoint is not yet implemented in the backend
    // Password resets should be handled through admin or change-password flow
    resetPassword: async (data) => {
        if (USE_MOCK_API) {
            return await mockApi.resetPassword(data);
        }
        const response = await api.post('/auth/reset-password/', data);
        return response.data;
    },

    // Submit onboarding request
    submitOnboardingRequest: async (data) => {
        if (USE_MOCK_API) {
            return await mockApi.submitOnboardingRequest(data);
        }
        const response = await api.post('/auth/onboarding-requests/', data);
        return response.data;
    },

    // Get onboarding requests (SUPER_ADMIN only)
    getOnboardingRequests: async () => {
        if (USE_MOCK_API) {
            return await mockApi.getOnboardingRequests();
        }
        const response = await api.get('/auth/onboarding-requests/');
        return response.data;
    },

    // Get onboarding request detail (SUPER_ADMIN only)
    getOnboardingRequestDetail: async (id) => {
        if (USE_MOCK_API) {
            return await mockApi.getOnboardingRequestDetail(id);
        }
        const response = await api.get(`/auth/onboarding-requests/${id}/`);
        return response.data;
    },

    // Decide on onboarding request (SUPER_ADMIN only)
    decideOnboardingRequest: async (id, action, remark) => {
        if (USE_MOCK_API) {
            return await mockApi.decideOnboardingRequest(id, action, remark);
        }
        const response = await api.post(`/auth/onboarding-requests/${id}/decide/`, {
            action,
            remark,
        });
        return response.data;
    },
};
