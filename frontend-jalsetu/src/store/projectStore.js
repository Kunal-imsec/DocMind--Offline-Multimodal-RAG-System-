import { create } from 'zustand';

const useProjectStore = create((set, get) => ({
    // Projects
    projects: [],
    currentProject: null,
    isLoadingProjects: false,

    // Current chat session
    currentChat: null,
    chats: [],
    messages: [],

    // Documents
    documents: [],

    // Panel states
    isLeftPanelCollapsed: false,
    isRightPanelCollapsed: false,
    isFullscreenMode: false,

    // Set projects list
    setProjects: (projects) => set({ projects }),

    // Set current project
    setCurrentProject: (project) => set({
        currentProject: project,
        currentChat: null,
        messages: [],
    }),

    // Add new project
    addProject: (project) => set((state) => ({
        projects: [project, ...state.projects],
    })),

    // Update project
    updateProject: (projectId, updates) => set((state) => ({
        projects: state.projects.map((p) =>
            p.id === projectId ? { ...p, ...updates } : p
        ),
        currentProject:
            state.currentProject?.id === projectId
                ? { ...state.currentProject, ...updates }
                : state.currentProject,
    })),

    // Delete project
    deleteProject: (projectId) => set((state) => ({
        projects: state.projects.filter((p) => p.id !== projectId),
        currentProject:
            state.currentProject?.id === projectId ? null : state.currentProject,
    })),

    // Set chats for current project
    setChats: (chats) => set({ chats }),

    // Add new chat
    addChat: (chat) => set((state) => ({
        chats: [chat, ...state.chats],
        currentChat: chat,
        messages: [],
    })),

    // Set current chat
    setCurrentChat: (chat) => set({
        currentChat: chat,
        messages: [],
    }),

    // Delete chat
    deleteChat: (chatId) => set((state) => ({
        chats: state.chats.filter((c) => c.id !== chatId),
        currentChat: state.currentChat?.id === chatId ? null : state.currentChat,
        messages: state.currentChat?.id === chatId ? [] : state.messages,
    })),

    // Set messages for current chat
    setMessages: (messages) => set({ messages }),

    // Add message to current chat
    addMessage: (message) => set((state) => ({
        messages: [...state.messages, message],
    })),

    // Set documents for current project
    setDocuments: (documents) => set({ documents }),

    // Add document
    addDocument: (document) => set((state) => ({
        documents: [...state.documents, document],
    })),

    // Update document
    updateDocument: (documentId, updates) => set((state) => ({
        documents: state.documents.map((d) =>
            d.id === documentId ? { ...d, ...updates } : d
        ),
    })),

    // Delete document
    deleteDocument: (documentId) => set((state) => ({
        documents: state.documents.filter((d) => d.id !== documentId),
    })),

    // Toggle left panel
    toggleLeftPanel: () => set((state) => ({
        isLeftPanelCollapsed: !state.isLeftPanelCollapsed,
    })),

    // Toggle right panel
    toggleRightPanel: () => set((state) => ({
        isRightPanelCollapsed: !state.isRightPanelCollapsed,
    })),

    // Toggle fullscreen mode
    toggleFullscreen: () => set((state) => {
        const newFullscreenMode = !state.isFullscreenMode;
        return {
            isFullscreenMode: newFullscreenMode,
            // When entering fullscreen, collapse both panels
            // When exiting fullscreen, restore both panels (uncollapse them)
            isLeftPanelCollapsed: newFullscreenMode ? true : false,
            isRightPanelCollapsed: newFullscreenMode ? true : false,
        };
    }),

    // Reset panel states
    resetPanelStates: () => set({
        isLeftPanelCollapsed: false,
        isRightPanelCollapsed: false,
        isFullscreenMode: false,
    }),

    // Clear current project data
    clearCurrentProject: () => set({
        currentProject: null,
        currentChat: null,
        chats: [],
        messages: [],
        documents: [],
    }),

    // Set loading state
    setLoadingProjects: (isLoading) => set({ isLoadingProjects: isLoading }),
}));

export default useProjectStore;
