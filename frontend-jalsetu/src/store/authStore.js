import { create } from 'zustand';

const useAuthStore = create((set, get) => ({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: true,

    // Initialize auth state from electron store
    initAuth: async () => {
        try {
            if (window.electronAPI) {
                const storedUser = await window.electronAPI.store.get('user');
                const storedAccessToken = await window.electronAPI.store.get('accessToken');
                const storedRefreshToken = await window.electronAPI.store.get('refreshToken');

                if (storedUser && storedAccessToken) {
                    set({
                        user: storedUser,
                        accessToken: storedAccessToken,
                        refreshToken: storedRefreshToken,
                        isAuthenticated: true,
                        isLoading: false,
                    });
                } else {
                    set({ isLoading: false });
                }
            } else {
                // Fallback to localStorage for web
                const storedUser = localStorage.getItem('user');
                const storedAccessToken = localStorage.getItem('accessToken');
                const storedRefreshToken = localStorage.getItem('refreshToken');

                if (storedUser && storedAccessToken) {
                    set({
                        user: JSON.parse(storedUser),
                        accessToken: storedAccessToken,
                        refreshToken: storedRefreshToken,
                        isAuthenticated: true,
                        isLoading: false,
                    });
                } else {
                    set({ isLoading: false });
                }
            }
        } catch (error) {
            console.error('Failed to initialize auth:', error);
            set({ isLoading: false });
        }
    },

    // Set authentication data
    setAuth: async (user, accessToken, refreshToken) => {
        set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
        });

        // Persist to electron store or localStorage
        try {
            if (window.electronAPI) {
                await window.electronAPI.store.set('user', user);
                await window.electronAPI.store.set('accessToken', accessToken);
                await window.electronAPI.store.set('refreshToken', refreshToken);
            } else {
                localStorage.setItem('user', JSON.stringify(user));
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', refreshToken);
            }
        } catch (error) {
            console.error('Failed to persist auth data:', error);
        }
    },

    // Update user profile
    updateUser: async (userData) => {
        const updatedUser = { ...get().user, ...userData };
        set({ user: updatedUser });

        try {
            if (window.electronAPI) {
                await window.electronAPI.store.set('user', updatedUser);
            } else {
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }
        } catch (error) {
            console.error('Failed to update user data:', error);
        }
    },

    // Update tokens
    setTokens: async (accessToken, refreshToken) => {
        set({ accessToken, refreshToken });

        try {
            if (window.electronAPI) {
                await window.electronAPI.store.set('accessToken', accessToken);
                if (refreshToken) {
                    await window.electronAPI.store.set('refreshToken', refreshToken);
                }
            } else {
                localStorage.setItem('accessToken', accessToken);
                if (refreshToken) {
                    localStorage.setItem('refreshToken', refreshToken);
                }
            }
        } catch (error) {
            console.error('Failed to update tokens:', error);
        }
    },

    // Logout
    logout: async () => {
        set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
        });

        try {
            if (window.electronAPI) {
                await window.electronAPI.store.clear();
            } else {
                localStorage.clear();
            }
        } catch (error) {
            console.error('Failed to clear auth data:', error);
        }
    },
}));

export default useAuthStore;
