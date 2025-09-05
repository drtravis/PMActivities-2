'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store';

export default function ClientAuthProvider({ children }: { children: React.ReactNode }) {
  const { login } = useAuthStore();

  useEffect(() => {
    // Initialize auth from localStorage after hydration
    console.log('ClientAuthProvider: Initializing auth from localStorage');
    const token = localStorage.getItem('pmactivities2_token');
    const userData = localStorage.getItem('user');

    console.log('ClientAuthProvider: Found token:', !!token);
    console.log('ClientAuthProvider: Found userData:', !!userData);

    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        console.log('ClientAuthProvider: Restoring user session:', user);

        // Transform role to match frontend expectations
        const normalizeRole = (role: string): 'ADMIN' | 'PMO' | 'PROJECT_MANAGER' | 'MEMBER' => {
          switch (role?.toLowerCase()) {
            case 'admin': return 'ADMIN';
            case 'pmo': return 'PMO';
            case 'project_manager': return 'PROJECT_MANAGER';
            case 'member': return 'MEMBER';
            default: return 'MEMBER';
          }
        };

        const normalizedUser = {
          ...user,
          role: normalizeRole(user.role || 'member')
        };

        login(token, normalizedUser);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('pmactivities2_token');
        localStorage.removeItem('user');
      }
    }
  }, [login]);

  return <>{children}</>;
}
