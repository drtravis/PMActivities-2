import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OrganizationSettings {
  logoPositionX?: number;
  logoPositionY?: number;
  logoScale?: number;
  logoWidth?: number;
  logoHeight?: number;
}

interface Organization {
  id: string;
  name: string;
  logoUrl?: string;
  description?: string;
  industry?: string;
  size?: string;
  timezone?: string;
  currency?: string;
  settings?: OrganizationSettings;
}

interface OrganizationState {
  organization: Organization | null;
  setOrganization: (organization: Organization) => void;
  updateOrganization: (updates: Partial<Organization>) => void;
  clearOrganization: () => void;
}

export const useOrganizationStore = create<OrganizationState>()(
  persist(
    (set, get) => ({
      organization: null,
      
      setOrganization: (organization) => set({ organization }),
      
      updateOrganization: (updates) => set((state) => ({
        organization: state.organization ? { ...state.organization, ...updates } : null
      })),
      
      clearOrganization: () => set({ organization: null }),
    }),
    {
      name: 'organization-storage',
    }
  )
);
