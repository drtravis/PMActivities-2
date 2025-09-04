'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { Activity } from '@/types';
import { useAuthStore, useActivityStore } from '@/lib/store';
import { activitiesAPI } from '@/lib/api';
import { 
  CheckIcon, 
  XMarkIcon, 
  PaperAirplaneIcon,
  PencilIcon,
  TrashIcon 
} from '@heroicons/react/24/outline';

interface ActivityCardProps {
  activity: Activity;
}

export default function ActivityCard({ activity }: ActivityCardProps) {
  const { user } = useAuthStore();
  const { updateActivity, removeActivity } = useActivityStore();
  const [isLoading, setIsLoading] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'closed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const canEdit = user?.role === 'ADMIN' || 
                 user?.role === 'PROJECT_MANAGER' || 
                 (activity.approvalState === 'draft' && activity.createdById === user?.id);

  const canSubmit = activity.approvalState === 'draft' && 
                   (activity.createdById === user?.id || user?.role !== 'MEMBER');

  const canApprove = (user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER') && 
                    activity.approvalState === 'submitted';

  const canDelete = user?.role === 'ADMIN' || 
                   (activity.approvalState === 'draft' && activity.createdById === user?.id);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const updatedActivity = await activitiesAPI.submit(activity.id);
      updateActivity(updatedActivity);
      toast.success('Activity submitted for approval');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit activity');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      const updatedActivity = await activitiesAPI.approve(activity.id);
      updateActivity(updatedActivity);
      toast.success('Activity approved');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve activity');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    const comment = prompt('Please provide a reason for rejection:');
    if (!comment) return;

    setIsLoading(true);
    try {
      const updatedActivity = await activitiesAPI.reject(activity.id, comment);
      updateActivity(updatedActivity);
      toast.success('Activity rejected');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject activity');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this activity?')) return;

    setIsLoading(true);
    try {
      await activitiesAPI.delete(activity.id);
      removeActivity(activity.id);
      toast.success('Activity deleted');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete activity');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <li className="px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-gray-900">
              {activity.ticketNumber}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(activity.approvalState)}`}>
              {activity.approvalState}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(activity.priority)}`}>
              {activity.priority}
            </span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mt-1">
            {activity.title}
          </h3>
          {activity.description && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {activity.description}
            </p>
          )}
          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
            <span>Created by: {activity.createdBy?.name}</span>
            <span>Created: {format(new Date(activity.createdAt), 'MMM d, yyyy')}</span>
            {activity.assignees?.length > 0 && (
              <span>Assignees: {activity.assignees.map(a => a.name).join(', ')}</span>
            )}
          </div>
          {activity.tags && activity.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {activity.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {canSubmit && (
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              title="Submit for approval"
            >
              <PaperAirplaneIcon className="h-4 w-4" />
            </button>
          )}

          {canApprove && (
            <>
              <button
                onClick={handleApprove}
                disabled={isLoading}
                className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                title="Approve"
              >
                <CheckIcon className="h-4 w-4" />
              </button>
              <button
                onClick={handleReject}
                disabled={isLoading}
                className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                title="Reject"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </>
          )}

          {canEdit && (
            <button
              className="inline-flex items-center p-2 border border-gray-300 rounded-full shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              title="Edit"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
          )}

          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={isLoading}
              className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              title="Delete"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </li>
  );
}
