'use client';

import { TaskForm } from '@/components/shared/TaskForm';

interface TaskManagementProps {
  selectedProject?: any;
  onTaskCreated?: () => void;
}

export function TaskManagement({ selectedProject, onTaskCreated }: TaskManagementProps) {
  return (
    <TaskForm
      selectedProject={selectedProject}
      onTaskCreated={onTaskCreated}
      mode="member"
    />
  );
}
