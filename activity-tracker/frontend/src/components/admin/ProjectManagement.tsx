'use client';

import { useState } from 'react';

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'completed' | 'archived';
  startDate: string;
  endDate?: string;
  budget?: number;
  progress: number;
  pmIds: string[];
  memberIds: string[];
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'pm' | 'pmo' | 'member';
  status: 'active' | 'inactive';
  projectIds: string[];
  tempPassword?: string;
  createdAt: string;
}

import { useEffect } from 'react';
import { projectsAPI, usersAPI, authAPI } from '@/lib/api';

export function ProjectManagement({ onChange }: { onChange?: () => void }) {
  const [activeTab, setActiveTab] = useState<'projects' | 'users' | 'credentials'>('projects');
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showEditProject, setShowEditProject] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showAssignUser, setShowAssignUser] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [generatedCredentials, setGeneratedCredentials] = useState<{email: string, password: string}[]>([]);

  const [projects, setProjects] = useState<Project[]>([]);

  const [users, setUsers] = useState<User[]>([]);

  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    budget: 0
  });

  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    role: 'member' as 'admin' | 'pm' | 'pmo' | 'member',
    projectId: ''
  });

  const [assignForm, setAssignForm] = useState({
    userId: '',
    projectIds: [] as string[]
  });

  // Default password is fixed on backend, expose for display
  const [defaultPassword, setDefaultPassword] = useState<string>('');

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'pmo': return 'bg-purple-100 text-purple-800';
      case 'pm': return 'bg-blue-100 text-blue-800';
      case 'member': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const load = async () => {
    try {
      console.log('🔄 ProjectManagement: Loading projects and users...');
      const [proj, usersData, pwd] = await Promise.all([
        projectsAPI.getAll(),
        usersAPI.getAll(),
        authAPI.getDefaultPassword()
      ]);

      console.log('✅ ProjectManagement: Loaded data:', {
        projects: proj.length,
        users: usersData.length,
        defaultPassword: !!pwd.password
      });

      setProjects(proj.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description || '',
        status: 'active',
        startDate: new Date().toISOString(),
        progress: 0,
        pmIds: p.members?.filter((m: any) => m.role === 'project_manager').map((m: any) => m.id) || [],
        memberIds: p.members?.filter((m: any) => m.role === 'member').map((m: any) => m.id) || [],
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })));
      setUsers(usersData.map((u: any) => {
        const backendRole = (u.role || '').toLowerCase();
        const role = backendRole === 'admin'
          ? 'admin'
          : backendRole === 'pmo'
          ? 'pmo'
          : backendRole === 'project_manager'
          ? 'pm'
          : 'member';
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          role,
          status: u.isActive !== false ? 'active' : 'inactive',
          projectIds: u.projects?.map((p: any) => p.id) || [],
          createdAt: u.createdAt,
        };
      }));
      setDefaultPassword(pwd.password);
    } catch (error) {
      console.error('❌ ProjectManagement: Failed to load data:', error);
      // Set empty arrays so UI doesn't break
      setProjects([]);
      setUsers([]);
      setDefaultPassword('');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreateProject = async () => {
    if (!projectForm.name.trim() || !projectForm.description.trim()) {
      alert('Please fill in project name and description');
      return;
    }

    try {
      const created = await projectsAPI.create({ name: projectForm.name, description: projectForm.description });
      setProjects(prev => [
        ...prev,
        {
          id: created.id,
          name: created.name,
          description: created.description || '',
          status: 'active',
          startDate: new Date().toISOString(),
          progress: 0,
          pmIds: [],
          memberIds: [],
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
        },
      ]);
      setProjectForm({ name: '', description: '', startDate: '', endDate: '', budget: 0 });
      setShowCreateProject(false);
      onChange && onChange();
      alert('Project created successfully!');
    } catch (e: any) {
      alert('Failed to create project');
    }
  };

  const handleCreateUser = async () => {
    if (!userForm.name.trim() || !userForm.email.trim() || (userForm.role !== 'pmo' && userForm.role !== 'admin' && !userForm.projectId)) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const role = userForm.role === 'admin' ? 'admin' :
                   userForm.role === 'pm' ? 'project_manager' :
                   userForm.role === 'pmo' ? 'pmo' :
                   'member';
      const created = await authAPI.inviteUser({
        email: userForm.email,
        name: userForm.name,
        role,
        projectIds: userForm.role === 'pmo' || userForm.role === 'admin' ? undefined : [userForm.projectId],
      });

      const mappedUser: User = {
        id: created.id,
        name: created.name,
        email: created.email,
        role: userForm.role,
        status: created.isActive ? 'active' : 'inactive',
        projectIds: userForm.role === 'pmo' || userForm.role === 'admin' ? [] : [userForm.projectId],
        tempPassword: defaultPassword,
        createdAt: created.createdAt,
      };

      setUsers(prev => [...prev, mappedUser]);

      // Update project list locally
      setProjects(prev => prev.map(project => {
        if (project.id === userForm.projectId) {
          const updatedProject = { ...project };
          if (userForm.role === 'pm') {
            updatedProject.pmIds = [...updatedProject.pmIds, mappedUser.id];
          } else {
            updatedProject.memberIds = [...updatedProject.memberIds, mappedUser.id];
          }
          return updatedProject;
        }
        return project;
      }));

      // Store credentials (default password)
      setGeneratedCredentials(prev => [...prev, {
        email: mappedUser.email,
        password: defaultPassword
      }]);

      setUserForm({ name: '', email: '', role: 'member', projectId: '' });
      setShowCreateUser(false);
      onChange && onChange();
      alert(`User created! Email: ${mappedUser.email}, Password: ${defaultPassword}`);
    } catch (e: any) {
      alert('Failed to create user');
    }
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setProjectForm({
      name: project.name,
      description: project.description,
      startDate: project.startDate,
      endDate: project.endDate || '',
      budget: project.budget || 0
    });
    setShowEditProject(true);
  };

  const handleUpdateProject = async () => {
    if (!selectedProject || !projectForm.name.trim() || !projectForm.description.trim()) {
      alert('Please fill in project name and description');
      return;
    }

    try {
      // Make API call to persist project updates
      await projectsAPI.update(selectedProject.id, {
        name: projectForm.name,
        description: projectForm.description,
      });

      // Update local state after successful API call
      setProjects(prev => prev.map(project =>
        project.id === selectedProject.id
          ? {
              ...project,
              name: projectForm.name,
              description: projectForm.description,
              startDate: projectForm.startDate,
              endDate: projectForm.endDate,
              budget: projectForm.budget,
              updatedAt: new Date().toISOString()
            }
          : project
      ));

      setProjectForm({ name: '', description: '', startDate: '', endDate: '', budget: 0 });
      setSelectedProject(null);
      setShowEditProject(false);
      onChange && onChange(); // Trigger refresh
      alert('Project updated successfully!');
    } catch (error: any) {
      console.error('Failed to update project:', error);
      alert('Failed to update project. Please try again.');
    }
  };

  const handleArchiveProject = (projectId: string) => {
    if (confirm('Are you sure you want to archive this project? This action can be undone.')) {
      setProjects(prev => prev.map(project =>
        project.id === projectId
          ? {
              ...project,
              status: 'archived' as const,
              updatedAt: new Date().toISOString(),
              archivedAt: new Date().toISOString()
            }
          : project
      ));
      alert('Project archived successfully!');
    }
  };

  const handleRestoreProject = (projectId: string) => {
    setProjects(prev => prev.map(project =>
      project.id === projectId
        ? {
            ...project,
            status: 'active' as const,
            updatedAt: new Date().toISOString(),
            archivedAt: undefined
          }
        : project
    ));
    alert('Project restored successfully!');
  };

  const handleAssignUserToProjects = async () => {
    if (!assignForm.userId || assignForm.projectIds.length === 0) {
      alert('Please select a user and at least one project');
      return;
    }

    try {
      // Make API calls to persist user-project assignments
      for (const projectId of assignForm.projectIds) {
        await projectsAPI.addMember(projectId, assignForm.userId);
      }

      // Update local state after successful API calls
      setUsers(prev => prev.map(user =>
        user.id === assignForm.userId
          ? { ...user, projectIds: Array.from(new Set([...user.projectIds, ...assignForm.projectIds])) }
          : user
      ));

      // Update projects with new user assignments
      const user = users.find(u => u.id === assignForm.userId);
      if (user) {
        setProjects(prev => prev.map(project => {
          if (assignForm.projectIds.includes(project.id)) {
            const updatedProject = { ...project };
            if (user.role === 'pm' && !project.pmIds.includes(user.id)) {
              updatedProject.pmIds = [...project.pmIds, user.id];
            } else if ((user.role === 'member' || user.role === 'admin') && !project.memberIds.includes(user.id)) {
              updatedProject.memberIds = [...project.memberIds, user.id];
            }
            updatedProject.updatedAt = new Date().toISOString();
            return updatedProject;
          }
          return project;
        }));
      }

      setAssignForm({ userId: '', projectIds: [] });
      setShowAssignUser(false);
      onChange && onChange(); // Trigger refresh
      alert('User assigned to projects successfully!');
    } catch (error: any) {
      console.error('Failed to assign user to projects:', error);
      alert('Failed to assign user to projects. Please try again.');
    }
  };

  const handleRemoveUserFromProject = (userId: string, projectId: string) => {
    if (confirm('Remove user from this project?')) {
      // Remove from user's project list
      setUsers(prev => prev.map(user =>
        user.id === userId
          ? { ...user, projectIds: user.projectIds.filter(id => id !== projectId) }
          : user
      ));

      // Remove from project's user lists
      setProjects(prev => prev.map(project =>
        project.id === projectId
          ? {
              ...project,
              pmIds: project.pmIds.filter(id => id !== userId),
              memberIds: project.memberIds.filter(id => id !== userId),
              updatedAt: new Date().toISOString()
            }
          : project
      ));

      alert('User removed from project successfully!');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'archived': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };



  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Project Management</h2>
          <p className="text-gray-600">Create projects, assign team members, and manage user credentials</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCreateProject(true)}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            📁 New Project
          </button>
          <button
            onClick={() => setShowCreateUser(true)}
            className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            👤 Add User
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'projects', label: 'Projects', icon: '📁', count: projects.length },
            { id: 'users', label: 'Project Users', icon: '👥', count: users.length },
            { id: 'credentials', label: 'User Credentials', icon: '🔑', count: generatedCredentials.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                activeTab === tab.id 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Projects Tab */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {projects.map(project => {
              const pms = users.filter(u => project.pmIds.includes(u.id));
              const members = users.filter(u => project.memberIds.includes(u.id));
              
              return (
                <div key={project.id} className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">Progress</span>
                      <span className="text-sm font-medium text-gray-900">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Team */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Team</span>
                      <span className="text-xs text-gray-500">{pms.length + members.length} members</span>
                    </div>
                    <div className="space-y-1">
                      {pms.length > 0 && (
                        <div className="text-xs text-gray-600">
                          <span className="font-medium">PMs:</span> {pms.map(pm => pm.name).join(', ')}
                        </div>
                      )}
                      {members.length > 0 && (
                        <div className="text-xs text-gray-600">
                          <span className="font-medium">Members:</span> {members.map(m => m.name).join(', ')}
                        </div>
                      )}
                      {pms.length === 0 && members.length === 0 && (
                        <div className="text-xs text-gray-500 italic">No team members assigned</div>
                      )}
                    </div>
                  </div>

                  {/* Budget & Dates */}
                  <div className="text-xs text-gray-600 space-y-1 mb-4">
                    {project.budget && (
                      <div>Budget: ${project.budget.toLocaleString()}</div>
                    )}
                    <div>Start: {new Date(project.startDate).toLocaleDateString()}</div>
                    {project.endDate && (
                      <div>End: {new Date(project.endDate).toLocaleDateString()}</div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditProject(project)}
                      className="flex-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      ✏️ Edit
                    </button>
                    {project.status === 'archived' ? (
                      <button
                        onClick={() => handleRestoreProject(project.id)}
                        className="flex-1 px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                      >
                        🔄 Restore
                      </button>
                    ) : (
                      <button
                        onClick={() => handleArchiveProject(project.id)}
                        className="flex-1 px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        📦 Archive
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Filter Options */}
          <div className="mt-6 flex gap-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Filter by status:</span>
              <div className="mt-2 flex gap-2">
                {['all', 'active', 'completed', 'archived'].map(status => (
                  <button
                    key={status}
                    className={`px-3 py-1 text-xs rounded-full border ${
                      status === 'all' 
                        ? 'bg-gray-100 text-gray-700 border-gray-300'
                        : `${getStatusColor(status)} border-transparent`
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Project Users</h3>
            <button
              onClick={() => setShowAssignUser(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              🎯 Assign to Projects
            </button>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="divide-y divide-gray-200">
              {users.map(user => {
                const userProjects = projects.filter(p => 
                  p.pmIds.includes(user.id) || p.memberIds.includes(user.id)
                );
                
                return (
                  <div key={user.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center text-white font-medium">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{user.name}</h4>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                          {user.role.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.status}
                        </span>
                      </div>
                    </div>
                    
                    {/* User's Projects */}
                    <div className="mt-3">
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        Assigned Projects ({userProjects.length})
                      </div>
                      {userProjects.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {userProjects.map(project => (
                            <div key={project.id} className="flex items-center bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                              <span>{project.name}</span>
                              <button
                                onClick={() => handleRemoveUserFromProject(user.id, project.id)}
                                className="ml-2 text-red-500 hover:text-red-700"
                                title="Remove from project"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500 italic">No projects assigned</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Credentials Tab */}
      {activeTab === 'credentials' && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Generated User Credentials</h3>
            
            {generatedCredentials.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No credentials generated yet. Create users to see their login credentials here.</p>
            ) : (
              <div className="space-y-4">
                {generatedCredentials.map((cred: {email: string, password: string}, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{cred.email}</div>
                        <div className="text-sm text-gray-500">Password: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{cred.password}</span></div>
                      </div>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(`Email: ${cred.email}\nPassword: ${cred.password}`);
                          alert('Credentials copied to clipboard!');
                        }}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        📋 Copy
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New Project</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                <input
                  type="text"
                  value={projectForm.name}
                  onChange={(e) => setProjectForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter project name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={projectForm.description}
                  onChange={(e) => setProjectForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter project description"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={projectForm.startDate}
                  onChange={(e) => setProjectForm(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={projectForm.endDate}
                  onChange={(e) => setProjectForm(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                <input
                  type="number"
                  value={projectForm.budget}
                  onChange={(e) => setProjectForm(prev => ({ ...prev, budget: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter budget amount"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateProject(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditProject && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Edit Project</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                <input
                  type="text"
                  value={projectForm.name}
                  onChange={(e) => setProjectForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter project name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={projectForm.description}
                  onChange={(e) => setProjectForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter project description"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={projectForm.startDate}
                  onChange={(e) => setProjectForm(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={projectForm.endDate}
                  onChange={(e) => setProjectForm(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                <input
                  type="number"
                  value={projectForm.budget}
                  onChange={(e) => setProjectForm(prev => ({ ...prev, budget: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter budget amount"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditProject(false);
                  setSelectedProject(null);
                  setProjectForm({ name: '', description: '', startDate: '', endDate: '', budget: 0 });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateProject}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Update Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add New User</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={userForm.name}
                  onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter user name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email address"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm(prev => ({
                    ...prev,
                    role: e.target.value as 'admin' | 'pm' | 'pmo' | 'member',
                    projectId: e.target.value === 'pmo' || e.target.value === 'admin' ? '' : prev.projectId,
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="member">Member</option>
                  <option value="pm">Project Manager</option>
                  <option value="pmo">PMO</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              
              {userForm.role !== 'pmo' && userForm.role !== 'admin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Project</label>
                  <select
                    value={userForm.projectId}
                    onChange={(e) => setUserForm(prev => ({ ...prev, projectId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateUser(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign User to Projects Modal */}
      {showAssignUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Assign User to Projects</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select User</label>
                <select
                  value={assignForm.userId}
                  onChange={(e) => setAssignForm(prev => ({ ...prev, userId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a user</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.role})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Projects</label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
                  {projects.filter(p => p.status !== 'archived').map((project) => (
                    <label key={project.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={assignForm.projectIds.includes(project.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAssignForm(prev => ({
                              ...prev,
                              projectIds: [...prev.projectIds, project.id]
                            }));
                          } else {
                            setAssignForm(prev => ({
                              ...prev,
                              projectIds: prev.projectIds.filter(id => id !== project.id)
                            }));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">{project.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAssignUser(false);
                  setAssignForm({ userId: '', projectIds: [] });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignUserToProjects}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Assign to Projects
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
