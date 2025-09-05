'use client';

import { useState, useEffect } from 'react';
import { tasksAPI, usersAPI } from '@/lib/api';

interface PMOProjectsViewProps {
  projects: any[];
  selectedProject: any;
  onProjectSelect: (project: any) => void;
}

export function PMOProjectsView({ projects, selectedProject, onProjectSelect }: PMOProjectsViewProps) {
  const [projectDetails, setProjectDetails] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadProjectDetails();
  }, [projects]);

  const loadProjectDetails = async () => {
    setLoading(true);
    try {
      const detailedProjects = await Promise.all(
        projects.map(async (project) => {
          try {
            // Load tasks for each project
            const tasks = await tasksAPI.getByProject(project.id);
            const totalTasks = tasks?.length || 0;
            const completedTasks = tasks?.filter((t: any) => 
              t.status === 'Done' || t.status === 'Completed' || t.status === 'done'
            ).length || 0;
            const inProgressTasks = tasks?.filter((t: any) => 
              t.status === 'Working on it' || t.status === 'In Progress' || t.status === 'in_progress'
            ).length || 0;

            // Calculate project metrics
            const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            const health = completionRate > 80 ? 'excellent' : 
                         completionRate > 60 ? 'good' : 
                         completionRate > 40 ? 'fair' : 'poor';

            return {
              ...project,
              totalTasks,
              completedTasks,
              inProgressTasks,
              completionRate,
              health,
              memberCount: project.members?.length || 0,
              lastActivity: new Date().toISOString(), // Mock - would come from audit logs
            };
          } catch (error) {
            console.error(`Failed to load details for project ${project.id}:`, error);
            return {
              ...project,
              totalTasks: 0,
              completedTasks: 0,
              inProgressTasks: 0,
              completionRate: 0,
              health: 'unknown',
              memberCount: project.members?.length || 0,
              lastActivity: project.updatedAt || project.createdAt,
            };
          }
        })
      );

      setProjectDetails(detailedProjects);
    } catch (error) {
      console.error('Failed to load project details:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projectDetails.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && (project.status === 'active' || !project.status)) ||
                         (statusFilter === 'completed' && project.status === 'completed') ||
                         (statusFilter === 'on_hold' && project.status === 'on_hold');
    return matchesSearch && matchesStatus;
  });

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'fair': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      case 'on_hold': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-green-600 bg-green-100'; // Default to active
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All Projects</h1>
        <p className="text-gray-600">Organization-wide project overview and management</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="on_hold">On Hold</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <div
            key={project.id}
            className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer border"
            onClick={() => onProjectSelect(project)}
          >
            <div className="p-6">
              {/* Project Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{project.name}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{project.description || 'No description'}</p>
                </div>
                <div className="ml-4 flex flex-col items-end space-y-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status || 'active')}`}>
                    {project.status || 'active'}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getHealthColor(project.health)}`}>
                    {project.health}
                  </span>
                </div>
              </div>

              {/* Project Metrics */}
              <div className="space-y-3">
                {/* Progress Bar */}
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium text-gray-900">{project.completionRate}%</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${project.completionRate}%` }}
                    ></div>
                  </div>
                </div>

                {/* Task Stats */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-4">
                    <span className="text-gray-600">
                      <span className="font-medium text-gray-900">{project.totalTasks}</span> tasks
                    </span>
                    <span className="text-gray-600">
                      <span className="font-medium text-green-600">{project.completedTasks}</span> done
                    </span>
                    <span className="text-gray-600">
                      <span className="font-medium text-blue-600">{project.inProgressTasks}</span> active
                    </span>
                  </div>
                </div>

                {/* Team Info */}
                <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600">👥</span>
                    <span className="text-gray-600">
                      <span className="font-medium text-gray-900">{project.memberCount}</span> members
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    Updated {formatDate(project.lastActivity)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <span className="text-4xl">📁</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'No projects have been created yet'
            }
          </p>
        </div>
      )}

      {/* Summary Stats */}
      {filteredProjects.length > 0 && (
        <div className="mt-8 bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">{filteredProjects.length}</div>
              <div className="text-sm text-gray-600">Total Projects</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {filteredProjects.filter(p => p.health === 'excellent' || p.health === 'good').length}
              </div>
              <div className="text-sm text-gray-600">Healthy Projects</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {filteredProjects.reduce((sum, p) => sum + p.totalTasks, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Tasks</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {filteredProjects.reduce((sum, p) => sum + p.memberCount, 0)}
              </div>
              <div className="text-sm text-gray-600">Team Members</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
