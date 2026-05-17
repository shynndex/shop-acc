export interface CloudinaryUploadPayload {
    url:string
}

export interface CloudinaryUploadResponse {
  success: boolean;
  message: string;
  data: {
    url: string;
    public_id: string;
    format: string;
    size: number;
    original_name: string;
  };
}

export interface CloudinaryDeleteSingleResponse {
  success: boolean;
  message: string;
  result?: string; // "ok" | "not found"
}

export interface CloudinaryDeleteBulkResponse {
  success: boolean;
  message: string;
  deleted?: Record<string, "deleted" | "not found">;
  errors?: Record<string, string>;
}
