import { parse } from 'csv-parse/sync';
import type { ParseCSVResult, RawRow } from '../types';

/**
 * Parses a CSV buffer into an array of raw row objects.
 * Handles: duplicate headers, malformed rows, BOM characters, empty files.
 */
export function parseCSVBuffer(buffer: Buffer): ParseCSVResult {
  const warnings: string[] = [];

  // Strip UTF-8 BOM if present
  const content = buffer.toString('utf-8').replace(/^\uFEFF/, '');

  if (!content.trim()) {
    return { rows: [], headers: [], totalRows: 0, warnings: ['File is empty'] };
  }

  let rawRecords: string[][];
  try {
    rawRecords = parse(content, {
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true,
      trim: true,
    }) as string[][];
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown parse error';
    throw new Error(`CSV parse error: ${message}`);
  }

  if (rawRecords.length === 0) {
    return { rows: [], headers: [], totalRows: 0, warnings: ['File is empty'] };
  }

  // First row is headers
  const rawHeaders = rawRecords[0];
  if (!rawHeaders || rawHeaders.length === 0) {
    return { rows: [], headers: [], totalRows: 0, warnings: ['No headers found'] };
  }

  // De-duplicate headers by appending _1, _2, etc.
  const seenHeaders = new Map<string, number>();
  const headers = rawHeaders.map((h) => {
    const normalized = (h || 'column').trim();
    if (seenHeaders.has(normalized)) {
      const count = (seenHeaders.get(normalized) ?? 0) + 1;
      seenHeaders.set(normalized, count);
      warnings.push(`Duplicate header "${normalized}" renamed to "${normalized}_${count}"`);
      return `${normalized}_${count}`;
    }
    seenHeaders.set(normalized, 0);
    return normalized;
  });

  const dataRows = rawRecords.slice(1);

  if (dataRows.length === 0) {
    return { rows: [], headers, totalRows: 0, warnings: ['File has headers but no data rows'] };
  }

  const rows: RawRow[] = dataRows.map((record, rowIndex) => {
    const row: RawRow = {};
    headers.forEach((header, colIndex) => {
      row[header] = (record[colIndex] ?? '').trim();
    });

    // If row has more columns than headers, append to a special "_extra" field
    if (record.length > headers.length) {
      const extra = record.slice(headers.length).filter(Boolean).join(', ');
      if (extra) {
        row['_extra'] = extra;
        if (rowIndex === 0) {
          warnings.push('Some rows have more columns than headers; extra values captured in "_extra"');
        }
      }
    }
    return row;
  });

  return { rows, headers, totalRows: rows.length, warnings };
}

/**
 * Checks whether a raw row is completely empty (all values are blank).
 */
export function isEmptyRow(row: RawRow): boolean {
  return Object.values(row).every((v) => !v || v.trim() === '');
}

/**
 * Splits a raw rows array into batches of a given size.
 */
export function chunkArray<T>(arr: T[], size: number): T[][] {
  if (size <= 0) throw new Error('Chunk size must be > 0');
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}
