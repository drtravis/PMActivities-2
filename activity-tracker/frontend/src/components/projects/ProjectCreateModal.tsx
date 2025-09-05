import React, { useState } from 'react';
import { X, Calendar, Users, FileText, Settings } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

interface ProjectCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (project: any) => void;
}

interface ProjectFormData {
  name: string;
  description: string;
  status: 'planning' | 'active' | 'on_hold';
  startDate: string;
  endDate: string;
  members: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
  template?: string;
}

export const ProjectCreateModal: React.FC<ProjectCreateModalProps> = ({
  isOpen,
  onClose,
  onProjectCreated,
}) => {
  const { user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    status: 'planning',
    startDate: '',
    endDate: '',
    members: [],
    template: undefined,
  });

  const [availableUsers] = useState([
    { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Developer' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'Designer' },
    { id: '3', name: 'Mike Johnson', email: 'mike@example.com', role: 'QA Engineer' },
    { id: '4', name: 'Sarah Wilson', email: 'sarah@example.com', role: 'Product Manager' },
  ]);

  const projectTemplates = [
    {
      id: 'software',
      name: 'Software Development',
      description: 'Template for software development projects with standard phases',
      tasks: ['Requirements Analysis', 'Design', 'Development', 'Testing', 'Deployment'],
    },
    {
      id: 'marketing',
      name: 'Marketing Campaign',
      description: 'Template for marketing campaigns with typical activities',
      tasks: ['Strategy Planning', 'Content Creation', 'Campaign Launch', 'Performance Analysis'],
    },
    {
      id: 'research',
      name: 'Research Project',
      description: 'Template for research projects with structured methodology',
      tasks: ['Literature Review', 'Data Collection', 'Analysis', 'Report Writing'],
    },
    {
      id: 'blank',
      name: 'Blank Project',
      description: 'Start with an empty project and add your own structure',
      tasks: [],
    },
  ];

  const handleInputChange = (field: keyof ProjectFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMemberToggle = (user: typeof availableUsers[0]) => {
    const isSelected = formData.members.some(member => member.id === user.id);
    if (isSelected) {
      setFormData(prev => ({
        ...prev,
        members: prev.members.filter(member => member.id !== user.id),
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        members: [...prev.members, user],
      }));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const projectData = {
        ...formData,
        ownerId: user?.id,
        organizationId: user?.organizationId,
      };

      // Create project via API
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(projectData),
      });

      if (response.ok) {
        const newProject = await response.json();
        onProjectCreated(newProject);
        onClose();
        resetForm();
      } else {
        throw new Error('Failed to create project');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      // For development, create mock project
      const mockProject = {
        id: Date.now().toString(),
        ...formData,
        owner: { id: user?.id || '', name: user?.name || '', email: user?.email || '' },
        stats: { totalTasks: 0, completedTasks: 0, totalActivities: 0, completedActivities: 0, progress: 0 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onProjectCreated(mockProject);
      onClose();
      resetForm();
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      status: 'planning',
      startDate: '',
      endDate: '',
      members: [],
      template: undefined,
    });
    setCurrentStep(1);
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return formData.name.trim() !== '';
      case 2:
        return true; // Template selection is optional
      case 3:
        return true; // Member selection is optional
      default:
        return true;
    }
  };

  const canSubmit = () => {
    return formData.name.trim() !== '' && !loading;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Create New Project</h2>
            <p className="text-sm text-gray-500 mt-1">Step {currentStep} of 4</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {step}
                </div>
                {step < 4 && (
                  <div className={`w-12 h-1 mx-2 ${
                    step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Basic Info</span>
            <span>Template</span>
            <span>Team</span>
            <span>Review</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter project name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your project goals and objectives"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Initial Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Template Selection */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Choose a Template</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Select a template to get started quickly with pre-configured tasks and structure.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {projectTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      formData.template === template.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleInputChange('template', template.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <input
                        type="radio"
                        checked={formData.template === template.id}
                        onChange={() => handleInputChange('template', template.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{template.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                        {template.tasks.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500">Includes tasks:</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {template.tasks.slice(0, 3).map((task, index) => (
                                <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                  {task}
                                </span>
                              ))}
                              {template.tasks.length > 3 && (
                                <span className="text-xs text-gray-500">+{template.tasks.length - 3} more</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Team Members */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Add Team Members</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Select team members who will work on this project. You can add more members later.
                </p>
              </div>

              <div className="space-y-3">
                {availableUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={formData.members.some(member => member.id === user.id)}
                      onChange={() => handleMemberToggle(user)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-sm text-white font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <span className="text-sm text-gray-500">{user.role}</span>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Selected:</strong> {formData.members.length} team member{formData.members.length !== 1 ? 's' : ''}
                  {formData.members.length > 0 && (
                    <span className="ml-2">
                      ({formData.members.map(m => m.name).join(', ')})
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Review Project Details</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Please review the project information before creating.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">{formData.name}</h4>
                  {formData.description && (
                    <p className="text-sm text-gray-600 mt-1">{formData.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span className="ml-2 font-medium capitalize">{formData.status.replace('_', ' ')}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Template:</span>
                    <span className="ml-2 font-medium">
                      {formData.template ? projectTemplates.find(t => t.id === formData.template)?.name : 'None'}
                    </span>
                  </div>
                  {formData.startDate && (
                    <div>
                      <span className="text-gray-500">Start Date:</span>
                      <span className="ml-2 font-medium">{new Date(formData.startDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  {formData.endDate && (
                    <div>
                      <span className="text-gray-500">End Date:</span>
                      <span className="ml-2 font-medium">{new Date(formData.endDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {formData.members.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-500">Team Members:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.members.map((member) => (
                        <div key={member.id} className="flex items-center space-x-2 bg-white px-3 py-1 rounded-full border">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-xs text-white font-medium">
                              {member.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm">{member.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="flex space-x-3">
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Previous
              </button>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            {currentStep < 4 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canProceedToNextStep()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canSubmit()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Project'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
