/**
 * Frontend Application Configuration
 * Single source of truth for all frontend settings
 * Centralized configuration that can be changed in one place
 */

// Environment detection
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';
const isTestEnvironment = process.env.NODE_ENV === 'test';

// Application configuration
export const appConfig = {
  // Environment
  environment: {
    isDevelopment,
    isProduction,
    isTest: isTestEnvironment,
    nodeEnv: process.env.NODE_ENV || 'development'
  },

  // Application info
  app: {
    name: 'PMActivities2',
    version: '1.0.0',
    description: 'PMActivities2 - Multi-tenant Activity Tracking Web Application',
    title: 'PMActivities2 - Project Management Made Simple'
  },

  // API Configuration - Single source of truth with enhanced debugging
  api: {
    baseUrl: (() => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      if (typeof window !== 'undefined') {
        console.log('🔗 API Base URL:', apiUrl);
        console.log('🌍 Environment:', process.env.NODE_ENV);
        console.log('🔧 All API env vars:', {
          NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        });
      }
      return apiUrl;
    })(),
    timeout: 30000,
    retries: 3,
    retryDelay: 1000,
    
    // API Endpoints - centralized endpoint definitions
    endpoints: {
      // Authentication
      auth: {
        login: '/api/auth/login',
        register: '/api/auth/register',
        logout: '/api/auth/logout',
        refresh: '/api/auth/refresh',
        profile: '/api/auth/profile',
        invite: '/api/auth/invite',
        acceptInvitation: '/api/auth/accept-invitation',
        createOrganization: '/api/auth/create-organization'
      },
      
      // Users
      users: {
        base: '/api/users',
        profile: '/api/users/profile',
        byId: (id: string) => `/api/users/${id}`,
        updatePassword: '/api/users/update-password'
      },

      // Organizations (Note: Backend uses singular 'organization')
      organizations: {
        base: '/api/organization',
        byId: (id: string) => `/api/organization/${id}`,
        members: (id: string) => `/api/organization/users`,
        projects: (id: string) => `/api/organization/projects`,
        userCount: '/api/organization/users/count'
      },
      
      // Projects
      projects: {
        base: '/api/projects',
        byId: (id: string) => `/api/projects/${id}`,
        members: (id: string) => `/api/projects/${id}/members`,
        activities: (id: string) => `/api/projects/${id}/activities`,
        tasks: (id: string) => `/api/projects/${id}/tasks`
      },

      // Activities
      activities: {
        base: '/api/activities',
        byId: (id: string) => `/api/activities/${id}`,
        submit: (id: string) => `/api/activities/${id}/submit`,
        approve: (id: string) => `/api/activities/${id}/approve`,
        reject: (id: string) => `/api/activities/${id}/reject`,
        reopen: (id: string) => `/api/activities/${id}/reopen`,
        close: (id: string) => `/api/activities/${id}/close`,
        comments: (id: string) => `/api/activities/${id}/comments`
      },
      
      // Tasks
      tasks: {
        base: '/api/tasks',
        my: '/api/tasks/my',
        byId: (id: string) => `/api/tasks/${id}`,
        start: (id: string) => `/api/tasks/${id}/start`,
        complete: (id: string) => `/api/tasks/${id}/complete`,
        approve: (id: string) => `/api/tasks/${id}/approve`,
        reject: (id: string) => `/api/tasks/${id}/reject`
      },

      // Boards
      boards: {
        base: '/api/boards',
        my: '/api/boards/me',
        byId: (id: string) => `/api/boards/${id}`,
        tasks: (id: string) => `/api/boards/${id}/tasks`,
        createTask: (id: string) => `/api/boards/${id}/tasks`,
        updateTask: (taskId: string) => `/api/boards/tasks/${taskId}`,
        moveTask: (taskId: string) => `/api/boards/tasks/${taskId}/move`
      },
      
      // Reports
      reports: {
        activityStatus: '/api/reports/activity-status',
        memberPerformance: '/api/reports/member-performance',
        approvalAging: '/api/reports/approval-aging',
        export: {
          activitiesCsv: '/api/reports/export/activities/csv',
          activitiesXlsx: '/api/reports/export/activities/xlsx'
        }
      },

      // Status Configuration
      statusConfiguration: {
        active: '/api/status-configuration/active',
        base: '/api/status-configuration',
        byId: (id: string) => `/api/status-configuration/${id}`
      }
    }
  },

  // UI Configuration
  ui: {
    // Theme
    theme: {
      primary: '#3B82F6',
      secondary: '#6B7280',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#06B6D4'
    },
    
    // Layout
    layout: {
      sidebarWidth: '256px',
      headerHeight: '64px',
      maxContentWidth: '1200px'
    },
    
    // Pagination
    pagination: {
      defaultPageSize: 20,
      pageSizeOptions: [10, 20, 50, 100]
    },
    
    // Date formats
    dateFormats: {
      display: 'MMM dd, yyyy',
      input: 'yyyy-MM-dd',
      datetime: 'MMM dd, yyyy HH:mm',
      time: 'HH:mm'
    },
    
    // File upload
    upload: {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'],
      maxFiles: 5
    }
  },

  // Feature flags
  features: {
    enableNotifications: true,
    enableFileUpload: true,
    enableRealTimeUpdates: true,
    enableAdvancedReports: true,
    enableBulkOperations: true,
    enableTaskBoards: true,
    enableComments: true,
    enableAuditLogs: true
  },

  // Local storage keys
  storage: {
    authToken: 'pmactivities2_token',
    userPreferences: 'pmactivities2_preferences',
    dashboardLayout: 'pmactivities2_dashboard_layout',
    recentProjects: 'pmactivities2_recent_projects'
  },

  // Routes - centralized route definitions
  routes: {
    home: '/',
    login: '/login',
    dashboard: '/dashboard',
    
    // Admin routes
    admin: {
      base: '/admin',
      users: '/admin/users',
      projects: '/admin/projects',
      settings: '/admin/settings',
      reports: '/admin/reports'
    },
    
    // PM routes
    pm: {
      base: '/pm',
      dashboard: '/pm/dashboard-refactored',
      activities: '/pm/activities',
      tasks: '/pm/tasks',
      reports: '/pm/reports',
      team: '/pm/team'
    },
    
    // Member routes
    member: {
      base: '/member',
      dashboard: '/member',
      board: '/member/board',
      activities: '/member/activities',
      tasks: '/member/tasks'
    },
    
    // Common routes
    profile: '/profile',
    settings: '/settings',
    help: '/help'
  }
};

// Helper functions
export const getApiUrl = (endpoint: string): string => {
  return `${appConfig.api.baseUrl}${endpoint}`;
};

export const getFullApiUrl = (path: string): string => {
  if (path.startsWith('http')) return path;
  return getApiUrl(path);
};

export const isFeatureEnabled = (feature: keyof typeof appConfig.features): boolean => {
  return appConfig.features[feature];
};

export const getStorageKey = (key: keyof typeof appConfig.storage): string => {
  return appConfig.storage[key];
};

export const getRoute = (route: string): string => {
  return route;
};

// Environment helpers
export const isDev = () => appConfig.environment.isDevelopment;
export const isProd = () => appConfig.environment.isProduction;
export const isTestMode = () => appConfig.environment.isTest;

// Export default config
export default appConfig;
