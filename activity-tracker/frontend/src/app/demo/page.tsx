'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { toast } from 'react-hot-toast';

interface UserRole {
  id: string;
  title: string;
  email: string;
  password: string;
  description: string[];
  buttonColor: string;
  hoverColor: string;
  redirectPath: string;
  profileImage: string;
}

const userRoles: UserRole[] = [
  {
    id: 'admin',
    title: 'ADMINISTRATOR',
    email: 'admin@niha.com',
    password: 'Niha123',
    description: ['Setup Organization, Projects, Users', 'Status Config', 'System Management'],
    buttonColor: 'bg-pink-600',
    hoverColor: 'hover:bg-pink-700',
    redirectPath: '/admin',
    profileImage: '/images/admin-profile.jpg'
  },
  {
    id: 'pmo',
    title: 'PROGRAM MANAGER',
    email: 'pmo@niha.com',
    password: 'Niha123',
    description: ['Visibility to Metrics', 'Reports', 'Member Activities'],
    buttonColor: 'bg-orange-500',
    hoverColor: 'hover:bg-orange-600',
    redirectPath: '/pmo',
    profileImage: '/images/program-manager-profile.jpg'
  },
  {
    id: 'pm',
    title: 'PROJECT MANAGER',
    email: 'pm@niha.com',
    password: 'Niha123',
    description: ['Project Planning', 'Task Assignment', 'Progress Tracking'],
    buttonColor: 'bg-cyan-500',
    hoverColor: 'hover:bg-cyan-600',
    redirectPath: '/pm',
    profileImage: '/images/project-manager-profile.jpg'
  },
  {
    id: 'member1',
    title: 'PROJECT MEMBER 1',
    email: 'member1@niha.com',
    password: 'Niha123',
    description: ['Task Progress', 'Status Updates', 'Project Documents'],
    buttonColor: 'bg-blue-500',
    hoverColor: 'hover:bg-blue-600',
    redirectPath: '/member',
    profileImage: '/images/project-member-1-profile.jpg'
  },
  {
    id: 'member2',
    title: 'PROJECT MEMBER 2',
    email: 'member2@niha.com',
    password: 'Niha123',
    description: ['Task Progress', 'Status Updates', 'Project Documents'],
    buttonColor: 'bg-blue-500',
    hoverColor: 'hover:bg-blue-600',
    redirectPath: '/member',
    profileImage: '/images/project-member-2-profile.jpg'
  }
];

interface RoleCardProps {
  user: UserRole;
  onLogin: (user: UserRole) => void;
  loading: boolean;
}

function RoleCard({ user, onLogin, loading }: RoleCardProps) {
  return (
    <div className="group bg-slate-800/30 border-2 border-cyan-500/30 rounded-xl p-6 min-w-[220px] max-w-[250px] 
                    transition-all duration-300 hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-400/20 
                    hover:-translate-y-2 relative z-10">
      <div className="flex flex-col items-center gap-4">
        {/* Profile Image */}
        <div className="w-20 h-20 rounded-full overflow-hidden border-3 border-cyan-400 relative
                        transition-transform duration-200 group-hover:scale-105">
          <Image
            src={user.profileImage}
            alt={`${user.title} Profile`}
            fill
            className="object-cover"
            onError={() => console.log(`Profile image not found: ${user.profileImage}`)}
          />
        </div>

        {/* Role Button */}
        <button
          onClick={() => onLogin(user)}
          disabled={loading}
          className={`${user.buttonColor} ${user.hoverColor} text-white font-semibold py-3 px-6 
                     rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg 
                     disabled:opacity-50 disabled:cursor-not-allowed min-w-[160px] text-sm 
                     uppercase tracking-wide`}
        >
          {loading ? 'Logging in...' : user.title}
        </button>

        {/* Description */}
        <div className="text-center text-slate-400 text-xs leading-relaxed 
                        transition-all duration-300 group-hover:text-white group-hover:scale-110 group-hover:font-medium">
          {user.description.map((desc, index) => (
            <p key={index} className="mb-1">{desc}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DemoPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();
  const { login } = useAuthStore();

  const handleQuickLogin = async (user: UserRole) => {
    setLoading(user.id);

    try {
      // Use the proper authentication API
      const response = await authAPI.login(user.email, user.password);
      console.log('Demo login response:', response);

      // Handle token from backend (returns 'token')
      const token = response.token;
      const userData = response.user;

      if (!token || !userData) {
        throw new Error('Invalid response from server');
      }

      // Use the auth store to handle login
      login(token, userData);
      toast.success(`Logged in as ${user.title}!`);

      // Redirect to appropriate dashboard based on user role
      const role = userData.role?.toLowerCase();
      let redirectPath = user.redirectPath;

      // Map backend roles to frontend paths
      switch (role) {
        case 'admin':
          redirectPath = '/admin';
          break;
        case 'pmo':
          redirectPath = '/pmo';
          break;
        case 'project_manager':
          redirectPath = '/pm';
          break;
        case 'member':
          redirectPath = '/member';
          break;
        default:
          redirectPath = '/dashboard';
      }

      // Small delay to show success message
      setTimeout(() => {
        router.push(redirectPath);
      }, 1000);

    } catch (error: any) {
      console.error('Demo login error:', error);
      const msg = error?.response?.data?.error || error?.response?.data?.message || error?.message;
      const friendlyMessage =
        msg === 'No account found with this email' ? `No account found for ${user.title}` :
        msg === 'Incorrect password' ? `Incorrect password for ${user.title}` :
        msg === 'Account is deactivated. Please contact your administrator.' ? `${user.title} account is deactivated` :
        `Login failed for ${user.title}. Please try again.`;

      toast.error(friendlyMessage);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative">
      {/* Floating Home Button */}
      <div className="fixed top-1/2 left-6 transform -translate-y-1/2 z-50">
        <button
          onClick={() => window.location.href = 'https://blue-mushroom-07499561e.2.azurestaticapps.net/'}
          className="demo-back-button group relative flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all duration-500 hover:scale-110 hover:-translate-y-1"
        >
          {/* Glowing Background Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>

          {/* Home Icon */}
          <div className="relative z-10 flex items-center gap-3">
            <svg
              className="w-6 h-6 transform group-hover:scale-125 transition-transform duration-300"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
            <span className="text-sm font-bold tracking-wide">Home</span>
          </div>

          {/* Ripple Effect */}
          <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 group-hover:animate-ping"></div>
        </button>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="flex items-center justify-center mb-4 flex-wrap">
            {/* Logo with fallback */}
            <div className="w-40 h-14 relative mr-5 mb-2 md:mb-0 flex items-center justify-center">
              <img
                src="/images/niha-logo.png"
                alt="NIHA Technologies Logo"
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  console.error('Logo image failed to load');
                  // Hide the logo container if image fails to load
                  const target = e.target as HTMLImageElement;
                  if (target.parentElement) {
                    target.parentElement.style.display = 'none';
                  }
                }}
                onLoad={() => console.log('Logo loaded successfully')}
              />
            </div>
            <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
              NIHA TECHNOLOGIES
            </h1>
          </div>
          <p className="text-slate-400 text-lg mb-2">Quick Demo Access</p>
          <p className="text-slate-500 text-sm">Click on any role to instantly login and access the dashboard</p>
        </header>

        {/* Organizational Chart */}
        <div className="space-y-16">
          {/* Level 1: Admin */}
          <div className="flex justify-center">
            <RoleCard 
              user={userRoles[0]} 
              onLogin={handleQuickLogin} 
              loading={loading === userRoles[0].id} 
            />
          </div>

          {/* Level 2: Managers */}
          <div className="flex justify-center gap-8 md:gap-16 flex-wrap">
            <RoleCard 
              user={userRoles[1]} 
              onLogin={handleQuickLogin} 
              loading={loading === userRoles[1].id} 
            />
            <RoleCard 
              user={userRoles[2]} 
              onLogin={handleQuickLogin} 
              loading={loading === userRoles[2].id} 
            />
          </div>

          {/* Level 3: Project Members */}
          <div className="flex justify-center gap-8 md:gap-16 flex-wrap">
            <RoleCard 
              user={userRoles[3]} 
              onLogin={handleQuickLogin} 
              loading={loading === userRoles[3].id} 
            />
            <RoleCard 
              user={userRoles[4]} 
              onLogin={handleQuickLogin} 
              loading={loading === userRoles[4].id} 
            />
          </div>
        </div>



        {/* Footer Note */}
        <div className="text-center mt-8">
          <div className="bg-slate-800/50 rounded-lg p-6 max-w-md mx-auto">
            <p className="text-slate-400 text-sm italic">
              Each role has different access levels and permissions within the organization
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
