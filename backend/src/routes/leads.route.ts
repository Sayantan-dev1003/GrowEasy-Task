import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: { importedAt: 'desc' },
      take: 50
    });
    res.json({ leads });
  } catch (error) {
    console.error('Failed to fetch leads:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

export default router;
