/* eslint-disable @typescript-eslint/no-explicit-any */
import { validateFileType, validateFileSize, truncateText, formatFileSize } from '../lib/utils';

describe('validateFileType', () => {
  it('accepts .csv extension', () => {
    const file = { name: 'leads.csv', type: '' } as File;
    expect(validateFileType(file)).toBe(true);
  });

  it('accepts text/csv MIME type', () => {
    const file = { name: 'leads', type: 'text/csv' } as File;
    expect(validateFileType(file)).toBe(true);
  });

  it('rejects non-CSV files', () => {
    const file = { name: 'report.xlsx', type: 'application/vnd.ms-excel' } as File;
    expect(validateFileType(file)).toBe(false);
  });
});

describe('validateFileSize', () => {
  it('accepts files within limit', () => {
    const file = { size: 1024 * 1024 } as File; // 1 MB
    expect(validateFileSize(file, 5 * 1024 * 1024)).toBe(true);
  });

  it('rejects files over limit', () => {
    const file = { size: 6 * 1024 * 1024 } as File; // 6 MB
    expect(validateFileSize(file, 5 * 1024 * 1024)).toBe(false);
  });

  it('accepts files exactly at limit', () => {
    const file = { size: 5 * 1024 * 1024 } as File; // exactly 5 MB
    expect(validateFileSize(file, 5 * 1024 * 1024)).toBe(true);
  });
});

describe('truncateText', () => {
  it('returns text unchanged if within limit', () => {
    expect(truncateText('hello', 10)).toBe('hello');
  });

  it('truncates and adds ellipsis if over limit', () => {
    const result = truncateText('Hello World', 5);
    expect(result).toBe('Hello…');
    expect(result.length).toBeLessThanOrEqual(6);
  });
});

describe('formatFileSize', () => {
  it('formats bytes', () => {
    expect(formatFileSize(512)).toBe('512 B');
  });

  it('formats kilobytes', () => {
    expect(formatFileSize(2048)).toBe('2.0 KB');
  });

  it('formats megabytes', () => {
    expect(formatFileSize(2 * 1024 * 1024)).toBe('2.0 MB');
  });
});
