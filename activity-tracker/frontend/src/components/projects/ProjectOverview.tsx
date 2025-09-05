import React, { useState, useEffect } from 'react';
import { Calendar, Users, BarChart3, Settings, Plus, Filter, Search, MoreHorizontal } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { projectsAPI } from '@/lib/api';
import { ProjectCreateModal } from './ProjectCreateModal';

interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  startDate?: string;
  endDate?: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  members: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
  stats: {
    totalTasks: number;
    completedTasks: number;
    totalActivities: number;
    completedActivities: number;
    progress: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface ProjectOverviewProps {
  onProjectSelect?: (project: Project) => void;
  onCreateProject?: () => void;
}

export const ProjectOverview: React.FC<ProjectOverviewProps> = ({
  onProjectSelect,
  onCreateProject,
}) => {
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const projectData = await projectsAPI.getAll();
      
      // Transform and enrich project data
      const enrichedProjects: Project[] = await Promise.all(
        projectData.map(async (project: any) => {
          try {
            // Get project statistics
            const [tasks, activities] = await Promise.all([
              fetch(`/api/projects/${project.id}/tasks`).then(res => res.json()).catch(() => []),
              fetch(`/api/projects/${project.id}/activities`).then(res => res.json()).catch(() => [])
            ]);

            const completedTasks = tasks.filter((task: any) => 
              task.status === 'completed' || task.status === 'done'
            ).length;

            const completedActivities = activities.filter((activity: any) => 
              activity.status === 'completed' || activity.approvalState === 'approved'
            ).length;

            const totalItems = tasks.length + activities.length;
            const completedItems = completedTasks + completedActivities;
            const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

            return {
              id: project.id,
              name: project.name,
              description: project.description,
              status: project.status || 'active',
              startDate: project.startDate,
              endDate: project.endDate,
              owner: project.owner || { id: user?.id || '', name: user?.name || '', email: user?.email || '' },
              members: project.members || [],
              stats: {
                totalTasks: tasks.length,
                completedTasks,
                totalActivities: activities.length,
                completedActivities,
                progress,
              },
              createdAt: project.createdAt,
              updatedAt: project.updatedAt,
            };
          } catch (error) {
            console.error(`Error loading stats for project ${project.id}:`, error);
            return {
              id: project.id,
              name: project.name,
              description: project.description,
              status: project.status || 'active',
              startDate: project.startDate,
              endDate: project.endDate,
              owner: project.owner || { id: user?.id || '', name: user?.name || '', email: user?.email || '' },
              members: project.members || [],
              stats: {
                totalTasks: 0,
                completedTasks: 0,
                totalActivities: 0,
                completedActivities: 0,
                progress: 0,
              },
              createdAt: project.createdAt,
              updatedAt: project.updatedAt,
            };
          }
        })
      );

      setProjects(enrichedProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
      // Mock data for development
      setProjects(generateMockProjects());
    } finally {
      setLoading(false);
    }
  };

  const generateMockProjects = (): Project[] => {
    return [
      {
        id: '1',
        name: 'Website Redesign',
        description: 'Complete overhaul of company website with modern design and improved UX',
        status: 'active',
        startDate: '2024-01-01',
        endDate: '2024-03-15',
        owner: { id: '1', name: 'John Doe', email: 'john@example.com' },
        members: [
          { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Project Manager' },
          { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'Designer' },
          { id: '3', name: 'Mike Johnson', email: 'mike@example.com', role: 'Developer' },
        ],
        stats: { totalTasks: 24, completedTasks: 18, totalActivities: 12, completedActivities: 9, progress: 75 },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-10T00:00:00Z',
      },
      {
        id: '2',
        name: 'Mobile App Development',
        description: 'iOS and Android app for customer portal',
        status: 'active',
        startDate: '2024-01-15',
        endDate: '2024-04-30',
        owner: { id: '2', name: 'Sarah Wilson', email: 'sarah@example.com' },
        members: [
          { id: '2', name: 'Sarah Wilson', email: 'sarah@example.com', role: 'Project Manager' },
          { id: '4', name: 'Tom Brown', email: 'tom@example.com', role: 'Mobile Developer' },
        ],
        stats: { totalTasks: 32, completedTasks: 14, totalActivities: 8, completedActivities: 4, progress: 45 },
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-01-20T00:00:00Z',
      },
      {
        id: '3',
        name: 'Database Migration',
        description: 'Migrate legacy database to new cloud infrastructure',
        status: 'completed',
        startDate: '2023-11-01',
        endDate: '2023-12-31',
        owner: { id: '3', name: 'Mike Johnson', email: 'mike@example.com' },
        members: [
          { id: '3', name: 'Mike Johnson', email: 'mike@example.com', role: 'Tech Lead' },
          { id: '5', name: 'Lisa Davis', email: 'lisa@example.com', role: 'Database Admin' },
        ],
        stats: { totalTasks: 16, completedTasks: 16, totalActivities: 6, completedActivities: 6, progress: 100 },
        createdAt: '2023-11-01T00:00:00Z',
        updatedAt: '2023-12-31T00:00:00Z',
      },
    ];
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-gray-100 text-gray-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateDaysRemaining = (endDate?: string) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleCreateProject = () => {
    if (onCreateProject) {
      onCreateProject();
    } else {
      setShowCreateModal(true);
    }
  };

  const handleProjectCreated = (newProject: Project) => {
    setProjects(prev => [newProject, ...prev]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600">Manage and track your project portfolio</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {viewMode === 'grid' ? 'List View' : 'Grid View'}
          </button>
          <button
            onClick={handleCreateProject}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="planning">Planning</option>
          <option value="active">Active</option>
          <option value="on_hold">On Hold</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Projects Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onSelect={() => onProjectSelect?.(project)}
              getStatusColor={getStatusColor}
              getProgressColor={getProgressColor}
              formatDate={formatDate}
              calculateDaysRemaining={calculateDaysRemaining}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Team
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProjects.map((project) => (
                  <ProjectRow
                    key={project.id}
                    project={project}
                    onSelect={() => onProjectSelect?.(project)}
                    getStatusColor={getStatusColor}
                    getProgressColor={getProgressColor}
                    formatDate={formatDate}
                    calculateDaysRemaining={calculateDaysRemaining}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <BarChart3 className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Get started by creating your first project'
            }
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <button
              onClick={handleCreateProject}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span>Create Project</span>
            </button>
          )}
        </div>
      )}

      {/* Project Create Modal */}
      <ProjectCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
};

// Project Card Component for Grid View
const ProjectCard: React.FC<{
  project: Project;
  onSelect: () => void;
  getStatusColor: (status: string) => string;
  getProgressColor: (progress: number) => string;
  formatDate: (date?: string) => string;
  calculateDaysRemaining: (date?: string) => number | null;
}> = ({ project, onSelect, getStatusColor, getProgressColor, formatDate, calculateDaysRemaining }) => {
  const daysRemaining = calculateDaysRemaining(project.endDate);

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.name}</h3>
            {project.description && (
              <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
            )}
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
              {project.status.replace('_', ' ')}
            </span>
            <button className="p-1 text-gray-400 hover:text-gray-600">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {/* Progress */}
          <div>
            <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
              <span>Progress</span>
              <span>{project.stats.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(project.stats.progress)}`}
                style={{ width: `${project.stats.progress}%` }}
              ></div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Tasks:</span>
              <span className="ml-1 font-medium">{project.stats.completedTasks}/{project.stats.totalTasks}</span>
            </div>
            <div>
              <span className="text-gray-500">Activities:</span>
              <span className="ml-1 font-medium">{project.stats.completedActivities}/{project.stats.totalActivities}</span>
            </div>
          </div>

          {/* Team */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">{project.members.length} members</span>
            </div>
            <div className="flex -space-x-1">
              {project.members.slice(0, 3).map((member, index) => (
                <div
                  key={member.id}
                  className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white"
                  title={member.name}
                >
                  {member.name.charAt(0).toUpperCase()}
                </div>
              ))}
              {project.members.length > 3 && (
                <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white">
                  +{project.members.length - 3}
                </div>
              )}
            </div>
          </div>

          {/* Due Date */}
          {project.endDate && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-1 text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>Due: {formatDate(project.endDate)}</span>
              </div>
              {daysRemaining !== null && (
                <span className={`font-medium ${
                  daysRemaining < 0 ? 'text-red-600' : 
                  daysRemaining <= 7 ? 'text-orange-600' : 'text-green-600'
                }`}>
                  {daysRemaining < 0 ? `${Math.abs(daysRemaining)}d overdue` : 
                   daysRemaining === 0 ? 'Due today' : `${daysRemaining}d left`}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onSelect}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Project
          </button>
        </div>
      </div>
    </div>
  );
};

// Project Row Component for List View
const ProjectRow: React.FC<{
  project: Project;
  onSelect: () => void;
  getStatusColor: (status: string) => string;
  getProgressColor: (progress: number) => string;
  formatDate: (date?: string) => string;
  calculateDaysRemaining: (date?: string) => number | null;
}> = ({ project, onSelect, getStatusColor, getProgressColor, formatDate, calculateDaysRemaining }) => {
  const daysRemaining = calculateDaysRemaining(project.endDate);

  return (
    <tr className="hover:bg-gray-50 cursor-pointer" onClick={onSelect}>
      <td className="px-6 py-4">
        <div>
          <div className="text-sm font-medium text-gray-900">{project.name}</div>
          {project.description && (
            <div className="text-sm text-gray-500 truncate max-w-xs">{project.description}</div>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
          {project.status.replace('_', ' ')}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center space-x-2">
          <div className="w-16 bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${getProgressColor(project.stats.progress)}`}
              style={{ width: `${project.stats.progress}%` }}
            ></div>
          </div>
          <span className="text-sm text-gray-600">{project.stats.progress}%</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex -space-x-1">
          {project.members.slice(0, 3).map((member, index) => (
            <div
              key={member.id}
              className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white"
              title={member.name}
            >
              {member.name.charAt(0).toUpperCase()}
            </div>
          ))}
          {project.members.length > 3 && (
            <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white">
              +{project.members.length - 3}
            </div>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900">{formatDate(project.endDate)}</div>
        {daysRemaining !== null && (
          <div className={`text-xs ${
            daysRemaining < 0 ? 'text-red-600' : 
            daysRemaining <= 7 ? 'text-orange-600' : 'text-green-600'
          }`}>
            {daysRemaining < 0 ? `${Math.abs(daysRemaining)}d overdue` : 
             daysRemaining === 0 ? 'Due today' : `${daysRemaining}d left`}
          </div>
        )}
      </td>
      <td className="px-6 py-4 text-right">
        <button className="p-1 text-gray-400 hover:text-gray-600">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
};
