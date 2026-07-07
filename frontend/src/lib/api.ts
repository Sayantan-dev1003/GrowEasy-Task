import type { CRMRecord, SkippedRow } from '@/types';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export interface ExtractProgressEvent {
  type: 'progress';
  batchIndex: number;
  totalBatches: number;
  batchRecords: CRMRecord[];
  batchSkipped: SkippedRow[];
}

export interface ExtractCompleteEvent {
  type: 'complete';
  totalImported: number;
  totalSkipped: number;
  importId?: string;
}

export interface ExtractErrorEvent {
  type: 'error';
  message: string;
}

export type ExtractEvent = ExtractProgressEvent | ExtractCompleteEvent | ExtractErrorEvent;

/**
 * Streams AI extraction results from the backend via fetch + ReadableStream.
 * Calls onEvent for each SSE event as it arrives.
 * Returns a promise that resolves when the stream ends.
 */
export async function extractLeads(
  file: File,
  onEvent: (event: ExtractEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${BACKEND_URL}/api/extract`, {
    method: 'POST',
    body: formData,
    signal,
  });

  if (!response.ok) {
    let errorMessage = `Server error: ${response.status}`;
    try {
      const errBody = await response.json();
      errorMessage = errBody.error || errorMessage;
    } catch {}
    throw new Error(errorMessage);
  }

  if (!response.body) {
    throw new Error('No response body received from server');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Split on double newlines (SSE event delimiter)
      const events = buffer.split('\n\n');
      buffer = events.pop() ?? ''; // Keep incomplete trailing data

      for (const eventStr of events) {
        const dataLine = eventStr.trim();
        if (dataLine.startsWith('data: ')) {
          const jsonStr = dataLine.slice(6);
          try {
            const event = JSON.parse(jsonStr) as ExtractEvent;
            onEvent(event);
          } catch (parseErr) {
            console.warn('Failed to parse SSE event:', jsonStr, parseErr);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Checks backend health.
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_URL}/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}
