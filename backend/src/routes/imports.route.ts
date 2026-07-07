import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

/**
 * GET /api/imports
 * Returns a list of past import jobs for the "Manage Leads" history view.
 */
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const imports = await prisma.import.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        filename: true,
        totalRows: true,
        totalImported: true,
        totalSkipped: true,
        createdAt: true,
      },
    });
    res.json({ imports });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch imports' });
  }
});

/**
 * GET /api/imports/:id
 * Returns metadata for a specific import job.
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const importJob = await prisma.import.findUnique({
      where: { id },
      select: {
        id: true,
        filename: true,
        totalRows: true,
        totalImported: true,
        totalSkipped: true,
        createdAt: true,
      },
    });
    
    if (!importJob) {
      res.status(404).json({ error: 'Import not found' });
      return;
    }
    
    res.json({ importJob });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch import job' });
  }
});

/**
 * GET /api/imports/:id/leads
 * Returns paginated leads for a specific import job.
 */
router.get('/:id/leads', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const page = parseInt(req.query.page as string || '1', 10);
  const limit = parseInt(req.query.limit as string || '50', 10);
  const search = (req.query.search as string || '').trim();

  try {
    const where = {
      importId: id,
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
          { mobileWithoutCountryCode: { contains: search } },
        ],
      } : {}),
    };

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { importedAt: 'asc' },
      }),
      prisma.lead.count({ where }),
    ]);

    res.json({ leads, total, page, limit, hasMore: page * limit < total });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

/**
 * GET /api/imports/:id/skipped
 * Returns paginated skipped rows for a specific import job.
 */
router.get('/:id/skipped', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const page = parseInt(req.query.page as string || '1', 10);
  const limit = parseInt(req.query.limit as string || '50', 10);

  try {
    const where = { importId: id };

    const [skippedRows, total] = await Promise.all([
      prisma.skippedRow.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.skippedRow.count({ where }),
    ]);

    res.json({ skippedRows, total, page, limit, hasMore: page * limit < total });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch skipped rows' });
  }
});

export default router;
