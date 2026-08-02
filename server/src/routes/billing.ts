import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();
export const billingRouter = Router();

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || '';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

const stripe = new Stripe(STRIPE_SECRET, { apiVersion: '2025-06-30.acacia' as any });

const PLAN_PRICES: Record<string, { month: string; year: string }> = {
  starter: { month: 'price_starter_monthly', year: 'price_starter_yearly' },
  pro: { month: 'price_pro_monthly', year: 'price_pro_yearly' },
  enterprise: { month: 'price_enterprise_monthly', year: 'price_enterprise_yearly' },
};

billingRouter.get('/subscription', async (req: AuthRequest, res: Response) => {
  const subscription = await prisma.subscription.findFirst({
    where: { teamId: req.teamId },
    orderBy: { currentPeriodStart: 'desc' },
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
  if (!STRIPE_SECRET) return res.json({ success: true, data: [] });
  try {
    const subscription = await prisma.subscription.findFirst({
      where: { teamId: req.teamId },
      orderBy: { currentPeriodStart: 'desc' },
    });
    if (!subscription?.stripeCustomerId) return res.json({ success: true, data: [] });
    const invoices = await stripe.invoices.list({ customer: subscription.stripeCustomerId, limit: 12 });
    res.json({ success: true, data: invoices.data.map(inv => ({
      id: inv.id, number: inv.number, amount: inv.amount_paid / 100, currency: inv.currency,
      status: inv.status, pdf: inv.invoice_pdf, date: inv.created,
    })) });
  } catch { res.json({ success: true, data: [] }); }
});

billingRouter.post('/checkout', async (req: AuthRequest, res: Response) => {
  if (!STRIPE_SECRET) return res.status(500).json({ error: 'Stripe not configured' });
  const { planId, interval }: { planId: string; interval: 'month' | 'year' } = req.body;
  const priceId = PLAN_PRICES[planId]?.[interval];
  if (!priceId) return res.status(400).json({ error: 'Invalid plan or interval' });

  try {
    let subscription = await prisma.subscription.findFirst({
      where: { teamId: req.teamId },
      orderBy: { currentPeriodStart: 'desc' },
    });

    let customerId = subscription?.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.userEmail || undefined,
        metadata: { teamId: req.teamId! },
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${CLIENT_URL}/dashboard/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${CLIENT_URL}/dashboard/billing?canceled=true`,
      metadata: { teamId: req.teamId!, planId, interval },
    });

    await prisma.subscription.upsert({
      where: { id: subscription?.id || 'none' },
      update: { stripeCustomerId: customerId, planId: planId },
      create: { teamId: req.teamId!, stripeCustomerId: customerId, tier: 'free', status: 'inactive', planId: planId },
    });

    res.json({ success: true, data: { url: session.url } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Portal link for managing subscription
billingRouter.post('/portal', async (req: AuthRequest, res: Response) => {
  if (!STRIPE_SECRET) return res.status(500).json({ error: 'Stripe not configured' });
  try {
    const subscription = await prisma.subscription.findFirst({
      where: { teamId: req.teamId },
      orderBy: { currentPeriodStart: 'desc' },
    });
    if (!subscription?.stripeCustomerId) return res.status(400).json({ error: 'No subscription' });
    const portal = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${CLIENT_URL}/dashboard/billing`,
    });
    res.json({ success: true, data: { url: portal.url } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});