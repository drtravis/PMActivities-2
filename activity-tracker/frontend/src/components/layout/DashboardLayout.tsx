import React from 'react';
import { GlobalHeader } from './GlobalHeader';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
  sidebar?: React.ReactNode;
  stats?: React.ReactNode;
  className?: string;
  projectName?: string;
}

/**
 * Traditional dashboard layout for admin/management interfaces
 * Used for: Admin console, PM dashboard, settings, reports
 */
export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
  subtitle,
  headerActions,
  sidebar,
  stats,
  className = '',
  projectName,
}) => {
  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {projectName && <GlobalHeader projectName={projectName} />}
      
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              {subtitle && (
                <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
              )}
            </div>
            {headerActions && (
              <div className="flex items-center space-x-4">
                {headerActions}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Section */}
        {stats && (
          <div className="mb-8">
            {stats}
          </div>
        )}

        {/* Main Content */}
        {sidebar ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Sidebar */}
            <aside className="lg:col-span-3">
              {sidebar}
            </aside>
            
            {/* Main Content */}
            <section className="lg:col-span-9">
              <div className="bg-white rounded-lg shadow">
                {children}
              </div>
            </section>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardLayout;
