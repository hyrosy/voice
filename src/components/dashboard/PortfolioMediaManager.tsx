import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Image as ImageIcon, Music, Video, Link as LinkIcon, 
  Plus, Loader2, Trash2, FilePlus, Check 
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Unified interface for what this manager returns
export interface UnifiedMediaItem {
  id: string;
  type: 'image' | 'audio' | 'video' | 'link';
  url: string;
  title: string;
  source: 'upload' | 'demo';
}

interface PortfolioMediaManagerProps {
  actorId: string;
  onSelect: (item: UnifiedMediaItem) => void;
}

const PortfolioMediaManager: React.FC<PortfolioMediaManagerProps> = ({ actorId, onSelect }) => {
  const [uploads, setUploads] = useState<UnifiedMediaItem[]>([]);
  const [demos, setDemos] = useState<UnifiedMediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isImporting, setIsImporting] = useState<string | null>(null); // Track which demo is being imported
  
  // Upload State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState<'image' | 'audio' | 'video' | 'link'>('image');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');

  // 1. Fetch Data
  const fetchData = async () => {
    setLoading(true);
    
    // A. Fetch Portfolio Uploads
    const { data: portfolioData } = await supabase
      .from('portfolio_media_items')
      .select('*')
      .eq('actor_id', actorId)
      .order('created_at', { ascending: false });
      
    if (portfolioData) {
      setUploads(portfolioData.map((item: any) => ({
        id: item.id,
        type: item.type,
        url: item.url,
        title: item.title || 'Untitled',
        source: 'upload'
      })));
    }

    // B. Fetch Existing Demos
    const { data: audioDemos } = await supabase.from('demos').select('*').eq('actor_id', actorId);
    const { data: videoDemos } = await supabase.from('video_demos').select('*').eq('actor_id', actorId);

    const unifiedDemos: UnifiedMediaItem[] = [];
    
    // --- FIXED LOGIC ---
    if (audioDemos) {
      audioDemos.forEach((d: any) => unifiedDemos.push({
        id: d.demo_id || d.id,
        type: 'audio',
        url: d.demo_url,
        title: d.demo_title || d.title,
        source: 'demo'
      }));
    }
    if (videoDemos) {
      videoDemos.forEach((d: any) => unifiedDemos.push({
        id: d.id,
        type: 'video',
        url: d.video_url,
        title: d.title,
        source: 'demo'
      }));
    }
    // -------------------
    
    setDemos(unifiedDemos);
    setLoading(false);
  };

  useEffect(() => {
    if (actorId) fetchData();
  }, [actorId]);

  // 2. Handle New Upload
  const handleUpload = async () => {
    if (!actorId || !uploadTitle) return;
    setIsUploading(true);

    try {
      let finalUrl = uploadUrl;

      if (uploadType !== 'link' && uploadFile) {
        const fileExt = uploadFile.name.split('.').pop();
        const filePath = `${actorId}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('portfolio-assets')
          .upload(filePath, uploadFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('portfolio-assets')
          .getPublicUrl(filePath);
        
        finalUrl = urlData.publicUrl;
      }

      const { data, error } = await supabase
        .from('portfolio_media_items')
        .insert({
          actor_id: actorId,
          type: uploadType,
          url: finalUrl,
          title: uploadTitle,
        })
        .select()
        .single();

      if (error) throw error;

      onSelect({
        id: data.id,
        type: data.type,
        url: data.url,
        title: data.title,
        source: 'upload'
      });
      
      setIsModalOpen(false);
      setUploadTitle('');
      setUploadFile(null);
      setUploadUrl('');
      fetchData();

    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  // 3. Handle Deletion
  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Delete this item from your portfolio library?")) return;
    
    const { error } = await supabase.from('portfolio_media_items').delete().eq('id', id);
    if (!error) fetchData();
  };

  // 4. Handle Import (Copy Demo to Portfolio Library)
  const handleImport = async (demo: UnifiedMediaItem) => {
    setIsImporting(demo.id);
    try {
      // Check if already exists? (Optional optimization)
      // For now, we just insert a new reference so they can edit the title for portfolio specifically if they want later
      const { data, error } = await supabase
        .from('portfolio_media_items')
        .insert({
          actor_id: actorId,
          type: demo.type,
          url: demo.url,
          title: demo.title,
          original_demo_id: demo.id // Link back
        })
        .select()
        .single();

      if (error) throw error;

      onSelect({
        id: data.id,
        type: data.type,
        url: data.url,
        title: data.title,
        source: 'upload' // It is now an 'upload' (portfolio item)
      });
      
      fetchData(); // Refresh so it shows up in "My Uploads"
    } catch (err) {
      console.error("Import failed", err);
    } finally {
      setIsImporting(null);
    }
  };

  // Helper to render media preview card
  const MediaCard = ({ item, isDemo = false }: { item: UnifiedMediaItem, isDemo?: boolean }) => {
    const Icon = item.type === 'image' ? ImageIcon : item.type === 'audio' ? Music : item.type === 'video' ? Video : LinkIcon;
    
    return (
      <div 
        className={cn(
          "group relative aspect-square rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:ring-2 hover:ring-primary cursor-pointer overflow-hidden",
          isImporting === item.id ? "opacity-50 pointer-events-none" : ""
        )}
        onClick={() => isDemo ? handleImport(item) : onSelect(item)}
      >
        {/* Thumbnail / Preview */}
        {item.type === 'image' ? (
          <img src={item.url} alt={item.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-muted/30 p-4 text-muted-foreground">
            <Icon className="h-10 w-10 mb-2 opacity-50" />
          </div>
        )}

        {/* Overlay Info */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
          <div className="flex items-center justify-between">
             <span className="truncate text-xs font-medium text-white w-full">{item.title}</span>
             {isDemo && isImporting === item.id && <Loader2 className="h-3 w-3 text-white animate-spin flex-shrink-0" />}
          </div>
        </div>

        {/* Type Badge */}
        <div className="absolute top-2 left-2">
          <Badge variant="secondary" className="h-5 px-1.5 text-[10px] opacity-90">
            <Icon className="mr-1 h-3 w-3" /> {item.type}
          </Badge>
        </div>

        {/* Actions (Delete for Uploads, Import Icon for Demos) */}
        {!isDemo && (
           <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
             <Button 
                variant="destructive" 
                size="icon" 
                className="h-6 w-6 rounded-full" 
                onClick={(e) => handleDelete(e, item.id)}
             >
               <Trash2 className="h-3 w-3" />
             </Button>
           </div>
        )}
        
        {isDemo && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/20 transition-opacity">
                <Badge className="bg-white text-black hover:bg-white/90 pointer-events-none">
                    <FilePlus className="mr-1 h-3 w-3" /> Add to Portfolio
                </Badge>
            </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex justify-between items-center px-1">
        <h3 className="text-lg font-semibold tracking-tight">Media Library</h3>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Upload New
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload to Portfolio</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
               <Tabs value={uploadType} onValueChange={(v) => setUploadType(v as any)}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="image"><ImageIcon className="h-4 w-4" /></TabsTrigger>
                  <TabsTrigger value="audio"><Music className="h-4 w-4" /></TabsTrigger>
                  <TabsTrigger value="video"><Video className="h-4 w-4" /></TabsTrigger>
                  <TabsTrigger value="link"><LinkIcon className="h-4 w-4" /></TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} placeholder="e.g., Hero Image" />
              </div>

              {uploadType === 'link' ? (
                 <div className="space-y-2">
                    <Label>URL</Label>
                    <Input value={uploadUrl} onChange={(e) => setUploadUrl(e.target.value)} placeholder="https://..." />
                 </div>
              ) : (
                 <div className="space-y-2">
                    <Label>File</Label>
                    <Input type="file" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
                 </div>
              )}

              <Button onClick={handleUpload} disabled={isUploading} className="w-full">
                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isUploading ? "Uploading..." : "Save & Select"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="uploads" className="flex-grow flex flex-col overflow-hidden">
        <TabsList className="w-full grid grid-cols-2 mb-2">
          <TabsTrigger value="uploads">My Portfolio Assets</TabsTrigger>
          <TabsTrigger value="demos">Import from Demos</TabsTrigger>
        </TabsList>

        {/* --- Tab 1: Uploads --- */}
        <TabsContent value="uploads" className="flex-grow overflow-hidden mt-0 relative">
           <ScrollArea className="h-full w-full rounded-md border bg-muted/10 p-4">
             {loading ? (
               <div className="flex h-40 items-center justify-center text-muted-foreground"><Loader2 className="animate-spin mr-2"/> Loading...</div>
             ) : (
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                 {uploads.map(item => (
                   <MediaCard key={item.id} item={item} />
                 ))}
                 {uploads.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center h-40 text-muted-foreground border-2 border-dashed rounded-lg">
                        <p>No assets yet.</p>
                        <Button variant="link" onClick={() => setIsModalOpen(true)}>Upload your first item</Button>
                    </div>
                 )}
               </div>
             )}
           </ScrollArea>
        </TabsContent>

        {/* --- Tab 2: Existing Demos --- */}
        <TabsContent value="demos" className="flex-grow overflow-hidden mt-0 relative">
           <ScrollArea className="h-full w-full rounded-md border bg-muted/10 p-4">
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
               {demos.map(item => (
                 <MediaCard key={item.id} item={item} isDemo={true} />
               ))}
               {demos.length === 0 && (
                   <div className="col-span-full flex flex-col items-center justify-center h-40 text-muted-foreground">
                        <p>No demos found in your main library.</p>
                        <p className="text-xs">Upload demos in the "Demos" tab of your dashboard first.</p>
                    </div>
               )}
             </div>
           </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PortfolioMediaManager;