'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { Users, Plus, Search, Mail, Phone, Building2, Loader2, Trash2 } from 'lucide-react';

interface Contact {
  id: string; firstName: string; lastName: string; email: string; phone: string | null;
  company: string | null; title: string | null; createdAt: string;
}

export default function CrmPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');

  const fetchContacts = async () => {
    try { const res = await api.get<{ success: boolean; data: Contact[] }>('/crm/contacts'); setContacts(res.data); } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchContacts(); }, []);

  const handleCreate = async () => {
    if (!firstName.trim() || !email.trim()) return;
    await api.post('/crm/contacts', { firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), phone: phone.trim() || undefined, company: company.trim() || undefined, title: title.trim() || undefined });
    setFirstName(''); setLastName(''); setEmail(''); setPhone(''); setCompany(''); setTitle(''); setShowCreate(false);
    fetchContacts();
  };

  const handleDelete = async (id: string) => { await api.delete(`/crm/contacts/${id}`); fetchContacts(); };

  const filtered = contacts.filter(c => search ? `${c.firstName} ${c.lastName} ${c.email} ${c.company || ''}`.toLowerCase().includes(search.toLowerCase()) : true);

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">CRM</h1><p className="text-muted-foreground mt-1">Manage contacts, deals, and pipeline</p></div>
        <Button onClick={() => setShowCreate(!showCreate)} className="gap-2"><Plus className="h-4 w-4" /> Add Contact</Button>
      </div>

      {showCreate && (
        <Card>
          <CardHeader><CardTitle>New Contact</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>First Name</Label><Input value={firstName} onChange={e => setFirstName(e.target.value)} /></div>
              <div><Label>Last Name</Label><Input value={lastName} onChange={e => setLastName(e.target.value)} /></div>
              <div><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
              <div><Label>Phone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} /></div>
              <div><Label>Company</Label><Input value={company} onChange={e => setCompany(e.target.value)} /></div>
              <div><Label>Job Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={!firstName.trim() || !email.trim()}>Add Contact</Button>
              <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contacts..." className="pl-9" />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">{search ? 'No matching contacts.' : 'No contacts yet. Add your first contact.'}</CardContent></Card>
        ) : filtered.map(c => (
          <Card key={c.id}>
            <CardContent className="py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center"><Users className="h-4 w-4 text-primary" /></div>
                <div>
                  <h3 className="font-semibold">{c.firstName} {c.lastName}</h3>
                  <div className="flex flex-wrap gap-3 mt-0.5 text-xs text-muted-foreground">
                    {c.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {c.email}</span>}
                    {c.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {c.phone}</span>}
                    {c.company && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {c.title ? `${c.title} at ${c.company}` : c.company}</span>}
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)} className="text-red-400 hover:text-red-300"><Trash2 className="h-4 w-4" /></Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}