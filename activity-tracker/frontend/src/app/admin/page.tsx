'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { organizationAPI, projectsAPI } from '@/lib/api';
import { ProjectManagement } from '@/components/admin/ProjectManagement';
import { AdminPasswordChange } from '@/components/admin/AdminPasswordChange';
import { SystemConfiguration } from '@/components/admin/SystemConfiguration';
import { AuditLogs } from '@/components/admin/AuditLogs';
import { OrganizationSettings } from '@/components/admin/OrganizationSettings';
import { StatusConfiguration } from '@/components/admin/StatusConfiguration';
import { GlobalHeader } from '@/components/layout/GlobalHeader';

export default function AdminDashboard() {
  const { user, setUser } = useAuthStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('projects');
  const [counts, setCounts] = useState<{ users?: number; projects?: number }>({});
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [hydrating, setHydrating] = useState(true);

  useEffect(() => {
    // Hydrate user from localStorage once
    if (!user && typeof window !== 'undefined') {
      const saved = localStorage.getItem('user');
      if (saved) {
        try {
          setUser(JSON.parse(saved));
        } catch {}
      }
    }
    setHydrating(false);
  }, []);

  useEffect(() => {
    if (hydrating) return;
    if (user && user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
    if (!user) {
      router.push('/login');
    }
    // Load dynamic counts
    const loadCounts = async () => {
      try {
        const [userCount, projects] = await Promise.all([
          organizationAPI.getUserCount(),
          projectsAPI.getAll(),
        ]);
        setCounts({ users: userCount.count, projects: projects.length });
      } catch {
        // silent failure ok
      }
    };
    loadCounts();
  }, [user, hydrating, router]);

  if (hydrating || !user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'projects', label: 'Project Management', icon: '📁', count: counts.projects },
    { id: 'users', label: 'User Management', icon: '👥', count: counts.users },
    { id: 'status', label: 'Status Configuration', icon: '🏷️' },
    { id: 'organization', label: 'Organization', icon: '🏢' },
    { id: 'system', label: 'System Config', icon: '⚙️' },
    { id: 'audit', label: 'Audit Logs', icon: '📋' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <GlobalHeader projectName="Admin : Dashboard" />
      
      {/* Sub-header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-2">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Admin : Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowPasswordChange(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-[11px] font-medium"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Left sidebar (Quick Actions + Views) and Right content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left sidebar */}
          <aside className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setActiveTab('projects')}
                  className="w-full inline-flex items-center justify-center px-3 py-2 text-[11px] font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  📁 Manage Projects
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className="w-full inline-flex items-center justify-center px-3 py-2 text-[11px] font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  👥 Manage Users
                </button>
                <button
                  onClick={() => setActiveTab('system')}
                  className="w-full inline-flex items-center justify-center px-3 py-2 text-[11px] font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                >
                  ⚙️ System Config
                </button>
                <button
                  onClick={() => setActiveTab('status')}
                  className="w-full inline-flex items-center justify-center px-3 py-2 text-[11px] font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  🏷️ Status Config
                </button>
                <button
                  onClick={() => setActiveTab('organization')}
                  className="w-full inline-flex items-center justify-center px-3 py-2 text-[11px] font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
                >
                  🏢 Organization
                </button>
              </div>
            </div>

            {/* Views with light badges */}
            <div className="bg-white shadow rounded-lg">
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700">Views</h3>
              </div>
              <nav className="p-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full px-3 py-2 rounded-md text-[11px] mb-1 flex items-center justify-between ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex items-center"><span className="mr-2">{tab.icon}</span>{tab.label}</span>
                    {typeof tab.count !== 'undefined' && (
                      <span className={`${
                        activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                      } inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Right content */}
          <section className="lg:col-span-10">
            <div className="bg-white rounded-lg shadow min-h-[600px] flex flex-col transition-all duration-200 ease-in-out">
              <div className="flex-1 overflow-hidden">
                {activeTab === 'projects' && <ProjectManagement onChange={async () => {
                  // refresh counts after changes
                  try {
                    const [userCount, projects] = await Promise.all([
                      organizationAPI.getUserCount(),
                      projectsAPI.getAll(),
                    ]);
                    setCounts({ users: userCount.count, projects: projects.length });
                  } catch {}
                }} />}
                {activeTab === 'users' && <ProjectManagement onChange={async () => {
                  try {
                    const [userCount, projects] = await Promise.all([
                      organizationAPI.getUserCount(),
                      projectsAPI.getAll(),
                    ]);
                    setCounts({ users: userCount.count, projects: projects.length });
                  } catch {}
                }} />}
                {activeTab === 'status' && <StatusConfiguration />}
                {activeTab === 'organization' && <OrganizationSettings />}
                {activeTab === 'system' && <SystemConfiguration />}
                {activeTab === 'audit' && <AuditLogs />}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Admin Password Change Modal */}
      <AdminPasswordChange 
        isOpen={showPasswordChange} 
        onClose={() => setShowPasswordChange(false)} 
      />
    </div>
  );
}
