import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ActivityCard } from '../ActivityCard';
import { Activity, ActivityStatus, ApprovalState, Priority } from '@/types';
import { useAuthStore, useActivityStore } from '@/lib/store';

// Mock the stores
jest.mock('@/lib/store', () => ({
  useAuthStore: jest.fn(),
  useActivityStore: jest.fn(),
}));

const mockActivity: Activity = {
  id: '1',
  title: 'Test Activity',
  description: 'Test Description',
  status: ActivityStatus.IN_PROGRESS,
  approvalState: ApprovalState.DRAFT,
  priority: Priority.MEDIUM,
  projectId: 'project1',
  createdById: 'user1',
  startDate: '2024-01-01',
  endDate: null,
  tags: ['test'],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  project: {
    id: 'project1',
    name: 'Test Project',
    description: 'Test Project Description',
    organizationId: 'org1',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  createdBy: {
    id: 'user1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'member',
    organizationId: 'org1',
    isActive: true,
  },
};

const mockUser = {
  id: 'user1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'member' as const,
  organizationId: 'org1',
  isActive: true,
};

const mockAuthStore = {
  user: mockUser,
  isAuthenticated: true,
};

const mockActivityStore = {
  submitActivity: jest.fn(),
  approveActivity: jest.fn(),
  rejectActivity: jest.fn(),
  deleteActivity: jest.fn(),
};

describe('ActivityCard', () => {
  beforeEach(() => {
    (useAuthStore as jest.Mock).mockReturnValue(mockAuthStore);
    (useActivityStore as jest.Mock).mockReturnValue(mockActivityStore);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders activity information correctly', () => {
    render(<ActivityCard activity={mockActivity} onEdit={jest.fn()} />);

    expect(screen.getByText('Test Activity')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('shows correct status and priority badges', () => {
    render(<ActivityCard activity={mockActivity} onEdit={jest.fn()} />);

    expect(screen.getByText('IN PROGRESS')).toBeInTheDocument();
    expect(screen.getByText('DRAFT')).toBeInTheDocument();
    expect(screen.getByText('MEDIUM')).toBeInTheDocument();
  });

  it('shows submit button for draft activities created by current user', () => {
    render(<ActivityCard activity={mockActivity} onEdit={jest.fn()} />);

    expect(screen.getByText('Submit')).toBeInTheDocument();
  });

  it('calls submitActivity when submit button is clicked', async () => {
    render(<ActivityCard activity={mockActivity} onEdit={jest.fn()} />);

    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockActivityStore.submitActivity).toHaveBeenCalledWith('1');
    });
  });

  it('shows approve and reject buttons for project managers on submitted activities', () => {
    const pmUser = { ...mockUser, role: 'project_manager' as const };
    const submittedActivity = { ...mockActivity, approvalState: ApprovalState.SUBMITTED };
    
    (useAuthStore as jest.Mock).mockReturnValue({ ...mockAuthStore, user: pmUser });

    render(<ActivityCard activity={submittedActivity} onEdit={jest.fn()} />);

    expect(screen.getByText('Approve')).toBeInTheDocument();
    expect(screen.getByText('Reject')).toBeInTheDocument();
  });

  it('calls approveActivity when approve button is clicked', async () => {
    const pmUser = { ...mockUser, role: 'project_manager' as const };
    const submittedActivity = { ...mockActivity, approvalState: ApprovalState.SUBMITTED };
    
    (useAuthStore as jest.Mock).mockReturnValue({ ...mockAuthStore, user: pmUser });

    render(<ActivityCard activity={submittedActivity} onEdit={jest.fn()} />);

    const approveButton = screen.getByText('Approve');
    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(mockActivityStore.approveActivity).toHaveBeenCalledWith('1');
    });
  });

  it('shows edit button for draft activities created by current user', () => {
    render(<ActivityCard activity={mockActivity} onEdit={jest.fn()} />);

    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const mockOnEdit = jest.fn();
    render(<ActivityCard activity={mockActivity} onEdit={mockOnEdit} />);

    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockActivity);
  });

  it('shows delete button for activity creators', () => {
    render(<ActivityCard activity={mockActivity} onEdit={jest.fn()} />);

    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('calls deleteActivity when delete button is clicked', async () => {
    render(<ActivityCard activity={mockActivity} onEdit={jest.fn()} />);

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockActivityStore.deleteActivity).toHaveBeenCalledWith('1');
    });
  });

  it('does not show action buttons for approved activities', () => {
    const approvedActivity = { ...mockActivity, approvalState: ApprovalState.APPROVED };
    render(<ActivityCard activity={approvedActivity} onEdit={jest.fn()} />);

    expect(screen.queryByText('Submit')).not.toBeInTheDocument();
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  it('shows tags when present', () => {
    render(<ActivityCard activity={mockActivity} onEdit={jest.fn()} />);

    expect(screen.getByText('test')).toBeInTheDocument();
  });

  it('formats dates correctly', () => {
    render(<ActivityCard activity={mockActivity} onEdit={jest.fn()} />);

    expect(screen.getByText('Jan 1, 2024')).toBeInTheDocument();
  });
});
