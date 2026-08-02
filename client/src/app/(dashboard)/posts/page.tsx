'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { Sparkles, Calendar, Clock, Send, Trash2, Plus, Loader2, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Post {
  id: string; content: string; platform: string; status: string;
  scheduledFor: string | null; createdAt: string; user?: { fullName: string };
}

const TONES = ['professional', 'casual', 'technical', 'inspirational'];

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [content, setContent] = useState('');
  const [platform, setPlatform] = useState('linkedin');
  const [scheduledFor, setScheduledFor] = useState('');

  // AI generate
  const [aiTopic, setAiTopic] = useState('');
  const [aiTone, setAiTone] = useState('professional');
  const [aiGenerating, setAiGenerating] = useState(false);

  const fetchPosts = async () => {
    try {
      const res = await api.get('/posts');
      setPosts(res.data.data);
    } catch { setLoading(false); }
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleCreate = async () => {
    if (!content.trim()) return;
    await api.post('/posts', { content: content.trim(), platform, scheduledFor: scheduledFor || undefined });
    setContent(''); setScheduledFor(''); setShowCreate(false);
    fetchPosts();
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/posts/${id}`);
    fetchPosts();
  };

  const handleAiGenerate = async () => {
    if (!aiTopic.trim()) return;
    setAiGenerating(true);
    try {
      const res = await api.post('/posts/generate', { topic: aiTopic.trim(), platform, tone: aiTone, length: 'medium' });
      setContent(res.data.data.content);
      setAiTopic('');
    } catch {} finally { setAiGenerating(false); }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'published': return 'text-green-400';
      case 'scheduled': return 'text-blue-400';
      case 'draft': return 'text-yellow-400';
      default: return 'text-muted-foreground';
    }
  };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Posts</h1>
          <p className="text-muted-foreground mt-1">Schedule and publish across platforms</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} className="gap-2">
          <Plus className="h-4 w-4" /> New Post
        </Button>
      </div>

      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle>Create Post</CardTitle>
            <CardDescription>Write or generate a post for scheduling</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* AI Generator */}
            <div className="flex gap-2 flex-wrap">
              <Input value={aiTopic} onChange={e => setAiTopic(e.target.value)} placeholder="Topic for AI to write about..." className="flex-1 min-w-[200px]" />
              <div className="flex gap-1">
                {TONES.map(t => (
                  <button key={t} onClick={() => setAiTone(t)} className={cn('px-2.5 py-1 rounded text-xs border', aiTone === t ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground')}>{t}</button>
                ))}
              </div>
              <Button variant="outline" onClick={handleAiGenerate} disabled={aiGenerating || !aiTopic.trim()} className="gap-1">
                {aiGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                Generate
              </Button>
            </div>

            <div>
              <Label htmlFor="content">Post Content</Label>
              <textarea id="content" value={content} onChange={e => setContent(e.target.value)} rows={5}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-y"
                placeholder="Write your post content here..." />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="platform">Platform</Label>
                <select id="platform" value={platform} onChange={e => setPlatform(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm mt-1.5">
                  <option value="linkedin">LinkedIn</option>
                  <option value="twitter">Twitter / X</option>
                  <option value="facebook">Facebook</option>
                  <option value="instagram">Instagram</option>
                  <option value="threads">Threads</option>
                </select>
              </div>
              <div>
                <Label htmlFor="schedule">Schedule (optional)</Label>
                <Input id="schedule" type="datetime-local" value={scheduledFor} onChange={e => setScheduledFor(e.target.value)} />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={!content.trim()} className="gap-2"><Send className="h-4 w-4" /> {scheduledFor ? 'Schedule Post' : 'Save as Draft'}</Button>
              <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Post list */}
      <div className="space-y-3">
        {posts.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">No posts yet. Create your first post above.</CardContent></Card>
        ) : posts.map(post => (
          <Card key={post.id}>
            <CardContent className="py-4 flex items-start gap-4">
              <MessageSquare className="h-5 w-5 mt-1 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm line-clamp-2">{post.content}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="uppercase">{post.platform}</span>
                  <span className={cn('font-medium', statusColor(post.status))}>{post.status}</span>
                  {post.scheduledFor && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(post.scheduledFor).toLocaleString()}</span>}
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(post.id)} className="text-red-400 hover:text-red-300"><Trash2 className="h-4 w-4" /></Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}