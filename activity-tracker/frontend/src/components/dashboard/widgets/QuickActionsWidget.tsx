import React from 'react';
import { BaseWidget } from './BaseWidget';
import { DashboardWidget } from '@/lib/dashboardStore';
import { useRouter } from 'next/navigation';

interface QuickActionsWidgetProps {
  widget: DashboardWidget;
  onEdit?: () => void;
  onRemove?: () => void;
}

interface QuickAction {
  label: string;
  action: string;
  icon: string;
  color?: string;
  route?: string;
}

export const QuickActionsWidget: React.FC<QuickActionsWidgetProps> = ({ widget, onEdit, onRemove }) => {
  const router = useRouter();

  const handleAction = (action: QuickAction) => {
    switch (action.action) {
      case 'create-user':
        router.push('/admin/users/create');
        break;
      case 'create-project':
        router.push('/admin/projects/create');
        break;
      case 'settings':
        router.push('/admin/settings');
        break;
      case 'reports':
        router.push('/admin/reports');
        break;
      case 'assign-task':
        router.push('/pm/tasks/assign');
        break;
      case 'review-activities':
        router.push('/pm/activities/review');
        break;
      case 'team-report':
        router.push('/pm/reports');
        break;
      case 'new-project':
        router.push('/pm/projects/create');
        break;
      case 'my-tasks':
        router.push('/member/tasks');
        break;
      case 'new-activity':
        router.push('/member/activities/create');
        break;
      case 'time-log':
        router.push('/member/time-tracking');
        break;
      default:
        console.log('Action:', action.action);
    }
  };

  const getButtonColor = (color?: string) => {
    const colors = {
      blue: 'bg-blue-600 hover:bg-blue-700 text-white',
      green: 'bg-green-600 hover:bg-green-700 text-white',
      purple: 'bg-purple-600 hover:bg-purple-700 text-white',
      red: 'bg-red-600 hover:bg-red-700 text-white',
      yellow: 'bg-yellow-600 hover:bg-yellow-700 text-white',
      indigo: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      gray: 'bg-gray-600 hover:bg-gray-700 text-white',
    };
    return colors[color as keyof typeof colors] || 'bg-blue-600 hover:bg-blue-700 text-white';
  };

  const actions: QuickAction[] = widget.config?.actions || [
    { label: 'Quick Action 1', action: 'action1', icon: '⚡' },
    { label: 'Quick Action 2', action: 'action2', icon: '🚀' },
  ];

  return (
    <BaseWidget widget={widget} onEdit={onEdit} onRemove={onRemove}>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 h-full">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => handleAction(action)}
            className={`
              p-3 rounded-lg transition-all duration-200 transform hover:scale-105 
              flex flex-col items-center justify-center space-y-2 min-h-[80px]
              ${getButtonColor(action.color)}
              shadow-sm hover:shadow-md
            `}
          >
            <span className="text-2xl">{action.icon}</span>
            <span className="text-xs font-medium text-center leading-tight">
              {action.label}
            </span>
          </button>
        ))}
        
        {/* Add New Action Button (when editing) */}
        {onEdit && (
          <button
            onClick={() => {
              // TODO: Open add action modal
              console.log('Add new action');
            }}
            className="p-3 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors duration-200 flex flex-col items-center justify-center space-y-2 min-h-[80px] text-gray-500 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-xs font-medium">Add Action</span>
          </button>
        )}
      </div>
    </BaseWidget>
  );
};
