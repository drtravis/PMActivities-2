'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const response = await authAPI.login(data.email, data.password);
      console.log('Login response:', response);

      // Handle token from backend (returns 'token')
      const token = response.token;
      const user = response.user;
      console.log('Token:', token);
      console.log('User:', user);

      if (!token || !user) {
        throw new Error('Invalid response from server');
      }

      login(token, user);
      toast.success('Login successful!');

      const role = user.role;
      console.log('User role:', role);

      // Small delay to ensure state is updated before redirect
      setTimeout(() => {
        // Redirect directly to role-specific dashboard
        let redirectPath = '/dashboard';
        switch (role) {
          case 'ADMIN':
            redirectPath = '/admin';
            break;
          case 'PMO':
            redirectPath = '/pmo';
            break;
          case 'PROJECT_MANAGER':
            redirectPath = '/pm';
            break;
          case 'MEMBER':
            redirectPath = '/member';
            break;
          default:
            redirectPath = '/dashboard'; // Fallback to dashboard
        }
        console.log('Redirecting to:', redirectPath);

        // Try Next.js router first
        router.push(redirectPath);

        // Fallback to window.location after a short delay
        setTimeout(() => {
          if (window.location.pathname === '/login') {
            console.log('Router redirect failed, using window.location');
            window.location.href = redirectPath;
          }
        }, 500);
      }, 100);
    } catch (error: any) {
      console.error('Login error:', error);
      const msg = error?.response?.data?.error || error?.response?.data?.message || error?.message;
      // Normalize backend error messages for users
      const friendly =
        msg === 'Invalid credentials' ? 'Invalid email or password' :
        msg === 'User not found' ? 'No account found with this email' :
        msg === 'Incorrect password' ? 'Incorrect password' :
        msg === 'Account is deactivated. Please contact your administrator.' ? 'Your account is deactivated. Please contact your administrator.' :
        Array.isArray(msg) ? msg.join(', ') :
        typeof msg === 'string' ? msg : 'Login failed. Please check your credentials.';
      toast.error(friendly);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative">
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
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to Activity Tracker
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: 'Invalid email address',
                  },
                })}
                type="email"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                {...register('password', { required: 'Password is required' })}
                type="password"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center">
            <a
              href="/setup"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Create new organization
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
