'use client';

import { useEffect, useState } from 'react';
import { PersonalBoard } from '../../../components/member/PersonalBoard';

export default function MemberBoardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real implementation, get user from auth context
    // For now, use mock data
    const mockUser = {
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      organizationId: 'org-456',
      role: 'member',
    };

    setUser(mockUser);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900">Authentication Required</h2>
          <p className="mt-1 text-sm text-gray-500">Please log in to access your task board.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PersonalBoard userId={user.id} organizationId={user.organizationId} />
    </div>
  );
}
