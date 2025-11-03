// In src/pages/dashboard/DashboardDemos.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabaseClient';
import { useOutletContext } from 'react-router-dom';
import { ActorDashboardContextType } from '@/layouts/ActorDashboardLayout';

// --- shadcn/ui Imports ---
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// ---

import { Music, Trash2 } from 'lucide-react';

// --- Interfaces ---
interface Demo {
  id: string;
  title: string;
  language: string;
  style_tag: string;
  demo_url: string;
}

interface Actor {
  id: string;
  MainDemoURL?: string;
}

// --- Hardcoded Options ---
const languageOptions = ["Arabic", "English", "French", "Spanish"];
const tagOptions = ["Warm", "Deep", "Conversational", "Corporate"];

const DashboardDemos: React.FC = () => {
  const { actorData: layoutActorData } = useOutletContext<ActorDashboardContextType>();
  
  const [mainDemoUrl, setMainDemoUrl] = useState<string | undefined>(undefined);
  const [demos, setDemos] = useState<Demo[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  
  const [uploadingMainDemo, setUploadingMainDemo] = useState(false);
  const [uploadingDemo, setUploadingDemo] = useState(false);
  const [newDemo, setNewDemo] = useState({ title: '', language: '', style_tag: '' });
  const [demoFile, setDemoFile] = useState<File | null>(null);

  // Fetch data for this page
  const fetchDemoData = useCallback(async () => {
    if (!layoutActorData.id) return;
    setLoading(true);

    // 1. Fetch MainDemoURL
    const { data: actor } = await supabase.from('actors').select('MainDemoURL').eq('id', layoutActorData.id).single();
    if (actor) setMainDemoUrl(actor.MainDemoURL);

    // 2. Fetch all other demos
    const { data: demosData, error } = await supabase.from('demos').select('*').eq('actor_id', layoutActorData.id).order('created_at', { ascending: false });
    if (error) setMessage(`Error: ${error.message}`);
    else setDemos(demosData);

    setLoading(false);
  }, [layoutActorData.id]);

  useEffect(() => {
    fetchDemoData();
  }, [fetchDemoData]);

  // --- Handlers ---
  const handleMainDemoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !layoutActorData.id) return;
    setUploadingMainDemo(true);
    setMessage('');
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${layoutActorData.id}/main-demo.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('demos').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('demos').getPublicUrl(filePath);
      const newDemoUrl = `${urlData.publicUrl}?t=${new Date().getTime()}`;

      const { error: updateError } = await supabase.from('actors').update({ MainDemoURL: newDemoUrl }).eq('id', layoutActorData.id);
      if (updateError) throw updateError;
      
      setMainDemoUrl(newDemoUrl);
      setMessage("Main demo updated!");
    } catch (error) {
      setMessage(`Error: ${(error as Error).message}`);
    } finally {
      setUploadingMainDemo(false);
    }
  };

  const handleDemoUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoFile || !newDemo.title || !newDemo.language || !newDemo.style_tag || !layoutActorData.id) {
      setMessage("Please fill all demo fields and select a file.");
      return;
    }
    setUploadingDemo(true);
    setMessage('');
    try {
      const fileExt = demoFile.name.split('.').pop();
      const filePath = `${layoutActorData.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('demos').upload(filePath, demoFile);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('demos').getPublicUrl(filePath);
      const { data: newDemoData, error: insertError } = await supabase.from('demos').insert({
        actor_id: layoutActorData.id, demo_url: urlData.publicUrl, ...newDemo
      }).select().single();

      if (insertError) throw insertError;
      
      setDemos(prev => [newDemoData as Demo, ...prev]);
      setNewDemo({ title: '', language: '', style_tag: '' });
      setDemoFile(null);
      (document.getElementById('demo-file-input') as HTMLInputElement).value = "";
      setMessage("Demo uploaded successfully!");
    } catch (error) {
      setMessage(`Error: ${(error as Error).message}`);
    } finally {
      setUploadingDemo(false);
    }
  };
  
  const handleDemoDelete = async (demoId: string, demoUrl: string) => {
    if (!window.confirm("Are you sure?")) return;
    setMessage('');
    try {
      const filePath = new URL(demoUrl).pathname.split('/demos/')[1];
      await supabase.storage.from('demos').remove([filePath]);
      await supabase.from('demos').delete().eq('id', demoId);
      setDemos(prev => prev.filter(d => d.id !== demoId));
      setMessage("Demo deleted.");
    } catch (error) {
      setMessage(`Error: ${(error as Error).message}`);
    }
  };

  // --- ADD THIS FUNCTION ---
  const handleDemoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewDemo(prev => ({ ...prev, [name]: value }));
  };
  // --- END OF FUNCTION TO ADD ---

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Manage Your Demos</h1>
      {message && <div className="mb-4 p-3 bg-card border rounded-lg text-center text-sm">{message}</div>}

      <Tabs defaultValue="upload">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload New</TabsTrigger>
          <TabsTrigger value="manage">Manage ({demos.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Main Demo</CardTitle>
                <CardDescription>Plays on your main profile card.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mainDemoUrl && (
                  <audio controls src={mainDemoUrl} className="w-full h-10" />
                )}
                <Label htmlFor="main-demo-upload" className="w-full">
                  <Button variant="outline" asChild className="w-full cursor-pointer">
                    <span>{uploadingMainDemo ? 'Uploading...' : 'Upload & Replace'}</span>
                  </Button>
                </Label>
                <Input type="file" id="main-demo-upload" className="hidden" accept="audio/*" onChange={handleMainDemoUpload} disabled={uploadingMainDemo} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Add New Portfolio Demo</CardTitle>
                <CardDescription>Add a new demo to your portfolio.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleDemoUpload} className="space-y-4">
                  <Input name="title" placeholder="Demo Title" value={newDemo.title} onChange={handleDemoInputChange} required />
                  <Select name="language" value={newDemo.language} onValueChange={(v) => setNewDemo(p => ({...p, language: v}))} required>
                    <SelectTrigger><SelectValue placeholder="Select Language..." /></SelectTrigger>
                    <SelectContent>
                      {languageOptions.map(lang => <SelectItem key={lang} value={lang}>{lang}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select name="style_tag" value={newDemo.style_tag} onValueChange={(v) => setNewDemo(p => ({...p, style_tag: v}))} required>
                    <SelectTrigger><SelectValue placeholder="Select Style..." /></SelectTrigger>
                    <SelectContent>
                      {tagOptions.map(tag => <SelectItem key={tag} value={tag}>{tag}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input id="demo-file-input" type="file" accept="audio/*" onChange={(e) => setDemoFile(e.target.files?.[0] || null)} required />
                  <Button type="submit" disabled={uploadingDemo} className="w-full">
                    {uploadingDemo ? 'Uploading...' : 'Upload Demo'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="manage" className="pt-6">
          <div className="space-y-3">
            {demos.length > 0 ? demos.map(demo => (
              <Card key={demo.id} className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <Music size={16} className="text-muted-foreground" />
                  <div>
                    <p className="font-semibold">{demo.title}</p>
                    <p className="text-xs text-muted-foreground">{demo.language} | {demo.style_tag}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDemoDelete(demo.id, demo.demo_url)} className="text-destructive hover:text-destructive">
                  <Trash2 size={16} />
                </Button>
              </Card>
            )) : <p className="text-muted-foreground text-sm text-center py-4">No portfolio demos uploaded yet.</p>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardDemos;