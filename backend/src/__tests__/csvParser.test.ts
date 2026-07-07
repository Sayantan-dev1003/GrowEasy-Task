import { parseCSVBuffer, chunkArray, isEmptyRow } from '../services/csvParser.service';

describe('parseCSVBuffer', () => {
  it('parses a simple CSV correctly', () => {
    const csv = `name,email,phone\nJohn Doe,john@example.com,9876543210\nJane Smith,jane@example.com,9123456789`;
    const result = parseCSVBuffer(Buffer.from(csv));
    expect(result.headers).toEqual(['name', 'email', 'phone']);
    expect(result.totalRows).toBe(2);
    expect(result.rows[0]).toEqual({ name: 'John Doe', email: 'john@example.com', phone: '9876543210' });
  });

  it('handles empty file', () => {
    const result = parseCSVBuffer(Buffer.from(''));
    expect(result.rows).toHaveLength(0);
    expect(result.warnings).toContain('File is empty');
  });

  it('handles headers-only CSV', () => {
    const result = parseCSVBuffer(Buffer.from('name,email,phone\n'));
    expect(result.rows).toHaveLength(0);
    expect(result.warnings.some((w: string) => w.includes('no data rows'))).toBe(true);
  });

  it('strips UTF-8 BOM character', () => {
    const csv = '\uFEFFname,email\nJohn,john@example.com';
    const result = parseCSVBuffer(Buffer.from(csv));
    expect(result.headers[0]).toBe('name');
  });

  it('deduplicates duplicate headers', () => {
    const csv = 'name,email,name\nJohn,john@example.com,JohnDoe';
    const result = parseCSVBuffer(Buffer.from(csv));
    expect(result.headers).toContain('name');
    expect(result.headers).toContain('name_1');
    expect(result.warnings.some((w: string) => w.includes('Duplicate header'))).toBe(true);
  });

  it('handles rows with fewer columns than headers', () => {
    const csv = 'name,email,phone\nJohn,john@example.com';
    const result = parseCSVBuffer(Buffer.from(csv));
    expect(result.rows[0]['phone']).toBe('');
  });

  it('trims whitespace from values', () => {
    const csv = 'name, email\n  John  ,  john@example.com  ';
    const result = parseCSVBuffer(Buffer.from(csv));
    expect(result.rows[0]['name']).toBe('John');
  });
});

describe('chunkArray', () => {
  it('splits an array into chunks of given size', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7];
    const chunks = chunkArray(arr, 3);
    expect(chunks).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
  });

  it('returns single chunk if array is smaller than size', () => {
    const arr = [1, 2];
    const chunks = chunkArray(arr, 5);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toEqual([1, 2]);
  });

  it('returns empty array for empty input', () => {
    expect(chunkArray([], 5)).toEqual([]);
  });

  it('throws for chunk size <= 0', () => {
    expect(() => chunkArray([1, 2], 0)).toThrow('Chunk size must be > 0');
  });

  it('handles exact divisibility', () => {
    const arr = [1, 2, 3, 4];
    const chunks = chunkArray(arr, 2);
    expect(chunks).toEqual([[1, 2], [3, 4]]);
  });
});

describe('isEmptyRow', () => {
  it('returns true for an all-empty row', () => {
    expect(isEmptyRow({ name: '', email: '  ', phone: '' })).toBe(true);
  });

  it('returns false for a row with any content', () => {
    expect(isEmptyRow({ name: 'John', email: '' })).toBe(false);
  });
});
