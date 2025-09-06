import axios from 'axios';
import { AuthResponse, User, Activity, Comment } from '@/types';
import { appConfig, getApiUrl, getStorageKey } from '@/config/app.config';

// Use centralized configuration - single source of truth
const API_URL = appConfig.api.baseUrl;

console.log('🔧 API Client Configuration:');
console.log('  - Base URL:', API_URL);
console.log('  - Timeout:', appConfig.api.timeout);

const api = axios.create({
  baseURL: API_URL,
  timeout: appConfig.api.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Enhanced request logging
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    console.log('  - Full URL:', `${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Add auth token
    const token = typeof window !== 'undefined' ? localStorage.getItem(getStorageKey('authToken')) : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);



// Enhanced response interceptor with detailed error logging and retry logic
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Enhanced error logging
    console.error('❌ API Error Details:');
    console.error('  - URL:', error.config?.url);
    console.error('  - Method:', error.config?.method?.toUpperCase());
    console.error('  - Status:', error.response?.status);
    console.error('  - Message:', error.message);
    console.error('  - Response Data:', error.response?.data);

    if (error.code === 'ECONNABORTED') {
      console.error('  - Error Type: Request Timeout');
    } else if (error.code === 'ERR_NETWORK') {
      console.error('  - Error Type: Network Error (Backend may be down)');
    } else if (error.code === 'ERR_CONNECTION_REFUSED') {
      console.error('  - Error Type: Connection Refused (Backend not responding)');
    }

    if (error.response?.status === 401 && typeof window !== 'undefined') {
      console.warn('🔐 Authentication failed - clearing tokens');
      // Clear any stale auth but do NOT hard-redirect here to avoid loops
      localStorage.removeItem(getStorageKey('authToken'));
      localStorage.removeItem('user');
      localStorage.removeItem(getStorageKey('userPreferences'));
    }

    // Retry logic for network errors
    if (!error.response && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      const retryCount = originalRequest._retryCount || 0;

      if (retryCount < appConfig.api.retries) {
        console.log(`🔄 Retrying request (${retryCount + 1}/${appConfig.api.retries}): ${originalRequest.url}`);
        originalRequest._retryCount = retryCount + 1;
        await new Promise(resolve => setTimeout(resolve, appConfig.api.retryDelay));
        return api(originalRequest);
      } else {
        console.error(`❌ Max retries (${appConfig.api.retries}) exceeded for: ${originalRequest.url}`);
      }
    }

    return Promise.reject(error);
  }
);

// Use centralized endpoint definitions
export const authAPI = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post(appConfig.api.endpoints.auth.login, { email, password });
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.post('/api/auth/change-password', { currentPassword, newPassword });
    return response.data as { message: string };
  },

  getDefaultPassword: async () => {
    try {
      const response = await api.get('/api/auth/default-password');
      return response.data;
    } catch (error: any) {
      // Fallback for when backend endpoint is not available yet
      console.warn('Default password endpoint not available, using fallback:', error.message);
      return { password: 'Password123!' };
    }
  },

  logout: async () => {
    const response = await api.post(appConfig.api.endpoints.auth.logout);
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get(appConfig.api.endpoints.auth.profile);
    return response.data;
  },

  createOrganization: async (data: {
    name: string;
    adminEmail: string;
    adminName: string;
    adminPassword: string;
  }) => {
    // Use the single create-organization endpoint that handles everything
    const response = await api.post(appConfig.api.endpoints.auth.createOrganization, {
      organizationName: data.name,
      adminEmail: data.adminEmail,
      adminName: data.adminName,
      adminPassword: data.adminPassword,
      description: `Organization created by ${data.adminName}`
    });

    // Store the token if provided (backend returns access_token)
    if (response.data.access_token && typeof window !== 'undefined') {
      localStorage.setItem(getStorageKey('authToken'), response.data.access_token);
    }

    return response.data;
  },

  inviteUser: async (data: { email: string; name: string; role: string; projectIds?: string[] }) => {
    const response = await api.post(appConfig.api.endpoints.auth.invite, data);
    return response.data;
  },

  acceptInvitation: async (token: string, password: string) => {
    const response = await api.post(appConfig.api.endpoints.auth.acceptInvitation, { token, password });
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get(appConfig.api.endpoints.auth.profile);
    return response.data;
  },
};

export const tasksAPI = {
  // PM/Admin create and assign task to member
  create: async (
    projectId: string,
    data: { title: string; description?: string; assigneeId: string; priority?: string; dueDate?: string }
  ) => {
    const response = await api.post(`/api/projects/${projectId}/tasks`, data);
    return response.data;
  },

  // PM/Admin create and assign task to member (alias for create)
  pmCreateAssign: async (
    projectId: string,
    data: { title: string; description?: string; assigneeId: string; priority?: string; dueDate?: string }
  ) => {
    const response = await api.post(`/api/projects/${projectId}/tasks`, data);
    return response.data;
  },

  // Member self-create -> auto self-assign and InProgress
  selfCreate: async (
    projectId: string,
    data: { title: string; description?: string; priority?: string; dueDate?: string }
  ) => {
    const response = await api.post(`/api/projects/${projectId}/tasks/self`, data);
    return response.data;
  },

  // Fetch tasks assigned to me (optional status and project filters)
  getMy: async (status?: string, projectId?: string) => {
    const response = await api.get('/api/tasks/my', { params: { status, projectId } });
    return response.data;
  },

  // Start an assigned task (moves to InProgress)
  start: async (taskId: string) => {
    const response = await api.patch(`/api/tasks/${taskId}/start`);
    return response.data;
  },

  // Update status (assignee or PM/Admin)
  updateStatus: async (taskId: string, status: string) => {
    const response = await api.patch(`/api/tasks/${taskId}/status`, { status });
    return response.data;
  },

  // Update task (general update)
  update: async (taskId: string, data: any) => {
    const response = await api.patch(`/api/tasks/${taskId}`, data);
    return response.data;
  },

  // Get all tasks with optional filters
  getAll: async (filters?: { status?: string; assigneeId?: string; projectId?: string }) => {
    const response = await api.get('/api/tasks', { params: filters });
    return response.data;
  },

  // Get tasks by project (for current user)
  getByProject: async (projectId: string) => {
    const response = await api.get('/api/tasks/my', { params: { projectId } });
    return response.data;
  },

  // Get tasks by assignee (for PM to view member's tasks)
  getByAssignee: async (assigneeId: string) => {
    const response = await api.get('/api/tasks', { params: { assigneeId } });
    return response.data;
  },

  // Comments
  getComments: async (taskId: string) => {
    const response = await api.get(`/api/tasks/${taskId}/comments`);
    return response.data;
  },
  addComment: async (taskId: string, body: string) => {
    const response = await api.post(`/api/tasks/${taskId}/comments`, { body });
    return response.data;
  },

  // Attachments
  getAttachments: async (taskId: string) => {
    const response = await api.get(`/api/tasks/${taskId}/attachments`);
    return response.data;
  },
  uploadAttachment: async (taskId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/api/tasks/${taskId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  downloadAttachment: async (taskId: string, attachmentId: string) => {
    const response = await api.get(`/api/tasks/${taskId}/attachments/${attachmentId}/download`, { responseType: 'blob' });
    return response.data as Blob;
  },

  // History
  getHistory: async (taskId: string) => {
    const response = await api.get(`/api/tasks/${taskId}/history`);
    return response.data;
  },

  // Enhanced Task Approval Workflow (moved from activities)
  submit: async (taskId: string): Promise<any> => {
    const response = await api.post(`/api/tasks/${taskId}/submit`);
    return response.data;
  },

  approve: async (taskId: string, comment?: string): Promise<any> => {
    const response = await api.post(`/api/tasks/${taskId}/approve`, { comment });
    return response.data;
  },

  reject: async (taskId: string, comment: string): Promise<any> => {
    const response = await api.post(`/api/tasks/${taskId}/reject`, { comment });
    return response.data;
  },

  reopen: async (taskId: string, comment?: string): Promise<any> => {
    const response = await api.post(`/api/tasks/${taskId}/reopen`, { comment });
    return response.data;
  },

  close: async (taskId: string, comment?: string): Promise<any> => {
    const response = await api.post(`/api/tasks/${taskId}/close`, { comment });
    return response.data;
  },

  delete: async (taskId: string): Promise<void> => {
    await api.delete(`/api/tasks/${taskId}`);
  },

  // Get task by ID
  getById: async (taskId: string) => {
    const response = await api.get(`/api/tasks/${taskId}`);
    return response.data;
  },
};

// Board API functions
export const boardsAPI = {
  // Get user's boards
  getMyBoards: async () => {
    const response = await api.get('/boards/me');
    return response.data;
  },

  // Get board by ID
  getById: async (boardId: string) => {
    const response = await api.get(`/boards/${boardId}`);
    return response.data;
  },

  // Create a new board
  create: async (data: { name: string; description?: string; projectId?: string }) => {
    const response = await api.post('/boards', data);
    return response.data;
  },

  // Update board
  update: async (boardId: string, data: { name?: string; description?: string }) => {
    const response = await api.put(`/boards/${boardId}`, data);
    return response.data;
  },

  // Get tasks for a specific board
  getTasks: async (boardId: string, filters?: any, options?: any) => {
    const response = await api.get(`/boards/${boardId}/tasks`, { params: { ...filters, ...options } });
    return response.data;
  },

  // Create task in board
  createTask: async (boardId: string, data: {
    title: string;
    description?: string;
    assigneeId?: string;
    status?: string;
    priority?: string;
    dueDate?: string;
    section?: string;
  }) => {
    const response = await api.post(`/boards/${boardId}/tasks`, data);
    return response.data;
  },

  // Update task in board (matches backend endpoint)
  updateTask: async (taskId: string, data: any) => {
    const response = await api.patch(`/boards/tasks/${taskId}`, data);
    return response.data;
  },

  // Delete task
  deleteTask: async (taskId: string) => {
    const response = await api.delete(`/boards/tasks/${taskId}`);
    return response.data;
  },

  // Get task history
  getTaskHistory: async (taskId: string) => {
    const response = await api.get(`/boards/tasks/${taskId}/history`);
    return response.data;
  },

  // Approve task (PM only)
  approveTask: async (taskId: string, note?: string) => {
    const response = await api.post(`/boards/tasks/${taskId}/approve`, { note });
    return response.data;
  },

  // Reject task (PM only)
  rejectTask: async (taskId: string, reason: string) => {
    const response = await api.post(`/boards/tasks/${taskId}/reject`, { reason });
    return response.data;
  },

  // Bulk update tasks
  bulkUpdateTasks: async (taskIds: string[], updates: any) => {
    const response = await api.patch('/boards/tasks/bulk', { taskIds, updates });
    return response.data;
  },

  // Get project tasks (PM view)
  getProjectTasks: async (projectId: string, filters?: any, options?: any) => {
    const response = await api.get(`/boards/projects/${projectId}/tasks`, { params: { ...filters, ...options } });
    return response.data;
  },
};

export const systemAPI = {
  health: async () => {
    const response = await api.get('/health');
    return response.data as { status: string; timestamp: string };
  },
};

// Activities API - Basic functionality for backward compatibility
export const activitiesAPI = {
  getAll: async (filters?: any) => {
    const response = await api.get('/api/activities', { params: filters });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/api/activities/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/api/activities', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.patch(`/api/activities/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/api/activities/${id}`);
    return response.data;
  },

  submit: async (id: string) => {
    const response = await api.post(`/api/activities/${id}/submit`);
    return response.data;
  },

  approve: async (id: string, comment?: string) => {
    const response = await api.post(`/api/activities/${id}/approve`, { comment });
    return response.data;
  },

  reject: async (id: string, comment: string) => {
    const response = await api.post(`/api/activities/${id}/reject`, { comment });
    return response.data;
  },

  // Get activities by project
  getByProject: async (projectId: string) => {
    const response = await api.get('/api/activities', { params: { projectId } });
    return response.data;
  }
};

export const commentsAPI = {
  getByActivity: async (activityId: string): Promise<Comment[]> => {
    const response = await api.get(`/comments/activity/${activityId}`);
    return response.data;
  },

  create: async (activityId: string, body: string): Promise<Comment> => {
    const response = await api.post('/comments', { activityId, body });
    return response.data;
  },

  update: async (id: string, body: string): Promise<Comment> => {
    const response = await api.patch(`/comments/${id}`, { body });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/comments/${id}`);
  },
};

export const reportsAPI = {
  getActivityStatusReport: async (filters?: any) => {
    const response = await api.get('/api/reports/activity-status', { params: filters });
    return response.data;
  },

  getMemberPerformanceReport: async (filters?: any) => {
    const response = await api.get('/api/reports/member-performance', { params: filters });
    return response.data;
  },

  getApprovalAgingReport: async () => {
    const response = await api.get('/api/reports/approval-aging');
    return response.data;
  },

  exportActivitiesCSV: async (filters?: any) => {
    const response = await api.get('/api/reports/export/activities/csv', {
      params: filters,
      responseType: 'blob'
    });
    return response.data;
  },

  // Note: XLSX export not implemented in backend yet
  exportActivitiesXLSX: async (filters?: any) => {
    // Fallback to CSV for now until backend implements XLSX
    return reportsAPI.exportActivitiesCSV(filters);
  },
};

export const projectsAPI = {
  getAll: async () => {
    const response = await api.get('/api/projects');
    return response.data.projects || response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/api/projects/${id}`);
    return response.data;
  },

  create: async (data: { name: string; description?: string }) => {
    const response = await api.post('/api/projects', data);
    return response.data;
  },

  update: async (id: string, data: { name?: string; description?: string }) => {
    const response = await api.patch(`/api/projects/${id}`, data);
    return response.data;
  },

  addMember: async (projectId: string, userId: string) => {
    const response = await api.post(`/api/projects/${projectId}/members`, { userId });
    return response.data;
  },

  removeMember: async (projectId: string, userId: string) => {
    const response = await api.delete(`/api/projects/${projectId}/members/${userId}`);
    return response.data;
  },

  getMembers: async (projectId: string) => {
    const response = await api.get(`/api/projects/${projectId}/members`);
    // Backend returns { members: [...] }; normalize to array for frontend callers
    return Array.isArray(response.data) ? response.data : (response.data?.members ?? []);
  }
};

export const organizationAPI = {
  get: async () => {
    const response = await api.get(appConfig.api.endpoints.organizations.base);
    return response.data;
  },

  update: async (data: any) => {
    const response = await api.put(appConfig.api.endpoints.organizations.base, data);
    return response.data;
  },

  getUsers: async () => {
    const response = await api.get(appConfig.api.endpoints.organizations.members(''));
    return response.data;
  },

  getUserCount: async () => {
    const response = await api.get(appConfig.api.endpoints.organizations.userCount);
    return response.data;
  },
};

export const usersAPI = {
  getAll: async () => {
    const response = await api.get('/api/users');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/api/users/${id}`);
    return response.data;
  },

  updateRole: async (id: string, role: string) => {
    const response = await api.patch(`/api/users/${id}/role`, { role });
    return response.data;
  },

  deactivate: async (id: string) => {
    const response = await api.delete(`/api/users/${id}`);
    return response.data;
  },

  assignToProject: async (userId: string, projectId: string) => {
    const response = await api.post(`/api/users/${userId}/projects/${projectId}`);
    return response.data;
  },

  removeFromProject: async (userId: string, projectId: string) => {
    const response = await api.delete(`/api/users/${userId}/projects/${projectId}`);
    return response.data;
  },

  // Preferences
  getPreferences: async (userId: string) => {
    const response = await api.get(`/api/users/${userId}/preferences`);
    return response.data;
  },
  updateMyPreferences: async (prefs: any) => {
    const response = await api.patch('/api/users/me/preferences', prefs);
    return response.data;
  },
};

// Status Configuration API
export const statusConfigurationAPI = {
  // Get all status configurations
  getAll: async (type?: 'activity' | 'task' | 'approval') => {
    const params = type ? { type } : {};
    const response = await api.get('/api/status-configuration', { params });
    return response.data;
  },

  // Get active status configurations
  getActive: async (type?: 'activity' | 'task' | 'approval') => {
    const params = type ? { type } : {};
    const response = await api.get('/api/status-configuration/active', { params });
    return response.data;
  },

  // Get status mapping for frontend use
  getMapping: async () => {
    const response = await api.get('/api/status-configuration/mapping');
    return response.data;
  },

  // Create new status configuration
  create: async (dto: {
    type: 'activity' | 'task' | 'approval';
    name: string;
    displayName: string;
    color: string;
    description?: string;
    workflowRules?: any;
  }) => {
    const response = await api.post('/api/status-configuration', dto);
    return response.data;
  },

  // Update status configuration
  update: async (id: string, dto: {
    displayName?: string;
    color?: string;
    description?: string;
    isActive?: boolean;
    order?: number;
    workflowRules?: any;
  }) => {
    const response = await api.put(`/api/status-configuration/${id}`, dto);
    return response.data;
  },

  // Delete status configuration
  delete: async (id: string) => {
    await api.delete(`/api/status-configuration/${id}`);
  },

  // Reorder statuses
  reorder: async (type: 'activity' | 'task' | 'approval', statusIds: string[]) => {
    await api.put(`/api/status-configuration/reorder/${type}`, { statusIds });
  },

  // Initialize default configurations
  initializeDefaults: async () => {
    await api.post('/api/status-configuration/initialize-defaults');
  },

  // Validate status transition
  validateTransition: async (
    type: 'activity' | 'task' | 'approval',
    fromStatus: string,
    toStatus: string
  ) => {
    const response = await api.post('/api/status-configuration/validate-transition', {
      type,
      fromStatus,
      toStatus,
    });
    return response.data;
  },
};

export default api;
