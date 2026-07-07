/**
 * Client-side utility functions for CSV validation.
 * These are tested independently of React components.
 */

export function validateFileType(file: File): boolean {
  return file.name.endsWith('.csv') || file.type === 'text/csv';
}

export function validateFileSize(file: File, maxBytes: number = 5 * 1024 * 1024): boolean {
  return file.size <= maxBytes;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '…';
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
