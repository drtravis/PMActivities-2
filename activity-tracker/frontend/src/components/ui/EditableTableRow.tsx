import React, { useState, useEffect } from 'react';
import { UserAvatar } from './UserAvatar';
import StatusDropdown from './StatusDropdown';
import { PriorityBadge } from './PriorityBadge';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStatus } from '@/contexts/StatusContext';

interface EditableTableRowProps {
  activity: {
    id: string;
    title: string;
    description: string;
    status: string;
    priority: 'low' | 'medium' | 'high' | 'urgent' | null | undefined;
    category: string;
    startDate: string;
    endDate: string;
    progress: number;
    estimatedHours: number;
    actualHours: number;
    tags: string[];
    comments: number;
    attachments: number;
    lastUpdated: string;
    taskId?: string;
    createdBy?: { name: string };
    updatedBy?: { name: string };
    projectId?: string;
    projectName?: string;
  };
  onConvertToActivity: (activity: any) => void;
  onOpenTaskDetails: (activity: any) => void;
  onStatusChange: (activityId: string, newStatus: string) => void;
  onSaveTask: (taskId: string, updates: any) => Promise<void>;
  formatDate: (date: string) => string;
  formatLastUpdated: (date: string) => string;
}

export const EditableTableRow: React.FC<EditableTableRowProps> = ({
  activity,
  onConvertToActivity,
  onOpenTaskDetails,
  onStatusChange,
  onSaveTask,
  formatDate,
  formatLastUpdated,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    description: activity.description,
    priority: activity.priority || 'medium',
    category: activity.category,
    endDate: activity.endDate,
    estimatedHours: activity.estimatedHours,
    actualHours: activity.actualHours,
  });
  const [isSaving, setIsSaving] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: activity.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset to original values
    setEditData({
      description: activity.description,
      priority: activity.priority || 'medium',
      category: activity.category,
      endDate: activity.endDate,
      estimatedHours: activity.estimatedHours,
      actualHours: activity.actualHours,
    });
  };

  const handleSave = async () => {
    if (!activity.taskId) return;
    
    setIsSaving(true);
    try {
      // Map priority to backend enum values (Low, Medium, High, Urgent)
      const priorityMap: Record<string, string> = {
        low: 'Low',
        medium: 'Medium',
        high: 'High',
        urgent: 'Urgent',
      };

      const updates = {
        description: editData.description,
        priority: priorityMap[String(editData.priority) as keyof typeof priorityMap] || 'Medium',
        category: editData.category,
        dueDate: editData.endDate,
        estimatedHours: editData.estimatedHours,
        actualHours: editData.actualHours,
      };
      
      await onSaveTask(activity.taskId, updates);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save task:', error);
      // You might want to show an error toast here
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div
      ref={setNodeRef}
      className={`gap-0 px-1.5 py-1 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150 min-h-[28px] ${
        isDragging ? 'opacity-50 shadow-lg z-10' : ''
      } ${isEditing ? 'bg-blue-50 border-blue-200' : ''}`}
      style={{
        ...style,
        display: 'grid',
        gridTemplateColumns: '32px 1fr 120px 100px 70px 100px 90px 80px',
        alignItems: 'center'
      }}
      {...attributes}
    >
      {/* Drag Handle */}
      <div className="flex items-center justify-center px-1 border-r border-gray-200" {...listeners}>
        <div className="flex items-center justify-center w-5 h-5 bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300 rounded cursor-grab active:cursor-grabbing hover:from-blue-100 hover:to-blue-200 hover:border-blue-300 transition-all duration-200">
          <svg
            width="10"
            height="10"
            viewBox="0 0 16 16"
            fill="none"
            className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
          >
            <line x1="8" y1="3" x2="8" y2="13" stroke="currentColor" strokeWidth="1.5"/>
            <line x1="3" y1="8" x2="13" y2="8" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M6 6l2-2 2 2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <path d="M6 10l2 2 2-2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <path d="M6 6l-2 2 2 2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <path d="M10 6l2 2-2 2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          </svg>
        </div>
      </div>

      {/* Task Name - Not Editable */}
      <div className="flex items-center space-x-1.5 px-1.5 border-r border-gray-200">
        <h4 className="text-xs font-medium text-gray-900 truncate hover:text-blue-600 cursor-pointer flex-1">
          {activity.title}
        </h4>
        <div className="flex items-center space-x-1 flex-shrink-0">
          {/* Comment Icon */}
          <button
            onClick={() => onOpenTaskDetails(activity)}
            className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded transition-all duration-200"
            title="Add comment / View details"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              <path d="M12 8v4M8 12h8"/>
            </svg>
          </button>

          {/* Convert Icon (Double Arrow) */}
          {activity.taskId && (
            <button
              onClick={() => onConvertToActivity(activity)}
              className="p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded transition-all duration-200"
              title="Convert task to activity"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14"/>
                <path d="M12 5l7 7-7 7"/>
                <path d="M5 9h14" strokeWidth="2"/>
                <path d="M12 2l7 7-7 7" strokeWidth="2"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Assigned To */}
      <div className="flex items-center space-x-1 px-1.5 border-r border-gray-200">
        <UserAvatar name={activity.createdBy?.name || 'U'} size="xs" className="flex-shrink-0" />
        <span className="text-xs text-gray-900 truncate flex-1">
          {activity.createdBy?.name || 'Unassigned'}
        </span>
      </div>

      {/* Status */}
      <div className="flex items-center justify-center px-1.5 border-r border-gray-200">
        <StatusDropdown
          value={activity.status}
          onChange={(newStatus) => onStatusChange(activity.id, newStatus)}
          size="xs"
        />
      </div>

      {/* Due Date - Editable */}
      <div className="flex items-center justify-center px-1.5 border-r border-gray-200">
        {isEditing ? (
          <input
            type="date"
            value={editData.endDate.split('T')[0]}
            onChange={(e) => handleInputChange('endDate', e.target.value + 'T00:00:00.000Z')}
            className="text-xs border border-gray-300 rounded px-1 py-0.5 w-full"
          />
        ) : (
          <span className="text-xs text-gray-600 text-center">
            {formatDate(activity.endDate)}
          </span>
        )}
      </div>

      {/* Priority - Editable */}
      <div className="flex items-center justify-center px-1.5 border-r border-gray-200">
        {isEditing ? (
          <select
            value={editData.priority}
            onChange={(e) => handleInputChange('priority', e.target.value)}
            className="text-xs border border-gray-300 rounded px-1 py-0.5 w-full"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        ) : (
          <PriorityBadge priority={(activity.priority ?? 'medium') as 'low' | 'medium' | 'high' | 'urgent'} size="xs" />
        )}
      </div>

      {/* Last Updated */}
      <div className="flex items-center justify-center space-x-1 px-1.5 border-r border-gray-200">
        <UserAvatar name={activity.updatedBy?.name || 'U'} size="xs" className="flex-shrink-0" />
        <span className="text-xs text-gray-500 truncate">
          {formatLastUpdated(activity.lastUpdated)}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center space-x-1 px-1">
        {isEditing ? (
          <>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded transition-all duration-200 disabled:opacity-50"
              title="Save changes"
            >
              {isSaving ? (
                <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              )}
            </button>
            <button
              onClick={handleCancel}
              className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-all duration-200"
              title="Cancel changes"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </>
        ) : (
          <button
            onClick={handleEdit}
            className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-100 rounded transition-all duration-200"
            title="Edit task"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default EditableTableRow;
