'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';

export default function ClientHome() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  // On load, redirect authenticated users to their role dashboard.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isAuthenticated || !user) {
        setShowWelcome(true);
        setIsLoading(false);
        return;
      }

      let redirectPath = '/dashboard';
      switch (user.role) {
        case 'PROJECT_MANAGER':
          redirectPath = '/pm';
          break;
        case 'ADMIN':
          redirectPath = '/admin';
          break;
        case 'PMO':
          redirectPath = '/pmo';
          break;
        case 'MEMBER':
          redirectPath = '/member';
          break;
        default:
          redirectPath = '/dashboard';
      }

      router.replace(redirectPath);
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [isAuthenticated, user, router]);

  // Simple loading spinner while determining redirect
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Show welcome page for unauthenticated users
  if (showWelcome) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="container mx-auto px-5 py-10 max-w-6xl">
          {/* Header */}
          <header className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Activity Tracker
            </h1>
            <p className="text-xl text-slate-300 font-light">
              Streamline your project management and track activities with ease
            </p>
          </header>

          {/* Main Options */}
          <div className="flex flex-wrap justify-center gap-8 mb-20">
            {/* Existing User Card */}
            <div className="bg-slate-800/50 border-2 border-cyan-500/30 rounded-2xl p-8 text-center min-w-[280px] max-w-[320px] transition-all duration-300 hover:border-cyan-400 hover:shadow-2xl hover:shadow-cyan-500/20 hover:-translate-y-2 backdrop-blur-sm">
              <h2 className="text-2xl font-semibold mb-4 text-white">Existing User?</h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Sign in to access your dashboard and manage your activities
              </p>
              <button
                onClick={() => router.push('/login')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/30 min-w-[150px] uppercase tracking-wide text-sm"
              >
                Sign In
              </button>
            </div>

            {/* New Organization Card */}
            <div className="bg-slate-800/50 border-2 border-cyan-500/30 rounded-2xl p-8 text-center min-w-[280px] max-w-[320px] transition-all duration-300 hover:border-cyan-400 hover:shadow-2xl hover:shadow-cyan-500/20 hover:-translate-y-2 backdrop-blur-sm">
              <h2 className="text-2xl font-semibold mb-4 text-white">New Organization?</h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Set up a new organization and start managing your team's activities
              </p>
              <button
                onClick={() => router.push('/setup')}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-8 rounded-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-green-500/30 min-w-[150px] uppercase tracking-wide text-sm"
              >
                Get Started
              </button>
            </div>

            {/* Demo Card */}
            <div className="bg-slate-800/50 border-2 border-cyan-500/30 rounded-2xl p-8 text-center min-w-[280px] max-w-[320px] transition-all duration-300 hover:border-cyan-400 hover:shadow-2xl hover:shadow-cyan-500/20 hover:-translate-y-2 backdrop-blur-sm">
              <h2 className="text-2xl font-semibold mb-4 text-white">Demo</h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Explore the platform with sample data and see how activity tracking works
              </p>
              <button
                onClick={() => router.push('/demo')}
                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-4 px-8 rounded-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-orange-500/30 min-w-[150px] uppercase tracking-wide text-sm"
              >
                Try Demo
              </button>
            </div>
          </div>

          {/* Key Features Section */}
          <div className="text-center">
            <h2 className="text-3xl font-semibold mb-12 text-white">Key Features</h2>
            <div className="flex flex-wrap justify-center gap-16 max-w-4xl mx-auto">
              <div className="text-center flex-1 min-w-[250px]">
                <div className="text-4xl mb-4">📄</div>
                <h3 className="text-lg font-semibold text-white mb-3">Activity Management</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Create, assign, and track activities with detailed status updates
                </p>
              </div>
              <div className="text-center flex-1 min-w-[250px]">
                <div className="text-4xl mb-4">👥</div>
                <h3 className="text-lg font-semibold text-white mb-3">Team Collaboration</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Role-based access control for admins, project managers, and team members
                </p>
              </div>
              <div className="text-center flex-1 min-w-[250px]">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-lg font-semibold text-white mb-3">Progress Tracking</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Real-time reporting and analytics to monitor project progress
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Nothing to render if redirecting
  return null;
}
