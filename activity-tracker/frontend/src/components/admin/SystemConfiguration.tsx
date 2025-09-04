'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { systemAPI } from '@/lib/api';

interface SystemSettings {
  general: {
    siteName: string;
    maintenanceMode: boolean;
  };
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
  };
  notifications: {
    emailEnabled: boolean;
    smtpHost: string;
  };
  backup: {
    autoBackup: boolean;
    retentionDays: number;
    storageLocation: string;
  };
  defaultPasswordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
  emailNotifications: {
    activityApproval: boolean;
    activityRejection: boolean;
    userInvitation: boolean;
    passwordReset: boolean;
  };
  workflowSettings: {
    autoApprovalThreshold: number;
    escalationTimeout: number;
    requireCommentOnRejection: boolean;
  };
  dataRetention: {
    auditLogDays: number;
    inactiveUserDays: number;
    completedActivityDays: number;
  };
}

export function SystemConfiguration() {
  const [settings, setSettings] = useState<SystemSettings>({
    general: {
      siteName: '',
      maintenanceMode: false,
    },
    security: {
      sessionTimeout: 480, // 8 hours in minutes
      maxLoginAttempts: 5,
    },
    notifications: {
      emailEnabled: true,
      smtpHost: '',
    },
    backup: {
      autoBackup: false,
      retentionDays: 30,
      storageLocation: '',
    },
    defaultPasswordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false,
    },
    emailNotifications: {
      activityApproval: true,
      activityRejection: true,
      userInvitation: true,
      passwordReset: true,
    },
    workflowSettings: {
      autoApprovalThreshold: 0, // Disabled by default
      escalationTimeout: 72, // 72 hours
      requireCommentOnRejection: true,
    },
    dataRetention: {
      auditLogDays: 365,
      inactiveUserDays: 90,
      completedActivityDays: 180,
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiStatus, setApiStatus] = useState<'ok' | 'down' | 'checking'>('checking');

  const checkHealth = async () => {
    try {
      setApiStatus('checking');
      const res = await systemAPI.health();
      if (res.status === 'ok') setApiStatus('ok');
      else setApiStatus('down');
    } catch (e) {
      setApiStatus('down');
    }
  };

  useEffect(() => {
    checkHealth();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // Mock data - replace with actual API call
      setSettings({
        general: {
          siteName: 'Activity Tracker',
          maintenanceMode: false,
        },
        security: {
          sessionTimeout: 480,
          maxLoginAttempts: 5,
        },
        notifications: {
          emailEnabled: true,
          smtpHost: 'smtp.example.com',
        },
        backup: {
          autoBackup: true,
          retentionDays: 30,
          storageLocation: '/backups',
        },
        defaultPasswordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: false,
        },
        emailNotifications: {
          activityApproval: true,
          activityRejection: true,
          userInvitation: true,
          passwordReset: true,
        },
        workflowSettings: {
          autoApprovalThreshold: 0,
          escalationTimeout: 72,
          requireCommentOnRejection: true,
        },
        dataRetention: {
          auditLogDays: 365,
          inactiveUserDays: 90,
          completedActivityDays: 180,
        },
      });
    } catch (error) {
      toast.error('Failed to fetch system settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // API call to save settings
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay
      toast.success('System settings updated successfully');
    } catch (error) {
      toast.error('Failed to update system settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = (path: string, value: any) => {
    const keys = path.split('.');
    const newSettings = { ...settings };
    let current = newSettings;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i] as keyof typeof current] as any;
    }
    
    (current as any)[keys[keys.length - 1]] = value;
    setSettings(newSettings);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* API Health Indicator */}
      <div className="flex items-center justify-between bg-white border rounded-lg p-4">
        <div className="flex items-center gap-3">
          <span
            className={`inline-block h-3 w-3 rounded-full ${
              apiStatus === 'ok' ? 'bg-green-500' : apiStatus === 'down' ? 'bg-red-500' : 'bg-yellow-500'
            }`}
          />
          <span className="text-sm text-gray-700">
            {apiStatus === 'ok' && 'API is reachable'}
            {apiStatus === 'down' && 'API is not reachable'}
            {apiStatus === 'checking' && 'Checking API health...'}
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={checkHealth} disabled={apiStatus === 'checking'}>
          {apiStatus === 'checking' ? 'Checking...' : 'Retry'}
        </Button>
      </div>

      {/* Security Settings */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-3">Password Policy</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Length</label>
                <input
                  type="number"
                  value={settings.defaultPasswordPolicy.minLength}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSettings('defaultPasswordPolicy.minLength', parseInt(e.target.value))}
                  min="6"
                  max="32"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.defaultPasswordPolicy.requireUppercase}
                    onChange={(e) => updateSettings('defaultPasswordPolicy.requireUppercase', e.target.checked)}
                    className="mr-2"
                  />
                  Require uppercase letters
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.defaultPasswordPolicy.requireLowercase}
                    onChange={(e) => updateSettings('defaultPasswordPolicy.requireLowercase', e.target.checked)}
                    className="mr-2"
                  />
                  Require lowercase letters
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.defaultPasswordPolicy.requireNumbers}
                    onChange={(e) => updateSettings('defaultPasswordPolicy.requireNumbers', e.target.checked)}
                    className="mr-2"
                  />
                  Require numbers
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.defaultPasswordPolicy.requireSpecialChars}
                    onChange={(e) => updateSettings('defaultPasswordPolicy.requireSpecialChars', e.target.checked)}
                    className="mr-2"
                  />
                  Require special characters
                </label>
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-3">Session & Access</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Session Timeout (minutes)</label>
                <input
                  type="number"
                  value={settings.security.sessionTimeout}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSettings('security.sessionTimeout', parseInt(e.target.value))}
                  min="30"
                  max="1440"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Login Attempts</label>
                <input
                  type="number"
                  value={settings.security.maxLoginAttempts}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSettings('security.maxLoginAttempts', parseInt(e.target.value))}
                  min="3"
                  max="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Email Notifications</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label>
            <input
              type="text"
              value={settings.notifications.smtpHost}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSettings('notifications.smtpHost', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., smtp.example.com"
            />
          </div>
          <div>
            <label className="flex items-center mt-6">
              <input
                type="checkbox"
                checked={settings.notifications.emailEnabled}
                onChange={(e) => updateSettings('notifications.emailEnabled', e.target.checked)}
                className="mr-2"
              />
              Enable Email Notifications
            </label>
          </div>
        </div>
        
        <h4 className="text-md font-medium text-gray-700 mb-3">Notification Types</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.emailNotifications.activityApproval}
                onChange={(e) => updateSettings('emailNotifications.activityApproval', e.target.checked)}
                className="mr-2"
              />
              Activity Approvals
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.emailNotifications.activityRejection}
                onChange={(e) => updateSettings('emailNotifications.activityRejection', e.target.checked)}
                className="mr-2"
              />
              Activity Rejections
            </label>
          </div>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.emailNotifications.userInvitation}
                onChange={(e) => updateSettings('emailNotifications.userInvitation', e.target.checked)}
                className="mr-2"
              />
              User Invitations
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.emailNotifications.passwordReset}
                onChange={(e) => updateSettings('emailNotifications.passwordReset', e.target.checked)}
                className="mr-2"
              />
              Password Resets
            </label>
          </div>
        </div>
      </div>

      {/* Backup Settings */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Backup Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Storage Location</label>
            <input
              type="text"
              value={settings.backup.storageLocation}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSettings('backup.storageLocation', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., /backups or s3://bucket-name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Retention Period (days)</label>
            <input
              type="number"
              value={settings.backup.retentionDays}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSettings('backup.retentionDays', parseInt(e.target.value))}
              min="1"
              max="365"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.backup.autoBackup}
                onChange={(e) => updateSettings('backup.autoBackup', e.target.checked)}
                className="mr-2"
              />
              Enable Automatic Backups
            </label>
          </div>
        </div>
      </div>

      {/* Workflow Settings */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Workflow Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Auto-approval Threshold (hours, 0 = disabled)</label>
            <input
              type="number"
              value={settings.workflowSettings.autoApprovalThreshold}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSettings('workflowSettings.autoApprovalThreshold', parseInt(e.target.value))}
              min="0"
              max="168"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Escalation Timeout (hours)</label>
            <input
              type="number"
              value={settings.workflowSettings.escalationTimeout}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSettings('workflowSettings.escalationTimeout', parseInt(e.target.value))}
              min="1"
              max="720"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.workflowSettings.requireCommentOnRejection}
                onChange={(e) => updateSettings('workflowSettings.requireCommentOnRejection', e.target.checked)}
                className="mr-2"
              />
              Require comment when rejecting activities
            </label>
          </div>
        </div>
      </div>

      {/* Data Retention */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Data Retention</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Audit Log Retention (days)</label>
            <input
              type="number"
              value={settings.dataRetention.auditLogDays}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSettings('dataRetention.auditLogDays', parseInt(e.target.value))}
              min="30"
              max="2555"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Inactive User Cleanup (days)</label>
            <input
              type="number"
              value={settings.dataRetention.inactiveUserDays}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSettings('dataRetention.inactiveUserDays', parseInt(e.target.value))}
              min="30"
              max="365"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Completed Activity Retention (days)</label>
            <input
              type="number"
              value={settings.dataRetention.completedActivityDays}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSettings('dataRetention.completedActivityDays', parseInt(e.target.value))}
              min="30"
              max="1095"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
