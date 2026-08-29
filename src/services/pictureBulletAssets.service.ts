import { API_BASE_URL } from '../config/api';
import { authFetch } from './auth-fetch';

const PICTURE_BULLET_ASSET_API_BASE_URL =
  `${API_BASE_URL}/picture-bullet-assets`;

export interface PictureBulletAssetUploadResult {
  assetId: string;
  imageHash: string;
  contentType: string;
  sizeBytes: number;
}

type GetAccessToken = (
  forceRefresh?: boolean
) => Promise<string | null>;

const parseErrorMessage = async (
  response: Response,
  fallback: string
): Promise<string> => {
  const errorData = await response.json().catch(() => null);

  if (!errorData) {
    return fallback;
  }

  if (
    typeof errorData.message === 'string' &&
    errorData.message.trim()
  ) {
    return errorData.message;
  }

  if (
    errorData.errors &&
    typeof errorData.errors === 'object'
  ) {
    const firstField = Object.keys(errorData.errors)[0];

    const firstErrors = Array.isArray(errorData.errors[firstField])
      ? errorData.errors[firstField]
      : [];

    if (firstErrors.length > 0) {
      return String(firstErrors[0]);
    }
  }

  return fallback;
};

export const pictureBulletAssetsService = {
  /**
   * Upload ảnh bullet chuẩn lên BE.
   *
   * POST /api/picture-bullet-assets
   *
   * BE tính SHA-256 và trả về:
   * - assetId
   * - imageHash
   * - contentType
   * - sizeBytes
   */
  async upload(
    file: File,
    getAccessToken: GetAccessToken
  ): Promise<PictureBulletAssetUploadResult> {
    const formData = new FormData();

    formData.append('file', file);

    const response = await authFetch(
      PICTURE_BULLET_ASSET_API_BASE_URL,
      {
        method: 'POST',

        // QUAN TRỌNG:
        // Không set Content-Type ở đây.
        // Browser sẽ tự tạo:
        // multipart/form-data; boundary=...
        body: formData,
      },
      getAccessToken
    );

    if (!response.ok) {
      const message = await parseErrorMessage(
        response,
        'Tải ảnh lên thất bại.'
      );

      throw new Error(message);
    }

    return response.json();
  },

  /**
   * Lấy lại ảnh theo assetId.
   *
   * GET /api/picture-bullet-assets/{assetId}
   *
   * Trả về object URL để FE hiển thị preview.
   */
  async fetchPreviewUrl(
    assetId: string,
    getAccessToken: GetAccessToken
  ): Promise<string> {
    const response = await authFetch(
      `${PICTURE_BULLET_ASSET_API_BASE_URL}/${encodeURIComponent(assetId)}`,
      {
        method: 'GET',
      },
      getAccessToken
    );

    if (!response.ok) {
      const message = await parseErrorMessage(
        response,
        'Không tải được ảnh xem trước.'
      );

      throw new Error(message);
    }

    const blob = await response.blob();

    return URL.createObjectURL(blob);
  },
};