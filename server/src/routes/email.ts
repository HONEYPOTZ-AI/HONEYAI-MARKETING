import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { sendEmail, isConfigured as isEmailConfigured } from '../services/email';

const prisma = new PrismaClient();
export const emailRouter = Router();

// ── Templates ─────────────────────────────────────────────────────────────
emailRouter.get('/templates', async (req: AuthRequest, res: Response) => {
  const templates = await prisma.emailTemplate.findMany({ where: { teamId: req.teamId }, orderBy: { createdAt: 'desc' } });
  res.json({ success: true, data: templates });
});

emailRouter.post('/templates', async (req: AuthRequest, res: Response) => {
  const schema = z.object({ name: z.string(), subject: z.string(), body: z.string(), type: z.string(), variables: z.array(z.string()).optional() });
  const template = await prisma.emailTemplate.create({ data: { ...schema.parse(req.body), teamId: req.teamId!, variables: JSON.stringify(req.body.variables || []) } });
  res.status(201).json({ success: true, data: template });
});

// ── Sequences ─────────────────────────────────────────────────────────────
emailRouter.get('/sequences', async (req: AuthRequest, res: Response) => {
  const sequences = await prisma.emailSequence.findMany({ where: { teamId: req.teamId }, orderBy: { createdAt: 'desc' } });
  res.json({ success: true, data: sequences });
});

emailRouter.post('/sequences', async (req: AuthRequest, res: Response) => {
  const schema = z.object({ name: z.string(), steps: z.array(z.object({ templateId: z.string(), delayHours: z.number(), condition: z.string().optional() })) });
  const sequence = await prisma.emailSequence.create({ data: { ...schema.parse(req.body), teamId: req.teamId!, steps: JSON.stringify(req.body.steps) } });
  res.status(201).json({ success: true, data: sequence });
});

// ── Send Results ──────────────────────────────────────────────────────────
emailRouter.get('/results', async (req: AuthRequest, res: Response) => {
  const { campaignId, page = '1', limit = '50' } = req.query;
  const where: any = { userId: req.userId };
  if (campaignId) where.campaignId = campaignId;
  const skip = (Number(page) - 1) * Number(limit);
  const [data, total] = await Promise.all([
    prisma.emailSendResult.findMany({ where, skip, take: Number(limit), orderBy: { sentAt: 'desc' } }),
    prisma.emailSendResult.count({ where }),
  ]);
  res.json({ success: true, data, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } });
});

// ── Send Email ────────────────────────────────────────────────────────────
emailRouter.post('/send', async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    to: z.string().email(),
    subject: z.string().min(1),
    body: z.string().min(1),
    templateId: z.string().optional(),
    campaignId: z.string().optional(),
    contactId: z.string().optional(),
  });
  const data = schema.parse(req.body);

  if (!isEmailConfigured()) {
    return res.status(500).json({ success: false, error: 'SendGrid not configured' });
  }

  try {
    const result = await sendEmail({ to: data.to, subject: data.subject, html: data.body });

    // Log the send result
    await prisma.emailSendResult.create({
      data: {
        templateId: data.templateId || '',
        campaignId: data.campaignId || "",
        recipientId: data.to,
        status: 'sent',
        sentAt: new Date(),
        userId: req.userId!,
      },
    });

    res.json({ success: true, data: { messageId: result.messageId, status: 'sent' } });
  } catch (err: any) {
    console.error('Email send error:', err.message);
    res.status(502).json({ success: false, error: 'Email send failed' });
  }
});