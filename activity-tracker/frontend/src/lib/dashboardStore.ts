import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DashboardWidget {
  id: string;
  type: 'stats' | 'chart' | 'tasks' | 'activities' | 'calendar' | 'notes' | 'quick-actions' | 'team' | 'notifications';
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  isResizable?: boolean;
  isDraggable?: boolean;
  config?: Record<string, any>;
  data?: any;
}

export interface DashboardLayout {
  userId: string;
  widgets: DashboardWidget[];
  gridCols: number;
  gridRowHeight: number;
  theme: 'light' | 'dark';
  lastModified: string;
}

interface DashboardStore {
  // Current layout
  currentLayout: DashboardLayout | null;
  
  // Available widget types for each role
  availableWidgets: Record<string, DashboardWidget[]>;
  
  // Actions
  loadUserLayout: (userId: string) => Promise<void>;
  saveUserLayout: (layout: DashboardLayout) => Promise<void>;
  updateWidget: (widgetId: string, updates: Partial<DashboardWidget>) => void;
  addWidget: (widget: Omit<DashboardWidget, 'id'>) => void;
  removeWidget: (widgetId: string) => void;
  resetToDefault: (userRole: string) => void;
  
  // Layout manipulation
  updateLayout: (widgets: DashboardWidget[]) => void;
  setGridConfig: (cols: number, rowHeight: number) => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

// Default widget configurations for different roles
const getDefaultWidgets = (role: string): DashboardWidget[] => {
  const baseWidgets: DashboardWidget[] = [];

  if (role === 'admin') {
    return [
      {
        id: 'admin-stats',
        type: 'stats',
        title: 'System Overview',
        x: 0, y: 0, w: 6, h: 2,
        minW: 4, minH: 2,
        config: { metrics: ['users', 'projects', 'activities', 'organizations'] }
      },
      {
        id: 'admin-users',
        type: 'chart',
        title: 'User Activity',
        x: 6, y: 0, w: 6, h: 3,
        minW: 4, minH: 2,
        config: { chartType: 'line', dataSource: 'user-activity' }
      },
      {
        id: 'admin-notifications',
        type: 'notifications',
        title: 'System Alerts',
        x: 0, y: 2, w: 6, h: 3,
        minW: 3, minH: 2
      },
      {
        id: 'admin-quick-actions',
        type: 'quick-actions',
        title: 'Quick Actions',
        x: 0, y: 5, w: 12, h: 2,
        minW: 6, minH: 1,
        config: { 
          actions: [
            { label: 'Create User', action: 'create-user', icon: '👤' },
            { label: 'New Project', action: 'create-project', icon: '📁' },
            { label: 'System Settings', action: 'settings', icon: '⚙️' },
            { label: 'View Reports', action: 'reports', icon: '📊' }
          ]
        }
      }
    ];
  }

  if (role === 'project_manager') {
    return [
      {
        id: 'pm-stats',
        type: 'stats',
        title: 'Project Overview',
        x: 0, y: 0, w: 4, h: 2,
        minW: 3, minH: 2,
        config: { metrics: ['active-tasks', 'team-members', 'pending-approvals', 'completed-activities'] }
      },
      {
        id: 'pm-team',
        type: 'team',
        title: 'Team Status',
        x: 4, y: 0, w: 4, h: 3,
        minW: 3, minH: 2
      },
      {
        id: 'pm-tasks',
        type: 'tasks',
        title: 'Recent Tasks',
        x: 8, y: 0, w: 4, h: 3,
        minW: 3, minH: 2
      },
      {
        id: 'pm-activities',
        type: 'activities',
        title: 'Activity Timeline',
        x: 0, y: 2, w: 8, h: 3,
        minW: 4, minH: 2
      },
      {
        id: 'pm-calendar',
        type: 'calendar',
        title: 'Project Calendar',
        x: 0, y: 5, w: 6, h: 4,
        minW: 4, minH: 3
      },
      {
        id: 'pm-quick-actions',
        type: 'quick-actions',
        title: 'Quick Actions',
        x: 6, y: 5, w: 6, h: 2,
        minW: 3, minH: 1,
        config: {
          actions: [
            { label: 'Assign Task', action: 'assign-task', icon: '🎯' },
            { label: 'Review Activities', action: 'review-activities', icon: '✅' },
            { label: 'Team Report', action: 'team-report', icon: '📈' },
            { label: 'New Project', action: 'new-project', icon: '➕' }
          ]
        }
      }
    ];
  }

  if (role === 'member') {
    return [
      {
        id: 'member-stats',
        type: 'stats',
        title: 'My Progress',
        x: 0, y: 0, w: 6, h: 2,
        minW: 4, minH: 2,
        config: { metrics: ['my-tasks', 'completed-today', 'pending-activities', 'hours-logged'] }
      },
      {
        id: 'member-tasks',
        type: 'tasks',
        title: 'My Tasks',
        x: 6, y: 0, w: 6, h: 4,
        minW: 4, minH: 3
      },
      {
        id: 'member-activities',
        type: 'activities',
        title: 'Recent Activities',
        x: 0, y: 2, w: 6, h: 3,
        minW: 4, minH: 2
      },
      {
        id: 'member-calendar',
        type: 'calendar',
        title: 'My Schedule',
        x: 0, y: 5, w: 8, h: 3,
        minW: 4, minH: 2
      },
      {
        id: 'member-notes',
        type: 'notes',
        title: 'Quick Notes',
        x: 8, y: 5, w: 4, h: 3,
        minW: 3, minH: 2
      }
    ];
  }

  return baseWidgets;
};

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set, get) => ({
      currentLayout: null,
      availableWidgets: {},

      loadUserLayout: async (userId: string) => {
        try {
          // Try to load from localStorage first (for offline capability)
          const stored = localStorage.getItem(`dashboard-layout-${userId}`);
          if (stored) {
            const layout = JSON.parse(stored);
            set({ currentLayout: layout });
            return;
          }

          // TODO: Load from backend API
          // const response = await fetch(`/api/dashboard/layout/${userId}`);
          // const layout = await response.json();
          
          // For now, return null to trigger default layout
          set({ currentLayout: null });
        } catch (error) {
          console.error('Error loading user layout:', error);
          set({ currentLayout: null });
        }
      },

      saveUserLayout: async (layout: DashboardLayout) => {
        try {
          // Save to localStorage immediately
          localStorage.setItem(`dashboard-layout-${layout.userId}`, JSON.stringify(layout));
          
          // TODO: Save to backend API
          // await fetch(`/api/dashboard/layout/${layout.userId}`, {
          //   method: 'POST',
          //   headers: { 'Content-Type': 'application/json' },
          //   body: JSON.stringify(layout)
          // });

          set({ currentLayout: layout });
        } catch (error) {
          console.error('Error saving user layout:', error);
        }
      },

      updateWidget: (widgetId: string, updates: Partial<DashboardWidget>) => {
        const { currentLayout } = get();
        if (!currentLayout) return;

        const updatedWidgets = currentLayout.widgets.map(widget =>
          widget.id === widgetId ? { ...widget, ...updates } : widget
        );

        const updatedLayout = {
          ...currentLayout,
          widgets: updatedWidgets,
          lastModified: new Date().toISOString()
        };

        get().saveUserLayout(updatedLayout);
      },

      addWidget: (widget: Omit<DashboardWidget, 'id'>) => {
        const { currentLayout } = get();
        if (!currentLayout) return;

        const newWidget: DashboardWidget = {
          ...widget,
          id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };

        const updatedLayout = {
          ...currentLayout,
          widgets: [...currentLayout.widgets, newWidget],
          lastModified: new Date().toISOString()
        };

        get().saveUserLayout(updatedLayout);
      },

      removeWidget: (widgetId: string) => {
        const { currentLayout } = get();
        if (!currentLayout) return;

        const updatedWidgets = currentLayout.widgets.filter(widget => widget.id !== widgetId);
        const updatedLayout = {
          ...currentLayout,
          widgets: updatedWidgets,
          lastModified: new Date().toISOString()
        };

        get().saveUserLayout(updatedLayout);
      },

      resetToDefault: (userRole: string) => {
        const { currentLayout } = get();
        if (!currentLayout) return;

        const defaultWidgets = getDefaultWidgets(userRole);
        const updatedLayout = {
          ...currentLayout,
          widgets: defaultWidgets,
          lastModified: new Date().toISOString()
        };

        get().saveUserLayout(updatedLayout);
      },

      updateLayout: (widgets: DashboardWidget[]) => {
        const { currentLayout } = get();
        if (!currentLayout) return;

        const updatedLayout = {
          ...currentLayout,
          widgets,
          lastModified: new Date().toISOString()
        };

        get().saveUserLayout(updatedLayout);
      },

      setGridConfig: (cols: number, rowHeight: number) => {
        const { currentLayout } = get();
        if (!currentLayout) return;

        const updatedLayout = {
          ...currentLayout,
          gridCols: cols,
          gridRowHeight: rowHeight,
          lastModified: new Date().toISOString()
        };

        get().saveUserLayout(updatedLayout);
      },

      setTheme: (theme: 'light' | 'dark') => {
        const { currentLayout } = get();
        if (!currentLayout) return;

        const updatedLayout = {
          ...currentLayout,
          theme,
          lastModified: new Date().toISOString()
        };

        get().saveUserLayout(updatedLayout);
      }
    }),
    {
      name: 'dashboard-store',
      partialize: (state) => ({ availableWidgets: state.availableWidgets })
    }
  )
);
