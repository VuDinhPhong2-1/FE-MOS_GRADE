import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx-js-style';

const ensureExt = (fileName: string, ext: '.xlsx' | '.pdf') =>
  fileName.toLowerCase().endsWith(ext) ? fileName : `${fileName}${ext}`;

const colorProps: Array<keyof CSSStyleDeclaration> = [
  'color',
  'backgroundColor',
  'borderTopColor',
  'borderRightColor',
  'borderBottomColor',
  'borderLeftColor',
  'outlineColor',
  'textDecorationColor',
];

const normalizeColor = (raw: string, cssProp: keyof CSSStyleDeclaration): string => {
  if (!raw || !raw.includes('oklch(')) return raw;

  const probe = document.createElement('span');
  probe.style.position = 'fixed';
  probe.style.left = '-99999px';
  probe.style.top = '0';
  document.body.appendChild(probe);

  try {
    (probe.style as unknown as Record<string, string>)[cssProp as string] = raw;
    const computed = getComputedStyle(probe);
    const resolved = (computed as unknown as Record<string, string>)[cssProp as string];
    return resolved || raw;
  } finally {
    document.body.removeChild(probe);
  }
};

const applySafeComputedStylesForPdf = (sourceRoot: HTMLElement, targetRoot: HTMLElement) => {
  const sourceNodes = [sourceRoot, ...Array.from(sourceRoot.querySelectorAll<HTMLElement>('*'))];
  const targetNodes = [targetRoot, ...Array.from(targetRoot.querySelectorAll<HTMLElement>('*'))];

  for (let i = 0; i < sourceNodes.length && i < targetNodes.length; i += 1) {
    const source = sourceNodes[i];
    const target = targetNodes[i];
    const computed = window.getComputedStyle(source);

    colorProps.forEach((prop) => {
      const value = (computed as unknown as Record<string, string>)[prop as string];
      if (!value) return;
      (target.style as unknown as Record<string, string>)[prop as string] = normalizeColor(
        value,
        prop
      );
    });
  }
};

type ExcelCellValue = string | number;

interface ExcelSheetData {
  sheetName: string;
  header: string[];
  body: ExcelCellValue[][];
  title?: string;
  colWidths?: number[];
}

interface ExportExcelOptions {
  title?: string;
  colWidths?: number[];
  extraSheets?: ExcelSheetData[];
}

const buildStyledSheet = ({
  header,
  body,
  title,
  colWidths,
}: Omit<ExcelSheetData, 'sheetName'>): XLSX.WorkSheet => {
  const sheetTitle = title?.trim() || '';
  const rows: ExcelCellValue[][] = [];
  if (sheetTitle) {
    rows.push([sheetTitle]);
    rows.push([]);
  }
  rows.push(header);
  rows.push(...body);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const headerRowIndex = sheetTitle ? 3 : 1; // 1-based
  const headerRowZeroBased = headerRowIndex - 1;
  const bodyStartRowIndex = headerRowIndex; // 0-based

  const computedWidths = header.map((h, columnIndex) => {
    if (colWidths?.[columnIndex]) {
      return { wch: colWidths[columnIndex] };
    }

    const bodyMax = body.reduce((max, row) => {
      const value = row[columnIndex];
      const cellText = value == null ? '' : String(value);
      return Math.max(max, cellText.length);
    }, 0);

    return { wch: Math.max(12, Math.min(72, Math.max(h.length, bodyMax) + 2)) };
  });
  ws['!cols'] = computedWidths;

  ws['!rows'] = rows.map((row, idx) => {
    if (sheetTitle && idx === 0) return { hpt: 28 };
    if (idx === headerRowZeroBased) return { hpt: 24 };

    const maxLineCount = (row || []).reduce<number>((max, value) => {
      const text = value == null ? '' : String(value);
      const lineCount = Math.max(1, text.split(/\r?\n/).length);
      return Math.max(max, lineCount);
    }, 1);

    const dynamicHeight = 19 + (maxLineCount - 1) * 14;
    return { hpt: Math.min(dynamicHeight, 120) };
  });

  if (sheetTitle && header.length > 0) {
    ws['!merges'] = [
      {
        s: { r: 0, c: 0 },
        e: { r: 0, c: header.length - 1 },
      },
    ];
  }

  if (header.length > 0) {
    const startCol = XLSX.utils.encode_col(0);
    const endCol = XLSX.utils.encode_col(header.length - 1);
    ws['!autofilter'] = {
      ref: `${startCol}${headerRowIndex}:${endCol}${headerRowIndex}`,
    };
  }

  (ws as XLSX.WorkSheet & { ['!freeze']?: unknown })['!freeze'] = {
    xSplit: 0,
    ySplit: headerRowIndex,
    topLeftCell: `A${headerRowIndex + 1}`,
    activePane: 'bottomLeft',
    state: 'frozen',
  };

  const applyCellStyle = (r: number, c: number, style: unknown) => {
    const address = XLSX.utils.encode_cell({ r, c });
    if (!ws[address]) return;
    (ws[address] as XLSX.CellObject & { s?: unknown }).s = style;
  };

  const borderStyle = {
    top: { style: 'thin', color: { rgb: 'D1D5DB' } },
    bottom: { style: 'thin', color: { rgb: 'D1D5DB' } },
    left: { style: 'thin', color: { rgb: 'D1D5DB' } },
    right: { style: 'thin', color: { rgb: 'D1D5DB' } },
  };

  const titleStyle = {
    font: { bold: true, sz: 16, color: { rgb: '1E3A8A' } },
    fill: { fgColor: { rgb: 'DBEAFE' } },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: borderStyle,
  };

  const headerStyle = {
    font: { bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '1E40AF' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: borderStyle,
  };

  const bodyBaseStyle = {
    alignment: { vertical: 'top', wrapText: true, horizontal: 'left' },
    border: borderStyle,
  };

  const totalColumnIndexes = header
    .map((value, idx) => (value.toLowerCase().includes('tổng điểm') ? idx : -1))
    .filter((idx) => idx >= 0);
  const noteColumnIndexes = header
    .map((value, idx) => (value.toLowerCase().includes('ghi chú') ? idx : -1))
    .filter((idx) => idx >= 0);
  const classificationColumnIndexes = header
    .map((value, idx) => (value.toLowerCase().includes('xếp loại') ? idx : -1))
    .filter((idx) => idx >= 0);
  const sttColumnIndexes = header
    .map((value, idx) => (value.toLowerCase() === 'stt' ? idx : -1))
    .filter((idx) => idx >= 0);

  if (sheetTitle) {
    applyCellStyle(0, 0, titleStyle);
  }

  for (let col = 0; col < header.length; col += 1) {
    applyCellStyle(headerRowZeroBased, col, headerStyle);
  }

  for (let rowOffset = 0; rowOffset < body.length; rowOffset += 1) {
    const rowIndex = bodyStartRowIndex + rowOffset;
    const isOddRow = rowOffset % 2 === 1;
    for (let col = 0; col < header.length; col += 1) {
      const cell = body[rowOffset]?.[col];
      const raw = cell == null ? '' : String(cell);

      const style: Record<string, unknown> = {
        ...bodyBaseStyle,
        fill: isOddRow ? { fgColor: { rgb: 'F8FAFC' } } : { fgColor: { rgb: 'FFFFFF' } },
      };

      if (sttColumnIndexes.includes(col)) {
        style.alignment = { horizontal: 'center', vertical: 'top' };
        style.font = { color: { rgb: '334155' }, bold: true };
      }

      if (classificationColumnIndexes.includes(col)) {
        style.alignment = { horizontal: 'center', vertical: 'center' };
        const level = raw.trim().toUpperCase();
        if (level === 'A') style.fill = { fgColor: { rgb: 'DCFCE7' } };
        if (level === 'B') style.fill = { fgColor: { rgb: 'DBEAFE' } };
        if (level === 'C') style.fill = { fgColor: { rgb: 'FEF3C7' } };
        if (level === 'D') style.fill = { fgColor: { rgb: 'FEE2E2' } };
      }

      if (totalColumnIndexes.includes(col)) {
        style.font = { bold: true, color: { rgb: '1D4ED8' } };
        style.fill = { fgColor: { rgb: 'EFF6FF' } };
        style.alignment = { horizontal: 'right', vertical: 'center' };
      }

      if (noteColumnIndexes.includes(col)) {
        style.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
      }

      const isRatioOrNumber = /^-?\d+([.,]\d+)?(\/-?\d+([.,]\d+)?)?$/.test(raw);
      if (!noteColumnIndexes.includes(col) && isRatioOrNumber) {
        style.alignment = { horizontal: 'center', vertical: 'center' };
      }

      applyCellStyle(rowIndex, col, style);
    }
  }

  return ws;
};

export const exportToExcel = (
  fileName: string,
  sheetName: string,
  header: string[],
  body: ExcelCellValue[][],
  options?: ExportExcelOptions
) => {
  const wb = XLSX.utils.book_new();
  const mainSheet = buildStyledSheet({
    header,
    body,
    title: options?.title,
    colWidths: options?.colWidths,
  });
  XLSX.utils.book_append_sheet(wb, mainSheet, sheetName);

  (options?.extraSheets || []).forEach((sheet) => {
    const ws = buildStyledSheet({
      header: sheet.header,
      body: sheet.body,
      title: sheet.title,
      colWidths: sheet.colWidths,
    });
    XLSX.utils.book_append_sheet(wb, ws, sheet.sheetName);
  });

  XLSX.writeFile(wb, ensureExt(fileName, '.xlsx'), {
    bookType: 'xlsx',
    cellStyles: true,
    compression: true,
  });
};

export const exportToPdf = async (elementId: string, fileName: string) => {
  const input = document.getElementById(elementId);
  if (!input) {
    console.error(`Không tìm thấy phần tử với ID: ${elementId}`);
    return;
  }

  const cloneWrapper = document.createElement('div');

  try {
    cloneWrapper.style.position = 'fixed';
    cloneWrapper.style.left = '-100000px';
    cloneWrapper.style.top = '0';
    cloneWrapper.style.zIndex = '-1';
    cloneWrapper.style.background = '#fff';
    cloneWrapper.style.padding = '16px';

    const clone = input.cloneNode(true) as HTMLElement;
    clone.style.maxHeight = 'none';
    clone.style.overflow = 'visible';
    clone.style.width = `${input.scrollWidth}px`;
    applySafeComputedStylesForPdf(input, clone);

    clone.querySelectorAll<HTMLElement>('*').forEach((el) => {
      const computed = window.getComputedStyle(el);
      if (computed.position === 'sticky') {
        el.style.position = 'static';
        el.style.left = 'auto';
        el.style.right = 'auto';
        el.style.zIndex = 'auto';
      }
      if (computed.overflow !== 'visible') {
        el.style.overflow = 'visible';
      }
      if (computed.maxHeight !== 'none') {
        el.style.maxHeight = 'none';
      }
    });

    cloneWrapper.appendChild(clone);
    document.body.appendChild(cloneWrapper);

    const canvas = await html2canvas(clone, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      windowWidth: clone.scrollWidth,
      windowHeight: clone.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/png');
    const orientation = canvas.width > canvas.height ? 'l' : 'p';
    const pdf = new jsPDF(orientation, 'mm', 'a4');

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 8;
    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = margin;

    pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
    heightLeft -= pageHeight - margin * 2;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight + margin;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - margin * 2;
    }

    pdf.save(ensureExt(fileName, '.pdf'));
  } catch (error) {
    console.error('Lỗi khi xuất PDF:', error);
    alert('Không thể xuất file PDF. Vui lòng thử lại.');
  } finally {
    if (cloneWrapper.parentNode) {
      cloneWrapper.parentNode.removeChild(cloneWrapper);
    }
  }
};
