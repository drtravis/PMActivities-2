'use client';

import { useState, useEffect } from 'react';
import { tasksAPI, projectsAPI, usersAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { usePersistentState, clearPersistentStateByPrefix } from '@/hooks/usePersistentState';
import { useAuthStore } from '@/lib/store';

interface TaskFormData {
  title: string;
  description: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High';
  expectedDate: string;
  estimatedHours: number;
  assigneeId?: string; // Only for PM/Admin mode
}

interface TaskFormProps {
  selectedProject?: any;
  onTaskCreated?: () => void;
  mode?: 'member' | 'pm'; // member = self-create, pm = assign to others
  onCancel?: () => void;
  defaultAssigneeId?: string; // Prefill for PM mode
}

export function TaskForm({ selectedProject, onTaskCreated, mode = 'member', onCancel, defaultAssigneeId }: TaskFormProps) {
  const { user } = useAuthStore();

  // Clear old cached form data with incorrect priority values
  useEffect(() => {
    clearPersistentStateByPrefix('member-task-form');
    clearPersistentStateByPrefix('pm-task-form');
  }, []);

  const [formData, setFormData] = usePersistentState<TaskFormData>(`${mode}-task-form-v3`, {
    title: '',
    description: '',
    category: '',
    priority: 'Medium',
    expectedDate: '',
    estimatedHours: 0,
    assigneeId: mode === 'member' ? undefined : ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [members, setMembers] = useState<any[]>([]);

  // Prefill default assignee for PM mode if provided
  useEffect(() => {
    if (mode === 'pm' && defaultAssigneeId) {
      setFormData(prev => ({ ...prev, assigneeId: defaultAssigneeId }));
    }
  }, [mode, defaultAssigneeId]);

  useEffect(() => {
    if (selectedProject) {
      setSelectedProjectId(selectedProject.id);

      // Load project members for PM mode
      if (mode === 'pm') {
        loadProjectMembers(selectedProject.id);
      }
    }
  }, [selectedProject, mode]);



  const loadProjectMembers = async (projectId: string) => {
    try {
      const projectMembers = await projectsAPI.getMembers(projectId);
      setMembers(projectMembers || []);
    } catch (error) {
      console.error('Failed to load project members:', error);
    }
  };

  const categories = [
    'Development',
    'Design',
    'Testing',
    'Documentation',
    'Research',
    'Meeting',
    'Training',
    'Bug Fix',
    'Feature',
    'Maintenance'
  ];

  const handleInputChange = (field: keyof TaskFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!selectedProjectId) {
      toast.error('Please select a project');
      return;
    }

    if (mode === 'pm' && !formData.assigneeId) {
      toast.error('Please select an assignee');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Ensure priority is properly capitalized
      const normalizedPriority = formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1).toLowerCase();

      if (mode === 'member') {
        const taskData = {
          title: formData.title,
          description: formData.description,
          priority: normalizedPriority,
          dueDate: formData.expectedDate || undefined,
        };
        // Member self-creates task (auto-assigned and IN_PROGRESS)
        await tasksAPI.selfCreate(selectedProjectId, taskData);
      } else {
        const taskData = {
          title: formData.title,
          description: formData.description,
          assigneeId: formData.assigneeId as string,
          priority: normalizedPriority,
          dueDate: formData.expectedDate || undefined,
        };
        // PM creates and assigns task
        await tasksAPI.pmCreateAssign(selectedProjectId, taskData);
      }
      
      // Reset form after successful submission
      setFormData({
        title: '',
        description: '',
        category: '',
        priority: 'Medium',
        expectedDate: '',
        estimatedHours: 0,
        assigneeId: mode === 'member' ? undefined : ''
      });
      
      toast.success(`Task created successfully!`);
      onTaskCreated && onTaskCreated();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      priority: 'Medium',
      expectedDate: '',
      estimatedHours: 0,
      assigneeId: mode === 'member' ? undefined : ''
    });
    onCancel && onCancel();
  };

  const isFormValid = formData.title.trim() && formData.description.trim() && 
                     formData.category && formData.expectedDate &&
                     (mode === 'member' || formData.assigneeId);

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === 'member' ? 'Create New Task' : 'Assign New Task'}
            </h2>
            <p className="text-gray-600">
              {mode === 'member' 
                ? 'Fill in the details to create a new activity or task' 
                : 'Create and assign a task to a team member'
              }
            </p>
          </div>
        </div>

        {/* Form Mode */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <form className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter a clear, descriptive title for your task"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Provide detailed information about the task, objectives, and requirements"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              {mode === 'pm' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign To *
                  </label>
                  <select
                    value={formData.assigneeId || ''}
                    onChange={(e) => handleInputChange('assigneeId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a team member</option>
                    {members.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.name} ({member.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Date *
                </label>
                <input
                  type="date"
                  value={formData.expectedDate}
                  onChange={(e) => handleInputChange('expectedDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Hours
                </label>
                <input
                  type="number"
                  value={formData.estimatedHours}
                  onChange={(e) => handleInputChange('estimatedHours', parseInt(e.target.value) || 0)}
                  min="0"
                  step="0.5"
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                * Required fields
              </div>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !isFormValid}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Saving...' : (mode === 'member' ? 'Save Task' : 'Assign Task')}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
