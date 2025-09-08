'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { useOrganizationStore } from '@/lib/organizationStore';
import { organizationAPI } from '@/lib/api';

interface OrganizationData {
  id: string;
  name: string;
  description: string;
  industry: string;
  size: string;
  timezone: string;
  currency: string;
  logoUrl?: string;
  settings: {
    allowSelfRegistration: boolean;
    requireEmailVerification: boolean;
    defaultUserRole: 'member' | 'pm';
    workingHours: {
      start: string;
      end: string;
      workingDays: string[];
    };
    holidays: string[];
    // New: logo position controls (percentages 0-100)
    logoPositionX?: number;
    logoPositionY?: number;
    // New: logo scale percentage (50-200)
    logoScale?: number;
    // New: logo container size (px)
    logoWidth?: number;
    logoHeight?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export function OrganizationSettings() {
  const [organization, setOrganization] = useState<OrganizationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const { updateOrganization: updateOrgStore } = useOrganizationStore();

  useEffect(() => {
    fetchOrganization();
  }, []);

  const fetchOrganization = async () => {
    try {
      console.log('Fetching organization data...');

      // Check if user is authenticated
      const token = typeof window !== 'undefined' ? localStorage.getItem('pmactivities2_token') : null;
      const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      console.log('Token exists:', !!token);
      console.log('User exists:', !!user);

      if (!token) {
        throw new Error('No authentication token found');
      }

      const orgData = await organizationAPI.get();
      console.log('Organization data received:', orgData);
      
      // Ensure all required fields exist with defaults
      const organization: OrganizationData = {
        id: orgData.id,
        name: orgData.name || '',
        description: orgData.description || '',
        industry: orgData.industry || 'Technology',
        size: orgData.size || '1-10',
        timezone: orgData.timezone || 'America/New_York',
        currency: orgData.currency || 'USD',
        logoUrl: orgData.logoUrl,
        settings: {
          allowSelfRegistration: orgData.settings?.allowSelfRegistration ?? false,
          requireEmailVerification: orgData.settings?.requireEmailVerification ?? true,
          defaultUserRole: orgData.settings?.defaultUserRole || 'member',
          workingHours: {
            start: orgData.settings?.workingHours?.start || '09:00',
            end: orgData.settings?.workingHours?.end || '17:00',
            workingDays: orgData.settings?.workingHours?.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          },
          holidays: orgData.settings?.holidays || [],
          // New: logo position controls (percentages)
          logoPositionX: orgData.settings?.logoPositionX ?? 50,
          logoPositionY: orgData.settings?.logoPositionY ?? 50,
          // New: logo scale default 100%
          logoScale: orgData.settings?.logoScale ?? 100,
          // New: logo container size with defaults
          logoWidth: orgData.settings?.logoWidth ?? 400,
          logoHeight: orgData.settings?.logoHeight ?? 100,
        },
        createdAt: orgData.createdAt,
        updatedAt: orgData.updatedAt,
      };
      
      setOrganization(organization);
    } catch (error: any) {
      console.error('Error fetching organization:', error);
      console.error('Error details:', error.response?.data || error.message);

      // Check if it's an authentication error
      if (error.response?.status === 401) {
        toast.error('Authentication failed. Please login again.');
      } else if (error.response?.status === 404) {
        toast.error('Organization not found. Creating default organization...');
        // Create a default organization
        const defaultOrg: OrganizationData = {
          id: 'temp-id',
          name: 'My Organization',
          description: '',
          industry: 'Technology',
          size: '1-10',
          timezone: 'America/New_York',
          currency: 'USD',
          logoUrl: '',
          settings: {
            allowSelfRegistration: false,
            requireEmailVerification: true,
            defaultUserRole: 'member',
            workingHours: {
              start: '09:00',
              end: '17:00',
              workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            },
            holidays: [],
            logoPositionX: 50,
            logoPositionY: 50,
            logoScale: 100,
            logoWidth: 400,
            logoHeight: 100,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setOrganization(defaultOrg);
      } else {
        toast.error(`Failed to fetch organization settings: ${error.response?.data?.message || error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!organization) return;
    
    setSaving(true);
    try {
      // First upload logo if there's a new file
      let logoUrl = organization.logoUrl;
      if (logoFile) {
        const formData = new FormData();
        formData.append('logo', logoFile);
        
        const token = typeof window !== 'undefined' ? localStorage.getItem('pmactivities2_token') : null;
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/organization/logo`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });
        
        if (response.ok) {
          const logoData = await response.json();
          logoUrl = logoData.logoUrl;
        } else {
          throw new Error('Failed to upload logo');
        }
      }

      const updateData = {
        name: organization.name,
        description: organization.description,
        industry: organization.industry,
        size: organization.size,
        timezone: organization.timezone,
        currency: organization.currency,
        logo: logoUrl, // Use 'logo' field to match backend
        settings: organization.settings,
      };

      await organizationAPI.update(updateData);

      const updatedOrg = await organizationAPI.get();
      
      // Update the global organization store
      updateOrgStore({
        name: updatedOrg.name,
        logoUrl: updatedOrg.logoUrl, // Use 'logoUrl' field from backend
        settings: {
          logoPositionX: updatedOrg.settings?.logoPositionX ?? organization.settings.logoPositionX,
          logoPositionY: updatedOrg.settings?.logoPositionY ?? organization.settings.logoPositionY,
          logoScale: updatedOrg.settings?.logoScale ?? organization.settings.logoScale,
          logoWidth: updatedOrg.settings?.logoWidth ?? organization.settings.logoWidth,
          logoHeight: updatedOrg.settings?.logoHeight ?? organization.settings.logoHeight,
        },
      });
      
      // Clear logo file and preview after successful save
      setLogoFile(null);
      setLogoPreview(null);
      
      toast.success('Organization settings updated successfully');
    } catch (error) {
      console.error('Error saving organization:', error);
      toast.error('Failed to update organization settings');
    } finally {
      setSaving(false);
    }
  };

  const updateOrganization = (field: string, value: any) => {
    if (!organization) return;
    
    const keys = field.split('.');
    const newOrg = { ...organization };
    let current = newOrg;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i] as keyof typeof current] as any;
    }
    
    current[keys[keys.length - 1] as keyof typeof current] = value;
    setOrganization(newOrg);
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setLogoFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setLogoPreview(result);
      // Don't update organization.logoUrl here - wait for save
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    updateOrganization('logoUrl', '');
  };

  const toggleWorkingDay = (day: string) => {
    if (!organization) return;
    
    const workingDays = organization.settings.workingHours.workingDays;
    const newWorkingDays = workingDays.includes(day)
      ? workingDays.filter(d => d !== day)
      : [...workingDays, day];
    
    updateOrganization('settings.workingHours.workingDays', newWorkingDays);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="p-6 text-center text-gray-500">
        Organization not found
      </div>
    );
  }

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing',
    'Retail', 'Consulting', 'Government', 'Non-profit', 'Other'
  ];

  const companySizes = [
    '1-10', '11-50', '51-100', '101-500', '501-1000', '1000+'
  ];

  const timezones = [
    'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai',
    'Australia/Sydney', 'UTC'
  ];

  const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY'];

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="p-6 space-y-8">
      {/* Organization Logo */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Organization Logo</h3>
        <div className="flex items-start space-x-6">
          <div className="flex-shrink-0">
            {/* Show uploaded logo preview or default NIHA logo */}
            <div className="relative rounded-md border-2 border-gray-200 overflow-hidden" style={{ width: (organization.settings as any).logoWidth ?? 400, height: (organization.settings as any).logoHeight ?? 100 }}>
              <img
                src={logoPreview || "/images/niha-logo.png"}
                alt={logoPreview ? "Uploaded Logo Preview" : "NIHA Technologies Logo"}
                className="w-full h-full object-contain"
                style={{
                  objectPosition: `${(organization.settings as any).logoPositionX ?? 50}% ${(organization.settings as any).logoPositionY ?? 50}%`,
                  transform: `scale(${((organization.settings as any).logoScale ?? 100) / 100})`,
                  transformOrigin: 'center',
                }}
                onError={(e) => {
                  console.error('Admin settings logo failed to load');
                }}
                onLoad={() => console.log('Admin settings logo loaded successfully')}
              />
              {logoPreview && (
                <button
                  onClick={removeLogo}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                  aria-label="Remove uploaded logo"
                >
                  ×
                </button>
              )}
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Organization Logo
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="mt-2 text-xs text-gray-500">
              PNG, JPG, GIF up to 5MB. Recommended display area: 400x100px (wide).
            </p>

            {/* Logo container size, position and zoom controls - always show since we always have a logo */}
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Logo Display Settings</h4>
              {(
              <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Width (px)</label>
                  <input
                    type="number"
                    min={200}
                    max={1000}
                    step={10}
                    value={(organization.settings as any).logoWidth ?? 400}
                    onChange={(e) => updateOrganization('settings.logoWidth', Math.max(200, Math.min(1000, Number(e.target.value))))}
                    className="w-full px-2 py-1 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Height (px)</label>
                  <input
                    type="number"
                    min={50}
                    max={400}
                    step={5}
                    value={(organization.settings as any).logoHeight ?? 100}
                    onChange={(e) => updateOrganization('settings.logoHeight', Math.max(50, Math.min(400, Number(e.target.value))))}
                    className="w-full px-2 py-1 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Horizontal Position (X)</label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={(organization.settings as any).logoPositionX ?? 50}
                    onChange={(e) => updateOrganization('settings.logoPositionX', Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500 mt-1">{(organization.settings as any).logoPositionX ?? 50}%</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vertical Position (Y)</label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={(organization.settings as any).logoPositionY ?? 50}
                    onChange={(e) => updateOrganization('settings.logoPositionY', Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500 mt-1">{(organization.settings as any).logoPositionY ?? 50}%</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Logo Size (Zoom)</label>
                  <input
                    type="range"
                    min={50}
                    max={200}
                    step={1}
                    value={(organization.settings as any).logoScale ?? 100}
                    onChange={(e) => updateOrganization('settings.logoScale', Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500 mt-1">{(organization.settings as any).logoScale ?? 100}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
            <input
              type="text"
              value={organization.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateOrganization('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
            <select
              value={organization.industry}
              onChange={(e) => updateOrganization('industry', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {industries.map(industry => (
                <option key={industry} value={industry}>{industry}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Size</label>
            <select
              value={organization.size}
              onChange={(e) => updateOrganization('size', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {companySizes.map(size => (
                <option key={size} value={size}>{size} employees</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
            <select
              value={organization.timezone}
              onChange={(e) => updateOrganization('timezone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {timezones.map(tz => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={organization.description}
              onChange={(e) => updateOrganization('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brief description of your organization"
            />
          </div>
        </div>
      </div>

      {/* User Registration Settings */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">User Registration</h3>
        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={organization.settings.allowSelfRegistration}
              onChange={(e) => updateOrganization('settings.allowSelfRegistration', e.target.checked)}
              className="mr-2"
            />
            Allow self-registration for new users
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={organization.settings.requireEmailVerification}
              onChange={(e) => updateOrganization('settings.requireEmailVerification', e.target.checked)}
              className="mr-2"
            />
            Require email verification for new accounts
          </label>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Default Role for New Users</label>
            <select
              value={organization.settings.defaultUserRole}
              onChange={(e) => updateOrganization('settings.defaultUserRole', e.target.value)}
              className="w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="member">Member</option>
              <option value="pm">Project Manager</option>
              <option value="pmo">PMO</option>
            </select>
          </div>
        </div>
      </div>

      {/* Working Hours */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Working Hours</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="time"
                  value={organization.settings.workingHours.start}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateOrganization('settings.workingHours.start', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input
                  type="time"
                  value={organization.settings.workingHours.end}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateOrganization('settings.workingHours.end', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Working Days</label>
            <div className="space-y-2">
              {weekDays.map(day => (
                <label key={day} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={organization.settings.workingHours.workingDays.includes(day)}
                    onChange={() => toggleWorkingDay(day)}
                    className="mr-2"
                  />
                  {day}
                </label>
              ))}
            </div>
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
