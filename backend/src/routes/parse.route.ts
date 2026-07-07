import { Router, Request, Response } from 'express';
import multer from 'multer';
import { parseCSVBuffer } from '../services/csvParser.service';
import type { ParseCSVResult } from '../types';

const router = Router();

// Multer config: memory storage, 5MB limit, CSV only
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
 * POST /api/parse
 * Accepts a CSV file upload, parses it client-side-style on the server,
 * and returns raw rows + headers. No AI involvement.
 */
router.post('/', upload.single('file'), (req: Request, res: Response): void => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  try {
    const result: ParseCSVResult = parseCSVBuffer(req.file.buffer);

    if (result.warnings.length > 0) {
      console.info('CSV parse warnings:', result.warnings);
    }

    res.json({
      success: true,
      filename: req.file.originalname,
      totalRows: result.totalRows,
      headers: result.headers,
      rows: result.rows,
      warnings: result.warnings,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to parse CSV';
    res.status(422).json({ error: message });
  }
});

export default router;
