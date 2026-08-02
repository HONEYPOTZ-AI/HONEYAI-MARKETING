import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();
export const smsRouter = Router();

smsRouter.get('/incentives', async (_req: AuthRequest, res: Response) => {
  const incentives = await prisma.smsIncentive.findMany({ where: { isActive: true } });
  res.json({ success: true, data: incentives });
});

smsRouter.post('/incentives', async (req: AuthRequest, res: Response) => {
  const schema = z.object({ code: z.string(), description: z.string(), discountType: z.enum(['fixed', 'percent']), discountValue: z.number(), maxRedemptions: z.number().optional() });
  const incentive = await prisma.smsIncentive.create({ data: schema.parse(req.body) });
  res.status(201).json({ success: true, data: incentive });
});

smsRouter.get('/opt-ins', async (req: AuthRequest, res: Response) => {
  const optIns = await prisma.smsOptIn.findMany({
    include: { contact: { select: { fullName: true, email: true } } },
    orderBy: { optedInAt: 'desc' },
    take: 100,
  });
  res.json({ success: true, data: optIns });
});

smsRouter.post('/opt-in', async (req: AuthRequest, res: Response) => {
  const { contactId, phoneNumber, incentiveCode } = z.object({ contactId: z.string(), phoneNumber: z.string(), incentiveCode: z.string().optional() }).parse(req.body);
  const optIn = await prisma.smsOptIn.create({ data: { contactId, phoneNumber, incentiveCode, source: 'manual' } });
  await prisma.contact.update({ where: { id: contactId }, data: { smsOptIn: true, smsOptInAt: new Date(), smsOptInSource: 'manual' } });
  res.status(201).json({ success: true, data: optIn });
});

smsRouter.post('/opt-out', async (req: AuthRequest, res: Response) => {
  const { contactId } = z.object({ contactId: z.string() }).parse(req.body);
  await prisma.smsOptIn.updateMany({ where: { contactId, isActive: true }, data: { isActive: false, optedOutAt: new Date() } });
  await prisma.contact.update({ where: { id: contactId }, data: { smsOptIn: false } });
  res.json({ success: true, message: 'Opted out' });
});