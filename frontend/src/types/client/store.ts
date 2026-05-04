import type { User } from "@/types/index";

export interface AuthState {
  accessToken: string | null;
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;

  signIn: (payload: { email: string; password: string }) => Promise<boolean>;

  signUp: (payload: {
    username: string;
    password: string;
    email: string;
    firstName: string;
    lastName: string;
  }) => Promise<boolean>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setAccessToken: (token: string) => void;
  updateUser: (partialUser: Partial<User>) => void;
}
