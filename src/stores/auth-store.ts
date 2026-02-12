import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole = "admin" | "accountant" | "clerk" | "auditor" | "viewer";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  companyId: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

// Mock users for demo
const mockUsers: Record<string, { password: string; user: User }> = {
  "admin@company.com": {
    password: "admin123",
    user: {
      id: "1",
      email: "admin@company.com",
      firstName: "John",
      lastName: "Admin",
      role: "admin",
      companyId: "comp_1",
    },
  },
  "accountant@company.com": {
    password: "acc123",
    user: {
      id: "2",
      email: "accountant@company.com",
      firstName: "Sarah",
      lastName: "Accountant",
      role: "accountant",
      companyId: "comp_1",
    },
  },
  "clerk@company.com": {
    password: "clerk123",
    user: {
      id: "3",
      email: "clerk@company.com",
      firstName: "Mike",
      lastName: "Clerk",
      role: "clerk",
      companyId: "comp_1",
    },
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500));
        
        const mockUser = mockUsers[email];
        if (mockUser && mockUser.password === password) {
          set({ user: mockUser.user, isAuthenticated: true, isLoading: false });
          return true;
        }
        
        set({ isLoading: false });
        return false;
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },

      setUser: (user) => {
        set({ user, isAuthenticated: !!user });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
