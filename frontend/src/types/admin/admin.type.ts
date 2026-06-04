export interface AdminListItem {
  _id: string;
  username: string;
  email: string;
  role: "super_admin" | "admin";
  isActive: boolean;
  totpEnabled?: boolean;
  lastLogin?: string;
  loginIP?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminListResponse {
  success: boolean;
  data: {
    admins: AdminListItem[];
    totalPages: number;
    currentPage: number;
    totalItems: number;
  };
}

export interface CreateAdminPayload {
  username: string;
  email: string;
  password: string;
  role?: "admin" | "super_admin";
}

export interface UpdateAdminPayload {
  username?: string;
  email?: string;
  role?: "admin" | "super_admin";
  isActive?: boolean;
}
