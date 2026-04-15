import type { User } from ".";

export interface AuthState {
  accessToken: string | null;
  user: User | null;
  loading: boolean;

  signIn: (payload: { username: string; password: string }) => Promise<boolean>;

  signUp: (payload: {
    username: string;
    password: string;
    email: string;
    firstName: string;
    lastName: string;
  }) => Promise<boolean>;
  signOut: () => Promise<void>;
  setAccessToken: (token: string) => void;
  updateUser: (partialUser: Partial<User>) => void;
}
