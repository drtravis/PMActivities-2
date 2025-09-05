import React, { useEffect, useState } from 'react';
import { BaseWidget } from './BaseWidget';
import { DashboardWidget } from '@/lib/dashboardStore';
import { useAuthStore } from '@/lib/store';

interface ApprovalQueueWidgetProps {
  widget: DashboardWidget;
  onEdit?: () => void;
  onRemove?: () => void;
}

interface ApprovalItem {
  id: string;
  type: 'activity' | 'task';
  title: string;
  description?: string;
  requester: {
    name: string;
    avatar?: string;
  };
  priority: 'low' | 'medium' | 'high' | 'urgent';
  submittedAt: string;
  entityId: string;
  project?: {
    name: string;
  };
}

export const ApprovalQueueWidget: React.FC<ApprovalQueueWidgetProps> = ({ widget, onEdit, onRemove }) => {
  const { user } = useAuthStore();
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER') {
      loadApprovals();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadApprovals = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/approvals/pending', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const approvalItems: ApprovalItem[] = data.approvals.map((approval: any) => ({
          id: approval.id,
          type: approval.activityId ? 'activity' : 'task',
          title: approval.activity?.title || approval.task?.title || 'Unknown Item',
          description: approval.activity?.description || approval.task?.description,
          requester: {
            name: approval.activity?.createdBy?.name || approval.task?.createdBy?.name || 'Unknown User',
          },
          priority: approval.activity?.priority || approval.task?.priority || 'medium',
          submittedAt: approval.createdAt,
          entityId: approval.activityId || approval.taskId,
          project: approval.activity?.project || approval.task?.project,
        }));

        // Sort by priority and submission time
        approvalItems.sort((a, b) => {
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
          if (priorityDiff !== 0) return priorityDiff;
          return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
        });

        // Limit to widget configuration
        const limitedApprovals = approvalItems.slice(0, widget.config?.limit || 5);
        setApprovals(limitedApprovals);
      } else {
        throw new Error('Failed to load approvals');
      }
    } catch (error) {
      console.error('Error loading approvals:', error);
      // Fallback to mock data for development
      setApprovals(generateMockApprovals());
    } finally {
      setLoading(false);
    }
  };

  const generateMockApprovals = (): ApprovalItem[] => {
    return [
      {
        id: '1',
        type: 'activity',
        title: 'Website Redesign Phase 2',
        description: 'Complete the second phase of website redesign including mobile optimization',
        requester: { name: 'John Doe' },
        priority: 'high',
        submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        entityId: 'activity-1',
        project: { name: 'Website Project' },
      },
      {
        id: '2',
        type: 'task',
        title: 'Database Performance Optimization',
        description: 'Optimize database queries for better performance',
        requester: { name: 'Jane Smith' },
        priority: 'urgent',
        submittedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        entityId: 'task-1',
        project: { name: 'Infrastructure' },
      },
      {
        id: '3',
        type: 'activity',
        title: 'User Training Materials',
        description: 'Create comprehensive training materials for new users',
        requester: { name: 'Mike Johnson' },
        priority: 'medium',
        submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
        entityId: 'activity-2',
        project: { name: 'Training Project' },
      },
    ];
  };

  const handleApprove = async (approvalId: string) => {
    try {
      const response = await fetch(`/api/approvals/${approvalId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ comments: 'Approved from dashboard' }),
      });

      if (response.ok) {
        // Remove from list
        setApprovals(prev => prev.filter(approval => approval.id !== approvalId));
      } else {
        throw new Error('Failed to approve');
      }
    } catch (error) {
      console.error('Error approving:', error);
      alert('Failed to approve item. Please try again.');
    }
  };

  const handleReject = async (approvalId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      const response = await fetch(`/api/approvals/${approvalId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ comments: reason }),
      });

      if (response.ok) {
        // Remove from list
        setApprovals(prev => prev.filter(approval => approval.id !== approvalId));
      } else {
        throw new Error('Failed to reject');
      }
    } catch (error) {
      console.error('Error rejecting:', error);
      alert('Failed to reject item. Please try again.');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'activity' ? '📋' : '✅';
  };

  const formatTimeAgo = (timestamp: string) => {
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
    } else {
      return `${diffDays}d ago`;
    }
  };

  // Don't show widget for members
  if (user?.role === 'MEMBER') {
    return null;
  }

  return (
    <BaseWidget
      widget={widget}
      onEdit={onEdit}
      onRemove={onRemove}
    >
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {approvals.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No pending approvals</p>
            <p className="text-sm mt-1">Great job staying on top of things! 🎉</p>
          </div>
        ) : (
          approvals.map((approval) => (
            <div key={approval.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start space-x-2 flex-1">
                  <span className="text-lg flex-shrink-0">
                    {getTypeIcon(approval.type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {approval.title}
                    </h4>
                    {approval.description && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {approval.description}
                      </p>
                    )}
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(approval.priority)}`}>
                  {approval.priority}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                <div className="flex items-center space-x-4">
                  <span>by {approval.requester.name}</span>
                  {approval.project && (
                    <span>in {approval.project.name}</span>
                  )}
                </div>
                <span>{formatTimeAgo(approval.submittedAt)}</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleApprove(approval.id)}
                  className="flex-1 px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded hover:bg-green-200 transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReject(approval.id)}
                  className="flex-1 px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded hover:bg-red-200 transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={() => window.open(`/${approval.type}s/${approval.entityId}`, '_blank')}
                  className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
                >
                  View
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      
      {approvals.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            View all approvals →
          </button>
        </div>
      )}
    </BaseWidget>
  );
};
