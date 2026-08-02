'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, User, Shield, CreditCard, Mail, Key } from 'lucide-react';

export default function SettingsPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage team and account settings</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          <div><CardTitle>Profile</CardTitle><CardDescription>Update your personal information</CardDescription></div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div><Label>Full Name</Label><Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your name" /></div>
            <div><Label>Email</Label><Input value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" /></div>
          </div>
          <Button>Save Changes</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <div><CardTitle>Password</CardTitle><CardDescription>Change your account password</CardDescription></div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Current Password</Label><Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} /></div>
          <div><Label>New Password</Label><Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} /></div>
          <Button variant="outline">Update Password</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Key className="h-5 w-5 text-primary" />
          <div><CardTitle>Integrations</CardTitle><CardDescription>Manage API keys and connected services</CardDescription></div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-border">
            <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><span className="text-sm">SendGrid</span></div>
            <span className="text-xs text-yellow-400">Not Connected</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border">
            <div className="flex items-center gap-2"><Key className="h-4 w-4 text-muted-foreground" /><span className="text-sm">LinkedIn</span></div>
            <span className="text-xs text-yellow-400">Not Connected</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-muted-foreground" /><span className="text-sm">Stripe</span></div>
            <span className="text-xs text-yellow-400">Not Connected</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}