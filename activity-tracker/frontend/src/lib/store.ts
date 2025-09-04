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
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      console.log('Stored in localStorage');
    }
    set({ token, user, isAuthenticated: true });
    console.log('Auth state updated');
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    set({ token: null, user: null, isAuthenticated: false });
  },
  setUser: (user: User) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }
    set({ user });
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
