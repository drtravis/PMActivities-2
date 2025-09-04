'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { activitiesAPI, organizationAPI, projectsAPI, tasksAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { ActivityManagement } from '@/components/pm/ActivityManagement';
import { TeamOverview } from '@/components/pm/TeamOverview';
import { ApprovalQueue } from '@/components/pm/ApprovalQueue';
import { ProjectReports } from '@/components/pm/ProjectReports';
import { TaskAssignment } from '@/components/pm/TaskAssignment';
import PMActivitiesRefactored from '@/components/pm/PMActivitiesRefactored';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function PMDashboardRefactored() {
  const { user, setUser } = useAuthStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('activities');
  const [counts, setCounts] = useState<{ activities?: number; approvals?: number; team?: number; tasks?: number }>({});
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
        
        // Load projects
        const projectsData = await projectsAPI.getAll();
        setProjects(projectsData);
        
        if (projectsData.length > 0) {
          setSelectedProject(projectsData[0]);
          await loadProjectData(projectsData[0].id);
        }
      } catch (error) {
        console.error('Error loading PM data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, hydrating]);

  const loadProjectData = async (projectId: string) => {
    try {
      // Load counts for the selected project
      const [activities, tasks] = await Promise.all([
        activitiesAPI.getAll(),
        tasksAPI.getAll()
      ]);

      setCounts({
        activities: activities?.length || 0,
        tasks: tasks?.length || 0,
        approvals: activities?.filter((a: any) => a.status === 'pending_approval')?.length || 0,
        team: projects.find(p => p.id === projectId)?.members?.length || 0
      });
    } catch (error) {
      console.error('Error loading project data:', error);
    }
  };

  if (hydrating || loading) {
    return (
      <DashboardLayout
        title="Project Manager Dashboard"
        subtitle="Loading..."
        projectName={selectedProject?.name}
      >
        <div className="p-8 text-center text-gray-500">Loading dashboard...</div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return null;
  }

  const tabs = [
    { id: 'activities', label: 'Activity Management', icon: '📋', count: counts.activities },
    { id: 'member-activities', label: 'Member Activities', icon: '👤', count: counts.team },
    { id: 'approvals', label: 'Approval Queue', icon: '✅', count: counts.approvals },
    { id: 'team', label: 'Team Overview', icon: '👥', count: counts.team },
    { id: 'reports', label: 'Reports & Analytics', icon: '📊' },
  ];

  // Header actions
  const headerActions = (
    <div className="flex items-center space-x-4">
      <select
        value={selectedProject?.id || ''}
        onChange={(e) => {
          const project = projects.find(p => p.id === e.target.value);
          setSelectedProject(project);
          if (project) loadProjectData(project.id);
        }}
        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Select Project</option>
        {projects.map(project => (
          <option key={project.id} value={project.id}>{project.name}</option>
        ))}
      </select>
      <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium">
        New Project
      </button>
    </div>
  );

  // Stats cards
  const stats = (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
              <span className="text-blue-600 text-lg">📋</span>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Total Activities</p>
            <p className="text-2xl font-semibold text-gray-900">{counts.activities || 0}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
              <span className="text-yellow-600 text-lg">⏳</span>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Pending Approvals</p>
            <p className="text-2xl font-semibold text-gray-900">{counts.approvals || 0}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
              <span className="text-green-600 text-lg">👥</span>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Team Members</p>
            <p className="text-2xl font-semibold text-gray-900">{counts.team || 0}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
              <span className="text-purple-600 text-lg">🎯</span>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Active Tasks</p>
            <p className="text-2xl font-semibold text-gray-900">{counts.tasks || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Sidebar with quick actions
  const sidebar = (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="space-y-3">
          <button
            onClick={() => setActiveTab('activities')}
            className="w-full inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            📋 Manage Activities
          </button>
          <button
            onClick={() => setActiveTab('member-activities')}
            className="w-full inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
          >
            👤 Member Activities
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className="w-full inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            🎯 Task Assignment
          </button>
          <button
            onClick={() => setActiveTab('approvals')}
            className="w-full inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            ✅ Review Approvals
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Project Info</h3>
        {selectedProject ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Name:</span> {selectedProject.name}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Members:</span> {selectedProject.members?.length || 0}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Status:</span> Active
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No project selected</p>
        )}
      </div>
    </div>
  );

  return (
    <DashboardLayout
      title="Project Manager Dashboard"
      subtitle={selectedProject ? `Managing ${selectedProject.name}` : 'Select a project to get started'}
      headerActions={headerActions}
      sidebar={sidebar}
      stats={stats}
      projectName={selectedProject?.name}
    >
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'activities' && <ActivityManagement selectedProject={selectedProject} />}
        {activeTab === 'member-activities' && (
          <div className="p-0 -m-6">
            <PMActivitiesRefactored />
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
    </DashboardLayout>
  );
}
