import { create } from 'zustand';
import { User, Activity } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

interface ActivityState {
  activities: Activity[];
  selectedActivity: Activity | null;
  filters: {
    status?: string;
    approvalState?: string;
    projectId?: string;
    assigneeId?: string;
  };
  setActivities: (activities: Activity[]) => void;
  setSelectedActivity: (activity: Activity | null) => void;
  updateActivity: (activity: Activity) => void;
  addActivity: (activity: Activity) => void;
  removeActivity: (id: string) => void;
  setFilters: (filters: any) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  login: (token: string, user: User) => {
    console.log('Auth store login called with:', { token, user });

    // Transform role to match frontend expectations
    const normalizeRole = (role: string): 'ADMIN' | 'PMO' | 'PROJECT_MANAGER' | 'MEMBER' => {
      switch (role.toLowerCase()) {
        case 'admin': return 'ADMIN';
        case 'pmo': return 'PMO';
        case 'project_manager': return 'PROJECT_MANAGER';
        case 'member': return 'MEMBER';
        default: return 'MEMBER';
      }
    };

    const normalizedUser = {
      ...user,
      role: normalizeRole(user.role)
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('pmactivities2_token', token);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      console.log('Stored in localStorage');
    }
    set({ token, user: normalizedUser, isAuthenticated: true });
    console.log('Auth state updated');
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pmactivities2_token');
      localStorage.removeItem('user');
    }
    set({ token: null, user: null, isAuthenticated: false });
  },
  setUser: (user: User) => {
    // Transform role to match frontend expectations
    const normalizeRole = (role: string): 'ADMIN' | 'PMO' | 'PROJECT_MANAGER' | 'MEMBER' => {
      switch (role.toLowerCase()) {
        case 'admin': return 'ADMIN';
        case 'pmo': return 'PMO';
        case 'project_manager': return 'PROJECT_MANAGER';
        case 'member': return 'MEMBER';
        default: return 'MEMBER';
      }
    };

    const normalizedUser = {
      ...user,
      role: normalizeRole(user.role)
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(normalizedUser));
    }
    set({ user: normalizedUser });
  },
}));

// Store initialization is now handled by ClientAuthProvider component

export const useActivityStore = create<ActivityState>((set) => ({
  activities: [],
  selectedActivity: null,
  filters: {},
  setActivities: (activities) => set({ activities }),
  setSelectedActivity: (activity) => set({ selectedActivity: activity }),
  updateActivity: (updatedActivity) =>
    set((state) => ({
      activities: state.activities.map((activity) =>
        activity.id === updatedActivity.id ? updatedActivity : activity
      ),
      selectedActivity:
        state.selectedActivity?.id === updatedActivity.id
          ? updatedActivity
          : state.selectedActivity,
    })),
  addActivity: (activity) =>
    set((state) => ({ activities: [activity, ...state.activities] })),
  removeActivity: (id) =>
    set((state) => ({
      activities: state.activities.filter((activity) => activity.id !== id),
      selectedActivity:
        state.selectedActivity?.id === id ? null : state.selectedActivity,
    })),
  setFilters: (filters) => set({ filters }),
}));
