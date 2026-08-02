'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { Sparkles, Copy, Download, FileText, Loader2, Send } from 'lucide-react';

const CONTENT_TYPES = ['blog', 'social', 'email', 'landing', 'ad'];
const TONES = ['professional', 'casual', 'technical', 'inspirational', 'sales'];
const LENGTHS = ['short', 'medium', 'long'];

export default function ContentPage() {
  const [topic, setTopic] = useState('');
  const [type, setType] = useState('social');
  const [tone, setTone] = useState('professional');
  const [length, setLength] = useState('medium');
  const [keywords, setKeywords] = useState('');
  const [targetAudience, setTargetAudience] = useState('');

  const [generated, setGenerated] = useState<{ title: string; body: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.post<{ success: boolean; data: any }>('/content/generate', {
        topic: topic.trim(),
        type,
        tone,
        length,
        keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
        targetAudience: targetAudience.trim() || undefined,
      });
      setGenerated(res.data);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (generated) navigator.clipboard.writeText(generated.body);
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold">Content Generator</h1>
        <p className="text-muted-foreground mt-1">Generate AI-powered marketing content with Azure OpenAI</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-orange-400" /> Create Content</CardTitle>
          <CardDescription>Fill in the details and let AI craft your content</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="topic">Topic</Label>
            <Input id="topic" value={topic} onChange={e => setTopic(e.target.value)} placeholder="What should the content be about?" />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>Content Type</Label>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {CONTENT_TYPES.map(t => (
                  <button key={t} onClick={() => setType(t)} className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${type === t ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}>{t}</button>
                ))}
              </div>
            </div>
            <div>
              <Label>Tone</Label>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {TONES.map(t => (
                  <button key={t} onClick={() => setTone(t)} className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${tone === t ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}>{t}</button>
                ))}
              </div>
            </div>
            <div>
              <Label>Length</Label>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {LENGTHS.map(l => (
                  <button key={l} onClick={() => setLength(l)} className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${length === l ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}>{l}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="keywords">Keywords (comma separated)</Label>
              <Input id="keywords" value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="ai, automation, marketing" />
            </div>
            <div>
              <Label htmlFor="audience">Target Audience</Label>
              <Input id="audience" value={targetAudience} onChange={e => setTargetAudience(e.target.value)} placeholder="e.g. startup founders" />
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button onClick={handleGenerate} disabled={loading || !topic.trim()} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {loading ? 'Generating...' : 'Generate Content'}
          </Button>
        </CardContent>
      </Card>

      {/* Generated content output */}
      {generated && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> {generated.title}</CardTitle>
              <CardDescription>Generated with Azure OpenAI</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyToClipboard} className="gap-1"><Copy className="h-3.5 w-3.5" /> Copy</Button>
              <Button variant="outline" size="sm" className="gap-1"><Download className="h-3.5 w-3.5" /> Save</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap bg-accent/30 rounded-lg p-4 text-sm leading-relaxed">
              {generated.body}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}