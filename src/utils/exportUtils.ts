import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

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

export const exportToExcel = (
  fileName: string,
  sheetName: string,
  header: string[],
  body: (string | number)[][]
) => {
  const ws = XLSX.utils.aoa_to_sheet([header, ...body]);
  ws['!cols'] = header.map((h) => ({ wch: Math.max(12, h.length + 2) }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, ensureExt(fileName, '.xlsx'), { bookType: 'xlsx' });
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
