'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { Plus, Megaphone, Calendar, BarChart2, Edit2, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Campaign {
  id: string; name: string; type: string; status: string; description: string;
  createdAt: string; startDate: string | null; endDate: string | null;
}

const TYPES = ['email', 'sms', 'linkedin', 'multi_channel'];
const STATUSES = ['draft', 'active', 'paused', 'completed'];

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('multi_channel');
  const [description, setDescription] = useState('');

  const fetchCampaigns = async () => {
    try {
      const res = await api.get<{ success: boolean; data: any[] }>('/campaigns');
      setCampaigns(res.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchCampaigns(); }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    await api.post('/campaigns', { name: name.trim(), type, description: description.trim() });
    setName(''); setDescription(''); setShowCreate(false);
    fetchCampaigns();
  };

  const handleStatus = async (id: string, status: string) => {
    await api.patch(`/campaigns/${id}`, { status });
    fetchCampaigns();
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/campaigns/${id}`);
    fetchCampaigns();
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'active': return 'bg-green-400/20 text-green-400';
      case 'draft': return 'bg-yellow-400/20 text-yellow-400';
      case 'paused': return 'bg-orange-400/20 text-orange-400';
      case 'completed': return 'bg-blue-400/20 text-blue-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground mt-1">Create and manage multi-channel marketing campaigns</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} className="gap-2"><Plus className="h-4 w-4" /> New Campaign</Button>
      </div>

      {showCreate && (
        <Card>
          <CardHeader><CardTitle>New Campaign</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Campaign Name</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Q3 Product Launch" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="type">Type</Label>
                <select id="type" value={type} onChange={e => setType(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm mt-1.5">
                  {TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="desc">Description</Label>
                <Input id="desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Campaign goals..." />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={!name.trim()}>Create Campaign</Button>
              <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {campaigns.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">No campaigns yet. Launch your first campaign.</CardContent></Card>
        ) : campaigns.map(c => (
          <Card key={c.id}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Megaphone className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-semibold">{c.name}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span className="uppercase">{c.type.replace('_', ' ')}</span>
                      <span className={cn('px-2 py-0.5 rounded-full font-medium text-[10px]', statusColor(c.status))}>{c.status}</span>
                      {c.startDate && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(c.startDate).toLocaleDateString()}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleStatus(c.id, 'active')}><BarChart2 className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleStatus(c.id, 'paused')}><Edit2 className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)} className="text-red-400 hover:text-red-300"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}