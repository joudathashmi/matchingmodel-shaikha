import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const CAPTURE_OPTS = {
  backgroundColor: "#0b1220",
  scale: 2,
  useCORS: true,
  logging: false,
} as const;

export async function exportElementPng(element: HTMLElement, filename: string) {
  const canvas = await html2canvas(element, CAPTURE_OPTS);
  const link = document.createElement("a");
  link.download = filename.endsWith(".png") ? filename : `${filename}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

/**
 * Export a DOM node to PDF. Tall reports are sliced across A4 pages
 * so the analytics portal stays readable instead of being shrunk to fit.
 */
export async function exportElementPdf(element: HTMLElement, filename: string) {
  const canvas = await html2canvas(element, CAPTURE_OPTS);
  const img = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "p",
    unit: "pt",
    format: "a4",
  });

  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 24;
  const usableW = pageW - margin * 2;
  const usableH = pageH - margin * 2;
  const imgW = usableW;
  const imgH = (canvas.height * imgW) / canvas.width;

  const fillPage = () => {
    pdf.setFillColor(11, 18, 32);
    pdf.rect(0, 0, pageW, pageH, "F");
  };

  if (imgH <= usableH) {
    fillPage();
    const y = margin + (usableH - imgH) / 2;
    pdf.addImage(img, "PNG", margin, y, imgW, imgH);
  } else {
    // Slice the tall canvas into page-height chunks (in canvas px).
    const pageCanvasH = Math.floor((usableH * canvas.width) / imgW);
    let offsetY = 0;
    let page = 0;

    while (offsetY < canvas.height) {
      if (page > 0) pdf.addPage();
      fillPage();

      const sliceH = Math.min(pageCanvasH, canvas.height - offsetY);
      const slice = document.createElement("canvas");
      slice.width = canvas.width;
      slice.height = sliceH;
      const ctx = slice.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#0b1220";
        ctx.fillRect(0, 0, slice.width, slice.height);
        ctx.drawImage(
          canvas,
          0,
          offsetY,
          canvas.width,
          sliceH,
          0,
          0,
          canvas.width,
          sliceH
        );
      }
      const sliceImg = slice.toDataURL("image/png");
      const drawH = (sliceH * imgW) / canvas.width;
      pdf.addImage(sliceImg, "PNG", margin, margin, imgW, drawH);

      offsetY += sliceH;
      page += 1;
    }
  }

  pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}

export function stampFilename(prefix: string, ext: "png" | "pdf") {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate()
  ).padStart(2, "0")}_${String(d.getHours()).padStart(2, "0")}${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
  return `${prefix}_${stamp}.${ext}`;
}
