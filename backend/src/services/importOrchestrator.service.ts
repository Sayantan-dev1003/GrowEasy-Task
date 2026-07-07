import pLimit from 'p-limit';
import { chunkArray } from './csvParser.service';
import { extractBatch, withRetry } from './aiExtractor.service';
import type { CRMRecord, RawRow, SkippedRow, SSEEvent } from '../types';

export interface OrchestratorOptions {
  batchSize?: number;
  concurrency?: number;
  maxRetries?: number;
  filename?: string;
  importId?: string;
}

export type SSECallback = (event: SSEEvent) => void;

/**
 * Orchestrates the full import pipeline:
 * 1. Chunks rows into batches
 * 2. Processes batches concurrently with rate limiting
 * 3. Retries failed batches with exponential backoff
 * 4. Streams progress events via callback
 * 5. Returns aggregated results
 */
export async function orchestrateImport(
  rows: RawRow[],
  onEvent: SSECallback,
  options: OrchestratorOptions = {}
): Promise<{ records: CRMRecord[]; skipped: SkippedRow[] }> {
  const batchSize = options.batchSize ?? parseInt(process.env.BATCH_SIZE || '20', 10);
  const concurrency = options.concurrency ?? parseInt(process.env.BATCH_CONCURRENCY || '3', 10);
  const maxRetries = options.maxRetries ?? parseInt(process.env.BATCH_MAX_RETRIES || '3', 10);

  const batches = chunkArray(rows, batchSize);
  const totalBatches = batches.length;

  const allRecords: CRMRecord[] = [];
  const allSkipped: SkippedRow[] = [];

  const limit = pLimit(concurrency);

  const batchResults = await Promise.all(
    batches.map((batch, batchIndex) =>
      limit(async () => {
        let batchRecords: CRMRecord[] = [];
        let batchSkipped: SkippedRow[] = [];

        try {
          const result = await withRetry(() => extractBatch(batch), maxRetries);
          batchRecords = result.records;
          batchSkipped = result.skipped;
        } catch (err) {
          console.error(`Batch ${batchIndex + 1} permanently failed after ${maxRetries} retries:`, err);
          // Mark all rows in this batch as skipped due to AI failure
          batchSkipped = batch.map((row) => ({
            row,
            reason: 'AI extraction failed after max retries',
          }));
        }

        // Stream progress event
        onEvent({
          type: 'progress',
          batchIndex: batchIndex + 1,
          totalBatches,
          batchRecords,
          batchSkipped,
        });

        return { batchRecords, batchSkipped };
      })
    )
  );

  batchResults.forEach(({ batchRecords, batchSkipped }) => {
    allRecords.push(...batchRecords);
    allSkipped.push(...batchSkipped);
  });

  return { records: allRecords, skipped: allSkipped };
}
