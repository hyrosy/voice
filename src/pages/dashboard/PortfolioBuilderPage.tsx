import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useOutletContext } from 'react-router-dom';
import { ActorDashboardContextType } from '../../layouts/ActorDashboardLayout';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { GripVertical, Eye, EyeOff, Save, ExternalLink, Loader2, Plus, Palette, Layers, Smartphone } from 'lucide-react';
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
import { THEME_REGISTRY, DEFAULT_THEME } from '../../themes/registry'; 
import { cn } from "@/lib/utils"; 

// --- CONSTANTS ---
const LOCAL_PORTFOLIO_TEMPLATES = [
  {
    id: 'modern',
    name: 'Modern Minimal',
    description: 'Clean lines, ample whitespace, professional feel.',
  },
  {
    id: 'cinematic', 
    name: 'Cinematic Dark',
    description: 'Immersive 3D sliders, dark mode, and high contrast.',
  },
  {
    id: 'classic',
    name: 'Classic Elegant',
    description: 'Serif fonts, soft colors, timeless look.',
  }
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

// --- REAL LIVE PREVIEW COMPONENT ---
const PortfolioPreview = ({ sections, theme }: { sections: PortfolioSection[], theme: any }) => {
  const themeId = theme.templateId || 'modern';
  const ActiveTheme = THEME_REGISTRY[themeId] || DEFAULT_THEME;
  const fontClass = theme.font === 'serif' ? 'font-serif' : theme.font === 'mono' ? 'font-mono' : 'font-sans';

  return (
    <div className="border rounded-lg h-full flex flex-col bg-white text-black relative shadow-inner overflow-hidden">
      <div className="bg-slate-800 text-white text-xs p-2 text-center z-50 flex-shrink-0 font-medium tracking-wide">
        Live Preview • {LOCAL_PORTFOLIO_TEMPLATES.find(t => t.id === themeId)?.name || 'Custom'}
      </div>

      <div 
        className={cn("flex-grow overflow-y-auto bg-background text-foreground custom-scrollbar", fontClass)}
        data-theme={theme.templateId}
      >
        {sections.filter(s => s.isVisible).length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground p-8 flex-col gap-2">
            <Layers className="w-10 h-10 opacity-20" />
            <p>Add sections to start building.</p>
          </div>
        ) : (
          sections.filter(s => s.isVisible).map(section => {
            switch (section.type) {
                case 'header': return <ActiveTheme.Header key={section.id} data={section.data} allSections={sections} isPreview={true} />;
                case 'hero': return <ActiveTheme.Hero key={section.id} data={section.data} />;
                case 'about': return <ActiveTheme.About key={section.id} data={section.data} />;
                case 'gallery': return <ActiveTheme.Gallery key={section.id} data={section.data} />;
                case 'image_slider': return <ActiveTheme.ImageSlider key={section.id} data={section.data} />;
                case 'video_slider': return <ActiveTheme.VideoSlider key={section.id} data={section.data} />;
                case 'services_showcase': return <ActiveTheme.ServicesShowcase key={section.id} data={section.data} />;
                case 'contact': return <ActiveTheme.Contact key={section.id} data={section.data} />;
                case 'stats': return <ActiveTheme.Stats key={section.id} data={section.data} />;
                case 'reviews': return <ActiveTheme.Reviews key={section.id} data={section.data} />;
                case 'team': return <ActiveTheme.Team key={section.id} data={section.data} />;
                case 'map': return <ActiveTheme.Map key={section.id} data={section.data} />;
                case 'pricing': return <ActiveTheme.Pricing key={section.id} data={section.data} />;
                default: return <div key={section.id} className="p-4 text-center text-red-500 text-xs">Unknown Block: {section.type}</div>;
            }
          })
        )}
      </div>
    </div>
  );
};

const PortfolioBuilderPage = () => {
  const { actorData } = useOutletContext<ActorDashboardContextType>();
  const [sections, setSections] = useState<PortfolioSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [editingSection, setEditingSection] = useState<PortfolioSection | null>(null);

  // Theme State
  const [themeConfig, setThemeConfig] = useState({
      templateId: 'modern',
      primaryColor: 'violet',
      font: 'sans'
  });

  // 1. Fetch or Init Portfolio
  useEffect(() => {
    const fetchPortfolio = async () => {
      if (!actorData.id) return;
      
      const { data, error } = await supabase
        .from('portfolios')
        .select('*')
        .eq('actor_id', actorData.id)
        .single();

      if (data) {
        setSections(data.sections as PortfolioSection[]);
        setIsPublished(data.is_published);
        if (data.theme_config) {
            setThemeConfig(data.theme_config);
        }
      } else {
        setSections(DEFAULT_PORTFOLIO_SECTIONS);
      }
      setIsLoading(false);
    };

    fetchPortfolio();
  }, [actorData.id]);

  // 2. Handle Reorder
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    const items = Array.from(sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setSections(items);
  };

  // 3. Handle Toggle Visibility
  const toggleSectionVisibility = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); 
    setSections(prev => prev.map(s => 
      s.id === id ? { ...s, isVisible: !s.isVisible } : s
    ));
  };

  // 4. Save Changes
  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from('portfolios')
      .upsert({
        actor_id: actorData.id,
        sections: sections,
        theme_config: themeConfig, 
        is_published: isPublished,
        updated_at: new Date().toISOString()
      }, { onConflict: 'actor_id' });

    if (error) {
      console.error("Error saving portfolio:", error);
    }
    setIsSaving(false);
  };

  const handleUpdateSection = (updatedSection: PortfolioSection) => {
    setSections(prev => prev.map(s => s.id === updatedSection.id ? updatedSection : s));
  };

  const handleAddSection = (type: SectionType) => {
      const newSection: PortfolioSection = {
          id: `${type}-${Date.now()}`,
          type: type,
          isVisible: true,
          data: {} 
      };
      setSections(prev => [...prev, newSection]);
  };

  const handleDeleteSection = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if(confirm("Are you sure you want to remove this section?")) {
          setSections(prev => prev.filter(s => s.id !== id));
      }
  }

  if (isLoading) return (
      <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
  );

  return (
    // Responsive Container: 
    // - On Mobile: Natural height with scrolling (min-h-screen)
    // - On Desktop: Fixed viewport height (h-screen) to use internal scrolling for panels
    <div className="max-w-7xl mx-auto flex flex-col pt-20 px-4 lg:px-8 pb-8 lg:pb-0 lg:h-[calc(100vh-20px)] min-h-screen">
      
      {/* Header / Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Portfolio Builder</h1>
          <p className="text-sm text-muted-foreground">Drag blocks to reorder. Click to edit.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg border">
            <span className="text-xs font-medium uppercase text-muted-foreground">Published</span>
            <Switch checked={isPublished} onCheckedChange={setIsPublished} />
          </div>

          <div className="flex items-center gap-2 ml-auto sm:ml-0">
             {isPublished && (
                <Button variant="outline" size="sm" asChild className="hidden sm:flex">
                   <a 
                    href={`/pro/${(actorData.ActorName || 'portfolio').toLowerCase().replace(/\s+/g, '-')}`} 
                    target="_blank" 
                    rel="noreferrer"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" /> Live
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
              
              {/* Tabs List: 3 cols on mobile (Preview added), 2 cols on desktop */}
              <TabsList className="w-full grid grid-cols-3 lg:grid-cols-2 mb-4 shrink-0">
                 <TabsTrigger value="content"><Layers className="w-4 h-4 mr-2 hidden sm:block"/> Content</TabsTrigger>
                 <TabsTrigger value="design"><Palette className="w-4 h-4 mr-2 hidden sm:block"/> Design</TabsTrigger>
                 <TabsTrigger value="preview" className="lg:hidden"><Smartphone className="w-4 h-4 mr-2"/> Preview</TabsTrigger>
              </TabsList>

              {/* --- TAB 1: CONTENT --- */}
              <TabsContent value="content" className="flex-grow flex flex-col overflow-hidden mt-0 data-[state=inactive]:hidden">
                  <div className="flex-grow overflow-y-auto pr-2 pb-4 min-h-[400px] lg:min-h-0 custom-scrollbar">
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
                                            onClick={() => setEditingSection(section)}
                                        >
                                            <CardContent className="p-3 sm:p-4 flex items-center gap-3">
                                                <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-foreground p-1">
                                                    <GripVertical size={22} />
                                                </div>
                                                
                                                <div className="flex-grow">
                                                    <p className="font-semibold text-sm capitalize select-none">
                                                        {section.type.replace('_', ' ')}
                                                    </p>
                                                    {section.data.title && (
                                                        <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                                                            {section.data.title}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
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

                  <div className="pt-4 border-t mt-auto shrink-0 bg-background z-10">
                      <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full border-dashed h-12 text-muted-foreground hover:text-primary hover:border-primary/50">
                                <Plus className="mr-2 h-5 w-5" /> Add New Section
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-64 max-h-[300px] overflow-y-auto" align="end">
                              <DropdownMenuItem onClick={() => handleAddSection('header')}>Header / Navbar</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAddSection('hero')}>Hero Section</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAddSection('about')}>About Me</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAddSection('gallery')}>Image Gallery</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAddSection('image_slider')}>Image Slider</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAddSection('video_slider')}>Video Slider</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAddSection('services_showcase')}>Services Showcase</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAddSection('contact')}>Contact</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAddSection('team')}>Team Section</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAddSection('map')}>Location Map</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAddSection('pricing')}>Pricing Plans</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAddSection('stats')}>Statistics</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAddSection('reviews')}>Client Reviews</DropdownMenuItem>
                          </DropdownMenuContent>
                      </DropdownMenu>
                  </div>
              </TabsContent>

              {/* --- TAB 2: DESIGN --- */}
              <TabsContent value="design" className="flex-grow flex flex-col overflow-y-auto overflow-x-hidden mt-0 data-[state=inactive]:hidden custom-scrollbar pb-10">
                  <div className="space-y-6 pr-2">
                    {/* Template Picker */}
                    <div className="space-y-3">
                       <Label className="text-base">Template Style</Label>
                       <div className="grid grid-cols-1 gap-3">
                          {LOCAL_PORTFOLIO_TEMPLATES.map(t => (
                             <Card 
                               key={t.id} 
                               className={cn(
                                   "cursor-pointer border-2 transition-all hover:shadow-md relative overflow-hidden",
                                   themeConfig.templateId === t.id ? 'border-primary bg-primary/5' : 'border-transparent hover:border-muted'
                               )}
                               onClick={() => setThemeConfig({...themeConfig, templateId: t.id})}
                             >
                                <div className="p-4">
                                   <div className="flex justify-between items-center mb-1">
                                       <h4 className="font-bold">{t.name}</h4>
                                       {themeConfig.templateId === t.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                                   </div>
                                   <p className="text-sm text-muted-foreground">{t.description}</p>
                                </div>
                             </Card>
                          ))}
                       </div>
                    </div>

                    {/* Color Picker */}
                    <div className="space-y-3">
                       <Label className="text-base">Accent Color</Label>
                       <div className="flex flex-wrap gap-4">
                          {LOCAL_COLOR_PALETTES.map(color => (
                             <button
                                key={color.id}
                                onClick={() => setThemeConfig({...themeConfig, primaryColor: color.id})}
                                className={cn(
                                  "w-10 h-10 rounded-full transition-all ring-offset-2 ring-offset-background hover:scale-110 border border-black/10 shadow-sm", 
                                  themeConfig.primaryColor === color.id ? 'ring-2 ring-primary scale-110' : ''
                                )}
                                style={{ backgroundColor: color.value }}
                                title={color.name}
                                aria-label={`Select ${color.name}`}
                             />
                          ))}
                       </div>
                    </div>

                    {/* Font Picker */}
                    <div className="space-y-3">
                       <Label className="text-base">Typography</Label>
                       <Select 
                           value={themeConfig.font} 
                           onValueChange={(val) => setThemeConfig({...themeConfig, font: val})}
                       >
                           <SelectTrigger className="h-12">
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
                  </div>
              </TabsContent>

              {/* --- TAB 3: PREVIEW (MOBILE ONLY) --- */}
              <TabsContent value="preview" className="lg:hidden flex-grow flex flex-col mt-0 h-[600px] border rounded-lg overflow-hidden bg-background shadow-lg data-[state=inactive]:hidden">
                   <PortfolioPreview sections={sections} theme={themeConfig} />
              </TabsContent>
              
          </Tabs>
        </div>

        {/* RIGHT COLUMN: Desktop Live Preview (Always Visible on LG screens) */}
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

    </div>
  );
};

export default PortfolioBuilderPage;