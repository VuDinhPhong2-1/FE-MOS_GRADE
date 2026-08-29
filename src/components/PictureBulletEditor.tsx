import { useEffect, useRef, useState } from 'react';
import {
  Image as ImageIcon,
  Upload,
  X
} from 'lucide-react';

import type {
  PictureBulletConfig
} from '../types/xml-grading-rules.types';

interface PictureBulletEditorProps {
  config?: PictureBulletConfig;
  onChange: (config: PictureBulletConfig) => void;
}

const ACCEPTED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/bmp',
  'image/webp',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const PictureBulletEditor = ({
  config,
  onChange,
}: PictureBulletEditorProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (
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

    const newPreviewUrl = URL.createObjectURL(file);

    setPreviewUrl((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous);
      }

      return newPreviewUrl;
    });

    setFileName(file.name);

    /*
     * QUAN TRỌNG:
     *
     * Ở bước FE hiện tại ta chỉ giữ preview.
     * Chưa upload file lên BE.
     *
     * Sau này: file -> uploadImage() -> assetId + imageHash
     * rồi cập nhật: { ...config, assetId, imageHash }
     */

    onChange({
      ...config,
      level: config?.level ?? 0,
    });
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

    if (inputRef.current) {
      inputRef.current.value = '';
    }

    onChange({
      level: config?.level ?? 0,
      assetId: undefined,
      imageHash: undefined,
    });
  };

  const handleLevelChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    onChange({
      ...config,
      level: Number(event.target.value),
    });
  };

  return (
    <div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50/40 p-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
          <ImageIcon size={17} />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-800">
            Cấu hình Picture Bullet
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Chọn hình ảnh chuẩn được sử dụng làm dấu đầu dòng
            trong bài Word của học viên.
          </p>
        </div>
      </div>

      {/* Configuration */}
      <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_160px]">
        {/* Image upload */}
        <div>
          <p className="text-xs font-semibold text-slate-600">
            Hình ảnh Bullet chuẩn
          </p>

          <div className="mt-2">
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(',')}
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-xs font-semibold text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
            >
              <Upload size={15} />

              {fileName ? 'Thay đổi hình ảnh' : 'Chọn hình ảnh'}
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
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-red-50 hover:text-red-600"
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
        </div>

        {/* Level */}
        <div>
          <label className="text-xs font-semibold text-slate-600">
            Level

            <select
              value={config?.level ?? 0}
              onChange={handleLevelChange}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition hover:border-slate-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
            >
              {Array.from({ length: 9 }, (_, index) => index).map((level) => (
                <option key={level} value={level}>
                  Level {level}
                </option>
              ))}
            </select>
          </label>

          <p className="mt-1.5 text-[11px] leading-4 text-slate-400">
            Cấp numbering cần kiểm tra trong Word.
          </p>
        </div>
      </div>

      {/* Preview */}
      <div className="mt-4">
        <p className="mb-2 text-xs font-semibold text-slate-600">
          Xem trước
        </p>

        {previewUrl ? (
          <div className="relative flex min-h-28 items-center justify-center rounded-xl border border-slate-200 bg-white p-4">
            <img
              src={previewUrl}
              alt="Picture bullet preview"
              className="max-h-20 max-w-20 object-contain"
            />

            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm ring-1 ring-slate-200 transition hover:bg-red-50 hover:text-red-600"
              title="Xóa hình"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="flex min-h-28 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white">
            <div className="text-center">
              <ImageIcon size={22} className="mx-auto text-slate-300" />

              <p className="mt-2 text-xs text-slate-400">
                Chưa chọn hình ảnh
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Status */}
      <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 text-xs">⚠️</span>

          <div className="text-[11px] leading-5 text-amber-700">
            <p className="font-semibold">
              Hình ảnh mới chỉ được dùng làm mẫu ở FE.
            </p>

            <p>
              Khi kết nối BE, hình ảnh sẽ được upload,
              tạo <strong>assetId</strong> và{' '}
              <strong>imageHash</strong> để dùng khi chấm bài.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PictureBulletEditor;
