'use client';

import React, { useEffect, useState } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { useDashboardStore, DashboardWidget, DashboardLayout } from '@/lib/dashboardStore';
import { useAuthStore } from '@/lib/store';

// Widget Components
import { StatsWidget } from './widgets/StatsWidget';
import { TasksWidget } from './widgets/TasksWidget';
import { QuickActionsWidget } from './widgets/QuickActionsWidget';
import { NotesWidget } from './widgets/NotesWidget';
import { ActivityFeedWidget } from './widgets/ActivityFeedWidget';
import { ProjectOverviewWidget } from './widgets/ProjectOverviewWidget';
import { ApprovalQueueWidget } from './widgets/ApprovalQueueWidget';

// Import CSS for react-grid-layout
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface CustomizableDashboardProps {
  className?: string;
}

export const CustomizableDashboard: React.FC<CustomizableDashboardProps> = ({ className = '' }) => {
  const { user } = useAuthStore();
  const {
    currentLayout,
    loadUserLayout,
    saveUserLayout,
    updateWidget,
    addWidget,
    removeWidget,
    resetToDefault,
    updateLayout
  } = useDashboardStore();

  const [isEditing, setIsEditing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user?.id && mounted) {
      initializeDashboard();
    }
  }, [user?.id, mounted]);

  const initializeDashboard = async () => {
    if (!user) return;

    await loadUserLayout(user.id);
    
    // If no layout exists, create default layout
    if (!currentLayout) {
      const defaultLayout: DashboardLayout = {
        userId: user.id,
        widgets: getDefaultWidgets(user.role || 'member'),
        gridCols: 12,
        gridRowHeight: 60,
        theme: 'light',
        lastModified: new Date().toISOString()
      };
      
      await saveUserLayout(defaultLayout);
    }
  };

  const getDefaultWidgets = (role: string): DashboardWidget[] => {
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
          id: 'admin-project-overview',
          type: 'project-overview',
          title: 'Project Overview',
          x: 6, y: 0, w: 6, h: 3,
          minW: 4, minH: 2
        },
        {
          id: 'admin-approval-queue',
          type: 'approval-queue',
          title: 'Approval Queue',
          x: 0, y: 2, w: 6, h: 3,
          minW: 4, minH: 2
        },
        {
          id: 'admin-activity-feed',
          type: 'activity-feed',
          title: 'Recent Activity',
          x: 6, y: 3, w: 6, h: 3,
          minW: 4, minH: 2
        },
        {
          id: 'admin-quick-actions',
          type: 'quick-actions',
          title: 'Quick Actions',
          x: 0, y: 5, w: 12, h: 2,
          minW: 4, minH: 1,
          config: {
            actions: [
              { label: 'Create User', action: 'create-user', icon: '👤', color: 'blue' },
              { label: 'New Project', action: 'create-project', icon: '📁', color: 'green' },
              { label: 'Settings', action: 'settings', icon: '⚙️', color: 'gray' },
              { label: 'Reports', action: 'reports', icon: '📊', color: 'purple' }
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
          id: 'pm-project-overview',
          type: 'project-overview',
          title: 'My Projects',
          x: 4, y: 0, w: 4, h: 3,
          minW: 3, minH: 2
        },
        {
          id: 'pm-approval-queue',
          type: 'approval-queue',
          title: 'Pending Approvals',
          x: 0, y: 2, w: 4, h: 3,
          minW: 3, minH: 2
        },
        {
          id: 'pm-quick-actions',
          type: 'quick-actions',
          title: 'Quick Actions',
          x: 8, y: 0, w: 4, h: 2,
          minW: 3, minH: 1,
          config: {
            actions: [
              { label: 'Assign Task', action: 'assign-task', icon: '🎯', color: 'blue' },
              { label: 'Review Activities', action: 'review-activities', icon: '✅', color: 'green' },
              { label: 'Team Report', action: 'team-report', icon: '📈', color: 'purple' },
              { label: 'New Project', action: 'new-project', icon: '➕', color: 'indigo' }
            ]
          }
        }
      ];
    }

    // Member default widgets
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
        x: 6, y: 0, w: 6, h: 3,
        minW: 4, minH: 2
      },
      {
        id: 'member-quick-actions',
        type: 'quick-actions',
        title: 'Quick Actions',
        x: 0, y: 2, w: 6, h: 1,
        minW: 4, minH: 1,
        config: {
          actions: [
            { label: 'My Tasks', action: 'my-tasks', icon: '📝', color: 'blue' },
            { label: 'New Activity', action: 'new-activity', icon: '➕', color: 'green' },
            { label: 'Time Log', action: 'time-log', icon: '⏰', color: 'purple' }
          ]
        }
      }
    ];
  };

  const renderWidget = (widget: DashboardWidget) => {
    const commonProps = {
      widget,
      onEdit: isEditing ? () => console.log('Edit widget:', widget.id) : undefined,
      onRemove: isEditing ? () => removeWidget(widget.id) : undefined
    };

    switch (widget.type) {
      case 'stats':
        return <StatsWidget {...commonProps} />;
      case 'tasks':
        return <TasksWidget {...commonProps} />;
      case 'quick-actions':
        return <QuickActionsWidget {...commonProps} />;
      case 'notes':
        return <NotesWidget {...commonProps} />;
      case 'activity-feed':
        return <ActivityFeedWidget {...commonProps} />;
      case 'project-overview':
        return <ProjectOverviewWidget {...commonProps} />;
      case 'approval-queue':
        return <ApprovalQueueWidget {...commonProps} />;
      default:
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-2xl mb-2">🔧</div>
              <div className="text-sm">Widget type: {widget.type}</div>
              <div className="text-xs">Coming soon...</div>
            </div>
          </div>
        );
    }
  };

  const handleLayoutChange = (layout: Layout[]) => {
    if (!currentLayout) return;

    const updatedWidgets = currentLayout.widgets.map(widget => {
      const layoutItem = layout.find(item => item.i === widget.id);
      if (layoutItem) {
        return {
          ...widget,
          x: layoutItem.x,
          y: layoutItem.y,
          w: layoutItem.w,
          h: layoutItem.h
        };
      }
      return widget;
    });

    updateLayout(updatedWidgets);
  };

  const handleAddWidget = (type: DashboardWidget['type']) => {
    const newWidget: Omit<DashboardWidget, 'id'> = {
      type,
      title: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Widget`,
      x: 0,
      y: 0,
      w: 4,
      h: 2,
      minW: 2,
      minH: 1,
      isResizable: true,
      isDraggable: true
    };

    addWidget(newWidget);
  };

  if (!mounted || !currentLayout) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const layouts = {
    lg: currentLayout.widgets.map(widget => ({
      i: widget.id,
      x: widget.x,
      y: widget.y,
      w: widget.w,
      h: widget.h,
      minW: widget.minW,
      minH: widget.minH,
      maxW: widget.maxW,
      maxH: widget.maxH,
      isResizable: widget.isResizable !== false,
      isDraggable: widget.isDraggable !== false
    }))
  };

  return (
    <div className={`customizable-dashboard ${className}`}>
      {/* Dashboard Controls */}
      <div className="flex items-center justify-between mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">My Dashboard</h2>
          <p className="text-sm text-gray-500">
            {isEditing ? 'Drag, resize, and customize your widgets' : 'Your personalized workspace'}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {isEditing && (
            <>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleAddWidget('stats')}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors duration-150"
                >
                  + Stats
                </button>
                <button
                  onClick={() => handleAddWidget('tasks')}
                  className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors duration-150"
                >
                  + Tasks
                </button>
                <button
                  onClick={() => handleAddWidget('quick-actions')}
                  className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors duration-150"
                >
                  + Actions
                </button>
                <button
                  onClick={() => handleAddWidget('notes')}
                  className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors duration-150"
                >
                  + Notes
                </button>
              </div>
              
              <button
                onClick={() => user?.role && resetToDefault(user.role)}
                className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50 transition-colors duration-150"
              >
                Reset to Default
              </button>
            </>
          )}
          
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-4 py-2 text-sm font-medium rounded transition-colors duration-150 ${
              isEditing
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isEditing ? '✓ Done' : '✏️ Customize'}
          </button>
        </div>
      </div>

      {/* Dashboard Grid */}
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={currentLayout.gridRowHeight}
        onLayoutChange={handleLayoutChange}
        isDraggable={isEditing}
        isResizable={isEditing}
        margin={[16, 16]}
        containerPadding={[0, 0]}
        useCSSTransforms={true}
      >
        {currentLayout.widgets.map(widget => (
          <div key={widget.id} className="widget-container">
            {renderWidget(widget)}
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
};
