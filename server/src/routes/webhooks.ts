import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2025-06-30.acacia' as any });

export const webhookRouter = Router();

// ── Stripe webhook ──────────────────────────────────────────────────────────
webhookRouter.post('/stripe', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const secret = process.env.STRIPE_WEBHOOK_SECRET || '';

  if (!sig || !secret) {
    res.status(400).json({ error: 'Missing signature or webhook secret' });
    return;
  }

  try {
    // Use rawBody if available (set by express.raw middleware), fallback to JSON.stringify
    const rawBody = (req as any).rawBody ? (req as any).rawBody.toString() : JSON.stringify(req.body);
    const event = stripe.webhooks.constructEvent(rawBody, sig, secret);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { teamId, planId } = session.metadata || {};
        if (teamId && planId) {
          await prisma.subscription.upsert({
            where: { teamId },
            create: {
              teamId,
              planId,
              tier: planId,
              status: 'active',
              stripeSubscriptionId: session.subscription as string,
              stripeCustomerId: session.customer as string,
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
            update: {
              planId,
              tier: planId,
              status: 'active',
              stripeSubscriptionId: session.subscription as string,
              stripeCustomerId: session.customer as string,
            },
          });
        }
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const teamId = sub.metadata?.teamId;
        if (teamId) {
          await prisma.subscription.updateMany({
            where: { teamId, stripeSubscriptionId: sub.id },
            data: {
              status: sub.status === 'active' ? 'active' : sub.status === 'past_due' ? 'past_due' : 'cancelled',
              currentPeriodStart: new Date(sub.current_period_start * 1000),
              currentPeriodEnd: new Date(sub.current_period_end * 1000),
            },
          });
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const teamId = sub.metadata?.teamId;
        if (teamId) {
          await prisma.subscription.updateMany({
            where: { teamId, stripeSubscriptionId: sub.id },
            data: { status: 'cancelled', tier: 'free' },
          });
        }
        break;
      }
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          console.log(`Invoice paid for subscription ${invoice.subscription}`);
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error('Stripe webhook error:', err.message);
    res.status(400).json({ error: `Webhook error: ${err.message}` });
  }
});

// ── Email events webhook (SendGrid / Resend) ────────────────────────────────
webhookRouter.post('/email-events', async (req: Request, res: Response) => {
  const events = req.body;
  if (!Array.isArray(events)) {
    res.status(400).json({ error: 'Invalid events format' });
    return;
  }

  for (const event of events) {
    const { email, event: eventType, timestamp } = event;
    if (!email) continue;

    try {
      switch (eventType) {
        case 'delivered':
          await prisma.emailSendResult.updateMany({
            where: { recipientId: email, status: 'sent' },
            data: { status: 'delivered', deliveredAt: new Date(timestamp * 1000) },
          });
          break;
        case 'open':
          await prisma.emailSendResult.updateMany({
            where: { recipientId: email, status: 'delivered' },
            data: { status: 'opened', openedAt: new Date(timestamp * 1000) },
          });
          break;
        case 'click':
          await prisma.emailSendResult.updateMany({
            where: { recipientId: email, status: { in: ['delivered', 'opened'] } },
            data: { status: 'clicked', clickedAt: new Date(timestamp * 1000) },
          });
          break;
        case 'bounce':
          await prisma.emailSendResult.updateMany({
            where: { recipientId: email, status: { in: ['sent', 'queued'] } },
            data: { status: 'bounced' },
          });
          break;
      }
    } catch (err) {
      console.error('Email webhook processing error:', err);
    }
  }

  res.json({ processed: true, count: events.length });
});