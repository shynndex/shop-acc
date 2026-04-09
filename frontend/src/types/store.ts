import type { User } from "./user";

export interface AuthState {
  accessToken: string | null;
  user: User | null;
  loading: boolean;
  signUp: (payload: {
    username: string;
    password: string;
    email: string;
    firstName: string;
    lastName: string;
  }) => Promise<boolean>;
}
