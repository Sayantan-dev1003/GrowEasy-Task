import { Router, Request, Response } from 'express';
import multer from 'multer';
import { parseCSVBuffer } from '../services/csvParser.service';
import { orchestrateImport } from '../services/importOrchestrator.service';
import prisma from '../lib/prisma';
import type { SSEEvent, CRMRecord, SkippedRow } from '../types';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are accepted'));
    }
  },
});

/**
 * POST /api/extract
 * Accepts a CSV file upload, parses it, runs AI field extraction in batches,
 * and streams results back via Server-Sent Events (SSE).
 */
router.post('/', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  // --- Set up SSE headers ---
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
  res.flushHeaders();

  const sendEvent = (event: SSEEvent): void => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
    // Flush if available (important for streaming)
    if (typeof (res as unknown as { flush?: () => void }).flush === 'function') {
      (res as unknown as { flush: () => void }).flush();
    }
  };

  const filename = req.file.originalname;
  const allRecords: CRMRecord[] = [];
  const allSkipped: SkippedRow[] = [];

  try {
    // 1. Parse CSV
    const { rows, warnings } = parseCSVBuffer(req.file.buffer);

    if (warnings.length > 0) {
      console.info('Parse warnings:', warnings);
    }

    if (rows.length === 0) {
      sendEvent({ type: 'error', message: 'CSV file has no data rows to process' });
      res.end();
      return;
    }

    // 2. Run AI extraction with streaming progress
    const { records, skipped } = await orchestrateImport(rows, (event) => {
      // Collect results as they stream
      if (event.type === 'progress') {
        allRecords.push(...event.batchRecords);
        allSkipped.push(...event.batchSkipped);
      }
      sendEvent(event);
    });

    // 3. Persist to database (non-blocking on DB failure)
    let importId: string | undefined;
    try {
      const dbImport = await prisma.import.create({
        data: {
          filename,
          totalRows: rows.length,
          totalImported: records.length,
          totalSkipped: skipped.length,
          leads: {
            create: records.map((r) => ({
              createdAt: r.created_at ? new Date(r.created_at) : null,
              name: r.name,
              email: r.email,
              countryCode: r.country_code,
              mobileWithoutCountryCode: r.mobile_without_country_code,
              company: r.company,
              city: r.city,
              state: r.state,
              country: r.country,
              leadOwner: r.lead_owner,
              crmStatus: r.crm_status,
              crmNote: r.crm_note,
              dataSource: r.data_source,
              possessionTime: r.possession_time,
              description: r.description,
            })),
          },
          skippedRows: {
            create: skipped.map((s) => ({
              rawRow: s.row,
              reason: s.reason,
            })),
          },
        },
      });
      importId = dbImport.id;
    } catch (dbErr) {
      console.error('Database persistence failed (non-fatal):', dbErr);
      // Don't fail the response — DB is optional
    }

    // 4. Send completion event
    sendEvent({
      type: 'complete',
      totalImported: records.length,
      totalSkipped: skipped.length,
      importId,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    console.error('Extract error:', err);
    sendEvent({ type: 'error', message });
  } finally {
    res.end();
  }
});

export default router;
