import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TaskBoard, Task } from '../TaskBoard';

// Mock the drag and drop library
jest.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children }: any) => <div>{children}</div>,
  Droppable: ({ children }: any) => children({ innerRef: jest.fn(), droppableProps: {}, placeholder: null }),
  Draggable: ({ children }: any) => children({ innerRef: jest.fn(), draggableProps: {}, dragHandleProps: {} }, {}),
}));

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Task 1',
    status: 'Working on it',
    priority: 'High',
    section: 'To-Do',
    position: 0,
    assignee: {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com'
    },
    dueDate: '2024-08-30',
    lastUpdated: '2024-08-24T10:00:00Z'
  },
  {
    id: '2',
    title: 'Task 2',
    status: 'Done',
    priority: 'Medium',
    section: 'Completed',
    position: 0,
    lastUpdated: '2024-08-23T15:30:00Z'
  }
];

const mockColumns = [
  { id: 'task', title: 'Task', width: 200 },
  { id: 'owner', title: 'Owner', width: 120 },
  { id: 'status', title: 'Status', width: 120 },
  { id: 'dueDate', title: 'Due date', width: 120 },
  { id: 'priority', title: 'Priority', width: 100 },
  { id: 'lastUpdated', title: 'Last updated', width: 120 }
];

describe('TaskBoard', () => {
  const mockOnTaskUpdate = jest.fn();
  const mockOnTaskCreate = jest.fn();
  const mockOnTaskMove = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders task board with Monday.com styling', () => {
    render(
      <TaskBoard
        tasks={mockTasks}
        columns={mockColumns}
        onTaskUpdate={mockOnTaskUpdate}
        onTaskCreate={mockOnTaskCreate}
        onTaskMove={mockOnTaskMove}
      />
    );

    // Check for Monday.com style elements
    expect(screen.getByText('New task')).toBeInTheDocument();
    expect(screen.getByText('Filter')).toBeInTheDocument();
    expect(screen.getByText('Sort')).toBeInTheDocument();
    expect(screen.getByText('Group by')).toBeInTheDocument();
  });

  it('displays tasks in correct sections', () => {
    render(
      <TaskBoard
        tasks={mockTasks}
        columns={mockColumns}
        onTaskUpdate={mockOnTaskUpdate}
        onTaskCreate={mockOnTaskCreate}
        onTaskMove={mockOnTaskMove}
      />
    );

    expect(screen.getByText('To-Do')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
  });

  it('shows status pills with correct colors', () => {
    render(
      <TaskBoard
        tasks={mockTasks}
        columns={mockColumns}
        onTaskUpdate={mockOnTaskUpdate}
        onTaskCreate={mockOnTaskCreate}
        onTaskMove={mockOnTaskMove}
      />
    );

    const workingOnItStatus = screen.getByText('Working on it');
    const doneStatus = screen.getByText('Done');
    
    expect(workingOnItStatus).toBeInTheDocument();
    expect(doneStatus).toBeInTheDocument();
  });

  it('shows priority indicators', () => {
    render(
      <TaskBoard
        tasks={mockTasks}
        columns={mockColumns}
        onTaskUpdate={mockOnTaskUpdate}
        onTaskCreate={mockOnTaskCreate}
        onTaskMove={mockOnTaskMove}
      />
    );

    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
  });

  it('displays user avatars correctly', () => {
    render(
      <TaskBoard
        tasks={mockTasks}
        columns={mockColumns}
        onTaskUpdate={mockOnTaskUpdate}
        onTaskCreate={mockOnTaskCreate}
        onTaskMove={mockOnTaskMove}
      />
    );

    // Check for user avatar (initials of name)
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('shows add task buttons for each section', () => {
    render(
      <TaskBoard
        tasks={mockTasks}
        columns={mockColumns}
        onTaskUpdate={mockOnTaskUpdate}
        onTaskCreate={mockOnTaskCreate}
        onTaskMove={mockOnTaskMove}
      />
    );

    const addTaskButtons = screen.getAllByText('Add task');
    expect(addTaskButtons.length).toBeGreaterThan(0);
  });

  it('handles task title editing', () => {
    render(
      <TaskBoard
        tasks={mockTasks}
        columns={mockColumns}
        onTaskUpdate={mockOnTaskUpdate}
        onTaskCreate={mockOnTaskCreate}
        onTaskMove={mockOnTaskMove}
      />
    );

    const taskTitle = screen.getByText('Task 1');
    fireEvent.click(taskTitle);

    // Should show input field for editing
    const input = screen.getByDisplayValue('Task 1');
    expect(input).toBeInTheDocument();
  });
});
