export function formatFileSizeRu(bytes: number): string {
  if (bytes <= 0) return "0 Б";
  const k = 1024;
  if (bytes < k) return `${bytes} Б`;
  if (bytes < k * k) {
    const kb = bytes / k;
    return `${Math.round(kb)} КБ`;
  }
  const mb = bytes / (k * k);
  return `${mb.toFixed(1).replace(".", ",")} МБ`;
}

export function getFileTypeLabel(fileName: string, mimeType?: string): string {
  const ext = fileName.split(".").pop()?.toUpperCase();
  if (ext && ext.length <= 5 && /^[A-Z0-9]+$/.test(ext)) {
    return ext;
  }
  if (mimeType?.includes("pdf")) return "PDF";
  if (mimeType?.includes("word") || mimeType?.includes("docx")) return "DOCX";
  if (mimeType?.includes("excel") || mimeType?.includes("spreadsheet")) return "XLSX";
  return "ФАЙЛ";
}
