import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useOutletContext } from 'react-router-dom';
import { ActorDashboardContextType } from '../../layouts/ActorDashboardLayout';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { GripVertical, Eye, EyeOff, Save, ExternalLink, Loader2, Plus, Palette, Layers } from 'lucide-react';
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

// --- CONSTANTS (Moved here to ensure they load) ---

const LOCAL_PORTFOLIO_TEMPLATES = [
  {
    id: 'modern',
    name: 'Modern Minimal',
    description: 'Clean lines, ample whitespace, professional feel.',
  },
  {
    id: 'cinematic', // <-- THIS MATCHES YOUR REGISTRY KEY
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
  // Fallback to modern if the registry lookup fails
  const ActiveTheme = THEME_REGISTRY[themeId] || DEFAULT_THEME;
  const fontClass = theme.font === 'serif' ? 'font-serif' : theme.font === 'mono' ? 'font-mono' : 'font-sans';

  return (
    <div className="border rounded-lg h-full flex flex-col bg-white text-black relative shadow-inner overflow-hidden">
      <div className="bg-slate-800 text-white text-xs p-2 text-center z-50 flex-shrink-0">
        Live Preview • {LOCAL_PORTFOLIO_TEMPLATES.find(t => t.id === themeId)?.name || 'Custom'}
      </div>

      <div 
        className={cn("flex-grow overflow-y-auto bg-background text-foreground", fontClass)}
        data-theme={theme.templateId}
      >
        {sections.filter(s => s.isVisible).length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground p-8">
            Add sections to see your portfolio.
          </div>
        ) : (
          sections.filter(s => s.isVisible).map(section => {
            switch (section.type) {
                case 'header': return <ActiveTheme.Header key={section.id} data={section.data} allSections={sections} isPreview={true} />; // <-- Pass true
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
                default: return <div key={section.id} className="p-4 text-center text-red-500">Unknown Block Type</div>;
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

  if (isLoading) return <div className="p-8 text-center">Loading Builder...</div>;

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-100px)] flex flex-col">
      
      {/* Header / Toolbar */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Portfolio Builder</h1>
          <p className="text-muted-foreground">Drag blocks to reorder. Click to edit content.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 mr-4">
            <span className="text-sm font-medium">Published</span>
            <Switch checked={isPublished} onCheckedChange={setIsPublished} />
          </div>
          {isPublished && (
            <Button variant="outline" size="sm" asChild>
               <a href={`/pro/${actorData.ActorName}`} target="_blank" rel="noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" /> View Live
               </a>
            </Button>
          )}
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Save className="w-4 h-4 mr-2"/>}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-grow overflow-hidden min-h-0">
        
        {/* LEFT: The Editor Sidebar */}
        <div className="lg:col-span-1 flex flex-col h-full min-h-0">
          
          <Tabs defaultValue="content" className="flex flex-col h-full min-h-0">
              
              <TabsList className="w-full grid grid-cols-2 mb-2 flex-shrink-0">
                 <TabsTrigger value="content"><Layers className="w-4 h-4 mr-2"/> Content</TabsTrigger>
                 <TabsTrigger value="design"><Palette className="w-4 h-4 mr-2"/> Design</TabsTrigger>
              </TabsList>

              {/* --- TAB 1: CONTENT --- */}
              <TabsContent value="content" className="flex-grow flex flex-col overflow-hidden mt-0">
                  <div className="flex-grow overflow-y-auto pr-2 pb-4 min-h-0">
                    <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="sections">
                        {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3 pb-4">
                            {sections.map((section, index) => (
                                <Draggable key={section.id} draggableId={section.id} index={index}>
                                    {(provided) => (
                                        <Card 
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            className={`border-l-4 transition-all cursor-pointer hover:bg-accent/50 group ${section.isVisible ? 'border-l-primary' : 'border-l-muted opacity-60'}`}
                                            onClick={() => setEditingSection(section)}
                                        >
                                            <CardContent className="p-4 flex items-center gap-3">
                                                <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
                                                    <GripVertical size={20} />
                                                </div>
                                                
                                                <div className="flex-grow font-medium capitalize select-none">
                                                    {section.type.replace('_', ' ')}
                                                </div>

                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                                        onClick={(e) => toggleSectionVisibility(e, section.id)}
                                                        title={section.isVisible ? "Hide Section" : "Show Section"}
                                                    >
                                                        {section.isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                                                        onClick={(e) => handleDeleteSection(e, section.id)}
                                                        title="Remove Section"
                                                    >
                                                        <Plus className="w-4 h-4 rotate-45" />
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

                  <div className="pt-4 border-t mt-auto flex-shrink-0">
                      <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full border-dashed">
                                <Plus className="mr-2 h-4 w-4" /> Add New Section
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-56">
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
                              <DropdownMenuItem onClick={() => handleAddSection('stats')}>Statistics / Milestones (Soon)</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAddSection('reviews')}>Client Reviews (Soon)</DropdownMenuItem>

                            
                          </DropdownMenuContent>
                      </DropdownMenu>
                  </div>
              </TabsContent>

              {/* --- TAB 2: DESIGN (Fixed) --- */}
              <TabsContent value="design" className="flex-grow flex flex-col overflow-hidden mt-0">
                 
                 {/* Template Picker */}
                 <div className="space-y-3">
                    <Label>Template Style</Label>
                    <div className="grid grid-cols-1 gap-2">
                       {LOCAL_PORTFOLIO_TEMPLATES.map(t => (
                          <Card 
                            key={t.id} 
                            className={cn(
                                "cursor-pointer border-2 transition-all hover:shadow-md",
                                themeConfig.templateId === t.id ? 'border-primary bg-primary/5' : 'border-transparent hover:border-muted'
                            )}
                            onClick={() => setThemeConfig({...themeConfig, templateId: t.id})}
                          >
                             <div className="p-4">
                                <h4 className="font-bold text-sm">{t.name}</h4>
                                <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
                             </div>
                          </Card>
                       ))}
                    </div>
                 </div>

                 {/* Color Picker (Fixed with Hex Codes) */}
                 <div className="space-y-3">
                    <Label>Accent Color</Label>
                    <div className="flex flex-wrap gap-3">
                       {LOCAL_COLOR_PALETTES.map(color => (
                          <button
                             key={color.id}
                             onClick={() => setThemeConfig({...themeConfig, primaryColor: color.id})}
                             className={cn(
                               "w-8 h-8 rounded-full transition-all ring-offset-2 ring-offset-background hover:scale-110 border border-black/10", 
                               themeConfig.primaryColor === color.id ? 'ring-2 ring-primary scale-110' : ''
                             )}
                             style={{ backgroundColor: color.value }} // Apply Hex Code directly
                             title={color.name}
                          />
                       ))}
                    </div>
                 </div>

                 {/* Font Picker */}
                 <div className="space-y-3">
                    <Label>Typography</Label>
                    <Select 
                       value={themeConfig.font} 
                       onValueChange={(val) => setThemeConfig({...themeConfig, font: val})}
                    >
                       <SelectTrigger>
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
              </TabsContent>
              
          </Tabs>
        </div>

        {/* RIGHT: Live Preview */}
        <div className="lg:col-span-2 hidden lg:block h-full pl-4 border-l min-h-0">
           <PortfolioPreview sections={sections} theme={themeConfig} />
        </div>

      </div>

      {/* --- EDITOR SHEET --- */}
      {editingSection && actorData.id && (
         <SectionEditor 
           sections={sections} // <-- ADD THIS PROP
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