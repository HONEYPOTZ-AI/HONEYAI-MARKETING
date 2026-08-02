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
    { id: 'starter', name: 'Starter', tier: 'starter', pricePerMonth: 99, pricePerYear: 950, currency: 'USD',
      features: ['3 team members', '25 posts/day', '25,000 emails/mo', '2,500 SMS/mo', '5,000 contacts', '5 platforms', 'Basic AI credits', 'Email support'], isActive: true },
    { id: 'pro', name: 'Professional', tier: 'pro', pricePerMonth: 199, pricePerYear: 1910, currency: 'USD',
      features: ['10 team members', '100 posts/day', '100,000 emails/mo', '10,000 SMS/mo', '25,000 contacts', 'All platforms', '100K AI credits', 'Custom domain', 'Priority support', 'Advanced analytics'], isActive: true },
    { id: 'enterprise', name: 'Enterprise', tier: 'enterprise', pricePerMonth: 499, pricePerYear: 4790, currency: 'USD',
      features: ['Unlimited team', 'Unlimited posts', 'Unlimited emails', 'Unlimited SMS', 'Unlimited contacts', 'All platforms', '500K AI credits', 'Custom domain', '24/7 support', 'SSO', 'Dedicated account manager', 'SLA'], isActive: true },
  ];
  const limits = { starter: { maxTeamMembers: 3, maxPostsPerDay: 25, maxEmailsPerMonth: 25000, maxSmsPerMonth: 2500, maxContacts: 5000, maxPlatforms: 5, aiCredits: 5000, customDomain: false, prioritySupport: false },
    pro: { maxTeamMembers: 10, maxPostsPerDay: 100, maxEmailsPerMonth: 100000, maxSmsPerMonth: 10000, maxContacts: 25000, maxPlatforms: 10, aiCredits: 100000, customDomain: true, prioritySupport: true },
    enterprise: { maxTeamMembers: -1, maxPostsPerDay: -1, maxEmailsPerMonth: -1, maxSmsPerMonth: -1, maxContacts: -1, maxPlatforms: -1, aiCredits: 500000, customDomain: true, prioritySupport: true } };
  res.json({ success: true, data: plans.map(p => ({ ...p, limits: limits[p.tier as keyof typeof limits] })) });
});

billingRouter.get('/invoices', async (req: AuthRequest, res: Response) => {
  // Stub — in production, fetch from Stripe
  res.json({ success: true, data: [] });
});