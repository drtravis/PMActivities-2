'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useAuthStore, useActivityStore } from '@/lib/store';
import { activitiesAPI } from '@/lib/api';
import { Activity } from '@/types';
import ActivityCard from '@/components/ActivityCard';
import ActivityFilters from '@/components/ActivityFilters';
import CreateActivityModal from '@/components/CreateActivityModal';
import { PlusIcon } from '@heroicons/react/24/outline';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout, login, setUser } = useAuthStore();
  const { activities, setActivities, filters, setFilters } = useActivityStore();
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'draft' | 'submitted' | 'approved' | 'rejected'>('all');
  const [hydrating, setHydrating] = useState(true);

  // Hydrate auth store from localStorage on first mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const token = localStorage.getItem('pmactivities2_token');
      const savedUser = localStorage.getItem('user');
      if (token && savedUser) {
        const parsed = JSON.parse(savedUser);
        // Use login to set isAuthenticated true
        login(token, parsed);
      } else if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch {}
    setHydrating(false);
  }, []);

  useEffect(() => {
    if (hydrating) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Redirect users to their role-specific dashboards
    if (user?.role === 'ADMIN') {
      router.push('/admin');
      return;
    }
    if (user?.role === 'PMO') {
      router.push('/pmo');
      return;
    }
    if (user?.role === 'PROJECT_MANAGER') {
      router.push('/pm');
      return;
    }
    if (user?.role === 'MEMBER') {
      router.push('/member');
      return;
    }

    loadActivities();
  }, [isAuthenticated, user, filters, hydrating]);

  const loadActivities = async () => {
    try {
      const data = await activitiesAPI.getAll(filters);
      setActivities(data);
    } catch (error: any) {
      toast.error('Failed to load activities');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const getStatusCounts = () => {
    return {
      draft: activities.filter(a => a.approvalState === 'draft').length,
      submitted: activities.filter(a => a.approvalState === 'submitted').length,
      approved: activities.filter(a => a.approvalState === 'approved').length,
      rejected: activities.filter(a => a.approvalState === 'rejected').length,
    };
  };

  const onSelectTab = (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (tab === 'all') {
      setFilters({ ...filters, approvalState: undefined });
    } else {
      setFilters({ ...filters, approvalState: tab });
    }
  };

  const statusCounts = getStatusCounts();

  if (hydrating || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Activity Tracker</h1>
              <p className="text-sm text-gray-600">Welcome back, {user?.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Role: {user?.role}</span>
              <div className="flex space-x-3">
                {(user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER') && (
                  <button
                    onClick={() => router.push('/reports')}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Reports
                  </button>
                )}
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Create Activity
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-yellow-600 font-semibold">{statusCounts.draft}</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Draft</dt>
                    <dd className="text-lg font-medium text-gray-900">Activities</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">{statusCounts.submitted}</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Submitted</dt>
                    <dd className="text-lg font-medium text-gray-900">Activities</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-semibold">{statusCounts.approved}</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Approved</dt>
                    <dd className="text-lg font-medium text-gray-900">Activities</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 font-semibold">{statusCounts.rejected}</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Rejected</dt>
                    <dd className="text-lg font-medium text-gray-900">Activities</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions + Tabs (Left) and Content (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left sidebar */}
          <aside className="lg:col-span-3 space-y-6">
            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="w-full inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create Activity
                </button>
                {(user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER') && (
                  <button
                    onClick={() => router.push('/reports')}
                    className="w-full inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    Open Reports
                  </button>
                )}
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white shadow rounded-lg">
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700">Views</h3>
              </div>
              <nav className="p-2">
                {[
                  { key: 'all', label: 'All', count: activities.length },
                  { key: 'draft', label: 'Draft', count: statusCounts.draft },
                  { key: 'submitted', label: 'Submitted', count: statusCounts.submitted },
                  { key: 'approved', label: 'Approved', count: statusCounts.approved },
                  { key: 'rejected', label: 'Rejected', count: statusCounts.rejected },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => onSelectTab(t.key as typeof activeTab)}
                    className={`w-full px-3 py-2 rounded-md text-sm mb-1 flex items-center justify-between ${
                      activeTab === (t.key as typeof activeTab)
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span>{t.label}</span>
                    <span
                      className={`${
                        activeTab === (t.key as typeof activeTab)
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-gray-100 text-gray-700'
                      } inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium`}
                    >
                      {t.count}
                    </span>
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Right content */}
          <section className="lg:col-span-9 space-y-4">
            {/* Filters */}
            <div className="bg-white shadow rounded-lg p-4">
              <div className="flex items-center justify-between">
                <ActivityFilters />
              </div>
            </div>

            {/* Activities List */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {activities.length === 0 ? (
                  <li className="px-6 py-12 text-center">
                    <p className="text-gray-500">No activities found. Create your first activity!</p>
                  </li>
                ) : (
                  activities.map((activity) => (
                    <ActivityCard key={activity.id} activity={activity} />
                  ))
                )}
              </ul>
            </div>
          </section>
        </div>
      </main>

      {/* Create Activity Modal */}
      {showCreateModal && (
        <CreateActivityModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadActivities();
          }}
        />
      )}
    </div>
  );
}
