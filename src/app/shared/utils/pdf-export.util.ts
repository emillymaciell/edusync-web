import html2pdf from 'html2pdf.js';

export interface ExportElementToPdfOptions {
  root?: ParentNode;
}

const PDF_EXPORT_MODE_CLASS = 'pdf-export-mode';
const PDF_CAPTURE_WIDTH = 1200;

interface Html2PdfSetOptions {
  margin?: number | [number, number] | [number, number, number, number];
  filename?: string;
  image?: { type?: 'jpeg' | 'png' | 'webp'; quality?: number };
  enableLinks?: boolean;
  html2canvas?: Record<string, unknown>;
  jsPDF?: { unit?: string; format?: string | [number, number]; orientation?: 'portrait' | 'landscape' };
  pagebreak?: {
    mode?: string | string[];
    before?: string | string[];
    after?: string | string[];
    avoid?: string | string[];
  };
}

function isElementVisible(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) {
    return false;
  }

  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function resolveExportElement(elementId: string, root?: ParentNode): HTMLElement {
  const escapedId = CSS.escape(elementId);
  const scopedCandidates = root
    ? Array.from(root.querySelectorAll<HTMLElement>(`#${escapedId}`))
    : [];
  const documentCandidates = Array.from(document.querySelectorAll<HTMLElement>(`#${escapedId}`));

  const candidates = scopedCandidates.length > 0 ? scopedCandidates : documentCandidates;

  if (candidates.length === 0) {
    throw new Error(`Element #${elementId} not found`);
  }

  const visibleCandidate = candidates.find(isElementVisible);
  if (!visibleCandidate) {
    throw new Error(`Element #${elementId} is hidden or not yet rendered`);
  }

  if (documentCandidates.length > 1) {
    console.warn(
      `[pdf-export] Multiple #${elementId} elements detected. Using the first visible instance.`,
      documentCandidates
    );
  }

  return visibleCandidate;
}

async function waitForRender(): Promise<void> {
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await new Promise<void>((resolve) => setTimeout(resolve, 80));
}

async function waitForExportStyles(): Promise<void> {
  await waitForRender();
  await new Promise<void>((resolve) => setTimeout(resolve, 150));
}

export async function exportElementToPdf(
  elementId: string,
  filename: string,
  options?: ExportElementToPdfOptions
): Promise<void> {
  await waitForRender();

  const element = resolveExportElement(elementId, options?.root);
  element.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  await waitForRender();

  element.classList.add(PDF_EXPORT_MODE_CLASS);

  try {
    await waitForExportStyles();

    const pdfOptions: Html2PdfSetOptions = {
      margin: [10, 10, 10, 10],
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: true,
        backgroundColor: '#ffffff',
        width: PDF_CAPTURE_WIDTH,
        windowWidth: PDF_CAPTURE_WIDTH,
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: {
        mode: ['avoid-all', 'css', 'legacy'],
        avoid: [
          '.lesson-section-block',
          '.question-card',
          '.focus-box',
          '.pdf-banner',
          '.pdf-meta',
          '.answer-block',
          '.option-item',
        ],
      },
    };

    await html2pdf().set(pdfOptions).from(element).save();
  } finally {
    element.classList.remove(PDF_EXPORT_MODE_CLASS);
  }
}
