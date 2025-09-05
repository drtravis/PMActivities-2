import api from '../api';

export interface StatusConfig {
  id: string;
  type: 'activity' | 'task' | 'approval';
  name: string;
  displayName: string;
  color: string;
  order: number;
  isDefault: boolean;
  isActive: boolean;
  description?: string;
  workflowRules?: {
    allowedTransitions?: string[];
    requiredRole?: string[];
    autoTransitions?: {
      condition: string;
      targetStatus: string;
    }[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateStatusConfigDto {
  type: 'activity' | 'task' | 'approval';
  name: string;
  displayName: string;
  color: string;
  description?: string;
  workflowRules?: any;
}

export interface UpdateStatusConfigDto {
  displayName?: string;
  color?: string;
  description?: string;
  isActive?: boolean;
  order?: number;
  workflowRules?: any;
}

export interface StatusMapping {
  activity: Record<string, { displayName: string; color: string }>;
  task: Record<string, { displayName: string; color: string }>;
  approval: Record<string, { displayName: string; color: string }>;
}

export const statusConfigurationAPI = {
  // Get all status configurations
  getAll: async (type?: 'activity' | 'task' | 'approval'): Promise<StatusConfig[]> => {
    const params = type ? { type } : {};
    const response = await api.get('/api/status-configuration', { params });
    return response.data;
  },

  // Get active status configurations
  getActive: async (type?: 'activity' | 'task' | 'approval'): Promise<StatusConfig[]> => {
    const params = type ? { type } : {};
    const response = await api.get('/api/status-configuration/active', { params });
    return response.data;
  },

  // Get status mapping for frontend use
  getMapping: async (): Promise<StatusMapping> => {
    const response = await api.get('/api/status-configuration/mapping');
    return response.data;
  },

  // Create new status configuration
  create: async (dto: CreateStatusConfigDto): Promise<StatusConfig> => {
    const response = await api.post('/api/status-configuration', dto);
    return response.data;
  },

  // Update status configuration
  update: async (id: string, dto: UpdateStatusConfigDto): Promise<StatusConfig> => {
    const response = await api.put(`/api/status-configuration/${id}`, dto);
    return response.data;
  },

  // Delete status configuration
  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/status-configuration/${id}`);
  },

  // Reorder statuses
  reorder: async (type: 'activity' | 'task' | 'approval', statusIds: string[]): Promise<void> => {
    await api.put(`/api/status-configuration/reorder/${type}`, { statusIds });
  },

  // Initialize default configurations
  initializeDefaults: async (): Promise<void> => {
    await api.post('/status-configuration/initialize-defaults');
  },

  // Validate status transition
  validateTransition: async (
    type: 'activity' | 'task' | 'approval',
    fromStatus: string,
    toStatus: string
  ): Promise<{ isValid: boolean }> => {
    const response = await api.post('/status-configuration/validate-transition', {
      type,
      fromStatus,
      toStatus,
    });
    return response.data;
  },
};
