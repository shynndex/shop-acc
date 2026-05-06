import type { User } from "@/types/index";
import type { SignInPayload } from "./services";

export interface AuthState {
  accessToken: string | null;
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;

  signIn: (payload: SignInPayload) => Promise<boolean>;

  signUp: (payload: {
    username: string;
    password: string;
    email: string;
    firstName: string;
    lastName: string;
  }) => Promise<boolean>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<User | null>;
  setAccessToken: (token: string) => void;
  updateUser: (partialUser: Partial<User>) => void;
}
