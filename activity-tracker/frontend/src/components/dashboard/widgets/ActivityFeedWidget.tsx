import React, { useEffect, useState } from 'react';
import { BaseWidget } from './BaseWidget';
import { DashboardWidget } from '@/lib/dashboardStore';
import { useAuthStore } from '@/lib/store';
import { activitiesAPI } from '@/lib/api';

interface ActivityFeedWidgetProps {
  widget: DashboardWidget;
  onEdit?: () => void;
  onRemove?: () => void;
}

interface ActivityFeedItem {
  id: string;
  type: 'activity' | 'task' | 'comment' | 'approval';
  title: string;
  description: string;
  user: {
    name: string;
    avatar?: string;
  };
  timestamp: string;
  status?: string;
  priority?: string;
  entityId?: string;
}

export const ActivityFeedWidget: React.FC<ActivityFeedWidgetProps> = ({ widget, onEdit, onRemove }) => {
  const { user } = useAuthStore();
  const [feedItems, setFeedItems] = useState<ActivityFeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivityFeed();
  }, [user]);

  const loadActivityFeed = async () => {
    setLoading(true);
    try {
      // Load recent activities, tasks, and other feed items
      const [activities, auditLogs] = await Promise.all([
        activitiesAPI.getAll({ limit: 10 }),
        fetch('/api/audit/my-activity?days=7').then(res => res.json()).catch(() => [])
      ]);

      const feedItems: ActivityFeedItem[] = [];

      // Add recent activities
      activities.forEach((activity: any) => {
        feedItems.push({
          id: `activity-${activity.id}`,
          type: 'activity',
          title: activity.title,
          description: `Activity ${activity.status}`,
          user: {
            name: activity.createdBy?.name || 'Unknown User',
          },
          timestamp: activity.updatedAt || activity.createdAt,
          status: activity.status,
          priority: activity.priority,
          entityId: activity.id,
        });
      });

      // Add audit log items
      auditLogs.forEach((log: any) => {
        let description = '';
        switch (log.action) {
          case 'create':
            description = `Created ${log.entityType}`;
            break;
          case 'update':
            description = `Updated ${log.entityType}`;
            break;
          case 'approve':
            description = `Approved ${log.entityType}`;
            break;
          case 'reject':
            description = `Rejected ${log.entityType}`;
            break;
          default:
            description = `${log.action} ${log.entityType}`;
        }

        feedItems.push({
          id: `audit-${log.id}`,
          type: log.entityType,
          title: description,
          description: log.details?.comment || '',
          user: {
            name: log.user?.name || 'System',
          },
          timestamp: log.createdAt,
          entityId: log.entityId,
        });
      });

      // Sort by timestamp (most recent first)
      feedItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Limit to widget configuration
      const limitedItems = feedItems.slice(0, widget.config?.limit || 10);
      setFeedItems(limitedItems);
    } catch (error) {
      console.error('Error loading activity feed:', error);
      // Fallback to mock data
      setFeedItems(generateMockFeedItems());
    } finally {
      setLoading(false);
    }
  };

  const generateMockFeedItems = (): ActivityFeedItem[] => {
    return [
      {
        id: '1',
        type: 'activity',
        title: 'Website Redesign Project',
        description: 'Activity submitted for approval',
        user: { name: 'John Doe' },
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        status: 'submitted',
        priority: 'high',
      },
      {
        id: '2',
        type: 'task',
        title: 'Update user interface',
        description: 'Task completed',
        user: { name: 'Jane Smith' },
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        status: 'completed',
        priority: 'medium',
      },
      {
        id: '3',
        type: 'comment',
        title: 'Database Migration',
        description: 'Added comment: "Migration completed successfully"',
        user: { name: 'Mike Johnson' },
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
      },
      {
        id: '4',
        type: 'approval',
        title: 'Budget Approval Request',
        description: 'Request approved',
        user: { name: 'Sarah Wilson' },
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
        status: 'approved',
      },
    ];
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'activity': return '📋';
      case 'task': return '✅';
      case 'comment': return '💬';
      case 'approval': return '👍';
      default: return '📄';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
      case 'approved': return 'text-green-600';
      case 'submitted':
      case 'pending': return 'text-yellow-600';
      case 'rejected': return 'text-red-600';
      case 'in_progress': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <BaseWidget
      widget={widget}
      onEdit={onEdit}
      onRemove={onRemove}
    >
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {feedItems.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No recent activity</p>
          </div>
        ) : (
          feedItems.map((item) => (
            <div key={item.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex-shrink-0 text-lg">
                {getTypeIcon(item.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {item.title}
                  </h4>
                  <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                    {formatTimestamp(item.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {item.description}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">
                    by {item.user.name}
                  </span>
                  {item.status && (
                    <span className={`text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {feedItems.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            View all activity →
          </button>
        </div>
      )}
    </BaseWidget>
  );
};
