// Điều chỉnh BASE_URL cho khớp với cách các service khác trong project trỏ
// tới API (ví dụ nếu có biến cấu hình chung như `API_BASE_URL` thì dùng lại,
// thay vì hardcode '/api' ở đây).
const BASE_URL = '/api/picture-bullet-assets';

export interface PictureBulletAssetUploadResult {
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

export const pictureBulletAssetsService = {
  /**
   * Upload ảnh bullet chuẩn lên BE. BE sẽ tính SHA-256 và trả về
   * assetId + imageHash để điền vào SpecialCondition.Config.
   */
  async upload(file: File, getAccessToken: GetAccessToken): Promise<PictureBulletAssetUploadResult> {
    const formData = new FormData();
    formData.append('file', file);

    const headers = await buildAuthHeaders(getAccessToken);
    const response = await fetch(BASE_URL, {
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
    const response = await fetch(`${BASE_URL}/${assetId}`, { headers });

    if (!response.ok) {
      throw new Error('Không tải được ảnh xem trước.');
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  },
};
