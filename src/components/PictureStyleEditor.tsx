import { useEffect, useRef, useState } from 'react';
import { Icon, ProgressIndicator } from '@bug-on/m3-expressive';

import type { PictureStyleConfig } from '../types/xml-grading-rules.types';
import { insertedImageAssetsService } from '../services/insertedImageAssets.service';

interface PictureStyleEditorProps {
  config?: PictureStyleConfig;
  onChange: (config: PictureStyleConfig) => void;
  getAccessToken: () => Promise<string | null> | string | null;
}

const ACCEPTED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/bmp',
  'image/webp',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const geometryOptions = [
  { value: '', label: 'Khong kiem tra hinh dang' },
  { value: 'rect', label: 'Khung chu nhat' },
  { value: 'roundRect', label: 'Chu nhat bo goc' },
  { value: 'ellipse', label: 'Hinh oval/tron' },
  { value: 'triangle', label: 'Tam giac' },
  { value: 'diamond', label: 'Hinh thoi' },
  { value: 'parallelogram', label: 'Hinh binh hanh' },
  { value: 'trapezoid', label: 'Hinh thang' },
];

const stylePresetOptions = [
  { value: 'simpleFrameBlack', label: 'Simple Frame, Black - khung don vien den' },
  { value: 'custom', label: 'Tuy chinh bang cac dieu kien ben duoi' },
];

const lineColorOptions = [
  { value: '000000', label: 'Den' },
  { value: 'FFFFFF', label: 'Trang' },
  { value: '808080', label: 'Xam' },
  { value: '1F4E79', label: 'Xanh dam' },
  { value: '', label: 'Khong kiem tra mau vien' },
];

const PictureStyleEditor = ({
  config,
  onChange,
  getAccessToken,
}: PictureStyleEditorProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const loadedAssetIdRef = useRef<string | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

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
          setError('Khong tai duoc anh da luu truoc do.');
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.assetId]);

  const patchConfig = (patch: Partial<PictureStyleConfig>) => {
    onChange({
      sourceFile: 'word/document.xml',
      relsFile: 'word/_rels/document.xml.rels',
      targetImageIndex: 1,
      requiredLineColor: '000000',
      presetGeometry: 'rect',
      ...config,
      ...patch,
    });
  };

  const handleStylePresetChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const stylePreset = event.target.value;
    patchConfig({
      stylePreset,
      ...(stylePreset === 'simpleFrameBlack'
        ? {
            requiredLineColor: '000000',
            presetGeometry: 'rect',
          }
        : {}),
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setError('');

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError('File khong hop le. Vui long chon PNG, JPG, GIF, BMP hoac WebP.');
      event.target.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('Kich thuoc hinh anh khong duoc vuot qua 10MB.');
      event.target.value = '';
      return;
    }

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
      patchConfig({
        assetId: result.assetId,
        imageHash: result.imageHash,
        perceptualHash: result.perceptualHash,
      });
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'Tai anh len that bai. Vui long thu lai.'
      );
      patchConfig({
        assetId: undefined,
        imageHash: undefined,
        perceptualHash: undefined,
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

    patchConfig({
      assetId: undefined,
      imageHash: undefined,
      perceptualHash: undefined,
    });
  };

  const hasSavedImage = Boolean(config?.assetId && config?.imageHash);

  return (
    <div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50/40 p-4">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_240px]">
        <div>
          <p className="text-xs font-semibold text-slate-600">
            Anh chuan de xac dinh dung anh can cham
          </p>
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
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-xs font-semibold text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading ? (
              <ProgressIndicator variant="circular" shape="wavy" showTrack size={15} aria-label="Dang tai len..." />
            ) : (
              <Icon name="upload" variant="rounded" size={15} />
            )}
            {uploading
              ? 'Dang tai len...'
              : fileName || hasSavedImage
                ? 'Thay doi anh chuan'
                : 'Chon anh chuan'}
          </button>

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
                title="Xoa anh"
              >
                <Icon name="close" variant="rounded" size={13} />
              </button>
            </div>
          )}

          <p className="mt-1.5 text-[11px] text-slate-400">
            Nen chon anh goc trong file dap an. He thong tu tinh hash, khong can nhap tay.
          </p>

          {error && (
            <p className="mt-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-[11px] text-red-600">
              {error}
            </p>
          )}

          {!error && !uploading && hasSavedImage && (
            <p className="mt-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700">
              Da luu anh va hash tren server.
            </p>
          )}
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold text-slate-600">Xem truoc</p>
          {previewUrl ? (
            <div className="relative flex h-36 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-2">
              <img src={previewUrl} alt="Picture style preview" className="h-full w-full object-contain" />
              <button
                type="button"
                onClick={handleRemoveImage}
                disabled={uploading}
                className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm ring-1 ring-slate-200 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                title="Xoa anh"
              >
                <Icon name="close" variant="rounded" size={12} />
              </button>
            </div>
          ) : (
            <div className="flex h-36 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white text-center text-[11px] text-slate-400">
              Chua chon anh chuan
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="text-xs font-semibold text-slate-600">
          Kieu Picture Style can cham
          <select
            value={config?.stylePreset ?? 'simpleFrameBlack'}
            onChange={handleStylePresetChange}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition hover:border-slate-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
          >
            {stylePresetOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-[11px] leading-5 text-amber-800">
          Simple Frame, Black se fail neu anh co shadow/effect, nen Moderate Frame, Black khong duoc tinh dung.
        </div>
        <label className="text-xs font-semibold text-slate-600">
          Source file
          <input
            value={config?.sourceFile ?? 'word/document.xml'}
            onChange={(e) => patchConfig({ sourceFile: e.target.value })}
            placeholder="word/document.xml"
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition hover:border-slate-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
          />
        </label>
        <label className="text-xs font-semibold text-slate-600">
          Rels file
          <input
            value={config?.relsFile ?? 'word/_rels/document.xml.rels'}
            onChange={(e) => patchConfig({ relsFile: e.target.value })}
            placeholder="word/_rels/document.xml.rels"
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition hover:border-slate-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
          />
        </label>
        <label className="text-xs font-semibold text-slate-600">
          Anh thu may neu khong chon anh chuan
          <input
            type="number"
            min={1}
            step={1}
            value={config?.targetImageIndex ?? 1}
            onChange={(e) => patchConfig({ targetImageIndex: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="1"
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition hover:border-slate-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
          />
        </label>
        <label className="text-xs font-semibold text-slate-600">
          Mau vien can co
          <select
            value={config?.requiredLineColor ?? '000000'}
            onChange={(e) => patchConfig({ requiredLineColor: e.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition hover:border-slate-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
          >
            {lineColorOptions.map((option) => (
              <option key={option.value || 'none'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-600">
          Do day vien toi thieu
          <input
            type="number"
            min={1}
            step={1}
            value={config?.minLineWidth ?? ''}
            onChange={(e) => patchConfig({ minLineWidth: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="De trong neu khong chac"
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition hover:border-slate-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
          />
        </label>
        <label className="text-xs font-semibold text-slate-600">
          Dang khung/hinh anh
          <select
            value={config?.presetGeometry ?? 'rect'}
            onChange={(e) => patchConfig({ presetGeometry: e.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition hover:border-slate-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
          >
            {geometryOptions.map((option) => (
              <option key={option.value || 'none'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
};

export default PictureStyleEditor;
