import React from 'react';

interface MondayLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
  toolbar?: React.ReactNode;
  className?: string;
}

/**
 * Monday.com-style full-screen layout for task boards and activity management
 * Used for: Personal boards, PM multi-board views, task management
 */
export const MondayLayout: React.FC<MondayLayoutProps> = ({
  children,
  title,
  subtitle,
  headerActions,
  toolbar,
  className = '',
}) => {
  return (
    <div className={`bg-gray-50 min-h-screen ${className}`}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          {headerActions && (
            <div className="flex items-center space-x-3">
              {headerActions}
            </div>
          )}
        </div>

        {/* Toolbar */}
        {toolbar && (
          <div className="border-t border-gray-100 pt-2">
            {toolbar}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {children}
      </div>
    </div>
  );
};

export default MondayLayout;
