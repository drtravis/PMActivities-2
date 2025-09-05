'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { organizationAPI, projectsAPI, tasksAPI, usersAPI } from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { TeamOverview } from '@/components/pm/TeamOverview';
import { ApprovalQueue } from '@/components/pm/ApprovalQueue';
import { ProjectReports } from '@/components/pm/ProjectReports';
import { TaskAssignment } from '@/components/pm/TaskAssignment';
import PMActivitiesRefactored from '@/components/pm/PMActivitiesRefactored';
import TeamActivities from '@/components/pm/TeamActivities';
import { PMOOverview } from '@/components/pmo/PMOOverview';
import { PMOProjectsView } from '@/components/pmo/PMOProjectsView';
import { PMOTeamManagement } from '@/components/pmo/PMOTeamManagement';
import { PMOReports } from '@/components/pmo/PMOReports';

import { PasswordChange } from '@/components/member/PasswordChange';

export default function PMODashboard() {
  const { user, logout, setUser } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize activeTab from URL parameter or default to 'overview'
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('tab') || 'overview';
    }
    return 'overview';
  });

  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allPMs, setAllPMs] = useState<any[]>([]);
  const [counts, setCounts] = useState<{ 
    projects?: number; 
    users?: number; 
    pms?: number;
    members?: number;
    team?: number; 
    approvals?: number; 
    tasks?: number;
  }>({});
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [hydrating, setHydrating] = useState(true);

  useEffect(() => {
    // Hydrate user from localStorage on first mount
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
    if (user && user.role !== 'PMO') {
      // Redirect non-PMO users to their appropriate dashboard
      switch (user.role) {
        case 'ADMIN':
          router.push('/admin');
          break;
        case 'PROJECT_MANAGER':
          router.push('/pm');
          break;
        case 'MEMBER':
          router.push('/member');
          break;
        default:
          router.push('/dashboard');
      }
    }
    if (!user) {
      router.push('/login');
    }
  }, [user, hydrating, router]);

  useEffect(() => {
    if (user && user.role === 'PMO') {
      loadPMOData();
    }
  }, [user]);

  const loadPMOData = async () => {
    try {
      // Load all projects across the organization
      const allProjects = await projectsAPI.getAll();
      setProjects(allProjects || []);

      // Load all users in the organization
      const users = await usersAPI.getAll();
      setAllUsers(users || []);

      // Filter PMs and Members
      const pms = users?.filter((u: any) => u.role === 'PROJECT_MANAGER' || u.role === 'project_manager') || [];
      const members = users?.filter((u: any) => u.role === 'MEMBER' || u.role === 'member') || [];
      setAllPMs(pms);

      // Set counts for PMO overview
      setCounts({
        projects: allProjects?.length || 0,
        users: users?.length || 0,
        pms: pms.length,
        members: members.length,
        team: users?.length || 0,
        approvals: 0, // Will be loaded separately
        tasks: 0, // Will be loaded separately
      });

      // Set first project as selected if available
      if (allProjects && allProjects.length > 0 && !selectedProject) {
        setSelectedProject(allProjects[0]);
      }
    } catch (error) {
      console.error('Failed to load PMO data:', error);
    }
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    // Update URL without page reload
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tabId);
    window.history.pushState({}, '', url.toString());
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (hydrating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user || user.role !== 'PMO') {
    return null; // Will redirect via useEffect
  }

  const tabs = [
    { id: 'overview', label: 'PMO Overview', icon: '📊', count: counts.projects },
    { id: 'projects', label: 'All Projects', icon: '📁', count: counts.projects },
    { id: 'team-assignments', label: 'Team Assignments', icon: '👥', count: counts.team },
    { id: 'team-management', label: 'Team Management', icon: '👤', count: counts.users },
    { id: 'pm-oversight', label: 'PM Oversight', icon: '🎯', count: counts.pms },
    { id: 'reports', label: 'Organization Reports', icon: '📈' },
    { id: 'approvals', label: 'Global Approvals', icon: '✅', count: counts.approvals },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <GlobalHeader projectName="PMO : Dashboard" />

      {/* Project Selector */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center space-x-4">
              <label htmlFor="project-select" className="text-sm font-medium text-gray-700">
                Organization View:
              </label>
              <select
                id="project-select"
                value={selectedProject?.id || ''}
                onChange={(e) => {
                  const project = projects.find(p => p.id === e.target.value);
                  setSelectedProject(project || null);
                }}
                className="block w-64 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="">All Projects</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">PMO: {user?.name}</span>
              <button
                onClick={() => setShowPasswordChange(true)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Change Password
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
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
                  onClick={() => handleTabChange('overview')}
                  className="w-full inline-flex items-center justify-center px-3 py-2 text-[11px] font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  📊 PMO Overview
                </button>
                <button
                  onClick={() => handleTabChange('projects')}
                  className="w-full inline-flex items-center justify-center px-3 py-2 text-[11px] font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                >
                  📁 All Projects
                </button>
                <button
                  onClick={() => handleTabChange('team-assignments')}
                  className="w-full inline-flex items-center justify-center px-3 py-2 text-[11px] font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700"
                >
                  👥 Team Assignments
                </button>
                <button
                  onClick={() => handleTabChange('team-management')}
                  className="w-full inline-flex items-center justify-center px-3 py-2 text-[11px] font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  👤 Team Management
                </button>
                <button
                  onClick={() => handleTabChange('pm-oversight')}
                  className="w-full inline-flex items-center justify-center px-3 py-2 text-[11px] font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  🎯 PM Oversight
                </button>
                <button
                  onClick={() => handleTabChange('reports')}
                  className="w-full inline-flex items-center justify-center px-3 py-2 text-[11px] font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700"
                >
                  📈 Reports
                </button>
              </div>
            </div>

            {/* Views */}
            <div className="bg-white shadow rounded-lg">
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700">Views</h3>
              </div>
              <nav className="p-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full px-3 py-2 rounded-md text-sm mb-1 flex items-center justify-between ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className="flex items-center">
                      <span className="mr-2">{tab.icon}</span>
                      {tab.label}
                    </span>
                    {tab.count !== undefined && (
                      <span className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        activeTab === tab.id ? 'bg-blue-200 text-blue-800' : 'bg-gray-100 text-gray-600'
                      }`}>
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
                {activeTab === 'overview' && (
                  <div className="p-0">
                    <PMOOverview 
                      projects={projects}
                      users={allUsers}
                      pms={allPMs}
                      counts={counts}
                    />
                  </div>
                )}
                {activeTab === 'projects' && (
                  <PMOProjectsView
                    projects={projects}
                    selectedProject={selectedProject}
                    onProjectSelect={setSelectedProject}
                  />
                )}
                {activeTab === 'team-assignments' && (
                  <div className="p-0">
                    <TeamActivities selectedProject={selectedProject} />
                  </div>
                )}
                {activeTab === 'team-management' && (
                  <PMOTeamManagement 
                    users={allUsers}
                    projects={projects}
                    onRefresh={loadPMOData}
                  />
                )}
                {activeTab === 'pm-oversight' && (
                  <div className="p-0">
                    <TeamActivities selectedProject={selectedProject} />
                  </div>
                )}
                {activeTab === 'reports' && (
                  <PMOReports 
                    projects={projects}
                    users={allUsers}
                    selectedProject={selectedProject}
                  />
                )}
                {activeTab === 'approvals' && (
                  <ApprovalQueue selectedProject={selectedProject} />
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* PMO Password Change Modal */}
      {showPasswordChange && (
        <PasswordChange
          userEmail={user?.email || ''}
          onClose={() => setShowPasswordChange(false)}
        />
      )}
    </div>
  );
}
