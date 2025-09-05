'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { statusConfigurationAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';

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
  createdAt?: string;
  updatedAt?: string;
}

export interface StatusMapping {
  activity: Record<string, { displayName: string; color: string }>;
  task: Record<string, { displayName: string; color: string }>;
  approval: Record<string, { displayName: string; color: string }>;
}

interface StatusContextType {
  // Raw status configurations
  statusConfigs: StatusConfig[];
  
  // Organized by type
  taskStatuses: StatusConfig[];
  activityStatuses: StatusConfig[];
  approvalStatuses: StatusConfig[];
  
  // Status mapping for quick lookup
  statusMapping: StatusMapping;
  
  // Loading state
  loading: boolean;
  
  // Methods
  refreshStatuses: () => Promise<void>;
  getStatusByName: (name: string, type?: 'activity' | 'task' | 'approval') => StatusConfig | undefined;
  getStatusColor: (name: string, type?: 'activity' | 'task' | 'approval') => string;
  getStatusDisplayName: (name: string, type?: 'activity' | 'task' | 'approval') => string;
  getActiveStatusOptions: (type: 'activity' | 'task' | 'approval') => Array<{ value: string; label: string; color: string }>;
}

const StatusContext = createContext<StatusContextType | undefined>(undefined);

interface StatusProviderProps {
  children: ReactNode;
}

export function StatusProvider({ children }: StatusProviderProps) {
  const [statusConfigs, setStatusConfigs] = useState<StatusConfig[]>([]);
  const [statusMapping, setStatusMapping] = useState<StatusMapping>({
    activity: {},
    task: {},
    approval: {}
  });
  const [loading, setLoading] = useState(true);

  const loadStatuses = async () => {
    try {
      setLoading(true);
      console.log('StatusContext: Loading status configurations...');

      // Load all active status configurations
      const configs = await statusConfigurationAPI.getActive();
      console.log('StatusContext: Loaded configs:', configs);
      setStatusConfigs(configs);

      // Load status mapping for quick lookup
      const mapping = await statusConfigurationAPI.getMapping();
      console.log('StatusContext: Loaded mapping:', mapping);
      setStatusMapping(mapping);

    } catch (error) {
      console.error('Failed to load status configurations:', error);
      console.log('StatusContext: Using fallback default statuses');

      // Fallback to default statuses if API fails
      const defaultTaskStatuses: StatusConfig[] = [
        {
          id: 'default-1',
          type: 'task',
          name: 'Not Started',
          displayName: 'Not Started',
          color: '#6B7280',
          order: 1,
          isDefault: true,
          isActive: true
        },
        {
          id: 'default-2',
          type: 'task',
          name: 'Working on it',
          displayName: 'Working on it',
          color: '#3B82F6',
          order: 2,
          isDefault: false,
          isActive: true
        },
        {
          id: 'default-3',
          type: 'task',
          name: 'Stuck',
          displayName: 'Stuck',
          color: '#EF4444',
          order: 3,
          isDefault: false,
          isActive: true
        },
        {
          id: 'default-4',
          type: 'task',
          name: 'Done',
          displayName: 'Done',
          color: '#10B981',
          order: 4,
          isDefault: false,
          isActive: true
        }
      ];

      console.log('StatusContext: Setting fallback statuses:', defaultTaskStatuses);
      setStatusConfigs(defaultTaskStatuses);
      setStatusMapping({
        task: {
          'Not Started': { displayName: 'Not Started', color: '#6B7280' },
          'Working on it': { displayName: 'Working on it', color: '#3B82F6' },
          'Stuck': { displayName: 'Stuck', color: '#EF4444' },
          'Done': { displayName: 'Done', color: '#10B981' }
        },
        activity: {},
        approval: {}
      });

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only attempt to load statuses if we have a token to avoid 401 loops on /login
    const token = typeof window !== 'undefined' ? localStorage.getItem('pmactivities2_token') : null;
    if (token) {
      loadStatuses();
    } else {
      setLoading(false);
    }
  }, []);

  // Organize statuses by type
  const taskStatuses = statusConfigs.filter(s => s.type === 'task' && s.isActive);
  const activityStatuses = statusConfigs.filter(s => s.type === 'activity' && s.isActive);
  const approvalStatuses = statusConfigs.filter(s => s.type === 'approval' && s.isActive);

  // Helper methods
  const getStatusByName = (name: string, type?: 'activity' | 'task' | 'approval'): StatusConfig | undefined => {
    if (type) {
      return statusConfigs.find(s => s.name === name && s.type === type && s.isActive);
    }
    return statusConfigs.find(s => s.name === name && s.isActive);
  };

  const getStatusColor = (name: string, type?: 'activity' | 'task' | 'approval'): string => {
    const status = getStatusByName(name, type);
    return status?.color || '#6B7280';
  };

  const getStatusDisplayName = (name: string, type?: 'activity' | 'task' | 'approval'): string => {
    const status = getStatusByName(name, type);
    return status?.displayName || name;
  };

  const getActiveStatusOptions = (type: 'activity' | 'task' | 'approval'): Array<{ value: string; label: string; color: string }> => {
    const options = statusConfigs
      .filter(s => s.type === type && s.isActive)
      .sort((a, b) => a.order - b.order)
      .map(s => ({
        value: s.name,
        label: s.displayName || s.name, // Fallback to name if displayName is missing
        color: s.color
      }));

    console.log(`StatusContext: getActiveStatusOptions for ${type}:`, options);
    return options;
  };

  const refreshStatuses = async () => {
    await loadStatuses();
  };

  const value: StatusContextType = {
    statusConfigs,
    taskStatuses,
    activityStatuses,
    approvalStatuses,
    statusMapping,
    loading,
    refreshStatuses,
    getStatusByName,
    getStatusColor,
    getStatusDisplayName,
    getActiveStatusOptions
  };

  return (
    <StatusContext.Provider value={value}>
      {children}
    </StatusContext.Provider>
  );
}

export function useStatus() {
  const context = useContext(StatusContext);
  if (context === undefined) {
    throw new Error('useStatus must be used within a StatusProvider');
  }
  return context;
}
