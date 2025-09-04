'use client';

import { useState, useEffect } from 'react';
import { useAuthStore, useActivityStore } from '@/lib/store';
import { tasksAPI, projectsAPI, activitiesAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { TaskForm } from '@/components/shared/TaskForm';
import MyActivitiesRefactored from '@/components/member/MyActivitiesRefactored';
import { Collaboration } from '@/components/member/Collaboration';
import { PersonalDashboard } from '@/components/member/PersonalDashboard';
import { PasswordChange } from '@/components/member/PasswordChange';
import { GlobalHeader } from '@/components/layout/GlobalHeader';

export default function MemberDashboard() {
  const { user, setUser } = useAuthStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [counts, setCounts] = useState<{ tasks?: number; activities?: number; assigned?: number; completed?: number }>({});
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [hydrating, setHydrating] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
    if (user && user.role !== 'MEMBER') {
      router.push('/dashboard');
    }
    if (!user) {
      router.push('/login');
    }
  }, [user, hydrating, router]);

  useEffect(() => {
    // Load projects and data for member
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
        console.error('Failed to load member data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!hydrating && user?.role === 'MEMBER') {
      loadData();
    }
  }, [hydrating, user]);

  const loadProjectData = async (projectId: string) => {
    try {
      const [assigned, activities] = await Promise.all([
        tasksAPI.getByProject(projectId),
        activitiesAPI.getByProject(projectId)
      ]);

      const assignedTasks = assigned.filter((t: any) => t.assigneeId === user?.id && t.status !== 'completed');
      const myActivities = activities.filter((a: any) => a.assignees?.some((assignee: any) => assignee.id === user?.id));
      const completedActivities = myActivities.filter((a: any) => a.status === 'completed');

      setCounts({
        assigned: assignedTasks.length,
        activities: myActivities.length,
        tasks: myActivities.filter((a: any) => a.status === 'in_progress').length,
        completed: completedActivities.length
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

  if (hydrating || !user || user.role !== 'MEMBER' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'My Dashboard', icon: '🏠' },
    { id: 'tasks', label: 'My Activities', icon: '✅', count: counts.activities },
    { id: 'create', label: 'Create Activity', icon: '➕' },
    { id: 'collaborate', label: 'Collaboration', icon: '💬' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <GlobalHeader projectName="Member : Dashboard" />

      {/* Sub-header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-2">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Member : Dashboard</h1>
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
                    const project = projects.find(p => p.id === e.target.value);
                    if (project) handleProjectChange(project);
                  }}
                  className="border border-gray-300 rounded-md px-3 py-2 text-[11px]"
                >
                  <option value="">Select Project</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              )}
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
                  data-testid="qa-member-create-activity"
                  onClick={() => setActiveTab('create')}
                  className="w-full inline-flex items-center justify-center px-3 py-2 text-[11px] font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  ➕ Create Activity
                </button>
                <button
                  data-testid="qa-member-my-activities"
                  onClick={() => setActiveTab('tasks')}
                  className="w-full inline-flex items-center justify-center px-3 py-2 text-[11px] font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  ✅ My Activities
                </button>
                <button
                  onClick={() => setActiveTab('collaborate')}
                  className="w-full inline-flex items-center justify-center px-3 py-2 text-[11px] font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                >
                  💬 Collaboration Hub
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
              {activeTab === 'dashboard' && <PersonalDashboard selectedProject={selectedProject} />}
              {activeTab === 'tasks' && <MyActivitiesRefactored onNewItem={() => setActiveTab('create')} />}
              {activeTab === 'create' && (
                <TaskForm
                  selectedProject={selectedProject}
                  onTaskCreated={() => {
                    if (selectedProject) loadProjectData(selectedProject.id);
                  }}
                  mode="member"
                />
              )}
              {activeTab === 'collaborate' && <Collaboration selectedProject={selectedProject} />}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordChange && (
        <PasswordChange
          userEmail={user.email}
          onClose={() => setShowPasswordChange(false)}
        />
      )}
    </div>
  );
}
