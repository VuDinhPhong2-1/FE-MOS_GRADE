// Điều chỉnh BASE_URL cho khớp với cách các service khác trong project trỏ
// tới API (dùng lại API_BASE_URL chung, không hardcode '/api').
import { API_BASE_URL } from '../config/api';
const INSERTED_IMAGE_ASSET_API_BASE_URL =
  `${API_BASE_URL}/inserted-image-assets`;

export interface InsertedImageAssetUploadResult {
  assetId: string;
  imageHash: string;
  contentType: string;
  sizeBytes: number;
}

type GetAccessToken = () => Promise<string | null> | string | null;

const buildAuthHeaders = async (getAccessToken: GetAccessToken): Promise<HeadersInit> => {
  const token = await getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const parseErrorMessage = async (response: Response, fallback: string): Promise<string> => {
  try {
    const body = await response.json();
    return body?.message || fallback;
  } catch {
    return fallback;
  }
};

export const insertedImageAssetsService = {
  /**
   * Upload ảnh chuẩn (VD: Apps.jpg) lên BE. BE sẽ tính SHA-256 và trả về
   * assetId + imageHash để điền vào SpecialCondition.ImageInsertConfig.
   */
  async upload(file: File, getAccessToken: GetAccessToken): Promise<InsertedImageAssetUploadResult> {
    const formData = new FormData();
    formData.append('file', file);

    const headers = await buildAuthHeaders(getAccessToken);
    const response = await fetch(INSERTED_IMAGE_ASSET_API_BASE_URL, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response, 'Tải ảnh lên thất bại.'));
    }

    return response.json();
  },

  /**
   * Lấy lại ảnh theo assetId (dùng khi mở 1 ruleset đã có sẵn assetId,
   * để hiển thị preview mà không cần người dùng chọn lại file).
   * Trả về object URL (blob:) — nhớ revoke khi component unmount.
   */
  async fetchPreviewUrl(assetId: string, getAccessToken: GetAccessToken): Promise<string> {
    const headers = await buildAuthHeaders(getAccessToken);
    const response = await fetch(`${INSERTED_IMAGE_ASSET_API_BASE_URL}/${assetId}`, { headers });

    if (!response.ok) {
      throw new Error('Không tải được ảnh xem trước.');
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  },
};