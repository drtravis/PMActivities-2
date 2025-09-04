'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { activitiesAPI } from '@/lib/api';

interface PendingActivity {
  id: string;
  title: string;
  description: string;
  submittedBy: string;
  submittedAt: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  estimatedHours: number;
  tags: string[];
  attachments: string[];
}

interface ApprovalQueueProps {
  selectedProject?: any;
}

export function ApprovalQueue({ selectedProject }: ApprovalQueueProps) {
  const [activities, setActivities] = useState<PendingActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchAction, setBatchAction] = useState<'approve' | 'reject'>('approve');
  const [batchComment, setBatchComment] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [sortBy, setSortBy] = useState('submittedAt');

  useEffect(() => {
    if (selectedProject) {
      fetchPendingActivities();
    }
  }, [selectedProject]);

  const fetchPendingActivities = async () => {
    if (!selectedProject) {
      setLoading(false);
      return;
    }

    try {
      // Fetch project-specific activities that are submitted and pending approval
      // Fetch only submitted (pending approval) activities for this project
      const projectActivities = await activitiesAPI.getAll({ projectId: selectedProject.id, approvalState: 'submitted' });
      const pendingActivities = projectActivities;

      // Transform activities to match our interface
      const transformedActivities: PendingActivity[] = pendingActivities.map((activity: any) => ({
        id: activity.id,
        title: activity.title,
        description: activity.description || '',
        submittedBy: activity.createdBy?.name || 'Unknown',
        submittedAt: activity.updatedAt, // When it was last updated (submitted)
        priority: activity.priority,
        category: activity.tags && activity.tags.length > 0 ? activity.tags[0] : 'General',
        estimatedHours: 0, // Not available in current schema
        tags: activity.tags || [],
        attachments: [], // Not available in current schema
      }));

      setActivities(transformedActivities);
    } catch (error) {
      console.error('Failed to fetch pending activities:', error);
      toast.error('Failed to fetch pending activities');
    } finally {
      setLoading(false);
    }
  };

  const handleSingleApproval = async (activityId: string, action: 'approve' | 'reject', comment?: string) => {
    try {
      if (action === 'approve') {
        await activitiesAPI.approve(activityId, comment);
      } else {
        await activitiesAPI.reject(activityId, comment || '');
      }
      setActivities(activities.filter(a => a.id !== activityId));
      toast.success(`Activity ${action}d successfully`);
    } catch (error) {
      toast.error(`Failed to ${action} activity`);
    }
  };

  const handleBatchAction = async () => {
    if (selectedActivities.length === 0) return;
    
    try {
      // Sequentially process selected items (could be optimized server-side for batch)
      for (const id of selectedActivities) {
        if (batchAction === 'approve') {
          await activitiesAPI.approve(id, batchComment);
        } else {
          await activitiesAPI.reject(id, batchComment);
        }
      }
      setActivities(activities.filter(a => !selectedActivities.includes(a.id)));
      setSelectedActivities([]);
      setShowBatchModal(false);
      setBatchComment('');
      toast.success(`${selectedActivities.length} activities ${batchAction}d successfully`);
    } catch (error) {
      toast.error(`Failed to ${batchAction} activities`);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + ' ' + 
           new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredAndSortedActivities = activities
    .filter(activity => filterPriority === 'all' || activity.priority === filterPriority)
    .sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'submittedAt':
          return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
        case 'estimatedHours':
          return b.estimatedHours - a.estimatedHours;
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!selectedProject) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">✅</div>
          <p>Please select a project to view pending approvals</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="submittedAt">Sort by Date</option>
            <option value="priority">Sort by Priority</option>
            <option value="estimatedHours">Sort by Hours</option>
          </select>
        </div>
        <div className="flex space-x-3">
          {selectedActivities.length > 0 && (
            <>
              <Button
                onClick={() => {
                  setBatchAction('approve');
                  setShowBatchModal(true);
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                ✅ Batch Approve ({selectedActivities.length})
              </Button>
              <Button
                onClick={() => {
                  setBatchAction('reject');
                  setShowBatchModal(true);
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                ❌ Batch Reject ({selectedActivities.length})
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Activities List */}
      <div className="space-y-4">
        {filteredAndSortedActivities.map((activity) => (
          <div key={activity.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4 flex-1">
                <input
                  type="checkbox"
                  checked={selectedActivities.includes(activity.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedActivities([...selectedActivities, activity.id]);
                    } else {
                      setSelectedActivities(selectedActivities.filter(id => id !== activity.id));
                    }
                  }}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-medium text-gray-900">{activity.title}</h3>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(activity.priority)}`}>
                      {activity.priority.toUpperCase()}
                    </span>
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      {activity.category}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">{activity.description}</p>
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <span>👤 {activity.submittedBy}</span>
                    <span>📅 {formatDate(activity.submittedAt)}</span>
                    <span>⏱️ {activity.estimatedHours}h estimated</span>
                    {activity.attachments.length > 0 && (
                      <span>📎 {activity.attachments.length} attachment(s)</span>
                    )}
                  </div>
                  {activity.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {activity.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex space-x-2 ml-4">
                <Button
                  onClick={() => handleSingleApproval(activity.id, 'approve')}
                  className="bg-green-600 hover:bg-green-700 text-sm px-3 py-1"
                >
                  ✅ Approve
                </Button>
                <Button
                  onClick={() => handleSingleApproval(activity.id, 'reject')}
                  className="bg-red-600 hover:bg-red-700 text-sm px-3 py-1"
                >
                  ❌ Reject
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredAndSortedActivities.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">✅</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No pending approvals</h3>
          <p className="text-gray-500">All activities have been reviewed. Great job!</p>
        </div>
      )}

      {/* Batch Action Modal */}
      <Modal
        isOpen={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        title={`Batch ${batchAction === 'approve' ? 'Approve' : 'Reject'} Activities`}
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            You are about to {batchAction} {selectedActivities.length} activities.
            {batchAction === 'reject' && ' Please provide a reason for rejection.'}
          </p>
          {batchAction === 'reject' && (
            <textarea
              value={batchComment}
              onChange={(e) => setBatchComment(e.target.value)}
              placeholder="Enter reason for rejection..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          )}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowBatchModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBatchAction}
              disabled={batchAction === 'reject' && !batchComment.trim()}
              className={batchAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {batchAction === 'approve' ? 'Approve All' : 'Reject All'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
