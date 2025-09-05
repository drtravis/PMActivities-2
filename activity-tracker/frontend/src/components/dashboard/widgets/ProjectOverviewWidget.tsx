import React, { useEffect, useState } from 'react';
import { BaseWidget } from './BaseWidget';
import { DashboardWidget } from '@/lib/dashboardStore';
import { useAuthStore } from '@/lib/store';
import { projectsAPI } from '@/lib/api';

interface ProjectOverviewWidgetProps {
  widget: DashboardWidget;
  onEdit?: () => void;
  onRemove?: () => void;
}

interface ProjectSummary {
  id: string;
  name: string;
  description?: string;
  status: string;
  progress: number;
  totalTasks: number;
  completedTasks: number;
  totalActivities: number;
  completedActivities: number;
  dueDate?: string;
  owner: {
    name: string;
  };
  members: Array<{
    id: string;
    name: string;
  }>;
}

export const ProjectOverviewWidget: React.FC<ProjectOverviewWidgetProps> = ({ widget, onEdit, onRemove }) => {
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, [user]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const projectData = await projectsAPI.getAll();
      
      // Transform project data to include summary information
      const projectSummaries: ProjectSummary[] = await Promise.all(
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
              progress,
              totalTasks: tasks.length,
              completedTasks,
              totalActivities: activities.length,
              completedActivities,
              dueDate: project.endDate,
              owner: project.owner || { name: 'Unknown' },
              members: project.members || [],
            };
          } catch (error) {
            console.error(`Error loading data for project ${project.id}:`, error);
            return {
              id: project.id,
              name: project.name,
              description: project.description,
              status: project.status || 'active',
              progress: 0,
              totalTasks: 0,
              completedTasks: 0,
              totalActivities: 0,
              completedActivities: 0,
              owner: project.owner || { name: 'Unknown' },
              members: project.members || [],
            };
          }
        })
      );

      // Sort by progress (active projects first, then by completion)
      projectSummaries.sort((a, b) => {
        if (a.status === 'active' && b.status !== 'active') return -1;
        if (b.status === 'active' && a.status !== 'active') return 1;
        return b.progress - a.progress;
      });

      // Limit to widget configuration
      const limitedProjects = projectSummaries.slice(0, widget.config?.limit || 5);
      setProjects(limitedProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
      // Fallback to mock data
      setProjects(generateMockProjects());
    } finally {
      setLoading(false);
    }
  };

  const generateMockProjects = (): ProjectSummary[] => {
    return [
      {
        id: '1',
        name: 'Website Redesign',
        description: 'Complete overhaul of company website',
        status: 'active',
        progress: 75,
        totalTasks: 24,
        completedTasks: 18,
        totalActivities: 12,
        completedActivities: 9,
        dueDate: '2024-03-15',
        owner: { name: 'John Doe' },
        members: [
          { id: '1', name: 'John Doe' },
          { id: '2', name: 'Jane Smith' },
          { id: '3', name: 'Mike Johnson' },
        ],
      },
      {
        id: '2',
        name: 'Mobile App Development',
        description: 'iOS and Android app for customer portal',
        status: 'active',
        progress: 45,
        totalTasks: 32,
        completedTasks: 14,
        totalActivities: 8,
        completedActivities: 4,
        dueDate: '2024-04-30',
        owner: { name: 'Sarah Wilson' },
        members: [
          { id: '4', name: 'Sarah Wilson' },
          { id: '5', name: 'Tom Brown' },
        ],
      },
      {
        id: '3',
        name: 'Database Migration',
        description: 'Migrate legacy database to new system',
        status: 'completed',
        progress: 100,
        totalTasks: 16,
        completedTasks: 16,
        totalActivities: 6,
        completedActivities: 6,
        owner: { name: 'Mike Johnson' },
        members: [
          { id: '3', name: 'Mike Johnson' },
          { id: '6', name: 'Lisa Davis' },
        ],
      },
    ];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'active': return 'text-blue-600 bg-blue-100';
      case 'on_hold': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatDueDate = (dueDate?: string) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return <span className="text-red-600 font-medium">Overdue</span>;
    } else if (diffDays === 0) {
      return <span className="text-orange-600 font-medium">Due today</span>;
    } else if (diffDays <= 7) {
      return <span className="text-yellow-600 font-medium">Due in {diffDays} days</span>;
    } else {
      return <span className="text-gray-600">Due {date.toLocaleDateString()}</span>;
    }
  };

  return (
    <BaseWidget
      title="Project Overview"
      icon="📁"
      onEdit={onEdit}
      onRemove={onRemove}
      loading={loading}
    >
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {projects.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No projects found</p>
          </div>
        ) : (
          projects.map((project) => (
            <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">
                    {project.name}
                  </h4>
                  {project.description && (
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                  {project.status.replace('_', ' ')}
                </span>
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{project.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(project.progress)}`}
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs text-gray-600 mb-3">
                <div>
                  <span className="font-medium">Tasks:</span> {project.completedTasks}/{project.totalTasks}
                </div>
                <div>
                  <span className="font-medium">Activities:</span> {project.completedActivities}/{project.totalActivities}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">Owner:</span>
                  <span className="font-medium">{project.owner.name}</span>
                </div>
                {project.dueDate && (
                  <div>
                    {formatDueDate(project.dueDate)}
                  </div>
                )}
              </div>

              {project.members.length > 0 && (
                <div className="mt-2 flex items-center space-x-1">
                  <span className="text-xs text-gray-500">Team:</span>
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
              )}
            </div>
          ))
        )}
      </div>
      
      {projects.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            View all projects →
          </button>
        </div>
      )}
    </BaseWidget>
  );
};
