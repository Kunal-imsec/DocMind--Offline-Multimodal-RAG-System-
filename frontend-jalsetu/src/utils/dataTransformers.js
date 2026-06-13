// Data transformation utilities to adapt backend API responses to frontend expectations

/**
 * Transform backend chat session to frontend chat format
 * Backend: { id, project, title, status, created_at, last_activity_at, created_by }
 * Frontend expects: { id, name, created_at, updated_at }
 */
export const transformChatSession = (backendChat) => {
    if (!backendChat) return null;

    return {
        id: backendChat.id,
        name: backendChat.title || 'Untitled Chat',
        created_at: backendChat.created_at,
        updated_at: backendChat.last_activity_at || backendChat.created_at,
        // Keep original fields for reference
        _original: backendChat
    };
};

/**
 * Transform backend chat message to frontend message format
 * Backend: { id, session, role, content, metadata, created_at, sender }
 * Frontend expects: { id, content, sender, timestamp }
 */
export const transformChatMessage = (backendMessage) => {
    if (!backendMessage) return null;

    return {
        id: backendMessage.id,
        content: backendMessage.content,
        sender: backendMessage.role.toLowerCase(), // USER/ASSISTANT -> user/assistant
        timestamp: backendMessage.created_at,
        metadata: backendMessage.metadata,
        // Keep original fields for reference
        _original: backendMessage
    };
};

/**
 * Transform backend project to frontend format
 * Backend: { id, name, description, members, owner, is_archived, created_at, updated_at }
 * Frontend expects: { id, name, description, document_count, created_at, updated_at }
 */
export const transformProject = (backendProject) => {
    if (!backendProject) return null;

    return {
        id: backendProject.id,
        name: backendProject.name,
        description: backendProject.description,
        document_count: backendProject.document_count || 0,
        created_at: backendProject.created_at,
        updated_at: backendProject.updated_at,
        // Keep original fields for reference
        _original: backendProject
    };
};

/**
 * Transform array of backend items
 */
export const transformArray = (items, transformFn) => {
    if (!Array.isArray(items)) return [];
    return items.map(transformFn);
};

/**
 * Transform backend user to frontend format
 * Backend: { id, username, email, first_name, last_name, role, department, access_expires_at, login_count }
 * Frontend expects: { id, username, email, first_name, last_name, role }
 */
export const transformUser = (backendUser) => {
    if (!backendUser) return null;

    return {
        id: backendUser.id,
        username: backendUser.username,
        email: backendUser.email,
        first_name: backendUser.first_name,
        last_name: backendUser.last_name,
        role: backendUser.role,
        // Keep original fields for reference
        _original: backendUser
    };
};
