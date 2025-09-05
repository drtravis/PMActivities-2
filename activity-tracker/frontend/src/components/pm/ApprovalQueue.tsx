'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

interface PendingActivity {
  id: string;
  title: string;
  description: string;
  submittedBy: string;
  submittedAt: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  estimatedHours: number;
  tags: string[];
  attachments: string[];
}

interface ApprovalQueueProps {
  selectedProject?: any;
}

export function ApprovalQueue({ selectedProject }: ApprovalQueueProps) {
  return (
    <div className="h-full bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Approval Queue</h1>
            <p className="text-sm text-gray-600 mt-1">
              {selectedProject?.name} • Task-focused workflow
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Approvals Needed</h3>
          <p className="text-gray-500 mb-4">
            This system now uses a task-focused workflow. Tasks are managed directly without requiring separate activity approvals.
          </p>
          <p className="text-sm text-gray-400">
            All work is tracked through the Task Assignment system for better efficiency and clarity.
          </p>
        </div>
      </div>
    </div>
  );
}
