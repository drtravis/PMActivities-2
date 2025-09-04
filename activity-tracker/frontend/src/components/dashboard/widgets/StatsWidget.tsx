import React, { useEffect, useState } from 'react';
import { BaseWidget } from './BaseWidget';
import { DashboardWidget } from '@/lib/dashboardStore';
import { useAuthStore } from '@/lib/store';

interface StatsWidgetProps {
  widget: DashboardWidget;
  onEdit?: () => void;
  onRemove?: () => void;
}

interface StatItem {
  label: string;
  value: number | string;
  icon: string;
  color: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
}

export const StatsWidget: React.FC<StatsWidgetProps> = ({ widget, onEdit, onRemove }) => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<StatItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [widget.config, user]);

  const loadStats = async () => {
    setLoading(true);
    try {
      // Simulate API call - replace with real data fetching
      const mockStats = generateMockStats(widget.config?.metrics || [], user?.role || 'member');
      setStats(mockStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockStats = (metrics: string[], role: string): StatItem[] => {
    const statConfigs: Record<string, StatItem> = {
      // Admin stats
      'users': { label: 'Total Users', value: 156, icon: '👥', color: 'blue', trend: { value: 12, direction: 'up' } },
      'projects': { label: 'Active Projects', value: 23, icon: '📁', color: 'green', trend: { value: 3, direction: 'up' } },
      'activities': { label: 'Total Activities', value: 1247, icon: '📋', color: 'purple', trend: { value: 45, direction: 'up' } },
      'organizations': { label: 'Organizations', value: 8, icon: '🏢', color: 'indigo', trend: { value: 1, direction: 'up' } },

      // PM stats
      'active-tasks': { label: 'Active Tasks', value: 34, icon: '🎯', color: 'blue', trend: { value: 5, direction: 'up' } },
      'team-members': { label: 'Team Members', value: 12, icon: '👥', color: 'green', trend: { value: 2, direction: 'up' } },
      'pending-approvals': { label: 'Pending Approvals', value: 7, icon: '⏳', color: 'yellow', trend: { value: 2, direction: 'down' } },
      'completed-activities': { label: 'Completed Today', value: 18, icon: '✅', color: 'green', trend: { value: 6, direction: 'up' } },

      // Member stats
      'my-tasks': { label: 'My Tasks', value: 8, icon: '📝', color: 'blue', trend: { value: 2, direction: 'up' } },
      'completed-today': { label: 'Completed Today', value: 3, icon: '✅', color: 'green', trend: { value: 1, direction: 'up' } },
      'pending-activities': { label: 'Pending Activities', value: 5, icon: '⏳', color: 'yellow', trend: { value: 1, direction: 'down' } },
      'hours-logged': { label: 'Hours Logged', value: '6.5h', icon: '⏰', color: 'purple', trend: { value: 1.5, direction: 'up' } },
    };

    return metrics.map(metric => statConfigs[metric] || {
      label: metric.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: Math.floor(Math.random() * 100),
      icon: '📊',
      color: 'gray'
    });
  };

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      green: 'bg-green-50 text-green-700 border-green-200',
      purple: 'bg-purple-50 text-purple-700 border-purple-200',
      yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      red: 'bg-red-50 text-red-700 border-red-200',
      gray: 'bg-gray-50 text-gray-700 border-gray-200',
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  return (
    <BaseWidget widget={widget} onEdit={onEdit} onRemove={onRemove}>
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 h-full">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border ${getColorClasses(stat.color)} flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg">{stat.icon}</span>
                {stat.trend && (
                  <div className={`flex items-center text-xs ${
                    stat.trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <svg 
                      className={`w-3 h-3 mr-1 ${stat.trend.direction === 'up' ? 'rotate-0' : 'rotate-180'}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                    </svg>
                    {stat.trend.value}
                  </div>
                )}
              </div>
              
              <div>
                <div className="text-xl font-bold mb-1">{stat.value}</div>
                <div className="text-xs opacity-75">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </BaseWidget>
  );
};
