import axios from 'axios';
import { AuthResponse, User, Activity, Comment } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://activity-tracker-backend.mangoground-80e673e8.canadacentral.azurecontainerapps.io';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Clear any stale auth but do NOT hard-redirect here to avoid loops
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.post('/auth/change-password', { currentPassword, newPassword });
    return response.data as { message: string };
  },

  createOrganization: async (data: {
    name: string;
    adminEmail: string;
    adminName: string;
    adminPassword: string;
  }) => {
    try {
      // 1. Try to register admin user
      await api.post('/auth/register', {
        email: data.adminEmail,
        password: data.adminPassword,
        name: data.adminName,
        role: 'ADMIN'
      });
    } catch (error: any) {
      // If user already exists (409), continue with login
      if (error.response?.status !== 409) {
        throw error;
      }
    }
    
    // 2. Login to get token
    const loginResponse = await api.post('/auth/login', {
      email: data.adminEmail,
      password: data.adminPassword
    });
    
    // 3. Store token
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', loginResponse.data.token);
    }
    
    // 4. Create organization
    const response = await api.post('/auth/create-organization', {
      name: data.name,
      description: `Organization created by ${data.adminName}`
    });
    
    return response.data;
  },

  inviteUser: async (data: { email: string; name: string; role: string; projectIds?: string[] }) => {
    const response = await api.post('/auth/invite', data);
    return response.data;
  },

  getDefaultPassword: async () => {
    const response = await api.get('/auth/default-password');
    return response.data;
  },

  acceptInvitation: async (token: string, password: string) => {
    const response = await api.post('/auth/accept-invitation', { token, password });
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
};

export const tasksAPI = {
  // PM/Admin create and assign task to member
  create: async (
    projectId: string,
    data: { title: string; description?: string; assigneeId: string; priority?: string; dueDate?: string }
  ) => {
    const response = await api.post(`/projects/${projectId}/tasks`, data);
    return response.data;
  },

  // PM/Admin create and assign task to member (alias for create)
  pmCreateAssign: async (
    projectId: string,
    data: { title: string; description?: string; assigneeId: string; priority?: string; dueDate?: string }
  ) => {
    const response = await api.post(`/projects/${projectId}/tasks`, data);
    return response.data;
  },

  // Member self-create -> auto self-assign and InProgress
  selfCreate: async (
    projectId: string,
    data: { title: string; description?: string; priority?: string; dueDate?: string }
  ) => {
    const response = await api.post(`/projects/${projectId}/tasks/self`, data);
    return response.data;
  },

  // Fetch tasks assigned to me (optional status and project filters)
  getMy: async (status?: string, projectId?: string) => {
    const response = await api.get('/tasks/my', { params: { status, projectId } });
    return response.data;
  },

  // Start an assigned task (moves to InProgress)
  start: async (taskId: string) => {
    const response = await api.patch(`/tasks/${taskId}/start`);
    return response.data;
  },

  // Update status (assignee or PM/Admin)
  updateStatus: async (taskId: string, status: string) => {
    const response = await api.patch(`/tasks/${taskId}/status`, { status });
    return response.data;
  },

  // Get all tasks with optional filters
  getAll: async (filters?: { status?: string; assigneeId?: string; projectId?: string }) => {
    const response = await api.get('/tasks', { params: filters });
    return response.data;
  },

  // Get tasks by project (for current user)
  getByProject: async (projectId: string) => {
    const response = await api.get('/tasks/my', { params: { projectId } });
    return response.data;
  },

  // Get tasks by assignee (for PM to view member's tasks)
  getByAssignee: async (assigneeId: string) => {
    const response = await api.get('/tasks', { params: { assigneeId } });
    return response.data;
  },

  // Comments
  getComments: async (taskId: string) => {
    const response = await api.get(`/tasks/${taskId}/comments`);
    return response.data;
  },
  addComment: async (taskId: string, body: string) => {
    const response = await api.post(`/tasks/${taskId}/comments`, { body });
    return response.data;
  },

  // Attachments
  getAttachments: async (taskId: string) => {
    const response = await api.get(`/tasks/${taskId}/attachments`);
    return response.data;
  },
  uploadAttachment: async (taskId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/tasks/${taskId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  downloadAttachment: async (taskId: string, attachmentId: string) => {
    const response = await api.get(`/tasks/${taskId}/attachments/${attachmentId}/download`, { responseType: 'blob' });
    return response.data as Blob;
  },

  // History
  getHistory: async (taskId: string) => {
    const response = await api.get(`/tasks/${taskId}/history`);
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

  // Update task in board
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

export const organizationAPI = {
  get: async () => {
    const response = await api.get('/organization');
    return response.data;
  },

  update: async (data: any) => {
    const response = await api.put('/organization', data);
    return response.data;
  },

  getUserCount: async (): Promise<{ count: number }> => {
    const response = await api.get('/organization/users/count');
    return response.data;
  },

  getUsers: async () => {
    const response = await api.get('/organization/users');
    return response.data;
  },
};



export const activitiesAPI = {
  getAll: async (filters?: any): Promise<Activity[]> => {
    const response = await api.get('/activities', { params: filters });
    return response.data.activities || response.data;
  },

  // Get activities by project
  getByProject: async (projectId: string): Promise<Activity[]> => {
    const response = await api.get('/activities', { params: { projectId } });
    return response.data.activities || response.data;
  },

  getById: async (id: string): Promise<Activity> => {
    const response = await api.get(`/activities/${id}`);
    return response.data;
  },

  create: async (data: any): Promise<Activity> => {
    const response = await api.post('/activities', data);
    return response.data;
  },

  update: async (id: string, data: any): Promise<Activity> => {
    const response = await api.patch(`/activities/${id}`, data);
    return response.data;
  },

  submit: async (id: string): Promise<Activity> => {
    const response = await api.post(`/activities/${id}/submit`);
    return response.data;
  },

  approve: async (id: string, comment?: string): Promise<Activity> => {
    const response = await api.post(`/activities/${id}/approve`, { comment });
    return response.data;
  },

  reject: async (id: string, comment: string): Promise<Activity> => {
    const response = await api.post(`/activities/${id}/reject`, { comment });
    return response.data;
  },

  reopen: async (id: string, comment?: string): Promise<Activity> => {
    const response = await api.post(`/activities/${id}/reopen`, { comment });
    return response.data;
  },

  close: async (id: string, comment?: string): Promise<Activity> => {
    const response = await api.post(`/activities/${id}/close`, { comment });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/activities/${id}`);
  },
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
    const response = await api.get('/reports/activity-status', { params: filters });
    return response.data;
  },

  getMemberPerformanceReport: async (filters?: any) => {
    const response = await api.get('/reports/member-performance', { params: filters });
    return response.data;
  },

  getApprovalAgingReport: async () => {
    const response = await api.get('/reports/approval-aging');
    return response.data;
  },

  exportActivitiesCSV: async (filters?: any) => {
    const response = await api.get('/reports/export/activities/csv', {
      params: filters,
      responseType: 'blob'
    });
    return response.data;
  },
};

export const projectsAPI = {
  getAll: async () => {
    const response = await api.get('/projects');
    return response.data.projects || response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  create: async (data: { name: string; description?: string }) => {
    const response = await api.post('/projects', data);
    return response.data;
  },

  update: async (id: string, data: { name?: string; description?: string }) => {
    const response = await api.patch(`/projects/${id}`, data);
    return response.data;
  },

  addMember: async (projectId: string, userId: string) => {
    const response = await api.post(`/projects/${projectId}/members`, { userId });
    return response.data;
  },

  removeMember: async (projectId: string, userId: string) => {
    const response = await api.delete(`/projects/${projectId}/members/${userId}`);
    return response.data;
  },

  getMembers: async (projectId: string) => {
    const response = await api.get(`/projects/${projectId}/members`);
    return response.data;
  }
};

export const usersAPI = {
  getAll: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  updateRole: async (id: string, role: string) => {
    const response = await api.patch(`/users/${id}/role`, { role });
    return response.data;
  },

  deactivate: async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  assignToProject: async (userId: string, projectId: string) => {
    const response = await api.post(`/users/${userId}/projects/${projectId}`);
    return response.data;
  },

  removeFromProject: async (userId: string, projectId: string) => {
    const response = await api.delete(`/users/${userId}/projects/${projectId}`);
    return response.data;
  },

  // Preferences
  getPreferences: async (userId: string) => {
    const response = await api.get(`/users/${userId}/preferences`);
    return response.data;
  },
  updateMyPreferences: async (prefs: any) => {
    const response = await api.patch('/users/me/preferences', prefs);
    return response.data;
  },
};

// Status Configuration API
export const statusConfigurationAPI = {
  // Get all status configurations
  getAll: async (type?: 'activity' | 'task' | 'approval') => {
    const params = type ? { type } : {};
    const response = await api.get('/status-configuration', { params });
    return response.data;
  },

  // Get active status configurations
  getActive: async (type?: 'activity' | 'task' | 'approval') => {
    const params = type ? { type } : {};
    const response = await api.get('/status-configuration/active', { params });
    return response.data;
  },

  // Get status mapping for frontend use
  getMapping: async () => {
    const response = await api.get('/status-configuration/mapping');
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
    const response = await api.post('/status-configuration', dto);
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
    const response = await api.put(`/status-configuration/${id}`, dto);
    return response.data;
  },

  // Delete status configuration
  delete: async (id: string) => {
    await api.delete(`/status-configuration/${id}`);
  },

  // Reorder statuses
  reorder: async (type: 'activity' | 'task' | 'approval', statusIds: string[]) => {
    await api.put(`/status-configuration/reorder/${type}`, { statusIds });
  },

  // Initialize default configurations
  initializeDefaults: async () => {
    await api.post('/status-configuration/initialize-defaults');
  },

  // Validate status transition
  validateTransition: async (
    type: 'activity' | 'task' | 'approval',
    fromStatus: string,
    toStatus: string
  ) => {
    const response = await api.post('/status-configuration/validate-transition', {
      type,
      fromStatus,
      toStatus,
    });
    return response.data;
  },
};

export default api;
