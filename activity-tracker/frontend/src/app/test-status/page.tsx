'use client';

import React from 'react';
import { StatusTest } from '@/components/test/StatusTest';
import { StatusProvider } from '@/contexts/StatusContext';

export default function TestStatusPage() {
  return (
    <StatusProvider>
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-center mb-8">Status Dropdown & Assigned By Test</h1>
          <StatusTest />
        </div>
      </div>
    </StatusProvider>
  );
}
