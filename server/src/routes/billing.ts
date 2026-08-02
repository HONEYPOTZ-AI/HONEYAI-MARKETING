import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();
export const billingRouter = Router();

billingRouter.get('/subscription', async (req: AuthRequest, res: Response) => {
  const subscription = await prisma.subscription.findFirst({
    where: { teamId: req.teamId },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: subscription });
});

billingRouter.get('/plans', async (_req: AuthRequest, res: Response) => {
  const plans = [
    { id: 'starter', name: 'Starter', tier: 'starter', pricePerMonth: 49, pricePerYear: 470, currency: 'USD',
      features: ['1 team member', '10 posts/day', '5,000 emails/mo', '500 SMS/mo', '1,000 contacts', '3 platforms', 'Basic AI credits'], isActive: true },
    { id: 'pro', name: 'Professional', tier: 'pro', pricePerMonth: 149, pricePerYear: 1430, currency: 'USD',
      features: ['5 team members', '50 posts/day', '50,000 emails/mo', '5,000 SMS/mo', '10,000 contacts', 'All platforms', '50K AI credits', 'Custom domain', 'Priority support'], isActive: true },
    { id: 'enterprise', name: 'Enterprise', tier: 'enterprise', pricePerMonth: 499, pricePerYear: 4790, currency: 'USD',
      features: ['Unlimited team', 'Unlimited posts', 'Unlimited emails', 'Unlimited SMS', 'Unlimited contacts', 'All platforms', '500K AI credits', 'Custom domain', '24/7 support', 'SSO', 'Dedicated account manager', 'SLA'], isActive: true },
  ];
  const limits = { starter: { maxTeamMembers: 1, maxPostsPerDay: 10, maxEmailsPerMonth: 5000, maxSmsPerMonth: 500, maxContacts: 1000, maxPlatforms: 3, aiCredits: 1000, customDomain: false, prioritySupport: false },
    pro: { maxTeamMembers: 5, maxPostsPerDay: 50, maxEmailsPerMonth: 50000, maxSmsPerMonth: 5000, maxContacts: 10000, maxPlatforms: 10, aiCredits: 50000, customDomain: true, prioritySupport: true },
    enterprise: { maxTeamMembers: -1, maxPostsPerDay: -1, maxEmailsPerMonth: -1, maxSmsPerMonth: -1, maxContacts: -1, maxPlatforms: -1, aiCredits: 500000, customDomain: true, prioritySupport: true } };
  res.json({ success: true, data: plans.map(p => ({ ...p, limits: limits[p.tier as keyof typeof limits] })) });
});

billingRouter.get('/invoices', async (req: AuthRequest, res: Response) => {
  // Stub — in production, fetch from Stripe
  res.json({ success: true, data: [] });
});