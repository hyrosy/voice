import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useOutletContext } from 'react-router-dom';
import { ActorDashboardContextType } from '../../layouts/ActorDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Globe, User, Plus, ExternalLink, Settings, LayoutTemplate, Check } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { PORTFOLIO_TEMPLATES, PortfolioTemplate } from '../../lib/templates'; // <--- Make sure path is correct
import { cn } from "@/lib/utils";

const SettingsPage = () => {
  const { actorData } = useOutletContext<ActorDashboardContextType>();
  const [loading, setLoading] = useState(true);
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  // --- CREATE MODAL STATE ---
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>(PORTFOLIO_TEMPLATES[0].id);
  const [newSiteName, setNewSiteName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Fetch Data
  const fetchData = async () => {
    if (!actorData.id) return;
    setLoading(true);

    // 1. Fetch Portfolios
    const { data: sites } = await supabase
        .from('portfolios')
        .select('*')
        .eq('actor_id', actorData.id)
        .order('created_at', { ascending: false });
    
    if (sites) setPortfolios(sites);

    // 2. Fetch Account Profile
    const { data: actor } = await supabase
        .from('actors')
        .select('*')
        .eq('id', actorData.id)
        .single();
    
    if (actor) setProfile(actor);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [actorData.id]);

  const handleUpdateProfile = async () => {
      setIsSaving(true);
      const { error } = await supabase
        .from('actors')
        .update({ ActorName: profile.ActorName, bio: profile.bio }) 
        .eq('id', actorData.id);
      
      if(error) alert("Error saving profile");
      else alert("Profile updated!");
      setIsSaving(false);
  }

  // --- NEW: CREATE SITE LOGIC ---
  const handleCreateSite = async () => {
      if (!newSiteName.trim()) {
          alert("Please enter a site name");
          return;
      }
      setIsCreating(true);

      // 1. Get Template Data
      const template = PORTFOLIO_TEMPLATES.find(t => t.id === selectedTemplate) || PORTFOLIO_TEMPLATES[0];
      
      // 2. Generate Unique Slug (basic version)
      const baseSlug = newSiteName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

      // 3. Insert into Supabase
      const { data, error } = await supabase.from('portfolios').insert({
          actor_id: actorData.id,
          site_name: newSiteName,
          public_slug: uniqueSlug,
          is_published: false, // Draft by default
          sections: template.sections, // <--- Load Template Sections!
          theme_config: { templateId: 'modern', primaryColor: 'violet', font: 'sans' }
      }).select().single();

      if (error) {
          console.error(error);
          alert("Failed to create site.");
      } else {
          // Success! Close modal and refresh list
          setIsCreateOpen(false);
          setNewSiteName("");
          fetchData(); // Refresh list to show new site
      }
      setIsCreating(false);
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="p-4 md:p-8 space-y-6 w-full max-w-5xl mx-auto">
      <div className="space-y-2 pt-20">
        <h1 className="text-3xl font-bold tracking-tight">Settings & Websites</h1>
        <p className="text-muted-foreground">Manage your portfolios and account details.</p>
      </div>

      <Tabs defaultValue="websites" className="space-y-6">
        <TabsList>
            <TabsTrigger value="websites" className="gap-2"><Globe size={16}/> My Websites</TabsTrigger>
            <TabsTrigger value="account" className="gap-2"><User size={16}/> Account Profile</TabsTrigger>
        </TabsList>

        {/* --- TAB 1: WEBSITES MANAGER --- */}
        <TabsContent value="websites" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* CREATE BUTTON */}
                <button 
                    className="border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/10 rounded-xl p-6 flex flex-col items-center justify-center gap-3 transition-all group h-[200px]"
                    onClick={() => setIsCreateOpen(true)}
                >
                    <div className="p-3 bg-muted rounded-full group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <Plus size={24} />
                    </div>
                    <span className="font-medium text-muted-foreground group-hover:text-foreground">Create New Website</span>
                </button>

                {/* EXISTING SITES */}
                {portfolios.map((site) => (
                    <Card key={site.id} className="overflow-hidden hover:shadow-md transition-all h-[200px] flex flex-col">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <Badge variant={site.is_published ? "default" : "secondary"}>
                                    {site.is_published ? "Live" : "Draft"}
                                </Badge>
                                {site.custom_domain && <Badge variant="outline" className="border-blue-500/20 text-blue-500">Pro</Badge>}
                            </div>
                            <CardTitle className="truncate">{site.site_name || "Untitled Portfolio"}</CardTitle>
                            <CardDescription className="truncate">
                                {site.custom_domain || `ucpmaroc.com/pro/${site.public_slug}`}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="mt-auto pt-0 flex gap-2">
                            {/* NOTE: We append `?id=` so the Builder knows WHICH site to edit */}
                            <Button size="sm" variant="outline" className="flex-1 gap-2" asChild>
                                <a href={`/dashboard/portfolio?id=${site.id}`}>
                                    <LayoutTemplate size={14} /> Edit
                                </a>
                            </Button>
                            <Button size="sm" variant="secondary" className="gap-2" asChild>
                                <a href={`/pro/${site.public_slug}`} target="_blank" rel="noreferrer">
                                    <ExternalLink size={14} /> Visit
                                </a>
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </TabsContent>

        {/* --- TAB 2: ACCOUNT SETTINGS --- */}
        <TabsContent value="account">
            <Card>
                <CardHeader>
                    <CardTitle>Personal Info</CardTitle>
                    <CardDescription>This is your global account identity.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input 
                                value={profile.ActorName || ''} 
                                onChange={e => setProfile({...profile, ActorName: e.target.value})} 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input value={profile.email || ''} disabled className="bg-muted" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Global Bio</Label>
                        <Input 
                            value={profile.bio || ''} 
                            onChange={e => setProfile({...profile, bio: e.target.value})} 
                        />
                    </div>
                    <div className="pt-2">
                        <Button onClick={handleUpdateProfile} disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Save Profile
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>

      {/* --- CREATE SITE MODAL --- */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                  <DialogTitle>Create New Website</DialogTitle>
                  <DialogDescription>Choose a starting template for your new portfolio.</DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                  <div className="space-y-2">
                      <Label>Website Name</Label>
                      <Input 
                          placeholder="e.g. My Voiceover Site" 
                          value={newSiteName}
                          onChange={(e) => setNewSiteName(e.target.value)}
                      />
                  </div>

                  <div className="space-y-3">
                      <Label>Select Template</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {PORTFOLIO_TEMPLATES.map((template) => (
                              <div 
                                  key={template.id}
                                  onClick={() => setSelectedTemplate(template.id)}
                                  className={cn(
                                      "cursor-pointer border-2 rounded-xl p-4 transition-all hover:border-primary/50 relative",
                                      selectedTemplate === template.id ? "border-primary bg-primary/5" : "border-muted bg-muted/20"
                                  )}
                              >
                                  {selectedTemplate === template.id && (
                                      <div className="absolute top-3 right-3 text-primary">
                                          <Check size={16} />
                                      </div>
                                  )}
                                  <h4 className="font-bold text-sm">{template.name}</h4>
                                  <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>

              <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateSite} disabled={isCreating}>
                      {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Website
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

    </div>
  );
};

export default SettingsPage;