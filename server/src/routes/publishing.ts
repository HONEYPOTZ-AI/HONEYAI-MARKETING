import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();
export const publishingRouter = Router();

publishingRouter.get('/channels', async (req: AuthRequest, res: Response) => {
  const channels = await prisma.publishingChannel.findMany({ where: { teamId: req.teamId } });
  res.json({ success: true, data: channels });
});

publishingRouter.post('/channels', async (req: AuthRequest, res: Response) => {
  const schema = z.object({ platform: z.string(), name: z.string(), credentials: z.record(z.string()).optional(), dailyLimit: z.number().optional() });
  const channel = await prisma.publishingChannel.create({ data: { ...schema.parse(req.body), teamId: req.teamId! } });
  res.status(201).json({ success: true, data: channel });
});

publishingRouter.patch('/channels/:id', async (req: AuthRequest, res: Response) => {
  const { isConnected, credentials, dailyLimit } = req.body;
  const channel = await prisma.publishingChannel.update({
    where: { id: req.params.id, teamId: req.teamId },
    data: { ...(isConnected !== undefined && { isConnected }), ...(credentials && { credentials }), ...(dailyLimit && { dailyLimit }) },
  });
  res.json({ success: true, data: channel });
});

publishingRouter.get('/articles', async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '50', platform } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const where: any = {};
  if (platform) where.platform = platform;
  const [data, total] = await Promise.all([
    prisma.publishedArticle.findMany({ where, skip, take: Number(limit), orderBy: { publishedAt: 'desc' } }),
    prisma.publishedArticle.count({ where }),
  ]);
  res.json({ success: true, data, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } });
});

publishingRouter.post('/articles', async (req: AuthRequest, res: Response) => {
  const schema = z.object({ contentId: z.string(), platform: z.string(), url: z.string(), title: z.string() });
  const article = await prisma.publishedArticle.create({ data: schema.parse(req.body) });
  res.status(201).json({ success: true, data: article });
});