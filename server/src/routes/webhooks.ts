import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' });

export const webhookRouter = Router();

webhookRouter.post('/stripe', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const secret = process.env.STRIPE_WEBHOOK_SECRET || '';

  if (!sig || !secret) {
    res.status(400).json({ error: 'Missing signature or webhook secret' });
    return;
  }

  try {
    const event = stripe.webhooks.constructEvent(
      JSON.stringify(req.body), sig, secret
    );
    // const rawBody = req.body; // use raw body parser for Stripe verification

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const teamId = sub.metadata?.teamId;
        if (teamId) {
          await prisma.subscription.updateMany({
            where: { teamId, stripeSubscriptionId: sub.id },
            data: {
              status: sub.status === 'active' ? 'active' : 'past_due',
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
            data: { status: 'cancelled' },
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

webhookRouter.post('/email-events', async (req: Request, res: Response) => {
  // SendGrid / Resend webhook handler
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