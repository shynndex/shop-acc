import { adminApi, api } from "@/lib/adminAxios";
import type {
  CloudinaryDeleteBulkResponse,
  CloudinaryDeleteSingleResponse,
  CloudinaryUploadResponse,
} from "@/types/admin/cloudinary.type";

export const cloudinaryService = {
  /**
   * Upload ảnh lên Cloudinary
   * @param file File từ input/dropzone
   * @returns Promise với URL và public_id
   */

  uploadImage: async (
    file: File,
  ): Promise<{ url: string; public_id: string }> => {
    const formData = new FormData();
    formData.append("file", file);

    const data = await api.post<CloudinaryUploadResponse>(
      "/admin/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return {
      url: data.url,
      public_id: data.public_id,
    };
  },

  /**
   * Xóa ảnh khỏi Cloudinary bằng public_id
   */
  deleteImage: async (publicId: string): Promise<{ result?: string }> => {
    const response = await api.delete<CloudinaryDeleteSingleResponse>(
      `/admin/upload`,
      {
        data: { public_id: publicId },
      },
    );
    return {
      result: response.result,
    };
  },

  /**
   * Xóa nhiều ảnh (bulk)
   */
  deleteImages: async (
    publicIds: string[],
  ): Promise<{
    deleted?: Record<string, string>;
    errors?: Record<string, string>;
  }> => {
    const response = await api.post<CloudinaryDeleteBulkResponse>(
      "/admin/upload/delete-many",
      { public_ids: publicIds },
    );

    return { deleted: response.deleted, errors: response.errors };
  },
};
