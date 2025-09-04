'use client';

import { useAuthStore } from '@/lib/store';
import { useProjectStore } from '@/lib/projectStore';
import { useOrganizationStore } from '@/lib/organizationStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface GlobalHeaderProps {
  projectName?: string;
}

export function GlobalHeader({ projectName }: GlobalHeaderProps) {
  const { user, logout } = useAuthStore();
  const { currentProject } = useProjectStore();
  const { organization, setOrganization } = useOrganizationStore();
  const router = useRouter();

  useEffect(() => {
    // Fetch organization data from API
    const fetchOrganization = async () => {
      if (user) {
        try {
          const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
          const response = await fetch('https://activity-tracker-backend.mangoground-80e673e8.canadacentral.azurecontainerapps.io/organization', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const orgData = await response.json();
            setOrganization({
              id: orgData.id,
              name: orgData.name || 'My Organization',
              logoUrl: orgData.logo,
              settings: {
                logoPositionX: orgData.settings?.logoPositionX,
                logoPositionY: orgData.settings?.logoPositionY,
                logoScale: orgData.settings?.logoScale,
                logoWidth: orgData.settings?.logoWidth,
                logoHeight: orgData.settings?.logoHeight,
              },
            });
          }
        } catch (error) {
          console.error('Failed to fetch organization:', error);
          // Fallback to default organization
          setOrganization({
            id: '1',
            name: 'My Organization',
            logoUrl: undefined,
          });
        }
      }
    };

    fetchOrganization();
  }, [setOrganization, user]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Display current project name or fallback to provided projectName
  const displayProjectName = currentProject?.name || projectName;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="flex justify-between items-center py-4"
          style={{ minHeight: (organization as any)?.settings?.logoHeight ?? 120 }}
        >
          {/* Left side - Organization branding */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              {organization?.logoUrl ? (
                <div
                  className="rounded-md border border-gray-200 bg-white overflow-hidden"
                  style={{
                    width: (organization as any)?.settings?.logoWidth ?? 400,
                    height: (organization as any)?.settings?.logoHeight ?? 100,
                  }}
                >
                  <img
                    src={`https://activity-tracker-backend.mangoground-80e673e8.canadacentral.azurecontainerapps.io${organization.logoUrl}`}
                    alt={organization.name}
                    className="w-full h-full object-cover"
                    style={{
                      objectPosition: `${(organization as any)?.settings?.logoPositionX ?? 50}% ${
                        (organization as any)?.settings?.logoPositionY ?? 50
                      }%`,
                      transform: `scale(${((organization as any)?.settings?.logoScale ?? 100) / 100})`,
                      transformOrigin: 'center',
                    }}
                  />
                </div>
              ) : (
                <div
                  className="bg-blue-600 rounded-md flex items-center justify-center text-white font-semibold"
                  style={{
                    width: (organization as any)?.settings?.logoWidth ?? 400,
                    height: (organization as any)?.settings?.logoHeight ?? 100,
                  }}
                >
                  <span className="text-3xl">
                    {organization?.name?.charAt(0) || 'O'}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {organization?.name || 'Organization'}
                </h1>
                {displayProjectName && (
                  <h2 className="text-lg font-medium text-gray-600 -mt-1">
                    {displayProjectName}
                  </h2>
                )}
              </div>
            </div>
          </div>

          {/* Center - Navigation based on role */}
          <nav className="hidden md:flex space-x-8">
            {user?.role === 'ADMIN' && (
              <>
                <a
                  href="/admin"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium"
                >
                  Admin Dashboard
                </a>
                <a
                  href="/reports"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium"
                >
                  Reports
                </a>
              </>
            )}
            {user?.role === 'PROJECT_MANAGER' && (
              <>
                <a
                  href="/pm"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium"
                >
                  PM Dashboard
                </a>
                <a
                  href="/reports"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium"
                >
                  Reports
                </a>
              </>
            )}
            {user?.role === 'MEMBER' && (
              <a
                href="/member"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium"
              >
                My Activities
              </a>
            )}
          </nav>

          {/* Right side - User menu */}
          <div className="flex items-center space-x-4">
            <span className="text-base text-gray-700 font-medium">
              {user?.name}
            </span>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
              {user?.role?.replace('_', ' ').toUpperCase()}
            </span>
            <div className="relative">
              <button
                onClick={handleLogout}
                className="text-base text-red-600 hover:text-red-800 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
