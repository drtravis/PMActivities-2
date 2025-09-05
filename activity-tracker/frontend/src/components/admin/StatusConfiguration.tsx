'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { statusConfigurationAPI } from '@/lib/api';
import { useStatus } from '@/contexts/StatusContext';

interface StatusConfig {
  id: string;
  type: 'activity' | 'task' | 'approval';
  name: string;
  displayName: string;
  color: string;
  order: number;
  isDefault: boolean;
  isActive: boolean;
  description?: string;
  workflowRules?: {
    allowedTransitions?: string[];
    requiredRole?: string[];
    autoTransitions?: {
      condition: string;
      targetStatus: string;
    }[];
  };
  createdAt?: string;
  updatedAt?: string;
}

interface StatusSet {
  type: 'activity' | 'task' | 'approval';
  title: string;
  description: string;
  statuses: StatusConfig[];
}

export function StatusConfiguration() {
  const { refreshStatuses } = useStatus();
  const [statusSets, setStatusSets] = useState<StatusSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingStatus, setEditingStatus] = useState<StatusConfig | null>(null);
  const [activeTab, setActiveTab] = useState<'activity' | 'task' | 'approval'>('task');

  const [newStatus, setNewStatus] = useState({
    type: 'activity' as const,
    name: '',
    displayName: '',
    color: '#6B7280',
    description: '',
  });

  // This component now loads all status configurations dynamically from the database

  useEffect(() => {
    fetchStatusConfigurations();
  }, []);

  const fetchStatusConfigurations = async () => {
    try {
      setLoading(true);
      const configs = await statusConfigurationAPI.getAll();

      // Group by type
      const grouped = configs.reduce((acc: Record<string, StatusConfig[]>, config: StatusConfig) => {
        if (!acc[config.type]) {
          acc[config.type] = [];
        }
        acc[config.type].push(config);
        return acc;
      }, {} as Record<string, StatusConfig[]>);

      // Create status sets - unified task/activity statuses (remove duplicates by name)
      const taskActivityStatuses = [...(grouped.task || []), ...(grouped.activity || [])];
      const uniqueTaskActivityStatuses = taskActivityStatuses.reduce((acc: StatusConfig[], current: StatusConfig) => {
        const existing = acc.find(status => status.name === current.name);
        if (!existing) {
          acc.push(current);
        }
        return acc;
      }, []);

      const sets: StatusSet[] = [
        {
          type: 'task',
          title: 'Task & Activity Statuses',
          description: 'Unified execution states for both tasks and activities',
          statuses: uniqueTaskActivityStatuses
        },
        {
          type: 'approval',
          title: 'Approval Statuses',
          description: 'Lifecycle and approval workflow states',
          statuses: grouped.approval || []
        }
      ];

      console.log('Fetched configs:', configs);
      console.log('Grouped configs:', grouped);
      console.log('Final status sets:', sets);
      setStatusSets(sets);
    } catch (error) {
      console.error('Failed to fetch status configurations:', error);
      toast.error('Failed to load status configurations');
      // Set empty status sets if loading fails
      setStatusSets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStatus = async () => {
    try {
      const createdStatus = await statusConfigurationAPI.create(newStatus);

      setStatusSets(prev => prev.map(set =>
        set.type === newStatus.type
          ? { ...set, statuses: [...set.statuses, createdStatus] }
          : set
      ));

      setNewStatus({
        type: 'activity',
        name: '',
        displayName: '',
        color: '#6B7280',
        description: '',
      });
      setShowCreateModal(false);
      toast.success('Status created successfully');
      // Refresh the status context to update all components
      await refreshStatuses();
    } catch (error) {
      console.error('Failed to create status:', error);
      toast.error('Failed to create status');
    }
  };

  const handleUpdateStatus = async (status: StatusConfig) => {
    try {
      const updatedStatus = await statusConfigurationAPI.update(status.id, {
        displayName: status.displayName,
        color: status.color,
        description: status.description,
        isActive: status.isActive,
        order: status.order,
        workflowRules: status.workflowRules,
      });

      setStatusSets(prev => prev.map(set =>
        set.type === status.type
          ? { ...set, statuses: set.statuses.map(s => s.id === status.id ? updatedStatus : s) }
          : set
      ));
      setEditingStatus(null);
      toast.success('Status updated successfully');
      // Refresh the status context to update all components
      await refreshStatuses();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleDeleteStatus = async (statusId: string, type: string) => {
    if (!confirm('Are you sure you want to delete this status? This action cannot be undone.')) {
      return;
    }

    try {
      await statusConfigurationAPI.delete(statusId);

      setStatusSets(prev => prev.map(set =>
        set.type === type
          ? { ...set, statuses: set.statuses.filter(s => s.id !== statusId) }
          : set
      ));
      toast.success('Status deleted successfully');
    } catch (error) {
      console.error('Failed to delete status:', error);
      toast.error('Failed to delete status');
    }
  };

  const handleToggleStatus = async (statusId: string, type: string) => {
    try {
      const currentStatus = statusSets
        .find(set => set.type === type)
        ?.statuses.find(s => s.id === statusId);

      if (!currentStatus) return;

      await statusConfigurationAPI.update(statusId, {
        isActive: !currentStatus.isActive
      });

      setStatusSets(prev => prev.map(set =>
        set.type === type
          ? { ...set, statuses: set.statuses.map(s =>
              s.id === statusId ? { ...s, isActive: !s.isActive } : s
            )}
          : set
      ));
      toast.success('Status updated successfully');
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    }
  };

  const currentStatusSet = statusSets.find(set => set.type === activeTab);

  if (loading) {
    return <div className="p-8 text-center">Loading status configurations...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Status Configuration</h2>
          <p className="text-gray-600 mt-1">
            Configure status options for activities, tasks, and approvals across your organization
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          Add New Status
        </Button>
      </div>

      {/* Status Type Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {statusSets.map((set) => (
            <button
              key={set.type}
              onClick={() => setActiveTab(set.type)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === set.type
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {set.title}
            </button>
          ))}
        </nav>
      </div>

      {/* Current Status Set */}
      {currentStatusSet && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900">{currentStatusSet.title}</h3>
            <p className="text-blue-700 text-sm mt-1">{currentStatusSet.description}</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
                <div className="col-span-3">Status Name</div>
                <div className="col-span-3">Display Name</div>
                <div className="col-span-2">Color</div>
                <div className="col-span-1">Order</div>
                <div className="col-span-1">Active</div>
                <div className="col-span-2">Actions</div>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {currentStatusSet.statuses
                .sort((a, b) => a.order - b.order)
                .map((status) => (
                <div key={status.id} className="px-6 py-4">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-3">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {status.name}
                      </code>
                    </div>
                    <div className="col-span-3">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: status.color }}
                        />
                        <span className="text-sm font-medium">{status.displayName}</span>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-6 h-6 rounded border border-gray-300"
                          style={{ backgroundColor: status.color }}
                        />
                        <span className="text-xs text-gray-500">{status.color}</span>
                      </div>
                    </div>
                    <div className="col-span-1">
                      <span className="text-sm text-gray-600">{status.order}</span>
                    </div>
                    <div className="col-span-1">
                      <button
                        onClick={() => handleToggleStatus(status.id, status.type)}
                        className={`w-8 h-4 rounded-full transition-colors ${
                          status.isActive ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`w-3 h-3 bg-white rounded-full transition-transform ${
                          status.isActive ? 'translate-x-4' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </div>
                    <div className="col-span-2 flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingStatus(status)}
                      >
                        Edit
                      </Button>
                      {!status.isDefault && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteStatus(status.id, status.type)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Status Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Status"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status Type
            </label>
            <select
              value={newStatus.type}
              onChange={(e) => setNewStatus(prev => ({ ...prev, type: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="activity">Activity Status</option>
              <option value="task">Task Status</option>
              <option value="approval">Approval Status</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status Name (Code)
            </label>
            <Input
              value={newStatus.name}
              onChange={(e) => setNewStatus(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., in_progress"
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Used internally. Use lowercase with underscores.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Name
            </label>
            <Input
              value={newStatus.displayName}
              onChange={(e) => setNewStatus(prev => ({ ...prev, displayName: e.target.value }))}
              placeholder="e.g., In Progress"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={newStatus.color}
                onChange={(e) => setNewStatus(prev => ({ ...prev, color: e.target.value }))}
                className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
              />
              <Input
                value={newStatus.color}
                onChange={(e) => setNewStatus(prev => ({ ...prev, color: e.target.value }))}
                placeholder="#6B7280"
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={newStatus.description}
              onChange={(e) => setNewStatus(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of when to use this status"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateStatus}
              disabled={!newStatus.name || !newStatus.displayName}
            >
              Create Status
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Status Modal */}
      {editingStatus && (
        <Modal
          isOpen={!!editingStatus}
          onClose={() => setEditingStatus(null)}
          title="Edit Status"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Name
              </label>
              <Input
                value={editingStatus.displayName}
                onChange={(e) => setEditingStatus(prev => prev ? { ...prev, displayName: e.target.value } : null)}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={editingStatus.color}
                  onChange={(e) => setEditingStatus(prev => prev ? { ...prev, color: e.target.value } : null)}
                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <Input
                  value={editingStatus.color}
                  onChange={(e) => setEditingStatus(prev => prev ? { ...prev, color: e.target.value } : null)}
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={editingStatus.description || ''}
                onChange={(e) => setEditingStatus(prev => prev ? { ...prev, description: e.target.value } : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setEditingStatus(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleUpdateStatus(editingStatus)}
              >
                Update Status
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
