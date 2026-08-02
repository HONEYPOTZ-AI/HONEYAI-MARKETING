import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest, authorize } from '../middleware/auth';

const prisma = new PrismaClient();
export const userRouter = Router();

userRouter.get('/me', async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, email: true, fullName: true, avatarUrl: true, role: true, teamId: true, isEmailVerified: true, isMfaEnabled: true, createdAt: true },
  });
  res.json({ success: true, data: user });
});

userRouter.patch('/me', async (req: AuthRequest, res: Response) => {
  const schema = z.object({ fullName: z.string().min(2).optional(), avatarUrl: z.string().url().optional() });
  const data = schema.parse(req.body);
  const user = await prisma.user.update({ where: { id: req.userId }, data, select: { id: true, fullName: true, avatarUrl: true } });
  res.json({ success: true, data: user });
});

userRouter.get('/team', async (req: AuthRequest, res: Response) => {
  const team = await prisma.team.findUnique({
    where: { id: req.teamId },
    include: { members: { select: { id: true, email: true, fullName: true, role: true, createdAt: true } }, subscriptions: { take: 1, orderBy: { createdAt: 'desc' } } },
  });
  res.json({ success: true, data: team });
});

userRouter.post('/team/invite', authorize('admin', 'manager'), async (req: AuthRequest, res: Response) => {
  const { email, role } = z.object({ email: z.string().email(), role: z.enum(['admin', 'manager', 'marketer', 'viewer']) }).parse(req.body);
  const user = await prisma.user.create({
    data: { email, fullName: email.split('@')[0], teamId: req.teamId, role },
  });
  res.status(201).json({ success: true, data: user });
});