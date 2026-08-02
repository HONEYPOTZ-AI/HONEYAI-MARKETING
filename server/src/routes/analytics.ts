import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();
export const analyticsRouter = Router();

analyticsRouter.get('/dashboard', async (req: AuthRequest, res: Response) => {
  const teamId = req.teamId!;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalCampaigns, activeCampaigns, totalPosts, scheduledPosts,
    totalContacts, newContactsThisMonth,
    emailSent, emailDelivered, emailOpened, emailClicked,
    smsSent, smsDelivered,
  ] = await Promise.all([
    prisma.campaign.count({ where: { teamId } }),
    prisma.campaign.count({ where: { teamId, status: 'active' } }),
    prisma.scheduledPost.count({ where: { teamId } }),
    prisma.scheduledPost.count({ where: { teamId, status: 'scheduled' } }),
    prisma.contact.count({ where: { teamId } }),
    prisma.contact.count({ where: { teamId, createdAt: { gte: monthStart } } }),
    prisma.emailSendResult.count({ where: { campaign: { teamId } } }),
    prisma.emailSendResult.count({ where: { campaign: { teamId }, status: { in: ['delivered', 'opened', 'clicked'] } } }),
    prisma.emailSendResult.count({ where: { campaign: { teamId }, status: { in: ['opened', 'clicked'] } } }),
    prisma.emailSendResult.count({ where: { campaign: { teamId }, status: 'clicked' } }),
    prisma.smsCampaign.count({ where: { campaign: { teamId } } }),
    prisma.smsCampaign.count({ where: { campaign: { teamId }, status: 'delivered' } }),
  ]);

  res.json({
    success: true,
    data: {
      totalCampaigns, activeCampaigns, totalPosts, scheduledPosts,
      totalContacts, newContactsThisMonth,
      emailStats: { sent: emailSent, delivered: emailDelivered, opened: emailOpened, clicked: emailClicked, bounced: 0, responded: 0, rate: emailSent ? (emailDelivered / emailSent) * 100 : 0 },
      smsStats: { sent: smsSent, delivered: smsDelivered, opened: 0, clicked: 0, responded: 0, bounced: 0, rate: smsSent ? (smsDelivered / smsSent) * 100 : 0 },
      linkedinStats: { sent: totalPosts, delivered: 0, opened: 0, clicked: 0, responded: 0, bounced: 0, rate: 0 },
      dateRange: { start: monthStart.toISOString(), end: now.toISOString() },
    },
  });
});