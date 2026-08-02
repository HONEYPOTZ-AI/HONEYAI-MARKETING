import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();
export const crmRouter = Router();

// ── Contacts ──────────────────────────────────────────────────────────────
crmRouter.get('/contacts', async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '50', stage, search } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const where: any = { teamId: req.teamId };
  if (stage) where.stage = stage;
  if (search) where.OR = [{ fullName: { contains: search as string, mode: 'insensitive' } }, { email: { contains: search as string, mode: 'insensitive' } }, { companyName: { contains: search as string, mode: 'insensitive' } }];

  const [data, total] = await Promise.all([
    prisma.contact.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' } }),
    prisma.contact.count({ where }),
  ]);
  res.json({ success: true, data, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } });
});

crmRouter.post('/contacts', async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    fullName: z.string(), firstName: z.string().optional(), lastName: z.string().optional(),
    email: z.string().email().optional(), phone: z.string().optional(), companyName: z.string().optional(),
    position: z.string().optional(), linkedinUrl: z.string().optional(), tags: z.array(z.string()).optional(),
  });
  const contact = await prisma.contact.create({ data: { ...schema.parse(req.body), teamId: req.teamId!, tags: JSON.stringify(req.body.tags || []) } });
  res.status(201).json({ success: true, data: contact });
});

crmRouter.patch('/contacts/:id', async (req: AuthRequest, res: Response) => {
  const { stage, score } = req.body;
  const contact = await prisma.contact.update({
    where: { id: req.params.id, teamId: req.teamId },
    data: { ...(stage && { stage }), ...(score !== undefined && { score }) },
  });
  res.json({ success: true, data: contact });
});

// ── Deals ─────────────────────────────────────────────────────────────────
crmRouter.get('/deals', async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '50', stage } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const where: any = { teamId: req.teamId };
  if (stage) where.stage = stage;
  const [data, total] = await Promise.all([
    prisma.deal.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' }, include: { contact: { select: { fullName: true, email: true } } } }),
    prisma.deal.count({ where }),
  ]);
  res.json({ success: true, data, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } });
});

crmRouter.post('/deals', async (req: AuthRequest, res: Response) => {
  const schema = z.object({ contactId: z.string(), name: z.string(), value: z.number().optional(), currency: z.string().optional(), stage: z.string().optional(), probability: z.number().optional(), expectedCloseDate: z.string().datetime().optional() });
  const deal = await prisma.deal.create({ data: { ...schema.parse(req.body), teamId: req.teamId! } });
  res.status(201).json({ success: true, data: deal });
});

// ── Activities ────────────────────────────────────────────────────────────
crmRouter.get('/activities', async (req: AuthRequest, res: Response) => {
  const { contactId, page = '1', limit = '50' } = req.query;
  const where: any = { teamId: req.teamId };
  if (contactId) where.contactId = contactId;
  const skip = (Number(page) - 1) * Number(limit);
  const [data, total] = await Promise.all([
    prisma.activity.findMany({ where, skip, take: Number(limit), orderBy: { performedAt: 'desc' } }),
    prisma.activity.count({ where }),
  ]);
  res.json({ success: true, data, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } });
});

crmRouter.post('/activities', async (req: AuthRequest, res: Response) => {
  const schema = z.object({ contactId: z.string(), type: z.enum(['email', 'call', 'meeting', 'note', 'sms', 'linkedin']), description: z.string() });
  const activity = await prisma.activity.create({ data: { ...schema.parse(req.body), teamId: req.teamId!, performedBy: req.userId! } });
  res.status(201).json({ success: true, data: activity });
});