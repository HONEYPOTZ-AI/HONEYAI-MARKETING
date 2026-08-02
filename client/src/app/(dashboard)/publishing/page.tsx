'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Globe, Plus, Link2, ExternalLink, Trash2 } from 'lucide-react';

const PLATFORMS = [
  { id: 'linkedin', name: 'LinkedIn', icon: '💼' },
  { id: 'medium', name: 'Medium', icon: '📝' },
  { id: 'devto', name: 'Dev.to', icon: '👩‍💻' },
  { id: 'hashnode', name: 'Hashnode', icon: '✍️' },
  { id: 'blogger', name: 'Blogger', icon: '📰' },
  { id: 'wordpress', name: 'WordPress', icon: '🌐' },
];

export default function PublishingPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [channelName, setChannelName] = useState('');
  const [apiKey, setApiKey] = useState('');

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Publishing</h1><p className="text-muted-foreground mt-1">Manage cross-platform publishing channels</p></div>
        <Button onClick={() => setShowAdd(!showAdd)} className="gap-2"><Plus className="h-4 w-4" /> Add Channel</Button>
      </div>

      {showAdd && (
        <Card>
          <CardHeader><CardTitle>Add Publishing Channel</CardTitle><CardDescription>Connect a platform for automated cross-posting</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Platform</Label>
              <div className="grid grid-cols-3 gap-2 mt-1.5">
                {PLATFORMS.map(p => (
                  <button key={p.id} onClick={() => setSelectedPlatform(p.id)}
                    className={`px-3 py-2 rounded-lg border text-sm text-center transition-colors ${selectedPlatform === p.id ? 'bg-primary/10 border-primary' : 'border-border hover:bg-accent'}`}>
                    <span className="text-lg">{p.icon}</span><br />{p.name}
                  </button>
                ))}
              </div>
            </div>
            <div><Label>Channel Name</Label><Input value={channelName} onChange={e => setChannelName(e.target.value)} placeholder="e.g. Blog Channel" /></div>
            <div><Label>API Key / Token</Label><Input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="Platform API key..." /></div>
            <div className="flex gap-2">
              <Button disabled={!selectedPlatform || !channelName.trim()} className="gap-2"><Link2 className="h-4 w-4" /> Connect</Button>
              <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Connected Channels</CardTitle></CardHeader>
        <CardContent className="py-8 text-center">
          <Globe className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No publishing channels connected yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Add platforms to start cross-posting your content.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Published Articles</CardTitle><CardDescription>Track backlinks and engagement across platforms</CardDescription></CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          <ExternalLink className="h-10 w-10 mx-auto mb-3 opacity-30" />
          Published articles with backlinks will be tracked here.
        </CardContent>
      </Card>
    </div>
  );
}