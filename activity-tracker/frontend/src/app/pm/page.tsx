'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { activitiesAPI, organizationAPI, projectsAPI, tasksAPI } from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import { ActivityManagement } from '@/components/pm/ActivityManagement';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { TeamOverview } from '@/components/pm/TeamOverview';
import { ApprovalQueue } from '@/components/pm/ApprovalQueue';
import { ProjectReports } from '@/components/pm/ProjectReports';
import { TaskAssignment } from '@/components/pm/TaskAssignment';
import PMActivitiesRefactored from '@/components/pm/PMActivitiesRefactored';
import TeamActivities from '@/components/pm/TeamActivities';

import { PasswordChange } from '@/components/member/PasswordChange';

export default function PMDashboard() {
  const { user, setUser } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize activeTab from URL parameter or default to 'activities'
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('tab') || 'activities';
    }
    return 'activities';
  });

  const [counts, setCounts] = useState<{ activities?: number; approvals?: number; team?: number; tasks?: number }>({});
  const [hydrating, setHydrating] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [showPasswordChange, setShowPasswordChange] = useState(false);

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

  // Listen for URL parameter changes to update active tab
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [searchParams, activeTab]);

  useEffect(() => {
    if (hydrating) return;
    if (user && user.role !== 'PROJECT_MANAGER') {
      router.push('/dashboard');
    }
    if (!user) {
      router.push('/login');
    }
    // Load projects and data for PM
    const loadData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const userProjects = await projectsAPI.getAll();
        setProjects(userProjects);

        // Set default project (first one or from localStorage)
        const savedProjectId = localStorage.getItem(`defaultProject_${user.id}`);
        let defaultProject = null;

        if (savedProjectId) {
          defaultProject = userProjects.find((p: any) => p.id === savedProjectId);
        }

        if (!defaultProject && userProjects.length > 0) {
          defaultProject = userProjects[0];
        }

        setSelectedProject(defaultProject);

        if (defaultProject) {
          await loadProjectData(defaultProject.id);
        }
      } catch (error) {
        console.error('Failed to load PM data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, hydrating, router]);

  const loadProjectData = async (projectId: string) => {
    try {
      const [activities, tasks, projectMembers] = await Promise.all([
        activitiesAPI.getAll({ projectId }),
        tasksAPI.getAll({ projectId }),
        projectsAPI.getMembers(projectId),
      ]);

      const submitted = activities.filter((a: any) => a.approvalState === 'submitted');

      setCounts({
        activities: activities.length,
        approvals: submitted.length,
        team: projectMembers?.length || 0,
        tasks: tasks.length,
      });
    } catch (error) {
      console.error('Failed to load project data:', error);
    }
  };

  const handleProjectChange = async (project: any) => {
    setSelectedProject(project);
    localStorage.setItem(`defaultProject_${user?.id}`, project.id);
    await loadProjectData(project.id);
  };

  // Helper function to change tabs and update URL
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    // Update URL without page reload
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tabId);
    window.history.pushState({}, '', url.toString());
  };

  if (hydrating || !user || user.role !== 'PROJECT_MANAGER' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'activities', label: 'Activity Management', icon: '📋', count: counts.activities },
    { id: 'team-activities', label: 'Team Activities', icon: '👥', count: counts.team },
    { id: 'tasks', label: 'Task Assignment', icon: '🎯' },
    { id: 'approvals', label: 'Approval Queue', icon: '✅', count: counts.approvals },
    { id: 'team', label: 'Team Overview', icon: '👥', count: counts.team },
    { id: 'reports', label: 'Reports & Analytics', icon: '📊' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <GlobalHeader projectName="Project Manager : Dashboard" />

      {/* Sub-header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-2">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Project Manager : Dashboard</h1>
              {selectedProject && (
                <p className="text-xs text-blue-600">Current Project: {selectedProject.name}</p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {/* Project Selector */}
              {projects.length > 0 && (
                <select
                  value={selectedProject?.id || ''}
                  onChange={(e) => {
                    const project = projects.find((p: any) => p.id === e.target.value);
                    if (project) handleProjectChange(project);
                  }}
                  className="border border-gray-300 rounded-md px-2 py-1 text-[11px]"
                >
                  <option value="">Select Project</option>
                  {projects.map((project: any) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              )}
              <div className="flex items-center space-x-2 bg-yellow-50 px-2 py-1 rounded-lg">
                <span className="text-yellow-600">⚠️</span>
                <span className="text-[11px] text-yellow-700">{counts.approvals || 0} pending approvals</span>
              </div>
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
                  onClick={() => handleTabChange('activities')}
                  className="w-full inline-flex items-center justify-center px-3 py-2 text-[11px] font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  📋 Manage Activities
                </button>
                <button
                  onClick={() => handleTabChange('team-activities')}
                  className="w-full inline-flex items-center justify-center px-3 py-2 text-[11px] font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                >
                  👥 Team Activities
                </button>
                <button
                  data-testid="qa-task-assignment"
                  onClick={() => handleTabChange('tasks')}
                  className="w-full inline-flex items-center justify-center px-3 py-2 text-[11px] font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  🎯 Task Assignment
                </button>
                <button
                  onClick={() => handleTabChange('approvals')}
                  className="w-full inline-flex items-center justify-center px-3 py-2 text-[11px] font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700"
                >
                  ✅ Review Approvals
                </button>
                <button
                  onClick={() => handleTabChange('reports')}
                  className="w-full inline-flex items-center justify-center px-3 py-2 text-[11px] font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  📊 Open Reports
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
                    onClick={() => handleTabChange(tab.id)}
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
              {activeTab === 'activities' && (
                <ActivityManagement selectedProject={selectedProject} />
              )}
              {activeTab === 'team-activities' && (
                <div className="p-0">
                  <TeamActivities selectedProject={selectedProject} />
                </div>
              )}
              {activeTab === 'tasks' && (
                <TaskAssignment
                  selectedProject={selectedProject}
                  onTaskCreated={() => {
                    if (selectedProject) loadProjectData(selectedProject.id);
                  }}
                />
              )}
              {activeTab === 'approvals' && <ApprovalQueue selectedProject={selectedProject} />}
              {activeTab === 'team' && <TeamOverview selectedProject={selectedProject} />}
              {activeTab === 'reports' && <ProjectReports selectedProject={selectedProject} />}
              </div>
            </div>
          </section>
        </div>

        {/* Password Change Modal */}
        {showPasswordChange && (
          <PasswordChange
            userEmail={user?.email}
            onClose={() => setShowPasswordChange(false)}
          />
        )}

      </div>
    </div>
  );
}
