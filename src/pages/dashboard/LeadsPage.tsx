import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useOutletContext } from 'react-router-dom';
import { ActorDashboardContextType } from '../../layouts/ActorDashboardLayout';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Loader2, Mail, User, Phone, Calendar, 
  MessageSquare, CheckCircle2, Archive, Reply, Trash2 
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Lead {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: 'new' | 'contacted' | 'archived';
  source: string;
}

const LeadsPage = () => {
  const { actorData } = useOutletContext<ActorDashboardContextType>();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Sheet State
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const fetchLeads = async () => {
    if (!actorData.id) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from('leads') 
      .select('*')
      .eq('actor_id', actorData.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setLeads(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLeads();
  }, [actorData.id]);

  const handleViewDetails = (lead: Lead) => {
    setSelectedLead(lead);
    setIsSheetOpen(true);
  };

  const updateStatus = async (leadId: string, newStatus: string) => {
    // Optimistic Update
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus as any } : l));
    if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead({ ...selectedLead, status: newStatus as any });
    }
    
    await supabase.from('leads').update({ status: newStatus }).eq('id', leadId);
  };

  const handleDelete = async (leadId: string) => {
      if(!confirm("Are you sure you want to delete this lead?")) return;
      
      setLeads(prev => prev.filter(l => l.id !== leadId));
      if(selectedLead?.id === leadId) setIsSheetOpen(false);

      await supabase.from('leads').delete().eq('id', leadId);
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="p-4 md:p-8 space-y-6 w-full max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Leads & Inquiries</h1>
            <p className="text-muted-foreground mt-1">Messages from your contact forms.</p>
        </div>
        <Button variant="outline" onClick={fetchLeads} size="sm">Refresh</Button>
      </div>

      <Card>
        <CardContent className="p-0">
            {leads.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <div className="bg-muted p-4 rounded-full mb-3">
                        <Mail className="w-8 h-8 opacity-50" />
                    </div>
                    <p>No messages yet.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[120px]">Date</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Subject</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {leads.map((lead) => (
                                <TableRow key={lead.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewDetails(lead)}>
                                    <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                                        {new Date(lead.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">{lead.name}</div>
                                        <div className="text-xs text-muted-foreground">{lead.email}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium truncate max-w-[200px]">{lead.subject || "No Subject"}</div>
                                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">{lead.message}</div>
                                    </TableCell>
                                    <TableCell>
                                        {lead.status === 'new' && <Badge className="bg-blue-500 hover:bg-blue-600">New</Badge>}
                                        {lead.status === 'contacted' && <Badge variant="outline" className="text-green-500 border-green-500/50">Contacted</Badge>}
                                        {lead.status === 'archived' && <Badge variant="secondary">Archived</Badge>}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button size="sm" variant="ghost" className="h-8 gap-1">
                                            View
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </CardContent>
      </Card>

      {/* --- LEAD DETAILS SLIDE-OVER --- */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:w-[540px] overflow-y-auto">
            {selectedLead && (
                <>
                    <SheetHeader className="mb-6">
                        <SheetTitle className="flex items-center gap-2">
                            {selectedLead.subject || "Inquiry"}
                        </SheetTitle>
                        <SheetDescription>
                            Received on {new Date(selectedLead.created_at).toLocaleString()}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="space-y-8">
                        
                        {/* 1. SENDER INFO */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <User size={14} /> Sender Details
                            </h3>
                            <div className="bg-muted/30 p-4 rounded-lg space-y-3 border">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Name</Label>
                                        <div className="font-medium">{selectedLead.name}</div>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Source</Label>
                                        <div className="font-medium capitalize">{selectedLead.source}</div>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Email</Label>
                                    <div className="font-medium flex items-center gap-2">
                                        {selectedLead.email}
                                    </div>
                                </div>
                                {selectedLead.phone && (
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Phone</Label>
                                        <div className="font-medium">{selectedLead.phone}</div>
                                    </div>
                                )}
                            </div>
                            
                            <Button className="w-full gap-2" onClick={() => window.open(`mailto:${selectedLead.email}`)}>
                                <Reply size={16} /> Reply via Email
                            </Button>
                        </div>

                        {/* 2. MESSAGE BODY */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <MessageSquare size={14} /> Message
                            </h3>
                            <div className="bg-muted/30 p-4 rounded-lg border min-h-[150px] whitespace-pre-wrap text-sm leading-relaxed">
                                {selectedLead.message}
                            </div>
                        </div>

                        {/* 3. MANAGEMENT */}
                        <div className="space-y-4">
                             <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <CheckCircle2 size={14} /> Status
                            </h3>
                            
                            <div className="flex gap-4 items-center bg-muted/30 p-4 rounded-lg border">
                                <div className="flex-grow">
                                    <Select 
                                        value={selectedLead.status} 
                                        onValueChange={(val) => updateStatus(selectedLead.id, val)}
                                    >
                                        <SelectTrigger className="bg-background">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="new">🔵 New</SelectItem>
                                            <SelectItem value="contacted">🟢 Contacted</SelectItem>
                                            <SelectItem value="archived">⚪ Archived</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(selectedLead.id)}>
                                    <Trash2 size={18} />
                                </Button>
                            </div>
                        </div>

                    </div>
                </>
            )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default LeadsPage;