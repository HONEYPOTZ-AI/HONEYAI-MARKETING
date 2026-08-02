import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();
export const linkedinRouter = Router();

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID || '';
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET || '';
const LINKEDIN_REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:3001/api/auth/linkedin/callback';

// GET /api/auth/linkedin — initiate OAuth flow
linkedinRouter.get('/', (req: Request, res: Response) => {
  if (!LINKEDIN_CLIENT_ID) {
    return res.status(500).json({ error: 'LinkedIn client ID not configured' });
  }
  const state = Buffer.from(JSON.stringify({ teamId: (req as any).teamId })).toString('base64');
  const url = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(LINKEDIN_REDIRECT_URI)}&scope=openid%20profile%20email%20w_member_social&state=${state}`;
  res.json({ success: true, data: { url } });
});

// GET /api/auth/linkedin/callback — OAuth callback
linkedinRouter.get('/callback', async (req: Request, res: Response) => {
  const { code, state, error } = req.query;

  if (error || !code) {
    return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/settings?linkedin=error`);
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code as string,
        redirect_uri: LINKEDIN_REDIRECT_URI,
        client_id: LINKEDIN_CLIENT_ID,
        client_secret: LINKEDIN_CLIENT_SECRET,
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('LinkedIn token exchange failed:', tokenRes.status, errText);
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/settings?linkedin=error&reason=token_exchange`);
    }

    const tokens: any = await tokenRes.json();

    // Get user profile from OpenID Connect
    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (profileRes.ok) {
      const profile: any = await profileRes.json();

      // Store connection in DB if we have a team context
      if (state) {
        try {
          const decoded = JSON.parse(Buffer.from(state as string, 'base64').toString());
          if (decoded.teamId) {
            await prisma.oAuthConnection.upsert({
              where: { platform_providerAccountId: { platform: 'linkedin', providerAccountId: profile.sub } },
              update: { accessToken: tokens.access_token, refreshToken: tokens.refresh_token || '', tokenExpiry: new Date(Date.now() + (tokens.expires_in || 5184000) * 1000), profileData: profile },
              create: { teamId: decoded.teamId, platform: 'linkedin', providerAccountId: profile.sub, accessToken: tokens.access_token, refreshToken: tokens.refresh_token || '', tokenExpiry: new Date(Date.now() + (tokens.expires_in || 5184000) * 1000), profileData: profile },
            });
          }
        } catch (e) {
          console.error('Failed to store LinkedIn connection:', e);
        }
      }
    }

    return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/settings?linkedin=connected`);
  } catch (err: any) {
    console.error('LinkedIn callback error:', err);
    return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/settings?linkedin=error`);
  }
});

// GET /api/auth/linkedin/status — check connection status
linkedinRouter.get('/status', async (req: AuthRequest, res: Response) => {
  const connection = await prisma.oAuthConnection.findFirst({
    where: { teamId: req.teamId, platform: 'linkedin' },
    select: { id: true, isActive: true, tokenExpiry: true, profileData: true, createdAt: true },
  });
  res.json({ success: true, data: connection });
});

// POST /api/auth/linkedin/disconnect
linkedinRouter.post('/disconnect', async (req: AuthRequest, res: Response) => {
  await prisma.oAuthConnection.deleteMany({ where: { teamId: req.teamId, platform: 'linkedin' } });
  res.json({ success: true, message: 'Disconnected' });
});

// POST /api/posts/linkedin/post — publish a post to LinkedIn
linkedinRouter.post('/post', async (req: AuthRequest, res: Response) => {
  try {
    const connection = await prisma.oAuthConnection.findFirst({
      where: { teamId: req.teamId, platform: 'linkedin', isActive: true },
    });

    if (!connection) {
      return res.status(400).json({ success: false, error: 'LinkedIn not connected. Connect in Settings first.' });
    }

    const { content, postId } = req.body;
    const profileData = connection.profileData as any;
    const personUrn = profileData?.sub ? `urn:li:person:${profileData.sub}` : 'urn:li:person:me';

    const postRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${connection.accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author: personUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: content },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
      }),
    });

    if (!postRes.ok) {
      const errText = await postRes.text();
      console.error('LinkedIn post failed:', postRes.status, errText);
      return res.status(502).json({ success: false, error: 'LinkedIn publish failed' });
    }

    // Update the scheduled post status if postId provided
    if (postId) {
      await prisma.scheduledPost.update({ where: { id: postId }, data: { status: 'published', publishedAt: new Date() } });
    }

    res.json({ success: true, data: { message: 'Published to LinkedIn' } });
  } catch (err: any) {
    console.error('LinkedIn post error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});