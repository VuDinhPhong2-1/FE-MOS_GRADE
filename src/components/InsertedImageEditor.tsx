import { useEffect, useRef, useState } from 'react';
import {
  Image as ImageIcon,
  Loader2,
  Upload,
  X
} from 'lucide-react';

import type {
  ImageInsertConfig,
  ImageWrapType
} from '../types/xml-grading-rules.types';
import { insertedImageAssetsService } from '../services/insertedImageAssets.service';

interface InsertedImageEditorProps {
  config?: ImageInsertConfig;
  onChange: (config: ImageInsertConfig) => void;
  getAccessToken: () => Promise<string | null> | string | null;
}

const ACCEPTED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/bmp',
  'image/webp',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const wrapOptions: Array<{ value: ImageWrapType; label: string }> = [
  { value: 'inline', label: 'In Line with Text' },
  { value: 'square', label: 'Square' },
  { value: 'tight', label: 'Tight' },
  { value: 'through', label: 'Through' },
  { value: 'topAndBottom', label: 'Top and Bottom' },
  { value: 'behind', label: 'Behind Text' },
  { value: 'inFront', label: 'In Front of Text' },
];

const InsertedImageEditor = ({
  config,
  onChange,
  getAccessToken,
}: InsertedImageEditorProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  // Ref theo dõi assetId đã tải preview, tránh việc effect chạy lại vô ích
  // hoặc ghi đè preview đang có do người dùng vừa chọn file mới.
  const loadedAssetIdRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Khi mở 1 Task đã có sẵn assetId (ruleset cũ đã upload ảnh trước đó),
  // tự động tải lại ảnh để hiển thị preview thay vì để trống.
  useEffect(() => {
    const assetId = config?.assetId;

    if (!assetId || loadedAssetIdRef.current === assetId) {
      return;
    }

    let cancelled = false;
    loadedAssetIdRef.current = assetId;

    insertedImageAssetsService
      .fetchPreviewUrl(assetId, getAccessToken)
      .then((url) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        setPreviewUrl((previous) => {
          if (previous) {
            URL.revokeObjectURL(previous);
          }
          return url;
        });
      })
      .catch(() => {
        if (!cancelled) {
          setError('Không tải được ảnh đã lưu trước đó.');
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.assetId]);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError('');

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError(
        'File không hợp lệ. Vui lòng chọn PNG, JPG, GIF, BMP hoặc WebP.'
      );

      event.target.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('Kích thước hình ảnh không được vượt quá 10MB.');

      event.target.value = '';
      return;
    }

    // Preview tức thì bằng blob URL cục bộ trong lúc chờ upload xong,
    // để người dùng thấy phản hồi ngay thay vì màn hình trống + spinner.
    const localPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous);
      }
      return localPreviewUrl;
    });
    setFileName(file.name);
    setUploading(true);

    try {
      const result = await insertedImageAssetsService.upload(file, getAccessToken);

      loadedAssetIdRef.current = result.assetId;

      onChange({
        ...config,
        wrapType: config?.wrapType ?? 'tight',
        assetId: result.assetId,
        imageHash: result.imageHash,
      });
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'Tải ảnh lên thất bại. Vui lòng thử lại.'
      );

      // Upload thất bại -> không giữ assetId/imageHash cũ (nếu có) để tránh
      // hiểu nhầm là đã lưu thành công; nhưng vẫn giữ preview cục bộ để
      // người dùng biết ảnh nào vừa chọn và có thể thử lại.
      onChange({
        ...config,
        wrapType: config?.wrapType ?? 'tight',
        assetId: undefined,
        imageHash: undefined,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous);
      }

      return null;
    });

    setFileName('');
    setError('');
    loadedAssetIdRef.current = null;

    if (inputRef.current) {
      inputRef.current.value = '';
    }

    onChange({
      wrapType: config?.wrapType ?? 'tight',
      assetId: undefined,
      imageHash: undefined,
    });
  };

  const handleWrapTypeChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    onChange({
      ...config,
      wrapType: (event.target.value || undefined) as ImageWrapType | undefined,
    });
  };

  const hasSavedImage = Boolean(config?.assetId && config?.imageHash);

  return (
    <div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50/40 p-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
          <ImageIcon size={17} />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-800">
            Cấu hình Chèn hình ảnh
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Chọn hình ảnh chuẩn (VD: Apps.jpg) và chế độ ngắt dòng cần kiểm tra
            trong bài Word của học viên.
          </p>
        </div>
      </div>

      {/* Configuration */}
      <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_200px]">
        {/* Image upload */}
        <div>
          <p className="text-xs font-semibold text-slate-600">
            Hình ảnh chuẩn
          </p>

          <div className="mt-2">
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(',')}
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-xs font-semibold text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Upload size={15} />
              )}

              {uploading
                ? 'Đang tải lên...'
                : fileName || hasSavedImage
                  ? 'Thay đổi hình ảnh'
                  : 'Chọn hình ảnh'}
            </button>
          </div>

          {fileName && (
            <div className="mt-2 flex items-center gap-2">
              <p className="min-w-0 flex-1 truncate text-[11px] text-slate-500">
                {fileName}
              </p>

              <button
                type="button"
                onClick={handleRemoveImage}
                disabled={uploading}
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                title="Xóa hình"
              >
                <X size={13} />
              </button>
            </div>
          )}

          <p className="mt-1.5 text-[11px] text-slate-400">
            PNG, JPG, GIF, BMP hoặc WebP · tối đa 10MB
          </p>

          {error && (
            <p className="mt-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-[11px] text-red-600">
              {error}
            </p>
          )}

          {!error && !uploading && hasSavedImage && (
            <p className="mt-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700">
              Đã lưu ảnh và hash trên server — sẵn sàng dùng để chấm điểm.
            </p>
          )}
        </div>

        {/* Wrap type */}
        <div>
          <label className="text-xs font-semibold text-slate-600">
            Chế độ ngắt dòng (Wrap)

            <select
              value={config?.wrapType ?? ''}
              onChange={handleWrapTypeChange}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition hover:border-slate-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
            >
              <option value="">Không kiểm tra (chỉ cần đúng ảnh)</option>
              {wrapOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <p className="mt-1.5 text-[11px] leading-4 text-slate-400">
            VD Task 5: Apps.jpg + Tight → chọn "Tight" ở trên.
          </p>
        </div>
      </div>

      {/* Preview */}
      <div className="mt-4">
        <p className="mb-2 text-xs font-semibold text-slate-600">
          Xem trước
        </p>

        {previewUrl ? (
          <div className="relative flex min-h-[500px] max-h-[500px] w-full items-center justify-center rounded-xl border border-slate-200 bg-white p-2.5">
            <img
              src={previewUrl}
              alt="Inserted image preview"
              className="max-h-[500px] max-w-[500px] object-contain"
            />

            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/70">
                <Loader2 size={16} className="animate-spin text-violet-600" />
              </div>
            )}

            <button
              type="button"
              onClick={handleRemoveImage}
              disabled={uploading}
              className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm ring-1 ring-slate-200 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
              title="Xóa hình"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <div className="flex min-h-16 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white">
            <div className="text-center">
              <ImageIcon size={18} className="mx-auto text-slate-300" />

              <p className="mt-1.5 text-[11px] text-slate-400">
                Chưa chọn hình ảnh
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InsertedImageEditor;