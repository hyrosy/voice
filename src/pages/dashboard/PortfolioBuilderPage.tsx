import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { supabase } from '../../supabaseClient';
import { useOutletContext, useSearchParams, useNavigate } from 'react-router-dom';
import { ActorDashboardContextType } from '../../layouts/ActorDashboardLayout';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  GripVertical, Eye, EyeOff, Save, ExternalLink, Loader2, Plus, 
  Palette, Layers, Smartphone, Settings, Globe, CheckCircle2,
  Pencil, Check, X, Lock, RefreshCw, Zap,
  Circle,
  LayoutTemplate,
  PaintBucket,
  Square,
  Type,
  Component as ComponentIcon // Correctly aliased
} from 'lucide-react';
import { PortfolioSection, DEFAULT_PORTFOLIO_SECTIONS, SectionType } from '../../types/portfolio';
import SectionEditor from '../../components/dashboard/SectionEditor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { THEME_REGISTRY, DEFAULT_THEME } from '../../themes/registry'; 
import { cn, hexToHSL } from "@/lib/utils"; 
import { useSubscription } from '../../context/SubscriptionContext';
import { Slider } from "@/components/ui/slider"; // Correct import for Shadcn Slider
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"; // Correct import for Shadcn ToggleGroup
import { PORTFOLIO_TEMPLATES } from '../../lib/templates'; // Use the imported templates

// --- AVAILABLE BLOCKS LIST ---
const AVAILABLE_BLOCKS: { type: SectionType; label: string; module?: 'shop' | 'appointments' }[] = [
  { type: 'header', label: 'Header / Navbar' },
  { type: 'hero', label: 'Hero Section' },
  { type: 'about', label: 'About Me' },
  { type: 'shop', label: 'Shop / Products', module: 'shop' },
  { type: 'services_showcase', label: 'Services' },
  { type: 'gallery', label: 'Gallery' },
  { type: 'image_slider', label: 'Image Slider' },
  { type: 'video_slider', label: 'Video Slider' },
  { type: 'stats', label: 'Statistics' },
  { type: 'reviews', label: 'Reviews' },
  { type: 'contact', label: 'Contact Form' },
  { type: 'team', label: 'Team' },
  { type: 'pricing', label: 'Pricing' },
  { type: 'lead_form', label: 'LeadForm' },
];

const LOCAL_FONT_OPTIONS = [
  { id: 'sans', name: 'Inter (Clean Sans)', value: 'font-sans' },
  { id: 'serif', name: 'Playfair (Elegant Serif)', value: 'font-serif' },
  { id: 'mono', name: 'Roboto (Technical Mono)', value: 'font-mono' },
];

const LOCAL_COLOR_PALETTES = [
  { id: 'violet', name: 'Creative Violet', value: '#8b5cf6' },
  { id: 'blue', name: 'Professional Blue', value: '#3b82f6' },
  { id: 'emerald', name: 'Nature Green', value: '#10b981' },
  { id: 'rose', name: 'Warm Rose', value: '#f43f5e' },
  { id: 'amber', name: 'Energetic Amber', value: '#f59e0b' },
  { id: 'slate', name: 'Neutral Slate', value: '#64748b' },
];

const VISUAL_THEMES = [
    {
        id: 'modern',
        name: 'Modern Minimal',
        description: 'Clean whitespace, classic layout, focus on typography.',
        previewColor: '#f3f4f6' // Light grey
    },
    {
        id: 'cinematic',
        name: 'Cinematic Dark',
        description: 'Immersive dark mode, full-screen media, dramatic transitions.',
        previewColor: '#1e293b' // Dark slate
    },
    // Future Marketplace Themes will appear here:
    // { id: 'cyberpunk-v1', name: 'Cyberpunk', author: 'DevUser123' ... }
];

// --- PREVIEW COMPONENT ---
const PortfolioPreview = ({ sections, theme }: { sections: PortfolioSection[], theme: any }) => {
  const themeId = theme.templateId || 'modern';
  const ActiveTheme = THEME_REGISTRY[themeId] || DEFAULT_THEME;
  const fontClass = theme.font === 'serif' ? 'font-serif' : theme.font === 'mono' ? 'font-mono' : 'font-sans';
  const activeColorObj = LOCAL_COLOR_PALETTES.find(c => c.id === theme.primaryColor) || LOCAL_COLOR_PALETTES[0];
  const primaryHSL = hexToHSL(activeColorObj.value);

  // Calculate Radius CSS value (0.0 to 1.0 -> 0px to 2rem)
  const radiusVal = theme?.radius !== undefined ? theme.radius : 0.5;
  const radiusCSS = `${radiusVal * 2}rem`; 

  const previewStyle = {
    '--primary': primaryHSL, 
    '--ring': primaryHSL, 
    '--radius': radiusCSS, // Inject radius for preview
  } as React.CSSProperties;

  return (
    <div className="border rounded-lg h-full flex flex-col w-full bg-white text-black relative shadow-inner overflow-hidden">
      <div className="bg-slate-800 text-white text-xs p-2 text-center z-50 flex-shrink-0 font-medium tracking-wide">
        Live Preview • {PORTFOLIO_TEMPLATES.find(t => t.id === themeId)?.name || 'Custom'}
      </div>

      <div 
        className={cn("flex-grow overflow-y-auto bg-background text-foreground custom-scrollbar", fontClass)}
        data-theme={theme.templateId}
        data-btn-style={theme.buttonStyle || 'solid'} // Inject button style
        style={previewStyle}
      >
        {sections.filter(s => s.isVisible).length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground p-8 flex-col gap-2">
            <Layers className="w-10 h-10 opacity-20" />
            <p>Add sections to start building.</p>
          </div>
        ) : (
          sections.filter(s => s.isVisible).map(section => {
            const Component = (ActiveTheme as any)[section.type === 'lead_form' ? 'LeadForm' : section.type.charAt(0).toUpperCase() + section.type.slice(1).replace(/_([a-z])/g, (g) => g[1].toUpperCase())] 
                            || (ActiveTheme as any)[Object.keys(ActiveTheme).find(k => k.toLowerCase() === section.type.replace('_','').toLowerCase()) || ''];

            if (!Component) return <div key={section.id} className="p-4 text-center text-red-500 text-xs">Missing Component: {section.type}</div>;

            // Mock props for preview
            const mockProps = {
                data: section.data,
                allSections: sections,
                isPreview: true,
                actorId: 'preview-actor-id',
                portfolioId: 'preview-portfolio-id'
            };

            return <Component key={section.id} {...mockProps} />;
          })
        )}
      </div>
    </div>
  );
};

const PortfolioBuilderPage = () => {
  const { actorData } = useOutletContext<ActorDashboardContextType>();
  const { limits, isLoading: isSubLoading } = useSubscription();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activePortfolioIdParam = searchParams.get('id');

  const [activePortfolioId, setActivePortfolioId] = useState<string | null>(activePortfolioIdParam);
  const [siteList, setSiteList] = useState<any[]>([]);
  const [sections, setSections] = useState<PortfolioSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [editingSection, setEditingSection] = useState<PortfolioSection | null>(null);

  // Renaming State
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [tempLabel, setTempLabel] = useState("");

  // Create Site State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newSiteName, setNewSiteName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>(PORTFOLIO_TEMPLATES[0].id);

  // Identity & Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [siteIdentity, setSiteIdentity] = useState({ name: '', slug: '', customDomain: '' });
  const [isSavingIdentity, setIsSavingIdentity] = useState(false);
  const [domainStatus, setDomainStatus] = useState<any>(null);
  const [isCheckingDomain, setIsCheckingDomain] = useState(false);
  const [activeDomain, setActiveDomain] = useState("");

  // Theme State
  const [themeConfig, setThemeConfig] = useState({
      templateId: 'modern',
      primaryColor: 'violet',
      font: 'sans',
      radius: 0.5,
      buttonStyle: 'solid'
  });

  // --- DATA FETCHING ---

  const fetchSiteList = useCallback(async () => {
      if (!actorData?.id) return;
      const { data } = await supabase
          .from('portfolios')
          .select('id, site_name')
          .eq('actor_id', actorData.id)
          .order('created_at', { ascending: false });
          
      if (data) setSiteList(data);
  }, [actorData?.id]);

  const fetchPortfolioData = useCallback(async (portfolioId: string | null) => {
    setIsLoading(true);
    try {
      let data = null;
      let error = null;

      if (portfolioId) {
         const response = await supabase
            .from('portfolios')
            .select('*')
            .eq('id', portfolioId)
            .single();
         data = response.data;
         error = response.error;
      } else {
         // Fallback: Get most recent
         const response = await supabase
            .from('portfolios')
            .select('*')
            .eq('actor_id', actorData.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
         data = response.data;
         error = response.error;
      }

      if (error && error.code !== 'PGRST116') throw error; // Ignore "no rows" error for fallback

      if (data) {
        setActivePortfolioId(data.id);
        setSections(data.sections || []);
        setIsPublished(data.is_published);
        
        // Merge theme config safely
        setThemeConfig({
            ...data.theme_config,
            radius: data.theme_config?.radius ?? 0.5,
            buttonStyle: data.theme_config?.buttonStyle ?? 'solid'
        });

        setSiteIdentity({
            name: data.site_name,
            slug: data.public_slug,
            customDomain: data.custom_domain || ''
        });

        if(data.custom_domain) {
            setActiveDomain(data.custom_domain);
            checkDomainStatus(data.custom_domain); // Check status on load
        } else {
            setActiveDomain("");
            setDomainStatus(null);
        }
      } else {
        // No portfolio found at all
        setSections(DEFAULT_PORTFOLIO_SECTIONS);
      }
    } catch (error) {
      console.error('Error fetching portfolio:', error);
    } finally {
      setIsLoading(false);
    }
  }, [actorData.id]);

  // Initial Load
  useEffect(() => {
    if (actorData.id) {
        fetchSiteList();
        fetchPortfolioData(activePortfolioIdParam);
    }
  }, [actorData.id, activePortfolioIdParam, fetchSiteList, fetchPortfolioData]);


  // --- DOMAIN LOGIC ---

  const checkDomainStatus = async (domain: string) => {
    setIsCheckingDomain(true);
    const { data } = await supabase.functions.invoke('manage-domains', {
        body: { action: 'check', domain }
    });
    
    if(data) setDomainStatus(data);
    setIsCheckingDomain(false);
  };

  const handleAddDomain = async () => {
    if(!siteIdentity.customDomain) return;
    
    const cleanDomain = siteIdentity.customDomain
        .replace(/^https?:\/\//, '')
        .replace(/\/$/, '')
        .toLowerCase();

    setIsCheckingDomain(true);
    
    const { data, error } = await supabase.functions.invoke('manage-domains', {
        body: { 
            action: 'add', 
            domain: cleanDomain, 
            portfolioId: activePortfolioId 
        }
    });

    if(error || (data && data.error)) {
        console.error("Domain Error:", error || data);
        alert(`Could not add domain:\n${data?.error || error?.message}`);
    } else {
        setSiteIdentity(prev => ({...prev, customDomain: cleanDomain}));
        setActiveDomain(cleanDomain);
        checkDomainStatus(cleanDomain);
    }
    setIsCheckingDomain(false);
  };

  const handleRemoveDomain = async () => {
    if(!confirm("Remove this custom domain?")) return;
    setIsCheckingDomain(true);
    await supabase.functions.invoke('manage-domains', {
        body: { action: 'remove', domain: activeDomain, portfolioId: activePortfolioId }
    });
    setActiveDomain('');
    setSiteIdentity(prev => ({...prev, customDomain: ''}));
    setDomainStatus(null);
    setIsCheckingDomain(false);
  };

  // --- ACTIONS ---

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    const items = Array.from(sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setSections(items);
  };

  const toggleSectionVisibility = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); 
    setSections(prev => prev.map(s => 
      s.id === id ? { ...s, isVisible: !s.isVisible } : s
    ));
  };

  const handleSave = async () => {
    if (!activePortfolioId) return; 
    setIsSaving(true);
    
    const { error } = await supabase
      .from('portfolios')
      .update({
        sections: sections,
        theme_config: themeConfig, 
        is_published: isPublished,
        updated_at: new Date().toISOString()
      })
      .eq('id', activePortfolioId);

    if (error) {
      console.error("Error saving portfolio:", error);
      alert("Failed to save changes.");
    }
    setIsSaving(false);
  };

  const handleSwitchSite = (val: string) => {
    if (val === 'new') {
        setIsCreateOpen(true); 
    } else {
        navigate(`/dashboard/portfolio?id=${val}`);
    }
  };

  const handleCreateSite = async () => {
    if (!newSiteName.trim()) { 
        alert("Please enter a site name"); 
        return; 
    }
    
    // --- FIX: Add Safety Check ---
    if (!limits || !limits.siteSlots) {
        alert("Subscription data is still loading. Please try again in a moment.");
        return;
    }

    if (limits.siteSlots.remaining <= 0) {
        alert("You have used all your portfolio slots. Please upgrade or buy more slots in Settings.");
        setIsCreateOpen(false);
        return;
    }

    setIsCreating(true);
      
      try {
          const template = PORTFOLIO_TEMPLATES.find(t => t.id === selectedTemplate) || PORTFOLIO_TEMPLATES[0];
          const baseSlug = newSiteName.toLowerCase().replace(/[^a-z0-9]/g, '-');
          const uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

          const { data, error } = await supabase.from('portfolios').insert({
              actor_id: actorData.id,
              site_name: newSiteName,
              public_slug: uniqueSlug,
              is_published: false, 
              sections: template.sections,
              theme_config: { templateId: 'modern', primaryColor: 'violet', font: 'sans', radius: 0.5, buttonStyle: 'solid' }
          }).select().single();

          if (error) throw error;

          setIsCreateOpen(false);
          setNewSiteName("");
          await fetchSiteList(); 
          navigate(`/dashboard/portfolio?id=${data.id}`);

      } catch (error: any) {
          console.error("Creation failed:", error);
          alert("Failed to create site: " + error.message);
      } finally {
          setIsCreating(false);
      }
  };

  const handleSaveIdentity = async () => {
      if (!activePortfolioId) return;
      
      if (siteIdentity.customDomain && !limits.canConnectDomain) {
          alert("Please upgrade to Pro to connect a custom domain.");
          return;
      }

      setIsSavingIdentity(true);
      
      const cleanSlug = siteIdentity.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      const cleanDomain = siteIdentity.customDomain.trim().replace(/^https?:\/\//, '');

      const { error } = await supabase
          .from('portfolios')
          .update({
              site_name: siteIdentity.name,
              public_slug: cleanSlug,
              custom_domain: cleanDomain || null 
          })
          .eq('id', activePortfolioId);

      if (error) {
          console.error(error);
          alert("Error saving settings. The URL might be taken.");
      } else {
          setSiteIdentity(prev => ({ 
              ...prev, 
              slug: cleanSlug,
              customDomain: cleanDomain
          }));
          setIsSettingsOpen(false);
          if(cleanDomain) checkDomainStatus(cleanDomain);
      }
      setIsSavingIdentity(false);
  };

  const handleUpdateSection = (updatedSection: PortfolioSection) => {
    setSections(prev => prev.map(s => s.id === updatedSection.id ? updatedSection : s));
  };

  const handleAddSection = (type: SectionType) => {
      if (sections.length >= limits.maxBlocksPerSite) {
          alert(`Plan Limit Reached! You can only add ${limits.maxBlocksPerSite} sections on this plan.`);
          return;
      }

      const newSection: PortfolioSection = {
          id: `${type}-${Date.now()}`,
          type: type,
          isVisible: true,
          data: { 
              title: AVAILABLE_BLOCKS.find(b => b.type === type)?.label || 'New Section' 
          } 
      };
      setSections(prev => [...prev, newSection]);
  };

  const handleDeleteSection = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if(confirm("Are you sure you want to remove this section?")) {
          setSections(prev => prev.filter(s => s.id !== id));
      }
  }

  // Renaming Helpers
  const startRenaming = (e: React.MouseEvent, section: PortfolioSection) => {
      e.stopPropagation();
      setRenamingId(section.id);
      setTempLabel(section.data._label || section.type.replace('_', ' '));
  };

  const cancelRenaming = (e: React.MouseEvent) => {
      e.stopPropagation();
      setRenamingId(null);
  };

  const saveLabel = async (e: React.MouseEvent | React.KeyboardEvent) => {
      e.stopPropagation();
      if (!renamingId || !activePortfolioId) return;

      const updatedSections = sections.map(s => 
          s.id === renamingId 
            ? { ...s, data: { ...s.data, _label: tempLabel } }
            : s
      );

      setSections(updatedSections);
      setRenamingId(null);

      setIsSaving(true);
      const { error } = await supabase
        .from('portfolios')
        .update({
          sections: updatedSections,
          updated_at: new Date().toISOString()
        })
        .eq('id', activePortfolioId);
        
      if(error) console.error("Auto-save failed:", error);
      setIsSaving(false);
  };

  if (isLoading || isSubLoading) return (
      <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
  );

  return (
    <div className="max-w-7xl mx-auto flex flex-col pt-20 px-4 lg:px-8 pb-8 lg:pb-0 lg:h-[calc(100vh-20px)] min-h-screen">
      
      {/* Header / Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 shrink-0">
        <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Editing Site</span>
            
            <Select value={activePortfolioId || ''} onValueChange={handleSwitchSite}>
                <SelectTrigger className="h-9 border-0 p-0 shadow-none text-2xl md:text-3xl font-bold tracking-tight bg-transparent focus:ring-0 w-auto min-w-[200px] justify-start gap-2">
                    <SelectValue placeholder="Select Site">
                        {siteList.find(s => s.id === activePortfolioId)?.site_name || siteIdentity.name || "Untitled Site"}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    {siteList.map(site => (
                        <SelectItem key={site.id} value={site.id} className="font-medium cursor-pointer">
                            {site.site_name || "Untitled Site"}
                        </SelectItem>
                    ))}
                    <SelectItem value="new" className="text-muted-foreground italic border-t mt-1 pt-2">
                        + Create New Site...
                    </SelectItem>
                </SelectContent>
            </Select>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          
          <Button variant="outline" size="sm" onClick={() => setIsSettingsOpen(true)} className="gap-2">
             <Settings className="w-4 h-4" /> 
             <span className="hidden sm:inline">Site Settings</span>
          </Button>

          <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg border">
            <span className="text-xs font-medium uppercase text-muted-foreground">Published</span>
            <Switch checked={isPublished} onCheckedChange={setIsPublished} />
          </div>

          <div className="flex items-center gap-2 ml-auto sm:ml-0">
             {isPublished && (
                <Button variant="outline" size="sm" asChild className="px-2 sm:px-4">
                   <a 
                    href={`/pro/${siteIdentity.slug || 'portfolio'}`} 
                    target="_blank" 
                    rel="noreferrer"
                    title="View Live Page"
                  >
                    <ExternalLink className="w-4 h-4 sm:mr-2" /> 
                    <span className="hidden sm:inline">Live</span>
                  </a>
                </Button>
             )}
             <Button onClick={handleSave} disabled={isSaving} size="sm" className="min-w-[100px]">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Save className="w-4 h-4 mr-2"/>}
                Save
             </Button>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 flex-grow lg:overflow-hidden min-h-0 relative">
        
        {/* LEFT COLUMN (Editor Controls) */}
        <div className="lg:col-span-1 flex flex-col h-full min-h-0">
          
          <Tabs defaultValue="content" className="flex flex-col h-full min-h-0">
              <TabsList className="w-full grid grid-cols-3 lg:grid-cols-2 mb-4 shrink-0">
                 <TabsTrigger value="content"><Layers className="w-4 h-4 mr-2 hidden sm:block"/> Content</TabsTrigger>
                 <TabsTrigger value="design"><Palette className="w-4 h-4 mr-2 hidden sm:block"/> Design</TabsTrigger>
                 <TabsTrigger value="preview" className="lg:hidden"><Smartphone className="w-4 h-4 mr-2"/> Preview</TabsTrigger>
              </TabsList>

              {/* --- TAB 1: CONTENT --- */}
              <TabsContent value="content" className="flex-grow flex flex-col overflow-hidden mt-0 data-[state=inactive]:hidden">
                  <div className="flex-grow overflow-y-auto pr-2 pb-4 min-h-[400px] lg:min-h-0 custom-scrollbar">
                    
                    {/* PLAN USAGE INDICATOR */}
                    <div className="mb-4 px-1 flex justify-between items-center text-xs text-muted-foreground">
                        <span>Sections used: {sections.length} / {limits.maxBlocksPerSite}</span>
                        {sections.length >= limits.maxBlocksPerSite && (
                            <span className="text-amber-600 font-bold">Limit Reached</span>
                        )}
                    </div>

                    <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="sections">
                        {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3 pb-4">
                            {sections.map((section, index) => (
                                <Draggable key={section.id} draggableId={section.id} index={index}>
                                    {(provided, snapshot) => (
                                        <Card 
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            className={cn(
                                                "border-l-4 transition-all cursor-pointer group active:scale-[0.99]",
                                                section.isVisible ? 'border-l-primary shadow-sm' : 'border-l-muted opacity-60 bg-muted/20',
                                                snapshot.isDragging && "shadow-lg scale-105 rotate-1 opacity-90 z-50"
                                            )}
                                            onClick={() => { if(!renamingId) setEditingSection(section) }}
                                        >
                                            <CardContent className="p-3 sm:p-4 flex items-center gap-3">
                                                <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-foreground p-1">
                                                    <GripVertical size={22} />
                                                </div>
                                                
                                                {renamingId === section.id ? (
                                                    <div className="flex-grow flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                                        <Input 
                                                            value={tempLabel}
                                                            onChange={(e) => setTempLabel(e.target.value)}
                                                            onKeyDown={(e) => { if(e.key === 'Enter') saveLabel(e); }}
                                                            autoFocus
                                                            className="h-8 text-sm"
                                                        />
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500 hover:bg-green-500/10" onClick={saveLabel}>
                                                            <Check size={16} />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={cancelRenaming}>
                                                            <X size={16} />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="flex-grow min-w-0" onDoubleClick={(e) => startRenaming(e, section)}>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-semibold text-sm capitalize select-none truncate">
                                                                {section.data._label || section.type.replace('_', ' ')}
                                                            </p>
                                                            <button 
                                                                onClick={(e) => startRenaming(e, section)}
                                                                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                                                                title="Rename section label"
                                                            >
                                                                <Pencil size={12} />
                                                            </button>
                                                        </div>
                                                        {section.data.title && section.data.title !== section.data._label && (
                                                            <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                                                                {section.data.title}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8 text-muted-foreground hover:text-foreground sm:hidden"
                                                        onClick={(e) => startRenaming(e, section)}
                                                    >
                                                        <Pencil size={16} />
                                                    </Button>

                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                        onClick={(e) => toggleSectionVisibility(e, section.id)}
                                                    >
                                                        {section.isVisible ? <Eye size={18} /> : <EyeOff size={18} />}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                                                        onClick={(e) => handleDeleteSection(e, section.id)}
                                                    >
                                                        <Plus className="w-5 h-5 rotate-45" />
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                            </div>
                        )}
                        </Droppable>
                    </DragDropContext>
                  </div>

                  <div className="pt-4 border-t mt-auto shrink-0 z-10">
                      <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full border-dashed h-12 text-foreground hover:text-primary hover:border-primary/50">
                                <Plus className="mr-2 h-5 w-5" /> Add New Section
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-64 max-h-[300px] overflow-y-auto" align="end">
                              {AVAILABLE_BLOCKS.map((block) => {
                                  // 5. CHECK IF BLOCK IS LOCKED
                                  const isLocked = block.module && !limits.modules[block.module];
                                  
                                  return (
                                      <DropdownMenuItem 
                                        key={block.type} 
                                        disabled={isLocked}
                                        onClick={() => !isLocked && handleAddSection(block.type)} 
                                        className={cn("cursor-pointer", isLocked && "opacity-50 cursor-not-allowed")}
                                      >
                                          <Plus className="mr-2 h-4 w-4 opacity-50" /> 
                                          {block.label}
                                          {isLocked && <Lock className="ml-auto h-3 w-3 text-amber-500" />}
                                      </DropdownMenuItem>
                                  )
                              })}
                          </DropdownMenuContent>
                      </DropdownMenu>
                  </div>
              </TabsContent>

              {/* --- TAB 2: DESIGN --- */}
              {/* TAB 2: DESIGN (Smart Engine) */}
                <TabsContent value="design" className="flex-grow flex flex-col overflow-y-auto overflow-x-hidden mt-0 data-[state=inactive]:hidden custom-scrollbar pb-20">
                    <div className="space-y-8 pr-2 p-4">
                        
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-wider">
                                <LayoutTemplate size={14} /> Active Theme
                            </div>
                            
                            <div className="grid grid-cols-1 gap-3">
                                {VISUAL_THEMES.map(theme => (
                                    <div 
                                        key={theme.id} 
                                        className={cn(
                                            "cursor-pointer border-2 rounded-xl p-3 transition-all hover:border-primary/50 flex items-center gap-4 relative overflow-hidden",
                                            themeConfig.templateId === theme.id ? 'border-primary bg-primary/5' : 'border-muted bg-card'
                                        )}
                                        onClick={() => setThemeConfig({...themeConfig, templateId: theme.id})}
                                    >
                                        {/* Theme Preview Swatch */}
                                        <div 
                                            className="w-12 h-12 rounded-lg border shadow-sm shrink-0" 
                                            style={{ backgroundColor: theme.previewColor }} 
                                        />
                                        
                                        <div className="flex-grow min-w-0">
                                            <div className="flex justify-between items-center mb-1">
                                                <h4 className="font-bold text-sm truncate">{theme.name}</h4>
                                                {themeConfig.templateId === theme.id && (
                                                    <div className="text-primary bg-primary/10 p-1 rounded-full">
                                                        <CheckCircle2 size={14} />
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-2 leading-tight">
                                                {theme.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="bg-blue-50 text-blue-700 text-[10px] p-2 rounded border border-blue-100 mt-2">
                                <strong>Marketplace Note:</strong> Changing the theme updates the layout and behavior of every section without losing your content.
                            </div>
                        </div>

                        {/* B. Brand Color */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-wider">
                                <PaintBucket size={14} /> Brand Color
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {LOCAL_COLOR_PALETTES.map(color => (
                                    <button
                                        key={color.id}
                                        onClick={() => setThemeConfig({...themeConfig, primaryColor: color.id})}
                                        className={cn(
                                            "w-8 h-8 rounded-full transition-all ring-offset-2 ring-offset-background hover:scale-110", 
                                            themeConfig.primaryColor === color.id ? 'ring-2 ring-primary scale-110 shadow-md' : 'opacity-80 hover:opacity-100'
                                        )}
                                        style={{ backgroundColor: color.value }}
                                        title={color.name}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* C. Typography */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-wider">
                                <Type size={14} /> Typography
                            </div>
                            <Select 
                                value={themeConfig.font} 
                                onValueChange={(val) => setThemeConfig({...themeConfig, font: val})}
                            >
                                <SelectTrigger className="h-10 bg-card">
                                    <SelectValue placeholder="Select a font" />
                                </SelectTrigger>
                                <SelectContent>
                                    {LOCAL_FONT_OPTIONS.map(font => (
                                        <SelectItem key={font.id} value={font.id}>
                                            <span className={font.value}>{font.name}</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* D. Interface Styling (NEW) */}
                        <div className="space-y-4 pt-4 border-t border-dashed">
                            <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-wider">
                                <ComponentIcon size={14} /> Interface
                            </div>
                            
                            {/* Radius Slider */}
                            <div className="space-y-3 bg-card p-3 rounded-xl border">
                                <div className="flex justify-between text-xs font-medium">
                                    <span className="flex items-center gap-1"><Square size={12}/> Sharp</span>
                                    <span className="flex items-center gap-1"><Circle size={12}/> Round</span>
                                </div>
                                <Slider 
                                    defaultValue={[0.5]} 
                                    max={1} 
                                    step={0.1} 
                                    value={[themeConfig.radius !== undefined ? themeConfig.radius : 0.5]} 
                                    onValueChange={(val) => setThemeConfig({...themeConfig, radius: val[0]})}
                                    className="py-1"
                                />
                            </div>

                            {/* Button Style Toggle */}
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Button Style</Label>
                                <ToggleGroup 
                                    type="single" 
                                    value={themeConfig.buttonStyle || 'solid'} 
                                    onValueChange={(val) => val && setThemeConfig({...themeConfig, buttonStyle: val})}
                                    className="justify-start gap-3"
                                >
                                    <ToggleGroupItem value="solid" className="border px-4 py-2 h-auto data-[state=on]:bg-primary data-[state=on]:text-white">
                                        Solid
                                    </ToggleGroupItem>
                                    <ToggleGroupItem value="outline" className="border px-4 py-2 h-auto data-[state=on]:border-primary data-[state=on]:text-primary">
                                        Outline
                                    </ToggleGroupItem>
                                    <ToggleGroupItem value="shadow" className="border px-4 py-2 h-auto shadow-md data-[state=on]:ring-2 ring-primary">
                                        Retro
                                    </ToggleGroupItem>
                                </ToggleGroup>
                            </div>
                        </div>

                    </div>
                </TabsContent>

              {/* --- TAB 3: PREVIEW (MOBILE ONLY) --- */}
              <TabsContent value="preview" className="lg:hidden flex-grow flex flex-col mt-0 h-[600px] border rounded-lg overflow-hidden bg-background shadow-lg data-[state=inactive]:hidden">
                   <PortfolioPreview sections={sections} theme={themeConfig} />
              </TabsContent>
              
          </Tabs>
        </div>

        {/* RIGHT COLUMN: Desktop Live Preview */}
        <div className="lg:col-span-2 hidden lg:block h-full pl-6 border-l min-h-0">
           <PortfolioPreview sections={sections} theme={themeConfig} />
        </div>

      </div>

      {/* --- EDITOR SHEET --- */}
      {editingSection && actorData.id && (
        <SectionEditor 
          sections={sections}
          section={editingSection}
          isOpen={!!editingSection}
          onClose={() => setEditingSection(null)}
          onSave={handleUpdateSection}
          actorId={actorData.id}
        />
      )}

      {/* --- SITE SETTINGS DIALOG --- */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
                <DialogTitle>Site Settings</DialogTitle>
                <DialogDescription>
                    Manage your site identity, URL, and custom domain.
                </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="general" className="w-full mt-2">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="domains">Domains</TabsTrigger>
                </TabsList>
                
                {/* GENERAL TAB (Name & Slug) */}
                <TabsContent value="general" className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Site Name</Label>
                        <Input 
                            value={siteIdentity.name} 
                            onChange={(e) => setSiteIdentity(prev => ({...prev, name: e.target.value}))}
                            placeholder="e.g. My Portfolio"
                        />
                        <p className="text-[11px] text-muted-foreground">Appears in the browser tab and SEO results.</p>
                    </div>
                    <div className="space-y-2">
                        <Label>Portfolio URL</Label>
                        <div className="flex items-center">
                            <span className="text-sm text-muted-foreground bg-muted h-10 px-3 flex items-center rounded-l-md border border-r-0 border-input shrink-0">
                                {window.location.host}/pro/
                            </span>
                            <Input 
                                value={siteIdentity.slug} 
                                onChange={(e) => setSiteIdentity(prev => ({...prev, slug: e.target.value}))}
                                className="rounded-l-none"
                                placeholder="username"
                            />
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                            This is your free permanent URL.
                        </p>
                    </div>
                </TabsContent>

                {/* DOMAINS TAB (Custom Domain) */}
                <TabsContent value="domains" className="space-y-4 py-4">
                  <div className="space-y-4">
                      
                      <div className="flex justify-between items-center">
                          <Label>Custom Domain</Label>
                          {!limits.canConnectDomain && (
                              <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                  <Lock size={10} /> Pro Feature
                              </span>
                          )}
                      </div>

                      {!activeDomain ? (
                          <div className="flex gap-2">
                              <div className="relative flex-grow">
                                  <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                  <Input 
                                      value={siteIdentity.customDomain} 
                                      onChange={(e) => setSiteIdentity(prev => ({...prev, customDomain: e.target.value}))}
                                      className="pl-9"
                                      placeholder={limits.canConnectDomain ? "example.com" : "Upgrade to connect"}
                                      disabled={!limits.canConnectDomain}
                                  />
                              </div>
                              <Button 
                                  onClick={handleAddDomain} 
                                  disabled={!siteIdentity.customDomain || isCheckingDomain || !limits.canConnectDomain}
                              >
                                  {isCheckingDomain ? <Loader2 className="animate-spin h-4 w-4"/> : "Connect"}
                              </Button>
                          </div>
                      ) : (
                          <div className="bg-muted/30 border rounded-xl p-4 space-y-4">
                              <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                      {/* ONLY Show Green Check if Verified AND Configured */}
                                      {(domainStatus?.verified && domainStatus?.configured) ? (
                                          <CheckCircle2 className="text-green-500 h-5 w-5" />
                                      ) : (
                                          <Loader2 className="text-amber-500 h-5 w-5 animate-spin" />
                                      )}
                                      <span className="font-bold text-lg">{activeDomain}</span>
                                  </div>
                                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 h-8" onClick={handleRemoveDomain}>
                                      Disconnect
                                  </Button>
                              </div>

                              {/* LOGIC FIX: Show Instructions if EITHER is false */}
                              {(!domainStatus?.verified || !domainStatus?.configured) && (
                                  <div className="space-y-3 text-sm">
                                      <div className="p-3 bg-background border rounded-lg space-y-3">
                                          <div className="flex items-start gap-2">
                                              <div className="p-1 bg-blue-100 text-blue-600 rounded mt-0.5"><Zap size={12} fill="currentColor"/></div>
                                              <div className="space-y-1">
                                                  <p className="font-semibold text-xs uppercase text-muted-foreground">Configuration Required</p>
                                                  
                                                  {/* Detailed Status Text */}
                                                  {!domainStatus?.verified ? (
                                                      <p className="text-amber-600 font-bold text-xs">Domain Ownership Not Verified</p>
                                                  ) : (
                                                      <p className="text-amber-600 font-bold text-xs">
                                                          Ownership Verified • <span className="underline">Waiting for DNS Record</span>
                                                      </p>
                                                  )}

                                                  <p className="text-muted-foreground text-xs">
                                                      Log in to your domain provider and add these <strong>2 records</strong>:
                                                  </p>
                                              </div>
                                          </div>
                                          
                                          {/* A Record */}
                                          <div className="grid grid-cols-[0.5fr_1fr_2fr] gap-2 font-mono text-xs items-center bg-muted/50 p-2 rounded">
                                              <div className="bg-white border px-1.5 py-0.5 rounded text-center font-bold">A</div>
                                              <div className="text-muted-foreground">@</div>
                                              <div className="text-right select-all cursor-pointer font-medium" onClick={() => navigator.clipboard.writeText('76.76.21.21')}>
                                                  76.76.21.21
                                              </div>
                                          </div>

                                          {/* CNAME Record */}
                                          <div className="grid grid-cols-[0.5fr_1fr_2fr] gap-2 font-mono text-xs items-center bg-muted/50 p-2 rounded">
                                              <div className="bg-white border px-1.5 py-0.5 rounded text-center font-bold">CNAME</div>
                                              <div className="text-muted-foreground">www</div>
                                              <div className="text-right select-all cursor-pointer font-medium" onClick={() => navigator.clipboard.writeText('cname.vercel-dns.com')}>
                                                  cname.vercel-dns.com
                                              </div>
                                          </div>
                                      </div>
                                      
                                      <Button 
                                          size="sm" 
                                          variant="outline" 
                                          className="w-full gap-2"
                                          onClick={() => checkDomainStatus(activeDomain)}
                                          disabled={isCheckingDomain}
                                      >
                                          {isCheckingDomain ? <Loader2 className="h-3 w-3 animate-spin"/> : <RefreshCw className="h-3 w-3"/>}
                                          Refresh Status
                                      </Button>
                                      
                                      <p className="text-[10px] text-center text-muted-foreground">
                                          DNS updates can take 5 minutes to 24 hours to propagate.
                                      </p>
                                  </div>
                              )}

                              {/* Success View */}
                              {domainStatus?.verified && domainStatus?.configured && (
                                  <div className="flex flex-col gap-2">
                                      <div className="flex items-center gap-2 text-sm text-green-600 bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                                          <CheckCircle2 size={16} /> 
                                          <span className="font-medium">Domain Active & SSL Secured</span>
                                      </div>
                                      <p className="text-[11px] text-muted-foreground px-1">
                                          Your site is live at <a href={`https://${activeDomain}`} target="_blank" rel="noreferrer" className="underline font-bold text-primary">https://{activeDomain}</a>
                                      </p>
                                  </div>
                              )}
                          </div>
                      )}

                      {!limits.canConnectDomain && (
                          <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 mt-2"
                              onClick={() => navigate('/dashboard/settings')}
                          >
                              Upgrade Plan to Connect Domain
                          </Button>
                      )}
                  </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
                <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveIdentity} disabled={isSavingIdentity}>
                    {isSavingIdentity && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* --- CREATE NEW SITE DIALOG --- */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                  <DialogTitle>Create New Website</DialogTitle>
                  <DialogDescription>Choose a starting template for your new portfolio.</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                  <div className="space-y-2">
                      <Label>Website Name</Label>
                      <Input 
                          placeholder="e.g. Acting Portfolio 2024" 
                          value={newSiteName} 
                          onChange={(e) => setNewSiteName(e.target.value)} 
                      />
                  </div>
                  
                  <div className="space-y-3">
                      <Label>Select Template</Label>
                      <div className="grid grid-cols-2 gap-3">
                          {PORTFOLIO_TEMPLATES.map((template) => (
                              <div 
                                  key={template.id} 
                                  onClick={() => setSelectedTemplate(template.id)} 
                                  className={cn(
                                      "cursor-pointer border-2 rounded-xl p-4 transition-all hover:border-primary/50 relative bg-muted/20", 
                                      selectedTemplate === template.id ? "border-primary bg-primary/5" : "border-muted"
                                  )}
                              >
                                  {selectedTemplate === template.id && (
                                      <div className="absolute top-2 right-2 text-primary bg-background rounded-full"><CheckCircle2 size={16} /></div>
                                  )}
                                  <h4 className="font-bold text-sm">{template.name}</h4>
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{template.description}</p>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>

              <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button 
                      onClick={handleCreateSite} 
                      disabled={isCreating || isSubLoading || !limits} // <--- Add these checks
                  >
                      {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
                      {isSubLoading ? "Loading Plan..." : "Create Website"}
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

    </div>
  );
};

export default PortfolioBuilderPage;