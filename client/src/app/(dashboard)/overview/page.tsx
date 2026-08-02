'use client';

import { useEffect, useState } from 'react';
import { getDashboardMetrics } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Megaphone, MessageSquare, Mail, Phone, Users, TrendingUp } from 'lucide-react';

interface DashboardData { totalCampaigns: number; activeCampaigns: number; totalPosts: number; scheduledPosts: number; totalContacts: number; newContactsThisMonth: number; emailStats: { sent: number; delivered: number; opened: number; clicked: number }; smsStats: { sent: number; delivered: number }; linkedinStats: { sent: number }; }

export default function OverviewPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardMetrics().then((res: any) => { setData(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-muted-foreground">Loading dashboard...</div>;
  if (!data) return <div className="text-muted-foreground">Failed to load dashboard.</div>;

  const metrics = [
    { label: 'Active Campaigns', value: data.activeCampaigns, sub: `${data.totalCampaigns} total`, icon: Megaphone, color: 'text-blue-400' },
    { label: 'Scheduled Posts', value: data.scheduledPosts, sub: `${data.totalPosts} total`, icon: MessageSquare, color: 'text-green-400' },
    { label: 'Contacts', value: data.totalContacts, sub: `+${data.newContactsThisMonth} this month`, icon: Users, color: 'text-purple-400' },
    { label: 'Emails Sent', value: data.emailStats.sent, sub: `${data.emailStats.delivered} delivered`, icon: Mail, color: 'text-orange-400' },
    { label: 'SMS Sent', value: data.smsStats.sent, sub: `${data.smsStats.delivered} delivered`, icon: Phone, color: 'text-pink-400' },
    { label: 'LinkedIn Posts', value: data.linkedinStats.sent, sub: 'this month', icon: TrendingUp, color: 'text-cyan-400' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Your marketing at a glance</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{m.label}</CardTitle>
              <m.icon className={`h-4 w-4 ${m.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{m.value.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">{m.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Recent Posts</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Your scheduled and published posts will appear here.</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Campaign Activity</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Campaign performance charts coming soon.</p></CardContent>
        </Card>
      </div>
    </div>
  );
}