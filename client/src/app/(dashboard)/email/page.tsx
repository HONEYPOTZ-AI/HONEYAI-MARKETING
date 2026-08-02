'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Plus, Send, Eye, Edit2, Trash2 } from 'lucide-react';

export default function EmailPage() {
  const [showTemplate, setShowTemplate] = useState(false);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Email</h1><p className="text-muted-foreground mt-1">Create templates and manage email sequences</p></div>
        <Button onClick={() => setShowTemplate(!showTemplate)} className="gap-2"><Plus className="h-4 w-4" /> New Template</Button>
      </div>

      {showTemplate && (
        <Card>
          <CardHeader><CardTitle>Create Email Template</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Template Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Welcome Email" /></div>
            <div><Label>Subject Line</Label><Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email subject..." /></div>
            <div>
              <Label>Body (HTML or plain text)</Label>
              <textarea value={body} onChange={e => setBody(e.target.value)} rows={6}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-y"
                placeholder="Write your email content..." />
            </div>
            <div className="flex gap-2">
              <Button disabled={!name.trim()} className="gap-2"><Send className="h-4 w-4" /> Save Template</Button>
              <Button variant="ghost" onClick={() => setShowTemplate(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Template list placeholder */}
      <Card>
        <CardContent className="py-8 text-center">
          <Mail className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Email templates and sequences will appear here.</p>
          <p className="text-xs text-muted-foreground mt-1">Configure SendGrid integration to start sending campaigns.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent Sends</CardTitle><CardDescription>Email delivery statistics</CardDescription></CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-center">
            {[{ label: 'Sent', value: '0' }, { label: 'Delivered', value: '0' }, { label: 'Opened', value: '0' }, { label: 'Clicked', value: '0' }].map(s => (
              <div key={s.label}><div className="text-2xl font-bold">{s.value}</div><div className="text-xs text-muted-foreground">{s.label}</div></div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}