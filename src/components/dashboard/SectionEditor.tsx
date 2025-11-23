import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Map, Users, DollarSign, Trash2, X, Plus, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import PortfolioMediaManager, { UnifiedMediaItem } from './PortfolioMediaManager';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { PortfolioSection } from '../../types/portfolio';

interface SectionEditorProps {
  section: PortfolioSection | null;
  sections: PortfolioSection[]; // <-- NEW PROP: We need context of all sections
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedSection: PortfolioSection) => void;
  actorId: string;
}

const SectionEditor: React.FC<SectionEditorProps> = ({ section, isOpen, onClose, onSave, actorId, sections }) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [activeMediaField, setActiveMediaField] = useState<string>(''); 

  useEffect(() => {
    if (section) {
      setFormData(JSON.parse(JSON.stringify(section.data))); 
    }
  }, [section]);

  if (!section) return null;

  const handleSave = () => {
    onSave({ ...section, data: formData });
    onClose();
  };

  const updateField = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleMediaSelect = (item: UnifiedMediaItem) => {

    if (activeMediaField.startsWith('member-image-')) {
        const index = parseInt(activeMediaField.split('-').pop() || '0');
        updateMember(index, 'image', item.url);

    } else

    if (activeMediaField.startsWith('slider-image-')) {
        const index = parseInt(activeMediaField.split('-').pop() || '0');
        handleUpdateSlide('image', index, 'url', item.url);

    } else 
      
    if (activeMediaField.startsWith('slider-video-')) {
        const index = parseInt(activeMediaField.split('-').pop() || '0');
        handleUpdateSlide('video', index, 'url', item.url);
        if (item.type === 'video' && 'poster' in item) {
            // handleUpdateSlide('video', index, 'poster', item.poster); // If your media item has a poster
        }

    } else
    
    if (activeMediaField === 'gallery') {
      const currentList = formData.images || [];
      // Add item to gallery list
      updateField('images', [...currentList, { url: item.url, type: item.type }]);
    
    
    } else 
      
    if (activeMediaField === 'backgroundImage' || activeMediaField === 'image') {
      updateField(activeMediaField, item.url);
    }
    setIsMediaPickerOpen(false);
  };

  // Helper to manage custom stats array
  const addStat = () => {
      const currentStats = formData.customStats || [];
      updateField('customStats', [...currentStats, { label: 'New Stat', value: '100' }]);
  };
  
  const updateStat = (index: number, field: 'label' | 'value', val: string) => {
      const currentStats = [...(formData.customStats || [])];
      currentStats[index][field] = val;
      updateField('customStats', currentStats);
  };

  const removeStat = (index: number) => {
      const currentStats = [...(formData.customStats || [])];
      currentStats.splice(index, 1);
      updateField('customStats', currentStats);
  };

  // Helper for managing slider items
  const handleAddSlide = (type: 'image' | 'video') => {
      const field = type === 'image' ? 'images' : 'videos';
      const newItem = type === 'image' ? { url: '', caption: '' } : { url: '', title: '', poster: '' };
      updateField(field, [...(formData[field] || []), newItem]);
  };

  const handleUpdateSlide = (type: 'image' | 'video', index: number, key: string, val: string) => {
      const field = type === 'image' ? 'images' : 'videos';
      const newSlides = [...(formData[field] || [])];
      newSlides[index][key] = val;
      updateField(field, newSlides);
  };

  const handleRemoveSlide = (type: 'image' | 'video', index: number) => {
      const field = type === 'image' ? 'images' : 'videos';
      const newSlides = [...(formData[field] || [])];
      newSlides.splice(index, 1);
      updateField(field, newSlides);
  };

  // Helper to update the menu config for a specific section
  const updateMenuConfig = (targetSectionId: string, field: 'visible' | 'label', value: any) => {
    const currentConfig = formData.menuConfig || {};
    const sectionConfig = currentConfig[targetSectionId] || { visible: true, label: '' };
    
    const newConfig = {
        ...currentConfig,
        [targetSectionId]: {
            ...sectionConfig,
            [field]: value
        }
    };
    updateField('menuConfig', newConfig);
  };

  // Team Helpers
  const handleAddMember = () => {
      const current = formData.members || [];
      updateField('members', [...current, { name: 'New Member', role: 'Role', image: '' }]);
  };
  const updateMember = (idx: number, field: string, val: any) => {
      const current = [...(formData.members || [])];
      current[idx][field] = val;
      updateField('members', current);
  };
  const removeMember = (idx: number) => {
      const current = [...(formData.members || [])];
      current.splice(idx, 1);
      updateField('members', current);
  };

  // Pricing Helpers
  const handleAddPlan = () => {
      const current = formData.plans || [];
      updateField('plans', [...current, { name: 'Basic', price: '1000', features: 'Feature 1, Feature 2' }]);
  };
  const updatePlan = (idx: number, field: string, val: any) => {
      const current = [...(formData.plans || [])];
      current[idx][field] = val;
      updateField('plans', current);
  };
  const removePlan = (idx: number) => {
      const current = [...(formData.plans || [])];
      current.splice(idx, 1);
      updateField('plans', current);
  };


  // --- RENDER FORM FIELDS BASED ON TYPE ---
  const renderFields = () => {
    switch (section.type) {

      case 'header':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Logo Text (Site Name)</Label>
              <Input 
                value={formData.logoText || ''} 
                onChange={e => updateField('logoText', e.target.value)} 
                placeholder="e.g. Hamza Kael"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Logo Image (Optional)</Label>
              <div className="flex items-center gap-4">
                {formData.logoImage && (
                  <img src={formData.logoImage} alt="Logo" className="w-10 h-10 object-contain border rounded" />
                )}
                <Button variant="outline" onClick={() => { setActiveMediaField('logoImage'); setIsMediaPickerOpen(true); }}>
                  {formData.logoImage ? "Change Logo" : "Upload Logo"}
                </Button>
              </div>
            </div>

             <div className="flex items-center justify-between border p-3 rounded-md">
                <Label htmlFor="isSticky">Sticky Header (Stays on top)</Label>
                <Switch 
                  id="isSticky"
                  checked={formData.isSticky !== false} 
                  onCheckedChange={(checked) => updateField('isSticky', checked)}
                />
             </div>

             {/* --- NEW: MENU BUILDER --- */}
             <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                    <Label className="text-base">Navigation Menu</Label>
                    <div className="flex items-center gap-2">
                        <Label htmlFor="autoMenu" className="text-xs font-normal text-muted-foreground">Auto-Generate?</Label>
                        <Switch 
                            id="autoMenu"
                            checked={formData.autoMenu !== false} 
                            onCheckedChange={(checked) => updateField('autoMenu', checked)}
                        />
                    </div>
                </div>
                
                {/* Only show manual builder if Auto is OFF */}
                {formData.autoMenu === false && (
                    <div className="space-y-2 bg-muted/30 p-3 rounded-md border">
                        <p className="text-xs text-muted-foreground mb-2">Select sections to show and rename them.</p>
                        {sections
                            .filter(s => s.type !== 'header' && s.isVisible) // Only show visible sections
                            .map(s => {
                                const config = formData.menuConfig?.[s.id] || {};
                                const isSelected = config.visible !== false; // Default to true
                                const label = config.label || s.data.title || s.type;

                                return (
                                    <div key={s.id} className="flex items-center gap-3">
                                        <Switch 
                                            checked={isSelected}
                                            onCheckedChange={(c) => updateMenuConfig(s.id, 'visible', c)}
                                        />
                                        <Input 
                                            value={label} 
                                            onChange={(e) => updateMenuConfig(s.id, 'label', e.target.value)}
                                            disabled={!isSelected}
                                            className="h-8 text-sm"
                                            placeholder="Menu Label"
                                        />
                                        <span className="text-xs text-muted-foreground whitespace-nowrap capitalize w-16 truncate">
                                            ({s.type})
                                        </span>
                                    </div>
                                );
                            })
                        }
                        {sections.filter(s => s.type !== 'header' && s.isVisible).length === 0 && (
                            <p className="text-xs text-yellow-500">Add other sections to your page first!</p>
                        )}
                    </div>
                )}
             </div>
             {/* ------------------------- */}

             <div className="pt-4 border-t space-y-2">
                <Label>Call to Action Button</Label>
                <div className="grid grid-cols-2 gap-2">
                    <Input 
                        value={formData.ctaText || ''} 
                        onChange={e => updateField('ctaText', e.target.value)} 
                        placeholder="Button Text" 
                    />
                    <Input 
                        value={formData.ctaLink || ''} 
                        onChange={e => updateField('ctaLink', e.target.value)} 
                        placeholder="#contact" 
                    />
                </div>
             </div>
          </div>
        );
        
      case 'hero':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Headline</Label>
              <Input 
                value={formData.headline || ''} 
                onChange={e => updateField('headline', e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label>Subheadline</Label>
              <Input 
                value={formData.subheadline || ''} 
                onChange={e => updateField('subheadline', e.target.value)} 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Button Text</Label>
                    <Input value={formData.ctaText || ''} onChange={e => updateField('ctaText', e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label>Button Link</Label>
                    <Input value={formData.ctaLink || ''} onChange={e => updateField('ctaLink', e.target.value)} placeholder="#contact" />
                </div>
            </div>
             <div className="space-y-2">
              <Label>Text Alignment</Label>
              <Select 
                value={formData.alignment || 'center'} 
                onValueChange={(val) => updateField('alignment', val)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Overlay Opacity ({formData.overlayOpacity || 50}%)</Label>
               <Input 
                type="range" min="0" max="100" 
                value={formData.overlayOpacity || 50} 
                onChange={e => updateField('overlayOpacity', parseInt(e.target.value))} 
              />
            </div>
            <div className="space-y-2">
              <Label>Background Image</Label>
              <div className="flex items-center gap-4">
                {formData.backgroundImage && (
                  <img src={formData.backgroundImage} alt="Preview" className="w-20 h-20 object-cover rounded-md border" />
                )}
                <Button variant="outline" onClick={() => { setActiveMediaField('backgroundImage'); setIsMediaPickerOpen(true); }}>
                  {formData.backgroundImage ? "Change Image" : "Select Image"}
                </Button>
              </div>
            </div>
          </div>
        );

        case 'team':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Section Title</Label>
              <Input value={formData.title || ''} onChange={e => updateField('title', e.target.value)} />
            </div>
            <div className="space-y-3 pt-4 border-t">
               <div className="flex justify-between items-center">
                   <Label>Team Members</Label>
                   <Button size="sm" variant="outline" onClick={handleAddMember}><Plus className="w-4 h-4 mr-2" /> Add Member</Button>
               </div>
               <div className="space-y-4">
                   {(formData.members || []).map((member: any, idx: number) => (
                       <div key={idx} className="border p-4 rounded-md bg-muted/20 space-y-3">
                           <div className="flex gap-4 items-start">
                               {/* Image Picker */}
                               <div 
                                 className="w-16 h-16 bg-muted rounded-full flex-shrink-0 relative overflow-hidden group cursor-pointer border" 
                                 onClick={() => { setActiveMediaField(`member-image-${idx}`); setIsMediaPickerOpen(true); }}
                               >
                                   {member.image ? <img src={member.image} className="w-full h-full object-cover" /> : <Users className="w-6 h-6 text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />}
                               </div>
                               <div className="flex-grow grid gap-2">
                                   <Input placeholder="Name" value={member.name} onChange={e => updateMember(idx, 'name', e.target.value)} />
                                   <Input placeholder="Role" value={member.role} onChange={e => updateMember(idx, 'role', e.target.value)} />
                               </div>
                               <Button size="icon" variant="ghost" className="text-destructive" onClick={() => removeMember(idx)}><Trash2 className="w-4 h-4" /></Button>
                           </div>
                           <Textarea placeholder="Short Bio (Optional)" value={member.bio} onChange={e => updateMember(idx, 'bio', e.target.value)} rows={2} />
                       </div>
                   ))}
               </div>
            </div>
          </div>
        );

      // --- MAP SECTION EDITOR ---
      case 'map':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Section Title</Label>
              <Input value={formData.title || ''} onChange={e => updateField('title', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Google Maps Embed URL</Label>
              <Input value={formData.mapUrl || ''} onChange={e => updateField('mapUrl', e.target.value)} placeholder='<iframe src="..."> or https://...' />
              <p className="text-xs text-muted-foreground">Go to Google Maps {'>'} Share {'>'} Embed a map {'>'} Copy HTML (src only)</p>
            </div>
            <div className="space-y-2">
                <Label>Height</Label>
                <Select value={formData.height || 'medium'} onValueChange={(val) => updateField('height', val)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="medium">Medium (400px)</SelectItem>
                        <SelectItem value="large">Large (600px)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>
        );

      // --- PRICING SECTION EDITOR ---
      case 'pricing':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Section Title</Label>
              <Input value={formData.title || ''} onChange={e => updateField('title', e.target.value)} />
            </div>
             <div className="space-y-2">
                <Label>Layout Mode</Label>
                <Select value={formData.layout || 'cards'} onValueChange={(val) => updateField('layout', val)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="cards">Grid Cards</SelectItem>
                        <SelectItem value="slider">Carousel Slider</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-3 pt-4 border-t">
               <div className="flex justify-between items-center">
                   <Label>Pricing Plans</Label>
                   <Button size="sm" variant="outline" onClick={handleAddPlan}><Plus className="w-4 h-4 mr-2" /> Add Plan</Button>
               </div>
               <div className="space-y-4">
                   {(formData.plans || []).map((plan: any, idx: number) => (
                       <div key={idx} className="border p-4 rounded-md bg-muted/20 space-y-3 relative">
                           <Button size="icon" variant="ghost" className="absolute top-2 right-2 text-destructive" onClick={() => removePlan(idx)}><Trash2 className="w-4 h-4" /></Button>
                           
                           <div className="grid grid-cols-2 gap-2">
                               <div className="space-y-1">
                                   <Label className="text-xs">Plan Name</Label>
                                   <Input placeholder="e.g. Basic" value={plan.name} onChange={e => updatePlan(idx, 'name', e.target.value)} />
                               </div>
                               <div className="space-y-1">
                                   <Label className="text-xs">Price</Label>
                                   <Input placeholder="e.g. $100" value={plan.price} onChange={e => updatePlan(idx, 'price', e.target.value)} />
                               </div>
                           </div>
                           <div className="space-y-1">
                               <Label className="text-xs">Features (Comma separated)</Label>
                               <Textarea placeholder="Feature 1, Feature 2, Feature 3" value={plan.features} onChange={e => updatePlan(idx, 'features', e.target.value)} />
                           </div>
                           <div className="space-y-1">
                               <Label className="text-xs">Button Text</Label>
                               <Input placeholder="e.g. Choose Plan" value={plan.cta} onChange={e => updatePlan(idx, 'cta', e.target.value)} />
                           </div>
                       </div>
                   ))}
               </div>
            </div>
          </div>
        );

      case 'about':
        return (
          <div className="space-y-6">
             <div className="space-y-2">
              <Label>Eyebrow Label (Small Text)</Label>
              <Input value={formData.label || ''} onChange={e => updateField('label', e.target.value)} placeholder="e.g. Who I Am" />
            </div>
            <div className="space-y-2">
              <Label>Main Title</Label>
              <Input value={formData.title || ''} onChange={e => updateField('title', e.target.value)} />
            </div>
            
            <div className="space-y-2">
              <Label>Layout Style</Label>
              <Select 
                value={formData.layout || 'split-right'} 
                onValueChange={(val) => updateField('layout', val)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="split-right">Image Right</SelectItem>
                  <SelectItem value="split-left">Image Left</SelectItem>
                  <SelectItem value="stacked">Stacked (Image Top)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Bio Content</Label>
              <Textarea 
                rows={6}
                value={formData.content || ''} 
                onChange={e => updateField('content', e.target.value)} 
              />
            </div>

            <div className="space-y-2">
              <Label>Profile Picture</Label>
              <div className="flex items-center gap-4">
                {formData.image && (
                  <img src={formData.image} alt="Preview" className="w-20 h-20 object-cover rounded-md border" />
                )}
                <Button variant="outline" onClick={() => { setActiveMediaField('image'); setIsMediaPickerOpen(true); }}>
                  {formData.image ? "Change Image" : "Select Image"}
                </Button>
              </div>
            </div>

            {/* --- FEATURES LIST (Bullet points) --- */}
            <div className="pt-4 border-t space-y-3">
               <div className="flex justify-between items-center">
                   <Label>Key Features (Bullet Points)</Label>
                   <Button size="sm" variant="outline" onClick={() => {
                       const current = formData.features || [];
                       updateField('features', [...current, "New Feature"]);
                   }}>
                       <Plus className="w-3 h-3 mr-1" /> Add
                   </Button>
               </div>
               <div className="space-y-2">
                   {(formData.features || []).map((feature: string, idx: number) => (
                       <div key={idx} className="flex gap-2">
                           <Input 
                              value={feature} 
                              onChange={(e) => {
                                  const newFeatures = [...formData.features];
                                  newFeatures[idx] = e.target.value;
                                  updateField('features', newFeatures);
                              }} 
                           />
                           <Button size="icon" variant="ghost" onClick={() => {
                                const newFeatures = [...formData.features];
                                newFeatures.splice(idx, 1);
                                updateField('features', newFeatures);
                           }}>
                               <Trash2 className="w-4 h-4 text-muted-foreground" />
                           </Button>
                       </div>
                   ))}
               </div>
            </div>

            {/* --- STATS TOGGLE & LIST --- */}
            <div className="pt-4 border-t space-y-4">
                <div className="flex items-center justify-between border p-3 rounded-md">
                    <Label htmlFor="showStats">Show Statistics</Label>
                    <Switch 
                      id="showStats"
                      checked={formData.showStats !== false} 
                      onCheckedChange={(checked) => updateField('showStats', checked)}
                    />
                </div>
                
                {formData.showStats !== false && (
                    <div className="space-y-3 pl-2 border-l-2 border-muted">
                        <div className="flex justify-between items-center">
                            <Label>Stats</Label>
                            <Button size="sm" variant="ghost" onClick={() => {
                                const current = formData.stats || [];
                                updateField('stats', [...current, { label: "Label", value: "0" }]);
                            }}>
                                <Plus className="w-3 h-3 mr-1" /> Add Stat
                            </Button>
                        </div>
                        {(formData.stats || []).map((stat: any, idx: number) => (
                            <div key={idx} className="flex gap-2">
                                <Input 
                                    placeholder="Value (e.g. 10+)" 
                                    value={stat.value} 
                                    onChange={(e) => {
                                        const newStats = [...formData.stats];
                                        newStats[idx].value = e.target.value;
                                        updateField('stats', newStats);
                                    }}
                                    className="w-20"
                                />
                                <Input 
                                    placeholder="Label (e.g. Years)" 
                                    value={stat.label} 
                                    onChange={(e) => {
                                        const newStats = [...formData.stats];
                                        newStats[idx].label = e.target.value;
                                        updateField('stats', newStats);
                                    }} 
                                />
                                <Button size="icon" variant="ghost" onClick={() => {
                                    const newStats = [...formData.stats];
                                    newStats.splice(idx, 1);
                                    updateField('stats', newStats);
                                }}>
                                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
          </div>
        );

      case 'stats':
        return (
          <div className="space-y-4">
             <p className="text-sm text-muted-foreground">Choose which statistics to display.</p>
             <div className="flex items-center justify-between border p-3 rounded-md">
                <Label htmlFor="showProjects">Show Completed Projects (Auto)</Label>
                <Switch 
                  id="showProjects"
                  checked={formData.showProjects !== false} 
                  onCheckedChange={(checked) => updateField('showProjects', checked)}
                />
             </div>
             <div className="flex items-center justify-between border p-3 rounded-md">
                <Label htmlFor="showExperience">Show Years of Experience (Auto)</Label>
                <Switch 
                  id="showExperience"
                  checked={formData.showExperience !== false}
                  onCheckedChange={(checked) => updateField('showExperience', checked)}
                />
             </div>
             
             <div className="pt-4 border-t">
                 <div className="flex justify-between items-center mb-2">
                     <Label>Custom Stats</Label>
                     <Button size="sm" variant="ghost" onClick={addStat}><Plus className="w-4 h-4 mr-1"/> Add</Button>
                 </div>
                 <div className="space-y-2">
                     {(formData.customStats || []).map((stat: any, index: number) => (
                         <div key={index} className="flex gap-2 items-center">
                             <Input placeholder="Label (e.g. Clients)" value={stat.label} onChange={e => updateStat(index, 'label', e.target.value)} className="flex-1" />
                             <Input placeholder="Value (e.g. 50+)" value={stat.value} onChange={e => updateStat(index, 'value', e.target.value)} className="w-24" />
                             <Button size="icon" variant="ghost" onClick={() => removeStat(index)}><Trash2 className="w-4 h-4 text-destructive"/></Button>
                         </div>
                     ))}
                 </div>
             </div>
          </div>
        );

      case 'demos':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Section Title</Label>
              <Input value={formData.title || 'Featured Work'} onChange={e => updateField('title', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Layout Style</Label>
              <Select 
                value={formData.layout || 'grid'} 
                onValueChange={(val) => updateField('layout', val)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid View</SelectItem>
                  <SelectItem value="list">List View</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between border p-3 rounded-md">
                <Label htmlFor="showAudio">Show Audio Demos</Label>
                <Switch id="showAudio" checked={formData.showAudio !== false} onCheckedChange={(c) => updateField('showAudio', c)} />
             </div>
             <div className="flex items-center justify-between border p-3 rounded-md">
                <Label htmlFor="showVideo">Show Video Demos</Label>
                <Switch id="showVideo" checked={formData.showVideo !== false} onCheckedChange={(c) => updateField('showVideo', c)} />
             </div>
          </div>
        );

        case 'services_showcase':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Section Title</Label>
              <Input value={formData.title || 'My Services & Work'} onChange={e => updateField('title', e.target.value)} />
            </div>

            <div className="flex items-center justify-between border p-3 rounded-md">
                <div className="space-y-0.5">
                    <Label htmlFor="showRates">Show Rates & Description</Label>
                    <p className="text-xs text-muted-foreground">Display the starting price and details for each service.</p>
                </div>
                <Switch 
                  id="showRates"
                  checked={formData.showRates !== false} 
                  onCheckedChange={(checked) => updateField('showRates', checked)}
                />
             </div>

             <div className="flex items-center justify-between border p-3 rounded-md">
                <div className="space-y-0.5">
                    <Label htmlFor="showDemos">Show Demos</Label>
                    <p className="text-xs text-muted-foreground">Display your uploaded demos for each service category.</p>
                </div>
                <Switch 
                  id="showDemos"
                  checked={formData.showDemos !== false} 
                  onCheckedChange={(checked) => updateField('showDemos', checked)}
                />
             </div>

             <div className="pt-4 border-t space-y-2">
                <Label>Call to Action Button</Label>
                <div className="grid grid-cols-2 gap-2">
                    <Input 
                        value={formData.ctaText || ''} 
                        onChange={e => updateField('ctaText', e.target.value)} 
                        placeholder="Button Text" 
                    />
                    <Input 
                        value={formData.ctaLink || ''} 
                        onChange={e => updateField('ctaLink', e.target.value)} 
                        placeholder="#contact" 
                    />
                </div>
             </div>
          </div>
        );

      case 'services':
        return (
           <div className="space-y-4">
            <div className="space-y-2">
              <Label>Section Title</Label>
              <Input value={formData.title || 'What I Offer'} onChange={e => updateField('title', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Display Mode</Label>
              <Select 
                value={formData.displayMode || 'cards'} 
                onValueChange={(val) => updateField('displayMode', val)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cards">Cards (Grid)</SelectItem>
                  <SelectItem value="list">Simple List</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between border p-3 rounded-md">
                <Label htmlFor="showRates">Show Starting Rates</Label>
                <Switch 
                  id="showRates"
                  checked={formData.showRates !== false}
                  onCheckedChange={(checked) => updateField('showRates', checked)}
                />
             </div>
           </div>
        );

      case 'reviews':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Section Title</Label>
              <Input value={formData.title || 'Client Love'} onChange={e => updateField('title', e.target.value)} />
            </div>
            <div className="flex items-center justify-between border p-3 rounded-md">
                <Label htmlFor="autoScroll">Auto-scroll Reviews</Label>
                <Switch 
                  id="autoScroll"
                  checked={formData.autoScroll !== false}
                  onCheckedChange={(checked) => updateField('autoScroll', checked)}
                />
             </div>
          </div>
        );

        case 'image_slider':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Section Title (Optional)</Label>
              <Input value={formData.title || ''} onChange={e => updateField('title', e.target.value)} placeholder="e.g. My Best Shots" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Slider Height</Label>
                    <Select value={formData.height || 'large'} onValueChange={(val) => updateField('height', val)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                           <SelectItem value="medium">Medium (400px)</SelectItem>
                           <SelectItem value="large">Large (600px)</SelectItem>
                           <SelectItem value="full">Full Screen</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Autoplay Interval (s)</Label>
                     <Select value={String(formData.interval || '5')} onValueChange={(val) => updateField('interval', parseInt(val))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                           <SelectItem value="0">Disabled</SelectItem>
                           <SelectItem value="3">3 seconds</SelectItem>
                           <SelectItem value="5">5 seconds</SelectItem>
                           <SelectItem value="8">8 seconds</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-3">
               <div className="flex justify-between items-center">
                   <Label>Slides</Label>
                   <Button size="sm" variant="outline" onClick={() => handleAddSlide('image')}>
                       <Plus className="w-4 h-4 mr-2" /> Add Slide
                   </Button>
               </div>
               <div className="space-y-2">
                   {(formData.images || []).map((slide: any, idx: number) => (
                       <div key={idx} className="flex gap-3 items-start border p-2 rounded-md bg-muted/20">
                           {/* Image Preview & Picker */}
                           <div className="w-20 h-20 bg-muted rounded-md flex-shrink-0 relative overflow-hidden group cursor-pointer" onClick={() => { setActiveMediaField(`slider-image-${idx}`); setIsMediaPickerOpen(true); }}>
                               {slide.url ? <img src={slide.url} className="w-full h-full object-cover" /> : <ImageIcon className="w-8 h-8 text-muted-foreground absolute center" />}
                               <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs text-white">Change</div>
                           </div>
                           
                           {/* Caption Input */}
                           <div className="flex-grow space-y-2">
                               <Input placeholder="Caption / Title (Optional)" value={slide.caption} onChange={e => handleUpdateSlide('image', idx, 'caption', e.target.value)} />
                           </div>

                           {/* Remove Button */}
                           <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => handleRemoveSlide('image', idx)}>
                               <X className="w-4 h-4" />
                           </Button>
                       </div>
                   ))}
                    {(formData.images || []).length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No slides added yet.</p>}
               </div>
            </div>
          </div>
        );

      case 'video_slider':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Section Title (Optional)</Label>
              <Input value={formData.title || ''} onChange={e => updateField('title', e.target.value)} placeholder="e.g. Showreel Highlights" />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Slider Height</Label>
                    <Select value={formData.height || 'large'} onValueChange={(val) => updateField('height', val)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                           <SelectItem value="medium">Medium (400px)</SelectItem>
                           <SelectItem value="large">Large (600px)</SelectItem>
                           <SelectItem value="full">Full Screen</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div className="flex items-center justify-between border p-3 rounded-md h-[74px]">
                    <Label htmlFor="autoplayVideo">Autoplay Videos (Muted)</Label>
                    <Switch id="autoplayVideo" checked={formData.autoplay !== false} onCheckedChange={(c) => updateField('autoplay', c)} />
                 </div>
            </div>

             <div className="space-y-3">
               <div className="flex justify-between items-center">
                   <Label>Video Slides</Label>
                   <Button size="sm" variant="outline" onClick={() => handleAddSlide('video')}>
                       <Plus className="w-4 h-4 mr-2" /> Add Video
                   </Button>
               </div>
               <div className="space-y-2">
                   {(formData.videos || []).map((slide: any, idx: number) => (
                       <div key={idx} className="flex gap-3 items-start border p-2 rounded-md bg-muted/20">
                           {/* Video Preview/Picker */}
                           <div className="w-32 h-20 bg-black rounded-md flex-shrink-0 relative overflow-hidden group cursor-pointer flex items-center justify-center" onClick={() => { setActiveMediaField(`slider-video-${idx}`); setIsMediaPickerOpen(true); }}>
                               {slide.url ? <video src={slide.url} className="w-full h-full object-cover pointer-events-none" /> : <LinkIcon className="w-8 h-8 text-muted-foreground" />}
                               <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs text-white">Change Video</div>
                           </div>
                           
                           {/* Title Input */}
                           <div className="flex-grow flex flex-col justify-center">
                               <Input placeholder="Video Title" value={slide.title} onChange={e => handleUpdateSlide('video', idx, 'title', e.target.value)} />
                           </div>

                           {/* Remove Button */}
                           <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => handleRemoveSlide('video', idx)}>
                               <X className="w-4 h-4" />
                           </Button>
                       </div>
                   ))}
                    {(formData.videos || []).length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No videos added yet.</p>}
               </div>
            </div>
          </div>
        );

      case 'gallery':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Section Title</Label>
              <Input value={formData.title || 'Gallery'} onChange={e => updateField('title', e.target.value)} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label>Grid Columns</Label>
                    <Select value={String(formData.gridColumns || '3')} onValueChange={(val) => updateField('gridColumns', parseInt(val))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                           <SelectItem value="2">2 Columns</SelectItem>
                           <SelectItem value="3">3 Columns</SelectItem>
                           <SelectItem value="4">4 Columns</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-2">
                    <Label>Gap Size</Label>
                    <Select value={formData.gap || 'medium'} onValueChange={(val) => updateField('gap', val)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                           <SelectItem value="none">None</SelectItem>
                           <SelectItem value="small">Small</SelectItem>
                           <SelectItem value="medium">Medium</SelectItem>
                           <SelectItem value="large">Large</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                 <Label>Images</Label>
                 <Button size="sm" variant="outline" onClick={() => { setActiveMediaField('gallery'); setIsMediaPickerOpen(true); }}>
                    <Plus className="w-4 h-4 mr-2" /> Add Media
                 </Button>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mt-2">
                {(formData.images || []).map((img: any, idx: number) => (
                  <div key={idx} className="relative group aspect-square bg-muted rounded-md overflow-hidden border">
                    <img src={img.url} alt="Gallery" className="w-full h-full object-cover" />
                    <button 
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        const newImages = [...formData.images];
                        newImages.splice(idx, 1);
                        updateField('images', newImages);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'contact':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Section Title</Label>
              <Input value={formData.title || "Let's Work Together"} onChange={e => updateField('title', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input value={formData.email || ''} onChange={e => updateField('email', e.target.value)} placeholder="your@email.com" />
            </div>
            <div className="space-y-2">
              <Label>Button Text</Label>
              <Input value={formData.emailText || "Get a Quote"} onChange={e => updateField('emailText', e.target.value)} />
            </div>
            <div className="flex items-center justify-between border p-3 rounded-md">
                <Label htmlFor="showPhone">Show Phone Number</Label>
                <Switch id="showPhone" checked={formData.showPhone || false} onCheckedChange={(c) => updateField('showPhone', c)} />
             </div>
            
            <div className="pt-4 border-t">
                <Label className="mb-2 block">Social Links</Label>
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <span className="text-sm w-20">LinkedIn</span>
                        <Input value={formData.linkedin || ''} onChange={e => updateField('linkedin', e.target.value)} placeholder="URL" />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm w-20">Instagram</span>
                        <Input value={formData.instagram || ''} onChange={e => updateField('instagram', e.target.value)} placeholder="URL" />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm w-20">Twitter</span>
                        <Input value={formData.twitter || ''} onChange={e => updateField('twitter', e.target.value)} placeholder="URL" />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm w-20">Website</span>
                        <Input value={formData.website || ''} onChange={e => updateField('website', e.target.value)} placeholder="URL" />
                    </div>
                </div>
            </div>
          </div>
        );
      
      default:
        return <p className="text-muted-foreground">No settings available for this section type.</p>;
    }
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>Edit {section.type.charAt(0).toUpperCase() + section.type.slice(1)} Section</SheetTitle>
          </SheetHeader>

          {renderFields()}

          <SheetFooter className="mt-8">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* --- MEDIA PICKER DIALOG --- */}
      <Dialog open={isMediaPickerOpen} onOpenChange={setIsMediaPickerOpen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
            <div className="p-6 flex-grow overflow-hidden">
                <PortfolioMediaManager actorId={actorId} onSelect={handleMediaSelect} />
            </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SectionEditor;