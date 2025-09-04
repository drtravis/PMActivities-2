'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store';

export default function ClientAuthProvider({ children }: { children: React.ReactNode }) {
  const { login } = useAuthStore();

  useEffect(() => {
    // Initialize auth from localStorage after hydration
    console.log('ClientAuthProvider: Initializing auth from localStorage');
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    console.log('ClientAuthProvider: Found token:', !!token);
    console.log('ClientAuthProvider: Found userData:', !!userData);

    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        console.log('ClientAuthProvider: Restoring user session:', user);
        login(token, user);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, [login]);

  return <>{children}</>;
}
