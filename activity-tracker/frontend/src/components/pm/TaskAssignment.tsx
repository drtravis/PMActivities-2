'use client';

import { TaskForm } from '@/components/shared/TaskForm';

interface TaskAssignmentProps {
  selectedProject?: any;
  onTaskCreated?: () => void;
}

export function TaskAssignment({ selectedProject, onTaskCreated }: TaskAssignmentProps) {
  return (
    <TaskForm
      selectedProject={selectedProject}
      onTaskCreated={onTaskCreated}
      mode="pm"
    />
  );
}

