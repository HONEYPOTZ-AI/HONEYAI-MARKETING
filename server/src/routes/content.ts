import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { generateText, isConfigured } from '../services/ai';

const prisma = new PrismaClient();
export const contentRouter = Router();

contentRouter.get('/', async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '20', type } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const where: any = { teamId: req.teamId };
  if (type) where.type = type;

  const [data, total] = await Promise.all([
    prisma.generatedContent.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' } }),
    prisma.generatedContent.count({ where }),
  ]);
  res.json({ success: true, data, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } });
});

contentRouter.post('/generate', async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    topic: z.string().min(2).max(500),
    type: z.enum(['blog', 'social', 'email', 'landing', 'ad']),
    tone: z.enum(['professional', 'casual', 'technical', 'inspirational', 'sales']).optional(),
    length: z.enum(['short', 'medium', 'long']).optional(),
    keywords: z.array(z.string()).optional(),
    targetAudience: z.string().optional(),
    includeSeo: z.boolean().optional(),
    relatedUrls: z.array(z.string()).optional(),
  });
  const data = schema.parse(req.body);

  if (!isConfigured()) {
    // Fallback stub — no Azure OpenAI configured
    const wordCount = data.length === 'short' ? 200 : data.length === 'long' ? 1000 : 600;
    const title = `[Preview] ${data.topic.substring(0, 80)}`;
    const body = `# ${title}\n\nThis is a preview of ${data.type} content about ${data.topic}.\n\nConfigure Azure OpenAI to generate real content.\n\n---\n*Honey AI Preview*`;
    const content = await prisma.generatedContent.create({
      data: { teamId: req.teamId!, title, body, type: data.type, tone: data.tone || 'professional',
        topic: data.topic, keywords: JSON.stringify(data.keywords || []), model: 'preview', tokensUsed: 0 },
    });
    return res.status(201).json({ success: true, data: content });
  }

  try {
    const wordTarget = data.length === 'short' ? 200 : data.length === 'long' ? 1200 : 600;
    const instructions = `You are an expert content writer and copywriter. Write high-quality ${data.type} content. Tone: ${data.tone || 'professional'}. Target roughly ${wordTarget} words. ${data.targetAudience ? `Target audience: ${data.targetAudience}.` : ''} ${data.includeSeo ? 'Optimize for SEO with relevant headings and keywords.' : ''} ${data.keywords?.length ? `Incorporate these keywords naturally: ${data.keywords.join(', ')}.` : ''} Format in Markdown with a compelling title as H1. Make it engaging, original, and publication-ready.`;

    const prompt = `Write a ${data.type} piece about: ${data.topic}. ${data.length === 'short' ? 'Keep it concise.' : data.length === 'long' ? 'Make it comprehensive.' : 'Medium depth.'}`;

    const result = await generateText({ prompt, instructions, maxTokens: wordTarget * 2 });

    // Parse title from first H1 line
    const lines = result.text.split('\n');
    const titleLine = lines.find(l => l.startsWith('# '))?.replace('# ', '') || data.topic;
    const body = result.text;

    const content = await prisma.generatedContent.create({
      data: { teamId: req.teamId!, title: titleLine.substring(0, 200), body, type: data.type,
        tone: data.tone || 'professional', topic: data.topic, keywords: JSON.stringify(data.keywords || []),
        model: result.model, tokensUsed: result.tokensUsed },
    });
    res.status(201).json({ success: true, data: content });
  } catch (err: any) {
    console.error('Content generation error:', err.message);
    res.status(502).json({ success: false, error: 'AI generation failed. Try again later.' });
  }
});

contentRouter.get('/:id', async (req: AuthRequest, res: Response) => {
  const content = await prisma.generatedContent.findUnique({ where: { id: req.params.id } });
  if (!content || content.teamId !== req.teamId) {
    res.status(404).json({ success: false, error: 'Content not found' });
    return;
  }
  res.json({ success: true, data: content });
});

contentRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  await prisma.generatedContent.delete({ where: { id: req.params.id, teamId: req.teamId } });
  res.json({ success: true, message: 'Content deleted' });
});