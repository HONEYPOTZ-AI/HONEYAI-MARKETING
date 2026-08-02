import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { v4 as uuid } from 'uuid';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();
export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'honeyai-dev-secret-key-change-in-production';
const TOKEN_EXPIRY = '24h';
const REFRESH_EXPIRY = '30d';

// ── Schemas ───────────────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  teamName: z.string().optional(),
});

// ── Helpers ───────────────────────────────────────────────────────────────
function generateTokens(user: { id: string; teamId: string | null; role: string }) {
  const accessToken = jwt.sign(
    { userId: user.id, teamId: user.teamId, role: user.role },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
  const refreshToken = jwt.sign(
    { userId: user.id },
    JWT_SECRET,
    { expiresIn: REFRESH_EXPIRY }
  );
  return { accessToken, refreshToken, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() };
}

// ── POST /api/auth/register ──────────────────────────────────────────────
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);
    
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new AppError('Email already registered', 409);

    const passwordHash = await bcrypt.hash(data.password, 12);

    // Create team
    const team = await prisma.team.create({
      data: {
        name: data.teamName || `${data.fullName}'s Team`,
        ownerId: '', // Will update after user creation
      },
    });

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        fullName: data.fullName,
        teamId: team.id,
        role: 'admin',
      },
    });

    // Update team owner
    await prisma.team.update({ where: { id: team.id }, data: { ownerId: user.id } });

    // Create trial subscription
    await prisma.subscription.create({
      data: {
        teamId: team.id,
        planId: 'starter',
        tier: 'starter',
        status: 'trialing',
        currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });

    const tokens = generateTokens(user);
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken: tokens.refreshToken } });

    res.status(201).json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, teamId: user.teamId },
        ...tokens,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation failed', details: err.errors });
      return;
    }
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ success: false, error: err.message });
      return;
    }
    console.error('Register error:', err);
    res.status(500).json({ success: false, error: 'Registration failed' });
  }
});

// ── POST /api/auth/login ─────────────────────────────────────────────────
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: data.email },
      select: { id: true, email: true, passwordHash: true, fullName: true, role: true, teamId: true, isEmailVerified: true },
    });

    if (!user || !user.passwordHash) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    const tokens = generateTokens(user);
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken: tokens.refreshToken, lastLoginAt: new Date() } });

    res.json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, teamId: user.teamId, isEmailVerified: user.isEmailVerified },
        ...tokens,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation failed', details: err.errors });
      return;
    }
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// ── POST /api/auth/refresh ───────────────────────────────────────────────
authRouter.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new AppError('Refresh token required', 400);

    const payload = jwt.verify(refreshToken, JWT_SECRET) as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, refreshToken: true, teamId: true, role: true },
    });

    if (!user || user.refreshToken !== refreshToken) {
      res.status(401).json({ success: false, error: 'Invalid refresh token' });
      return;
    }

    const tokens = generateTokens(user);
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken: tokens.refreshToken } });

    res.json({ success: true, data: tokens });
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ success: false, error: 'Refresh token expired, please login again' });
      return;
    }
    res.status(401).json({ success: false, error: 'Invalid refresh token' });
  }
});

// ── POST /api/auth/logout ────────────────────────────────────────────────
authRouter.post('/logout', async (req: Request, res: Response) => {
  const { userId } = req.body;
  if (userId) {
    await prisma.user.update({ where: { id: userId }, data: { refreshToken: null } });
  }
  res.json({ success: true, message: 'Logged out' });
});

// ── POST /api/auth/magic-link ────────────────────────────────────────────
authRouter.post('/magic-link', async (req: Request, res: Response) => {
  try {
    const { email, redirectTo } = z.object({ email: z.string().email(), redirectTo: z.string().optional() }).parse(req.body);
    
    const token = uuid();
    await prisma.magicLink.create({
      data: {
        email,
        token,
        redirectTo,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    // In production, send via email service
    console.log(`[MagicLink] ${email} → ${process.env.CLIENT_URL}/verify?token=${token}`);

    res.json({ success: true, message: 'Magic link sent to your email' });
  } catch (err) {
    console.error('Magic link error:', err);
    res.status(500).json({ success: false, error: 'Failed to send magic link' });
  }
});

// ── POST /api/auth/verify-magic-link ─────────────────────────────────────
authRouter.post('/verify-magic-link', async (req: Request, res: Response) => {
  try {
    const { token } = z.object({ token: z.string() }).parse(req.body);

    const link = await prisma.magicLink.findUnique({ where: { token } });
    if (!link || link.used || new Date() > link.expiresAt) {
      res.status(400).json({ success: false, error: 'Invalid or expired magic link' });
      return;
    }

    await prisma.magicLink.update({ where: { id: link.id }, data: { used: true } });

    let user = await prisma.user.findUnique({ where: { email: link.email } });
    if (!user) {
      // Auto-create user from magic link
      const team = await prisma.team.create({ data: { name: `${link.email.split('@')[0]}'s Team`, ownerId: '' } });
      user = await prisma.user.create({
        data: { email: link.email, fullName: link.email.split('@')[0], teamId: team.id, role: 'admin', isEmailVerified: true },
      });
      await prisma.team.update({ where: { id: team.id }, data: { ownerId: user.id } });
      await prisma.subscription.create({
        data: { teamId: team.id, planId: 'starter', tier: 'starter', status: 'trialing', currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
      });
    }

    const tokens = generateTokens(user);
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken: tokens.refreshToken, isEmailVerified: true } });

    res.json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, teamId: user.teamId },
        ...tokens,
      },
    });
  } catch (err) {
    console.error('Verify magic link error:', err);
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
});