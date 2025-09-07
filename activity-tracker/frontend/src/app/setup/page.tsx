'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { authAPI } from '@/lib/api';

interface SetupForm {
  organizationName: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  confirmPassword: string;
}

export default function SetupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SetupForm>();

  const password = watch('adminPassword');

  const onSubmit = async (data: SetupForm) => {
    setIsLoading(true);
    try {
      const response = await authAPI.createOrganization({
        name: data.organizationName,
        adminEmail: data.adminEmail,
        adminName: data.adminName,
        adminPassword: data.adminPassword,
      });

      // Organization created successfully with auto-login
      toast.success('Organization created successfully! Welcome to PMActivities2!');

      // Redirect to dashboard since user is now logged in
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create organization');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Floating Back to Demo Button */}
      <div className="fixed top-6 left-6 z-50">
        <button
          onClick={() => router.push('/demo')}
          className="demo-back-button group relative flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-full shadow-2xl hover:shadow-orange-500/50 transition-all duration-500 hover:scale-110 hover:-translate-y-1"
        >
          {/* Glowing Background Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-400 rounded-full blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>

          {/* Arrow Icon */}
          <div className="relative z-10 flex items-center gap-3">
            <svg
              className="w-6 h-6 transform group-hover:scale-125 transition-transform duration-300"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
            <span className="text-sm font-bold tracking-wide">Back to Demo</span>
          </div>

          {/* Ripple Effect */}
          <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 group-hover:animate-ping"></div>
        </button>
      </div>

      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">
            Create Organization
          </h2>
          <p className="text-slate-400 text-sm">
            Set up your organization and admin account to get started
          </p>
        </div>
        <form className="mt-8 space-y-6 bg-slate-800/30 border border-cyan-500/30 rounded-xl p-8 backdrop-blur-sm" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="organizationName" className="block text-sm font-medium text-slate-300 mb-2">
                Organization Name
              </label>
              <input
                {...register('organizationName', { required: 'Organization name is required' })}
                type="text"
                className="appearance-none relative block w-full px-4 py-3 bg-slate-700/50 border border-slate-600 placeholder-slate-400 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-200 sm:text-sm"
                placeholder="Enter organization name"
              />
              {errors.organizationName && (
                <p className="mt-2 text-sm text-red-400">{errors.organizationName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="adminName" className="block text-sm font-medium text-slate-300 mb-2">
                Admin Name
              </label>
              <input
                {...register('adminName', { required: 'Admin name is required' })}
                type="text"
                className="appearance-none relative block w-full px-4 py-3 bg-slate-700/50 border border-slate-600 placeholder-slate-400 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-200 sm:text-sm"
                placeholder="Enter admin name"
              />
              {errors.adminName && (
                <p className="mt-2 text-sm text-red-400">{errors.adminName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="adminEmail" className="block text-sm font-medium text-slate-300 mb-2">
                Admin Email
              </label>
              <input
                {...register('adminEmail', {
                  required: 'Email is required',
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: 'Invalid email address',
                  },
                })}
                type="email"
                className="appearance-none relative block w-full px-4 py-3 bg-slate-700/50 border border-slate-600 placeholder-slate-400 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-200 sm:text-sm"
                placeholder="Enter admin email"
              />
              {errors.adminEmail && (
                <p className="mt-2 text-sm text-red-400">{errors.adminEmail.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="adminPassword" className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <input
                {...register('adminPassword', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                })}
                type="password"
                className="appearance-none relative block w-full px-4 py-3 bg-slate-700/50 border border-slate-600 placeholder-slate-400 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-200 sm:text-sm"
                placeholder="Enter password"
              />
              {errors.adminPassword && (
                <p className="mt-2 text-sm text-red-400">{errors.adminPassword.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-2">
                Confirm Password
              </label>
              <input
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) => value === password || 'Passwords do not match',
                })}
                type="password"
                className="appearance-none relative block w-full px-4 py-3 bg-slate-700/50 border border-slate-600 placeholder-slate-400 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-200 sm:text-sm"
                placeholder="Confirm password"
              />
              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-red-400">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-6 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg hover:shadow-cyan-500/25"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating Organization...
                </div>
              ) : (
                'Create Organization'
              )}
            </button>
          </div>

          <div className="text-center">
            <a
              href="/login"
              className="font-medium text-cyan-400 hover:text-cyan-300 transition-colors duration-200"
            >
              Already have an account? Sign in
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
