import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();
export const campaignRouter = Router();

campaignRouter.get('/', async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '20', status } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const where: any = { teamId: req.teamId };
  if (status) where.status = status;

  const [data, total] = await Promise.all([
    prisma.campaign.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' }, include: { creator: { select: { fullName: true } } } }),
    prisma.campaign.count({ where }),
  ]);

  res.json({ success: true, data, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } });
});

campaignRouter.post('/', async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    name: z.string().min(2),
    type: z.enum(['email', 'sms', 'linkedin', 'multi']),
    scheduledAt: z.string().datetime().optional(),
    channelConfig: z.record(z.unknown()).optional(),
  });
  const data = schema.parse(req.body);
  const campaign = await prisma.campaign.create({
    data: { ...data, teamId: req.teamId!, createdBy: req.userId! },
  });
  res.status(201).json({ success: true, data: campaign });
});

campaignRouter.patch('/:id', async (req: AuthRequest, res: Response) => {
  const { status, name } = req.body;
  const campaign = await prisma.campaign.update({
    where: { id: req.params.id, teamId: req.teamId },
    data: { ...(status && { status }), ...(name && { name }) },
  });
  res.json({ success: true, data: campaign });
});

campaignRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  await prisma.campaign.delete({ where: { id: req.params.id, teamId: req.teamId } });
  res.json({ success: true, message: 'Campaign deleted' });
});