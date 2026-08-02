import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { generateText, isConfigured } from '../services/ai';

const prisma = new PrismaClient();
export const postRouter = Router();

postRouter.get('/', async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '20', status, platform } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const where: any = { teamId: req.teamId };
  if (status) where.status = status;
  if (platform) where.platform = platform;

  const [data, total] = await Promise.all([
    prisma.scheduledPost.findMany({ where, skip, take: Number(limit), orderBy: { scheduledFor: 'desc' }, include: { user: { select: { fullName: true } } } }),
    prisma.scheduledPost.count({ where }),
  ]);

  res.json({ success: true, data, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } });
});

postRouter.post('/', async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    content: z.string().min(1).max(3000),
    platform: z.string(),
    scheduledFor: z.string().datetime().optional(),
    imageUrl: z.string().url().optional(),
    tags: z.array(z.string()).optional(),
  });
  const data = schema.parse(req.body);
  const post = await prisma.scheduledPost.create({
    data: { ...data, teamId: req.teamId!, userId: req.userId!, tags: JSON.stringify(data.tags || []) },
  });
  res.status(201).json({ success: true, data: post });
});

postRouter.patch('/:id', async (req: AuthRequest, res: Response) => {
  const { content, status, scheduledFor } = req.body;
  const post = await prisma.scheduledPost.update({
    where: { id: req.params.id, teamId: req.teamId },
    data: { ...(content && { content }), ...(status && { status }), ...(scheduledFor && { scheduledFor: new Date(scheduledFor) }) },
  });
  res.json({ success: true, data: post });
});

postRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  await prisma.scheduledPost.delete({ where: { id: req.params.id, teamId: req.teamId } });
  res.json({ success: true, message: 'Post deleted' });
});

postRouter.post('/generate', async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    topic: z.string().min(2),
    tone: z.enum(['professional', 'casual', 'technical', 'inspirational']).optional(),
    platform: z.string(),
    length: z.enum(['short', 'medium', 'long']).optional(),
  });
  const data = schema.parse(req.body);

  if (!isConfigured()) {
    return res.json({ success: true, data: { content: `[Preview] AI-generated ${data.platform} post about "${data.topic}" — configure Azure OpenAI for real content.`, model: 'preview', tokensUsed: 0 } });
  }

  try {
    const lengthGuide = data.length === 'short' ? '150-300 characters' : data.length === 'long' ? '1000-2000 characters' : '500-1000 characters';
    const instructions = `You are an expert social media copywriter. Write an engaging ${data.platform} post about the given topic. Tone: ${data.tone || 'professional'}. Length: ${lengthGuide}. Make it engaging, include relevant hashtags at the end (3-5 max), use emojis sparingly and only if appropriate for the tone. Format as plain text ready to post.`;
    const prompt = `Write a ${data.platform} post about: ${data.topic}.`;

    const result = await generateText({ prompt, instructions, maxTokens: 800 });
    res.json({ success: true, data: { content: result.text, model: result.model, tokensUsed: result.tokensUsed } });
  } catch (err: any) {
    console.error('Post generation error:', err.message);
    res.status(502).json({ success: false, error: 'AI generation failed' });
  }
});