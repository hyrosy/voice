import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Video, Map, Users, ShoppingBag, DollarSign, Trash2,FileText, X, Plus, Image as ImageIcon, Link as LinkIcon, MessageCircle, ExternalLink } from 'lucide-react';
import PortfolioMediaManager, { UnifiedMediaItem } from './PortfolioMediaManager';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { PortfolioSection } from '../../types/portfolio';
import { THEME_REGISTRY } from '../../themes/registry';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // <--- You need this component

interface SectionEditorProps {
  section: PortfolioSection | null;
  sections: PortfolioSection[]; // <-- NEW PROP: We need context of all sections
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedSection: PortfolioSection) => void;
  actorId: string;
  themeId?: string; // <--- Pass the active theme ID so we know which schema to load
}

const SectionEditor: React.FC<SectionEditorProps> = ({ section, isOpen, onClose, onSave, actorId, sections, themeId = 'modern' }) => {
const [formData, setFormData] = useState<Record<string, any>>({});
  const [settingsData, setSettingsData] = useState<Record<string, any>>({}); // Zone B Data
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [activeMediaField, setActiveMediaField] = useState<string>('');

  useEffect(() => {
    if (section) {
      // Zone A: Core Data
      setFormData(JSON.parse(JSON.stringify(section.data || {}))); 
      // Zone B: Theme Settings (or empty object if none)
      setSettingsData(JSON.parse(JSON.stringify(section.settings || {})));
    }
  }, [section]);

  if (!section) return null;

  const handleSave = () => {
    onSave({ 
        ...section, 
        data: formData,      // Save Core Data
        settings: settingsData // Save Theme Settings
    });
    onClose();
  };

  const updateField = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // --- HELPER: UPDATE THEME SETTINGS (Zone B) ---
  const updateSetting = (key: string, value: any) => {
    setSettingsData(prev => ({ ...prev, [key]: value }));
  };

  const handleMediaSelect = (item: UnifiedMediaItem) => {

    // 1. HEADER LOGO FIX
    if (activeMediaField === 'logoImage') {
       updateField('logoImage', item.url);
    
    // 2. Team Member Images
    } else if (activeMediaField.startsWith('member-image-')) {
        const index = parseInt(activeMediaField.split('-').pop() || '0');
        updateMember(index, 'image', item.url);

    // 3. Slider Images
    } else if (activeMediaField.startsWith('slider-image-')) {
        const index = parseInt(activeMediaField.split('-').pop() || '0');
        handleUpdateSlide('image', index, 'url', item.url);

    // 4. Slider Videos
    } else if (activeMediaField.startsWith('slider-video-')) {
        const index = parseInt(activeMediaField.split('-').pop() || '0');
        handleUpdateSlide('video', index, 'url', item.url);
        if (!formData.videos?.[index]?.title) {
           handleUpdateSlide('video', index, 'title', item.title || 'Video');
        }

    // 5. Gallery
    } else if (activeMediaField === 'gallery') {
      const currentList = formData.images || [];
      updateField('images', [...currentList, { url: item.url, type: item.type }]);
    
    // 6. Generic Single Images
    } else if (activeMediaField === 'backgroundImage') {
    // If we are editing the Header, background image is usually a Design Setting
    if (section.type === 'header') {
        updateSetting('backgroundImage', item.url); 
    } else {
        updateField('backgroundImage', item.url);
    }
    } else if (activeMediaField === 'image') {
    updateField('image', item.url);

    // 7. Generic Video URL (Hero Video)
    } else if (activeMediaField === 'videoUrl') {
       updateField('videoUrl', item.url);
    

    } else if (activeMediaField.startsWith('product-image-')) {
        // OLD SINGLE IMAGE LOGIC (Keep if you want, or replace)
        const index = parseInt(activeMediaField.split('-').pop() || '0');
        const currentProducts = [...(formData.products || [])];
        if (currentProducts[index]) {
            currentProducts[index].image = item.url; // Main/Legacy image
            // Also ensure it's in the images array if empty
            if (!currentProducts[index].images) currentProducts[index].images = [];
            if (currentProducts[index].images.length === 0) currentProducts[index].images.push(item.url);
            
            updateField('products', currentProducts);
        }
    } else if (activeMediaField.startsWith('product-gallery-add-')) {
        // NEW MULTI-IMAGE LOGIC
        const index = parseInt(activeMediaField.split('product-gallery-add-')[1]);
        const currentProducts = [...(formData.products || [])];
        if (currentProducts[index]) {
            const currentImages = currentProducts[index].images || [];
            // Add new image to array
            currentProducts[index].images = [...currentImages, item.url];
            // If main image is empty, set this as main
            if (!currentProducts[index].image) currentProducts[index].image = item.url;
            
            updateField('products', currentProducts);
        }
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

  // --- SHOP HELPERS ---
  const handleAddProduct = () => {
      const current = formData.products || [];
      updateField('products', [...current, { 
          title: 'New Product', 
          price: '$19.99', 
          buttonText: 'Buy Now',
          link: '' 
      }]);
  };
  
  const updateProduct = (idx: number, field: string, val: any) => {
      const current = [...(formData.products || [])];
      current[idx][field] = val;
      updateField('products', current);
  };
  
  const removeProduct = (idx: number) => {
      const current = [...(formData.products || [])];
      current.splice(idx, 1);
      updateField('products', current);
  };

  // =========================================================
  // DYNAMIC FORM BUILDER (The Magic Part)
  // =========================================================
  const renderThemeSettings = () => {
    // 1. Find the active theme component
    const ActiveTheme = THEME_REGISTRY[themeId];
    if (!ActiveTheme) return <p>Theme not found.</p>;

    // 2. Find the component for this section type (e.g., Header)
    // We assume your Registry maps keys like 'header', 'bio', etc.
    // If your registry uses Capitalized keys (Header), match that.
    const ComponentKey = section.type.charAt(0).toUpperCase() + section.type.slice(1).replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    const SectionComponent = (ActiveTheme as any)[ComponentKey] || (ActiveTheme as any)['Header']; // Fallback

    // 3. Get the Schema
    const schema = (SectionComponent as any)?.schema || [];

    if (schema.length === 0) {
        return (
            <div className="p-8 text-center text-muted-foreground bg-muted/10 rounded-lg">
                <p>This section has no design settings for the current theme.</p>
            </div>
        );
    }

    // 4. Render Fields based on Schema
    return (
        <div className="space-y-6 animate-in fade-in">
            {schema.map((field: any) => (
                <div key={field.id} className="space-y-3 p-4 border rounded-lg bg-muted/20">
                    <div className="flex items-center justify-between">
                        <Label htmlFor={field.id} className="text-base font-medium">
                            {field.label}
                        </Label>
                        {/* Optional: Show current value for debugging */}
                        {/* <span className="text-xs text-muted-foreground">{settingsData[field.id]}</span> */}
                    </div>

                    {/* RENDER INPUT BASED ON TYPE */}
                    
                    {/* TOGGLE */}
                    {field.type === 'toggle' && (
                        <Switch 
                            id={field.id}
                            checked={settingsData[field.id] !== undefined ? settingsData[field.id] : field.defaultValue}
                            onCheckedChange={(val) => updateSetting(field.id, val)}
                        />
                    )}

                    {/* SELECT / DROPDOWN */}
                    {field.type === 'select' && (
                        <Select 
                            value={settingsData[field.id] || field.defaultValue} 
                            onValueChange={(val) => updateSetting(field.id, val)}
                        >
                            <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {field.options.map((opt: string) => (
                                    <SelectItem key={opt} value={opt}>
                                        {opt.charAt(0).toUpperCase() + opt.slice(1)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {/* SLIDER */}
                    {field.type === 'slider' && (
                        <div className="pt-2">
                             <Slider 
                                value={[settingsData[field.id] || field.defaultValue]} 
                                min={field.min || 0}
                                max={field.max || 100}
                                step={field.step || 1}
                                onValueChange={([val]) => updateSetting(field.id, val)}
                            />
                            <div className="flex justify-between mt-1">
                                <span className="text-xs text-muted-foreground">{field.min}</span>
                                <span className="text-xs font-medium">{settingsData[field.id] || field.defaultValue}</span>
                                <span className="text-xs text-muted-foreground">{field.max}</span>
                            </div>
                        </div>
                    )}

                    {/* COLOR PICKER (Simple Text Input for now) */}
                    {field.type === 'color' && (
                        <div className="flex gap-2">
                            <Input 
                                type="color" 
                                className="w-12 h-10 p-1 cursor-pointer"
                                value={settingsData[field.id] || field.defaultValue}
                                onChange={(e) => updateSetting(field.id, e.target.value)}
                            />
                            <Input 
                                value={settingsData[field.id] || field.defaultValue}
                                onChange={(e) => updateSetting(field.id, e.target.value)}
                            />
                        </div>
                    )}
                     
                     {/* IMAGE UPLOAD (Using your Media Picker) */}
                     {field.type === 'image' && (
                        <div className="flex gap-2">
                             {settingsData[field.id] && (
                                <img src={settingsData[field.id]} className="h-10 w-10 rounded object-cover border" alt="preview" />
                             )}
                             <Button variant="outline" size="sm" onClick={() => {
                                 setActiveMediaField(field.id); // Set the active field to this setting ID
                                 setIsMediaPickerOpen(true);
                             }}>
                                <ImageIcon className="w-4 h-4 mr-2" /> Select Image
                             </Button>
                        </div>
                     )}

                </div>
            ))}
        </div>
    );
  };


  // --- RENDER FORM FIELDS BASED ON TYPE ---
  const renderFields = () => {
    switch (section.type) {

      case 'header':
  return (
    <div className="space-y-6">
      
      {/* 1. BRANDING */}
      <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
         <Label className="text-base font-semibold">Branding</Label>
         <div className="space-y-2">
            <Label>Logo Text</Label>
            <Input 
              value={formData.logoText || ''} 
              onChange={e => updateField('logoText', e.target.value)} 
              placeholder="e.g. HAMZA KAEL"
            />
         </div>
         
         <div className="space-y-2">
            <Label>Logo Image</Label>
            <div className="flex items-center gap-4">
              {formData.logoImage && (
                <div className="h-10 w-10 bg-black rounded border flex items-center justify-center">
                    <img src={formData.logoImage} alt="Logo" className="max-h-full max-w-full object-contain" />
                </div>
              )}
              <Button size="sm" variant="outline" onClick={() => { setActiveMediaField('logoImage'); setIsMediaPickerOpen(true); }}>
                {formData.logoImage ? "Change Logo" : "Upload Logo"}
              </Button>
            </div>
         </div>

         {/* --- NEW: LOGO SIZE SLIDER --- */}
    {formData.logoImage && (
        <div className="space-y-3 pt-2">
            <div className="flex justify-between">
                <Label>Logo Size (Desktop)</Label>
                <span className="text-xs text-muted-foreground">{formData.logoHeight || 40}px</span>
            </div>
            <Slider 
                value={[formData.logoHeight || 40]} 
                min={20} 
                max={120} 
                step={2} 
                onValueChange={([val]) => updateField('logoHeight', val)} 
            />
        </div>
    )}
    
      </div>

      {/* 2. LAYOUT CONFIG */}
      <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
         <Label className="text-base font-semibold">Layout & Style</Label>
         
         <div className="space-y-2">
            <Label>Header Variant</Label>
            <Select 
                value={formData.variant || 'transparent'} 
                onValueChange={(val) => updateField('variant', val)}
            >
               <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
               <SelectContent>
                  <SelectItem value="transparent">Transparent (Standard)</SelectItem>
                  <SelectItem value="centered">Editorial (Centered Logo)</SelectItem>
                  <SelectItem value="floating">Floating Island (Pill Shape)</SelectItem>
               </SelectContent>
            </Select>
         </div>

         {/* Sticky Toggle - Available for ALL variants now */}
         <div className="flex items-center justify-between border p-3 rounded-md bg-background">
            <div className="space-y-0.5">
                <Label htmlFor="isSticky" className="cursor-pointer">Sticky Header</Label>
                <p className="text-[10px] text-muted-foreground">Keep header at top while scrolling</p>
            </div>
            <Switch 
              id="isSticky"
              checked={formData.isSticky !== false} 
              onCheckedChange={(checked) => updateField('isSticky', checked)}
            />
         </div>
      </div>

      {/* 3. MENU BUILDER */}
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
         
         {formData.autoMenu === false && (
            <div className="space-y-2 bg-muted/30 p-3 rounded-md border">
               <p className="text-xs text-muted-foreground mb-2">Select sections to show and rename them.</p>
               {sections
                  .filter(s => s.type !== 'header' && s.isVisible)
                  .map(s => {
                     const config = formData.menuConfig?.[s.id] || {};
                     const isSelected = config.visible !== false;
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
                           />
                           <span className="text-xs text-muted-foreground whitespace-nowrap capitalize w-16 truncate">
                              ({s.type})
                           </span>
                        </div>
                     );
                  })
               }
            </div>
         )}
      </div>

      {/* 4. CTA BUTTON */}
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


  case 'lead_form':
    return (
        <div className="space-y-8">
            {/* 1. BASIC SETTINGS */}
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label>Section Title</Label>
                    <Input 
                        value={formData.title || ''} 
                        onChange={e => updateField('title', e.target.value)} 
                        placeholder="Get in Touch" 
                    />
                </div>
                <div className="space-y-2">
                    <Label>Subheadline</Label>
                    <Textarea 
                        value={formData.subheadline || ''} 
                        onChange={e => updateField('subheadline', e.target.value)} 
                        placeholder="Send me a message..." 
                        rows={2}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Button Text</Label>
                    <Input 
                        value={formData.buttonText || ''} 
                        onChange={e => updateField('buttonText', e.target.value)} 
                        placeholder="Send Message" 
                    />
                </div>
            </div>

            {/* 2. LAYOUT VARIANT */}
            <div className="space-y-3 pt-4 border-t">
                <Label>Layout Style</Label>
                <Select 
                    value={formData.variant || 'centered'} 
                    onValueChange={(val) => updateField('variant', val)}
                >
                    <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="centered">Centered Box (Standard)</SelectItem>
                        <SelectItem value="split">Split Screen (Image Left)</SelectItem>
                        <SelectItem value="minimal">Minimal (No Background)</SelectItem>
                    </SelectContent>
                </Select>
                
                {formData.variant === 'split' && (
                    <div className="mt-2">
                        <Label className="text-xs">Side Image</Label>
                        <div className="flex gap-2 mt-1">
                            <Input 
                                value={formData.image || ''} 
                                onChange={e => updateField('image', e.target.value)} 
                                placeholder="https://..." 
                                className="text-xs"
                            />
                            {/* You can add the MediaPicker button here if you have it available in scope */}
                        </div>
                    </div>
                )}
            </div>

            {/* 3. FORM FIELDS BUILDER */}
            <div className="space-y-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                    <Label>Form Fields</Label>
                    <Button size="sm" variant="outline" onClick={() => {
                        const newField = { 
                            id: `custom_${Date.now()}`, 
                            label: 'New Field', 
                            type: 'text', 
                            placeholder: '', 
                            required: false, 
                            width: 'full' 
                        };
                        updateField('fields', [...(formData.fields || []), newField]);
                    }}>
                        <Plus className="w-4 h-4 mr-2" /> Add Field
                    </Button>
                </div>

                <div className="space-y-3">
                    {(formData.fields || []).map((field: any, idx: number) => (
                        <div key={idx} className="border p-3 rounded-lg bg-muted/10 space-y-3 group relative">
                            {/* Remove Button */}
                            <button 
                                onClick={() => {
                                    const newFields = [...formData.fields];
                                    newFields.splice(idx, 1);
                                    updateField('fields', newFields);
                                }}
                                className="absolute top-2 right-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 size={14} />
                            </button>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <Label className="text-[10px] text-muted-foreground uppercase">Label</Label>
                                    <Input 
                                        value={field.label} 
                                        onChange={(e) => {
                                            const newFields = [...formData.fields];
                                            newFields[idx].label = e.target.value;
                                            updateField('fields', newFields);
                                        }}
                                        className="h-8 text-xs" 
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] text-muted-foreground uppercase">Type</Label>
                                    <Select 
                                        value={field.type} 
                                        onValueChange={(val) => {
                                            const newFields = [...formData.fields];
                                            newFields[idx].type = val;
                                            updateField('fields', newFields);
                                        }}
                                    >
                                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="text">Short Text</SelectItem>
                                            <SelectItem value="textarea">Long Text</SelectItem>
                                            <SelectItem value="email">Email</SelectItem>
                                            <SelectItem value="tel">Phone</SelectItem>
                                            <SelectItem value="date">Date</SelectItem>
                                            {/* Future: Select/Dropdown */}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <Label className="text-[10px] text-muted-foreground uppercase">Placeholder</Label>
                                    <Input 
                                        value={field.placeholder || ''} 
                                        onChange={(e) => {
                                            const newFields = [...formData.fields];
                                            newFields[idx].placeholder = e.target.value;
                                            updateField('fields', newFields);
                                        }}
                                        className="h-8 text-xs" 
                                        placeholder="e.g. Enter name"
                                    />
                                </div>
                                <div className="flex items-end gap-2 pb-1">
                                    <div className="flex items-center gap-2 border rounded px-2 h-8 w-full bg-background">
                                        <input 
                                            type="checkbox" 
                                            checked={field.required} 
                                            onChange={(e) => {
                                                const newFields = [...formData.fields];
                                                newFields[idx].required = e.target.checked;
                                                updateField('fields', newFields);
                                            }}
                                            className="accent-primary"
                                        />
                                        <span className="text-xs">Required</span>
                                    </div>
                                    <div className="flex items-center gap-2 border rounded px-2 h-8 w-full bg-background">
                                        <input 
                                            type="checkbox" 
                                            checked={field.width === 'half'} 
                                            onChange={(e) => {
                                                const newFields = [...formData.fields];
                                                newFields[idx].width = e.target.checked ? 'half' : 'full';
                                                updateField('fields', newFields);
                                            }}
                                            className="accent-primary"
                                        />
                                        <span className="text-xs">50% Width</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );


  // --- SHOP SECTION EDITOR ---
      case 'shop':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
                <Label>Section Title</Label>
                <Input value={formData.title || ''} onChange={e => updateField('title', e.target.value)} placeholder="Shop" />
            </div>
            
            {/* 1. CONFIGURATION */}
            <div className="grid grid-cols-1 gap-4 p-4 border rounded-lg bg-muted/20">
                <div className="space-y-2">
                    <Label>Layout Style</Label>
                    <Select 
                        value={formData.variant || 'grid'} 
                        onValueChange={(val) => updateField('variant', val)}
                    >
                        <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="grid">Grid (Standard)</SelectItem>
                            <SelectItem value="carousel">Carousel (Horizontal)</SelectItem>
                            <SelectItem value="spotlight">Spotlight (Hero Product)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* 2. PRODUCT MANAGER */}
            <div className="space-y-3 pt-4 border-t">
                <div className="flex justify-between items-center">
                    <Label>Products</Label>
                    <Button size="sm" variant="outline" onClick={handleAddProduct}>
                        <Plus className="w-4 h-4 mr-2" /> Add Product
                    </Button>
                </div>
                
                <div className="space-y-6">
                    {(formData.products || []).map((product: any, idx: number) => (
                        <div key={idx} className="border p-4 rounded-lg bg-muted/10 space-y-4 relative group">
                            
                            <div className="absolute top-3 right-3 flex gap-2">
                                <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="text-muted-foreground hover:text-destructive h-8 w-8" 
                                    onClick={() => removeProduct(idx)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>

                            {/* BASIC INFO */}
                            <div className="flex gap-4 items-start">
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">Product Gallery (First image is featured)</Label>
                                    
                                    <div className="flex flex-wrap gap-2">
                                        {/* Existing Images */}
                                        {(product.images || (product.image ? [product.image] : [])).map((imgUrl: string, imgIdx: number) => (
                                            <div key={imgIdx} className="relative group/thumb w-16 h-16 border rounded overflow-hidden">
                                                <img src={imgUrl} className="w-full h-full object-cover" alt="thumb" />
                                                
                                                {/* Remove Image Button */}
                                                <button
                                                    className="absolute top-0 right-0 bg-red-500/90 text-white p-1 opacity-0 group-hover/thumb:opacity-100 transition-opacity"
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Stop bubble
                                                        const newProds = [...(formData.products || [])];
                                                        const newImages = [...(product.images || [])];
                                                        newImages.splice(imgIdx, 1);
                                                        newProds[idx].images = newImages;
                                                        // Update legacy 'image' field to always be the first one
                                                        newProds[idx].image = newImages[0] || ''; 
                                                        updateField('products', newProds);
                                                    }}
                                                >
                                                    <Trash2 size={10} />
                                                </button>
                                            </div>
                                        ))}

                                        {/* Add New Image Button */}
                                        <div 
                                            className="w-16 h-16 border border-dashed rounded flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 text-muted-foreground hover:text-primary transition-colors"
                                            onClick={() => { 
                                                setActiveMediaField(`product-gallery-add-${idx}`); 
                                                setIsMediaPickerOpen(true); 
                                            }}
                                        >
                                            <Plus size={16} />
                                            <span className="text-[9px] font-semibold mt-1">ADD</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex-grow space-y-2">
                                    <Input 
                                        placeholder="Product Title" 
                                        value={product.title} 
                                        onChange={e => updateProduct(idx, 'title', e.target.value)} 
                                        className="font-medium"
                                    />
                                    <div className="flex gap-2">
                                        <Input 
                                            placeholder="Price" 
                                            value={product.price} 
                                            onChange={e => updateProduct(idx, 'price', e.target.value)} 
                                            className="w-1/2"
                                        />
                                        <Input 
                                            placeholder="Stock" 
                                            value={product.stock} 
                                            onChange={e => updateProduct(idx, 'stock', e.target.value)} 
                                            className="w-1/2"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <Textarea 
                                placeholder="Short description..." 
                                value={product.description} 
                                onChange={e => updateProduct(idx, 'description', e.target.value)} 
                                rows={2}
                                className="text-sm resize-none"
                            />

                            {/* CHECKOUT METHOD SELECTOR */}
                            <div className="p-3 bg-background border rounded-md space-y-3">
                                <Label className="text-xs font-bold text-muted-foreground uppercase">Checkout Action</Label>
                                <Select 
                                    value={product.actionType || 'whatsapp'} 
                                    onValueChange={(val) => updateProduct(idx, 'actionType', val)}
                                >
                                    <SelectTrigger className="h-9 text-sm">
                                        <SelectValue placeholder="Select Action" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="whatsapp">
                                            <div className="flex items-center gap-2"><MessageCircle size={14} className="text-green-500"/> WhatsApp Order</div>
                                        </SelectItem>
                                        <SelectItem value="form_order">
                                            {/* NEW OPTION */}
                                            <div className="flex items-center gap-2"><FileText size={14} className="text-orange-500"/> Direct Order Form</div>
                                        </SelectItem>
                                        <SelectItem value="link">
                                            <div className="flex items-center gap-2"><ExternalLink size={14} className="text-blue-500"/> External Link</div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>

                                {/* CONDITIONAL INPUTS */}
                                {product.actionType === 'link' && (
                                    <Input 
                                        placeholder="https://buy.stripe.com/..." 
                                        value={product.checkoutUrl || ''} 
                                        onChange={e => updateProduct(idx, 'checkoutUrl', e.target.value)} 
                                        className="h-9 text-xs"
                                    />
                                )}
                                
                                {product.actionType === 'whatsapp' && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground whitespace-nowrap">wa.me/</span>
                                        <Input 
                                            placeholder="212600000000" 
                                            value={product.whatsappNumber || ''} 
                                            onChange={e => updateProduct(idx, 'whatsappNumber', e.target.value)} 
                                            className="h-9 text-xs"
                                        />
                                    </div>
                                )}

                                {/* Note: 'form_order' doesn't need extra inputs, just the button label below */}

                                <Input 
                                    placeholder="Button Label (e.g. Buy Now)" 
                                    value={product.buttonText} 
                                    onChange={e => updateProduct(idx, 'buttonText', e.target.value)} 
                                    className="h-9 text-xs"
                                />
                            </div>

                            {/* VISUAL VARIANT BUILDER (Only for WhatsApp flow mostly, but useful for display too) */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <Label className="text-xs">Product Variants</Label>
                                    <Button 
                                        size="sm" variant="ghost" className="h-6 text-[10px]"
                                        onClick={() => {
                                            const current = product.variants || [];
                                            updateProduct(idx, 'variants', [...current, { name: 'Size', options: 'S, M, L' }]);
                                        }}
                                    >
                                        <Plus className="w-3 h-3 mr-1" /> Add Option
                                    </Button>
                                </div>

                                {(product.variants || []).map((v: any, vIdx: number) => (
                                    <div key={vIdx} className="flex gap-2 items-center">
                                        <Input 
                                            placeholder="Type (Color)" 
                                            value={v.name} 
                                            onChange={(e) => {
                                                const newVars = [...(product.variants || [])];
                                                newVars[vIdx].name = e.target.value;
                                                updateProduct(idx, 'variants', newVars);
                                            }}
                                            className="w-1/3 h-8 text-xs"
                                        />
                                        <Input 
                                            placeholder="Options (Red, Blue)" 
                                            value={v.options} 
                                            onChange={(e) => {
                                                const newVars = [...(product.variants || [])];
                                                newVars[vIdx].options = e.target.value;
                                                updateProduct(idx, 'variants', newVars);
                                            }}
                                            className="flex-grow h-8 text-xs"
                                        />
                                        <Button 
                                            variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"
                                            onClick={() => {
                                                 const newVars = [...(product.variants || [])];
                                                 newVars.splice(vIdx, 1);
                                                 updateProduct(idx, 'variants', newVars);
                                            }}
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>

                        </div>
                    ))}
                </div>
            </div>
          </div>
        );

        
case 'hero':
  return (
    <div className="space-y-6">
      
      {/* 1. LAYOUT VARIANT */}
      <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
        <Label>Hero Layout Style</Label>
        <Select 
          value={formData.variant || 'static'} 
          onValueChange={(val) => updateField('variant', val)}
        >
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="Select Layout" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="static">Standard Image</SelectItem>
            <SelectItem value="video">Cinematic Video Background</SelectItem>
            <SelectItem value="slider" disabled>Vertical Slider (Coming Soon)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 2. CONTENT FIELDS */}
      <div className="space-y-4">
          <div className="grid gap-2">
              <Label>Eyebrow Label</Label>
              <Input 
                  value={formData.label || ''} 
                  onChange={(e) => updateField('label', e.target.value)} 
                  placeholder="e.g. Welcome"
              />
          </div>
          <div className="grid gap-2">
              <Label>Main Headline</Label>
              <Textarea 
                  value={formData.headline || ''} 
                  onChange={(e) => updateField('headline', e.target.value)} 
                  placeholder="Creative & Voice Actor"
                  className="font-bold text-lg"
              />
          </div>
          <div className="grid gap-2">
              <Label>Subheadline</Label>
              <Textarea 
                  value={formData.subheadline || ''} 
                  onChange={(e) => updateField('subheadline', e.target.value)} 
                  placeholder="Based in Los Angeles..."
              />
          </div>
      </div>

      {/* 3. MEDIA FIELDS (Conditional) */}
      <div className="space-y-4 pt-4 border-t">
          <Label className="text-base font-semibold">Background Media</Label>
          
          {/* OPTION A: VIDEO INPUT */}
          {(formData.variant === 'video') ? (
               <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  
                  <div className="grid gap-2">
                      <Label>Video Source</Label>
                      <div className="flex gap-2">
                        {/* Text Input for external links */}
                        <div className="relative flex-grow">
                            <LinkIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                value={formData.videoUrl || ''} 
                                onChange={(e) => updateField('videoUrl', e.target.value)} 
                                placeholder="Paste link or select from library..."
                                className="pl-9"
                            />
                        </div>

                        {/* Library Select Button */}
                        <Button 
                            variant="secondary" 
                            type="button"
                            onClick={() => { 
                                setActiveMediaField('videoUrl'); 
                                setIsMediaPickerOpen(true);      
                            }}
                            title="Select from Library"
                        >
                            <Video className="h-4 w-4 mr-2" />
                            Library
                        </Button>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                          Supports direct MP4 links or videos uploaded to your library.
                      </p>
                  </div>

                  {/* Fallback Image */}
                  <div className="p-3 border rounded-md bg-muted/10">
                      <div className="flex items-center justify-between mb-2">
                          <Label className="text-sm">Fallback Image (Mobile Poster)</Label>
                          {formData.backgroundImage && (
                              <span className="text-[10px] text-green-600 font-medium flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-500" /> Active
                              </span>
                          )}
                      </div>
                      <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="flex-grow justify-start"
                            onClick={() => { 
                                setActiveMediaField('backgroundImage'); 
                                setIsMediaPickerOpen(true); 
                            }}
                          >
                            <ImageIcon className="h-4 w-4 mr-2" />
                            {formData.backgroundImage ? "Change Poster Image" : "Select Poster Image"}
                          </Button>

                          {/* REMOVE BUTTON (Only shows if image exists) */}
                          {formData.backgroundImage && (
                             <Button
                               variant="ghost"
                               size="icon"
                               className="h-9 w-9 text-destructive hover:bg-destructive/10"
                               onClick={() => updateField('backgroundImage', '')}
                               title="Remove Image"
                             >
                               <Trash2 className="h-4 w-4" />
                             </Button>
                          )}
                      </div>
                  </div>

               </div>
          ) : (
          /* OPTION B: STANDARD IMAGE INPUT */
               <div className="grid gap-2 animate-in fade-in slide-in-from-top-2">
                  <Label>Background Image</Label>
                  <div className="flex gap-2 items-center">
                    {/* Preview Tiny Thumbnail if exists */}
                    {formData.backgroundImage && (
                        <div className="h-9 w-9 rounded overflow-hidden border shrink-0 bg-muted relative group cursor-pointer">
                            <img src={formData.backgroundImage} className="h-full w-full object-cover" alt="preview" />
                        </div>
                    )}
                    
                    <Button 
                        variant="outline" 
                        className="flex-grow justify-start"
                        onClick={() => { 
                            setActiveMediaField('backgroundImage'); 
                            setIsMediaPickerOpen(true); 
                        }}
                    >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        {formData.backgroundImage ? "Change Background Image" : "Select Background Image"}
                    </Button>

                    {/* REMOVE BUTTON (Only shows if image exists) */}
                    {formData.backgroundImage && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 text-destructive hover:bg-destructive/10 shrink-0"
                            onClick={() => updateField('backgroundImage', '')}
                            title="Remove Image"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                  </div>
               </div>
          )}
          
          {/* Overlay Opacity Slider */}
          <div className="grid gap-4 pt-2">
              <div className="flex justify-between">
                  <Label>Overlay Darkness</Label>
                  <span className="text-xs text-muted-foreground">{formData.overlayOpacity || 60}%</span>
              </div>
              <Slider 
                  value={[formData.overlayOpacity || 60]} 
                  max={95} 
                  step={5} 
                  onValueChange={([val]: [number]) => updateField('overlayOpacity', val)} 
              />
          </div>
      </div>

      {/* 4. BUTTONS & ALIGNMENT */}
      <div className="space-y-4 pt-2 border-t">
          <div className="grid grid-cols-2 gap-4">
               <div className="grid gap-2">
                  <Label>Button Text</Label>
                  <Input value={formData.ctaText || ''} onChange={(e) => updateField('ctaText', e.target.value)} />
               </div>
               <div className="grid gap-2">
                  <Label>Button Link</Label>
                  <Input value={formData.ctaLink || ''} onChange={(e) => updateField('ctaLink', e.target.value)} />
               </div>
          </div>
          
          {/* Secondary Button */}
          {formData.variant === 'video' && (
              <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                      <Label>Secondary Button</Label>
                      <Input 
                          value={formData.secondaryCtaText || ''} 
                          onChange={(e) => updateField('secondaryCtaText', e.target.value)} 
                          placeholder="e.g. Watch Reel"
                      />
                  </div>
                   <div className="grid gap-2">
                      <Label>Secondary Link</Label>
                      <Input 
                          value={formData.secondaryCtaLink || ''} 
                          onChange={(e) => updateField('secondaryCtaLink', e.target.value)} 
                      />
                  </div>
              </div>
          )}

          <div className="grid gap-2">
              <Label>Text Alignment</Label>
              <Select value={formData.alignment || 'center'} onValueChange={(val) => updateField('alignment', val)}>
                  <SelectTrigger>
                      <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="left">Left Aligned</SelectItem>
                      <SelectItem value="center">Center Aligned</SelectItem>
                      <SelectItem value="right">Right Aligned</SelectItem>
                  </SelectContent>
              </Select>
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
      
      {/* 1. CONFIGURATION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/20">
         <div className="space-y-2">
            <Label>Layout Style</Label>
            <Select 
                value={formData.variant || 'grid'} 
                onValueChange={(val) => updateField('variant', val)}
            >
               <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
               <SelectContent>
                  <SelectItem value="grid">Classic Grid (Equal)</SelectItem>
                  <SelectItem value="spotlight">Founder Spotlight (First Large)</SelectItem>
                  <SelectItem value="carousel">Horizontal Scroll (Compact)</SelectItem>
               </SelectContent>
            </Select>
         </div>
      </div>

      {/* 2. MEMBER MANAGER */}
      <div className="space-y-3 pt-4 border-t">
         <div className="flex justify-between items-center">
            <Label>Team Members</Label>
            <Button size="sm" variant="outline" onClick={handleAddMember}>
               <Plus className="w-4 h-4 mr-2" /> Add Member
            </Button>
         </div>
         
         <div className="space-y-4">
            {(formData.members || []).map((member: any, idx: number) => (
               <div key={idx} className="border p-4 rounded-lg bg-muted/10 space-y-4 relative group">
                  
                  {/* Remove Button */}
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="absolute top-2 right-2 text-muted-foreground hover:text-destructive h-8 w-8" 
                    onClick={() => removeMember(idx)}
                  >
                     <Trash2 className="w-4 h-4" />
                  </Button>

                  <div className="flex gap-4 items-start">
                      {/* Image Picker */}
                      <div 
                         className="w-20 h-20 bg-muted rounded-full flex-shrink-0 relative overflow-hidden cursor-pointer border border-border group/img" 
                         onClick={() => { setActiveMediaField(`member-image-${idx}`); setIsMediaPickerOpen(true); }}
                      >
                         {member.image ? (
                            <img src={member.image} className="w-full h-full object-cover transition-transform group-hover/img:scale-110" alt={member.name} />
                         ) : (
                            <Users className="w-8 h-8 text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                         )}
                         <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-[9px] text-white uppercase tracking-wider font-bold">
                            Change
                         </div>
                      </div>
                      
                      {/* Basic Info */}
                      <div className="flex-grow grid gap-2">
                          <Input 
                            placeholder="Name" 
                            value={member.name} 
                            onChange={e => updateMember(idx, 'name', e.target.value)} 
                            className="font-medium"
                          />
                          <Input 
                            placeholder="Role / Title" 
                            value={member.role} 
                            onChange={e => updateMember(idx, 'role', e.target.value)} 
                            className="text-xs text-muted-foreground"
                          />
                      </div>
                  </div>
                  
                  {/* Bio */}
                  <Textarea 
                    placeholder="Short Bio..." 
                    value={member.bio} 
                    onChange={e => updateMember(idx, 'bio', e.target.value)} 
                    rows={2} 
                    className="text-sm resize-none"
                  />

                  {/* Social Links (Collapsible-ish) */}
                  <div className="grid grid-cols-2 gap-2">
                      <div className="relative">
                          <Input 
                            placeholder="LinkedIn URL" 
                            value={member.linkedin || ''} 
                            onChange={e => updateMember(idx, 'linkedin', e.target.value)} 
                            className="pl-8 text-xs h-8"
                          />
                          <span className="absolute left-2.5 top-2 text-muted-foreground font-bold text-xs">in</span>
                      </div>
                      <div className="relative">
                          <Input 
                            placeholder="Instagram URL" 
                            value={member.instagram || ''} 
                            onChange={e => updateMember(idx, 'instagram', e.target.value)} 
                            className="pl-8 text-xs h-8"
                          />
                          <span className="absolute left-2.5 top-2 text-muted-foreground font-bold text-xs">IG</span>
                      </div>
                  </div>
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
         <Input value={formData.title || ''} onChange={e => updateField('title', e.target.value)} placeholder="e.g. My Studio" />
      </div>

      {/* 1. CONFIGURATION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/20">
         <div className="space-y-2">
            <Label>Map Style</Label>
            <Select 
                value={formData.variant || 'standard'} 
                onValueChange={(val) => updateField('variant', val)}
            >
               <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
               <SelectContent>
                  <SelectItem value="standard">Standard (Full Width)</SelectItem>
                  <SelectItem value="dark">Cinematic (Full Width Dark)</SelectItem>
                  <SelectItem value="card">Overlay Card (Boxed)</SelectItem>
               </SelectContent>
            </Select>
         </div>

         <div className="space-y-2">
            <Label>Height</Label>
            <Select value={formData.height || 'medium'} onValueChange={(val) => updateField('height', val)}>
               <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
               <SelectContent>
                  <SelectItem value="small">Small (300px)</SelectItem>
                  <SelectItem value="medium">Medium (50vh)</SelectItem>
                  <SelectItem value="large">Large (70vh)</SelectItem>
               </SelectContent>
            </Select>
         </div>
      </div>

      {/* 2. MAP LINKS */}
      <div className="space-y-4">
         
         {/* Embed Link (For the Visual Map) */}
         <div className="space-y-2">
            <Label>Google Maps Embed Link (Src)</Label>
            <Input 
                value={formData.mapUrl || ''} 
                onChange={e => updateField('mapUrl', e.target.value)} 
                placeholder='Paste the "src" from the Embed code' 
            />
            <p className="text-[11px] text-muted-foreground">
                Google Maps → Share → Embed a map → Copy HTML → Paste the <strong>src="..."</strong> URL.
            </p>
         </div>

         {/* Direction Link (For the Button) */}
         <div className="space-y-2">
            <Label>Get Directions Link</Label>
            <Input 
                value={formData.directionUrl || ''} 
                onChange={e => updateField('directionUrl', e.target.value)} 
                placeholder='https://maps.app.goo.gl/...' 
            />
            <p className="text-[11px] text-muted-foreground">
                Paste the direct "Share Location" link here. If empty, we'll try to generate one from the address.
            </p>
         </div>

         {/* Address (Used for Card Display or Fallback Link) */}
         <div className="space-y-2 animate-in fade-in">
            <Label>Address / Label</Label>
            <Textarea 
                value={formData.address || ''} 
                onChange={e => updateField('address', e.target.value)} 
                placeholder="e.g. 123 Hollywood Blvd, Los Angeles"
                rows={2}
            />
         </div>
      </div>
    </div>
  );
      // --- PRICING SECTION EDITOR ---
      case 'pricing':
  return (
    <div className="space-y-6">
      <div className="space-y-2">
         <Label>Section Title</Label>
         <Input value={formData.title || ''} onChange={e => updateField('title', e.target.value)} placeholder="Pricing & Rates" />
      </div>

      {/* 1. CONFIGURATION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/20">
         <div className="space-y-2">
            <Label>Layout Style</Label>
            <Select 
                value={formData.variant || 'cards'} 
                onValueChange={(val) => updateField('variant', val)}
            >
               <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
               <SelectContent>
                  <SelectItem value="cards">Grid Cards (Standard)</SelectItem>
                  <SelectItem value="slider">Carousel (Horizontal Scroll)</SelectItem>
                  <SelectItem value="list">Rate Card (Minimal List)</SelectItem>
               </SelectContent>
            </Select>
         </div>
      </div>

      {/* 2. PLANS MANAGER */}
      <div className="space-y-3 pt-4 border-t">
         <div className="flex justify-between items-center">
            <Label>Packages / Rates</Label>
            <Button size="sm" variant="outline" onClick={handleAddPlan}>
               <Plus className="w-4 h-4 mr-2" /> Add Item
            </Button>
         </div>
         
         <div className="space-y-4">
            {(formData.plans || []).map((plan: any, idx: number) => (
               <div key={idx} className="border p-4 rounded-lg bg-muted/10 space-y-4 relative group">
                  
                  {/* Remove Button */}
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="absolute top-2 right-2 text-muted-foreground hover:text-destructive h-8 w-8" 
                    onClick={() => removePlan(idx)}
                  >
                     <Trash2 className="w-4 h-4" />
                  </Button>

                  <div className="grid grid-cols-12 gap-3">
                      <div className="col-span-12 md:col-span-4 space-y-1">
                          <Label className="text-xs">Service Name</Label>
                          <Input 
                            placeholder="e.g. Day Rate" 
                            value={plan.name} 
                            onChange={e => updatePlan(idx, 'name', e.target.value)} 
                            className="font-medium"
                          />
                      </div>
                      <div className="col-span-8 md:col-span-4 space-y-1">
                          <Label className="text-xs">Price</Label>
                          <Input 
                            placeholder="e.g. 500" 
                            value={plan.price} 
                            onChange={e => updatePlan(idx, 'price', e.target.value)} 
                          />
                      </div>
                      <div className="col-span-4 md:col-span-4 space-y-1">
                          <Label className="text-xs">Unit (Optional)</Label>
                          <Input 
                            placeholder="/mo" 
                            value={plan.unit} 
                            onChange={e => updatePlan(idx, 'unit', e.target.value)} 
                          />
                      </div>
                  </div>

                  <div className="space-y-1">
                      <Label className="text-xs">Description / Features</Label>
                      <Textarea 
                        placeholder="Feature 1, Feature 2, Feature 3..." 
                        value={plan.features} 
                        onChange={e => updatePlan(idx, 'features', e.target.value)} 
                        rows={2}
                      />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                          <Label className="text-xs">Button Text</Label>
                          <Input 
                            placeholder="e.g. Book Now" 
                            value={plan.cta} 
                            onChange={e => updatePlan(idx, 'cta', e.target.value)} 
                          />
                      </div>
                      <div className="space-y-1">
                          <Label className="text-xs">Button Link (URL)</Label>
                          <Input 
                            placeholder="https://..." 
                            value={plan.buttonUrl} 
                            onChange={e => updatePlan(idx, 'buttonUrl', e.target.value)} 
                          />
                      </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                     <Switch 
                        id={`pop-${idx}`}
                        checked={plan.isPopular || false} 
                        onCheckedChange={(c) => updatePlan(idx, 'isPopular', c)} 
                     />
                     <Label htmlFor={`pop-${idx}`} className="text-xs cursor-pointer text-muted-foreground">Highlight as Popular</Label>
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
      
      {/* 1. LAYOUT & VARIANT */}
      <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
         <Label>Layout Style</Label>
         <Select 
           value={formData.variant || 'split'} 
           onValueChange={(val) => updateField('variant', val)}
         >
           <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
           <SelectContent>
             <SelectItem value="split">Standard Split (Bio + Media)</SelectItem>
             <SelectItem value="profile">Actor Profile (Bio + Media + Stats)</SelectItem>
             <SelectItem value="simple">Minimal (Text Only)</SelectItem>
           </SelectContent>
         </Select>

         {/* Alignment Buttons (Hidden for Simple mode) */}
         {formData.variant !== 'simple' && (
             <div className="flex items-center justify-between mt-2">
                 <Label className="text-xs text-muted-foreground">Media Position</Label>
                 <div className="flex gap-2">
                     <Button 
                        size="sm" 
                        variant={formData.layout === 'left' ? 'default' : 'outline'}
                        onClick={() => updateField('layout', 'left')}
                        className="h-7 text-xs"
                     >
                        Left
                     </Button>
                     <Button 
                        size="sm" 
                        variant={formData.layout === 'right' || !formData.layout ? 'default' : 'outline'}
                        onClick={() => updateField('layout', 'right')}
                        className="h-7 text-xs"
                     >
                        Right
                     </Button>
                 </div>
             </div>
         )}
      </div>

      {/* 2. TEXT CONTENT */}
      <div className="space-y-4">
          <div className="grid gap-2">
             <Label>Eyebrow Label</Label>
             <Input value={formData.label || ''} onChange={e => updateField('label', e.target.value)} placeholder="e.g. Who I Am" />
          </div>
          <div className="grid gap-2">
             <Label>Main Title</Label>
             <Input value={formData.title || ''} onChange={e => updateField('title', e.target.value)} placeholder="e.g. About Me" />
          </div>
          <div className="grid gap-2">
             <Label>Bio Content</Label>
             <Textarea 
               rows={6}
               value={formData.content || ''} 
               onChange={e => updateField('content', e.target.value)} 
               placeholder="Write your bio here..."
             />
          </div>
      </div>

      {/* 3. MEDIA PICKER (Hidden in Simple Mode) */}
      {formData.variant !== 'simple' && (
         <div className="space-y-4 pt-4 border-t">
            <Label>Featured Media</Label>
            <div className="flex gap-3 items-start p-3 border rounded-md bg-muted/10">
               {/* Smart Preview (Video or Image) */}
               {formData.image && (
                  <div className="h-20 w-20 rounded overflow-hidden border shrink-0 bg-black relative">
                     {formData.image.match(/\.(mp4|webm|mov)$/i) ? (
                        <video src={formData.image} className="w-full h-full object-cover opacity-80" muted />
                     ) : (
                        <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                     )}
                  </div>
               )}
               
               <div className="flex-grow space-y-2">
                   <Button variant="outline" size="sm" className="w-full" onClick={() => { setActiveMediaField('image'); setIsMediaPickerOpen(true); }}>
                       {formData.image ? "Change Media" : "Select Image or Video"}
                   </Button>
                   <p className="text-[10px] text-muted-foreground leading-tight">
                       Tip: You can use a headshot or a vertical video loop (reels work great here!).
                   </p>
               </div>
            </div>
         </div>
      )}

      {/* 4. KEY FEATURES (Good for 'Split' Variant) */}
      <div className="pt-4 border-t space-y-3">
          <div className="flex justify-between items-center">
              <Label>Key Highlights / Features</Label>
              <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => {
                  const current = formData.features || [];
                  updateField('features', [...current, "New Highlight"]);
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
                          className="h-8 text-sm" 
                      />
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => {
                          const newFeatures = [...formData.features];
                          newFeatures.splice(idx, 1);
                          updateField('features', newFeatures);
                      }}>
                          <Trash2 className="w-4 h-4" />
                      </Button>
                  </div>
              ))}
          </div>
      </div>

      {/* 5. PROFILE STATS (Only shows for 'Profile' variant) */}
      {formData.variant === 'profile' && (
        <div className="pt-4 border-t space-y-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
                <Label className="text-primary">Actor Stats Grid</Label>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => {
                    const current = formData.stats || [];
                    updateField('stats', [...current, { label: "Label", value: "Value" }]);
                }}>
                    <Plus className="w-3 h-3 mr-1" /> Add Stat
                </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
                {(formData.stats || []).map((stat: any, idx: number) => (
                    <div key={idx} className="flex gap-1 items-center bg-muted/30 p-1 rounded border">
                        <Input 
                            placeholder="Label" 
                            value={stat.label} 
                            onChange={(e) => {
                                const newStats = [...formData.stats];
                                newStats[idx].label = e.target.value;
                                updateField('stats', newStats);
                            }}
                            className="h-7 text-xs border-transparent focus-visible:ring-0 bg-transparent" 
                        />
                        <div className="h-4 w-px bg-border" />
                        <Input 
                            placeholder="Value" 
                            value={stat.value} 
                            onChange={(e) => {
                                const newStats = [...formData.stats];
                                newStats[idx].value = e.target.value;
                                updateField('stats', newStats);
                            }}
                            className="h-7 text-xs border-transparent focus-visible:ring-0 bg-transparent text-right font-medium" 
                        />
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0" onClick={() => {
                            const newStats = [...formData.stats];
                            newStats.splice(idx, 1);
                            updateField('stats', newStats);
                        }}>
                            <Trash2 className="w-3 h-3" />
                        </Button>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* 6. CALL TO ACTION */}
      <div className="pt-4 border-t space-y-2">
         <Label>Button (Optional)</Label>
         <div className="grid grid-cols-2 gap-2">
            <Input value={formData.ctaText || ''} onChange={e => updateField('ctaText', e.target.value)} placeholder="Text" />
            <Input value={formData.ctaLink || ''} onChange={e => updateField('ctaLink', e.target.value)} placeholder="Link (#contact)" />
         </div>
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

      {/* 1. CONFIGURATION GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/20">
         
         {/* Variant Selector */}
         <div className="space-y-2">
            <Label>Slider Style</Label>
            <Select 
                value={formData.variant || 'standard'} 
                onValueChange={(val) => updateField('variant', val)}
            >
               <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
               <SelectContent>
                  <SelectItem value="standard">Standard Swipe</SelectItem>
                  <SelectItem value="cinematic">Cinematic Fade (Ken Burns)</SelectItem>
                  <SelectItem value="cards">Focus Cards (Center Mode)</SelectItem>
               </SelectContent>
            </Select>
         </div>

         {/* Height Selector */}
         <div className="space-y-2">
            <Label>Slider Height</Label>
            <Select value={formData.height || 'large'} onValueChange={(val) => updateField('height', val)}>
               <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
               <SelectContent>
                  <SelectItem value="medium">Medium (400px)</SelectItem>
                  <SelectItem value="large">Large (600px)</SelectItem>
                  <SelectItem value="full">Full Screen</SelectItem>
               </SelectContent>
            </Select>
         </div>

         {/* Autoplay Selector */}
         <div className="space-y-2">
            <Label>Autoplay Speed</Label>
             <Select value={String(formData.interval || '5')} onValueChange={(val) => updateField('interval', parseInt(val))}>
               <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
               <SelectContent>
                  <SelectItem value="0">Disabled</SelectItem>
                  <SelectItem value="3">Fast (3s)</SelectItem>
                  <SelectItem value="5">Normal (5s)</SelectItem>
                  <SelectItem value="8">Slow (8s)</SelectItem>
               </SelectContent>
            </Select>
         </div>
      </div>

      {/* 2. SLIDES MANAGER */}
      <div className="space-y-3 pt-2">
         <div className="flex justify-between items-center">
            <Label>Slides</Label>
            <Button size="sm" variant="outline" onClick={() => handleAddSlide('image')}>
               <Plus className="w-4 h-4 mr-2" /> Add Slide
            </Button>
         </div>
         <div className="space-y-2">
            {(formData.images || []).map((slide: any, idx: number) => (
               <div key={idx} className="flex gap-3 items-start border p-3 rounded-md bg-background shadow-sm group">
                  {/* Image Preview & Picker */}
                  <div 
                    className="w-20 h-20 bg-muted rounded-md flex-shrink-0 relative overflow-hidden cursor-pointer border" 
                    onClick={() => { setActiveMediaField(`slider-image-${idx}`); setIsMediaPickerOpen(true); }}
                  >
                     {slide.url ? (
                        <img src={slide.url} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="slide" />
                     ) : (
                        <ImageIcon className="w-8 h-8 text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                     )}
                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] text-white font-medium uppercase tracking-wider">
                        Change
                     </div>
                  </div>
                  
                  {/* Caption Input */}
                  <div className="flex-grow space-y-2">
                     <Label className="text-xs text-muted-foreground">Caption</Label>
                     <Input 
                        placeholder="e.g. Headshot 2024" 
                        value={slide.caption} 
                        onChange={e => handleUpdateSlide('image', idx, 'caption', e.target.value)} 
                        className="h-9"
                     />
                  </div>

                  {/* Remove Button */}
                  <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-destructive h-8 w-8" onClick={() => handleRemoveSlide('image', idx)}>
                     <Trash2 className="w-4 h-4" />
                  </Button>
               </div>
            ))}
            {(formData.images || []).length === 0 && (
                <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground text-sm">
                    No slides added yet. Click "Add Slide" to begin.
                </div>
            )}
         </div>
      </div>
    </div>
  );

      case 'video_slider':
  return (
    <div className="space-y-6">
      <div className="space-y-2">
         <Label>Section Title</Label>
         <Input value={formData.title || ''} onChange={e => updateField('title', e.target.value)} placeholder="e.g. Showreel & Clips" />
      </div>

      {/* 1. CONFIGURATION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/20">
         <div className="space-y-2">
            <Label>Layout Style</Label>
            <Select 
                value={formData.variant || 'cinema'} 
                onValueChange={(val) => updateField('variant', val)}
            >
               <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
               <SelectContent>
                  <SelectItem value="cinema">Cinema Spotlight (One at a time)</SelectItem>
                  <SelectItem value="carousel">Netflix Strip (Horizontal Scroll)</SelectItem>
                  <SelectItem value="grid">Video Grid (Thumbnail Wall)</SelectItem>
               </SelectContent>
            </Select>
         </div>

         {/* Height (Cinema Only) */}
         {formData.variant === 'cinema' && (
             <div className="space-y-2">
                <Label>Player Height</Label>
                <Select value={formData.height || 'large'} onValueChange={(val) => updateField('height', val)}>
                   <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                   <SelectContent>
                      <SelectItem value="medium">Medium (400px)</SelectItem>
                      <SelectItem value="large">Large (600px)</SelectItem>
                      <SelectItem value="full">Full Screen</SelectItem>
                   </SelectContent>
                </Select>
             </div>
         )}

         {/* Grid Columns (Grid Only) */}
         {formData.variant === 'grid' && (
             <div className="space-y-2">
                <Label>Grid Columns</Label>
                <Select value={String(formData.gridColumns || '3')} onValueChange={(val) => updateField('gridColumns', parseInt(val))}>
                   <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                   <SelectContent>
                      <SelectItem value="2">2 Columns</SelectItem>
                      <SelectItem value="3">3 Columns</SelectItem>
                      <SelectItem value="4">4 Columns</SelectItem>
                   </SelectContent>
                </Select>
             </div>
         )}
      </div>

      {/* 2. VIDEO MANAGER */}
      <div className="space-y-3 pt-2">
         <div className="flex justify-between items-center">
            <Label>Video Clips</Label>
            <Button size="sm" variant="outline" onClick={() => handleAddSlide('video')}>
               <Plus className="w-4 h-4 mr-2" /> Add Video
            </Button>
         </div>

         <div className="space-y-4">
            {(formData.videos || []).map((slide: any, idx: number) => (
               <div key={idx} className="flex flex-col gap-3 border p-4 rounded-lg bg-background shadow-sm relative group">
                  
                  {/* Remove Button (Top Right) */}
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="absolute top-2 right-2 text-muted-foreground hover:text-destructive h-8 w-8" 
                    onClick={() => handleRemoveSlide('video', idx)}
                  >
                     <Trash2 className="w-4 h-4" />
                  </Button>

                  <div className="flex gap-4 items-start">
                      {/* Thumbnail / Library Picker */}
                      <div 
                        className="w-32 h-20 bg-black rounded-md flex-shrink-0 relative overflow-hidden cursor-pointer flex items-center justify-center border border-border" 
                        onClick={() => { setActiveMediaField(`slider-video-${idx}`); setIsMediaPickerOpen(true); }}
                        title="Pick from Library"
                      >
                         {slide.url ? (
                            <video src={slide.url} className="w-full h-full object-cover opacity-50 pointer-events-none" />
                         ) : (
                            <LinkIcon className="w-8 h-8 text-muted-foreground" />
                         )}
                         <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-colors">
                            <span className="text-[10px] text-white font-medium bg-black/60 px-2 py-1 rounded">Library</span>
                         </div>
                      </div>
                      
                      {/* Text Inputs */}
                      <div className="flex-grow space-y-3">
                         <div className="grid gap-1.5">
                            <Label className="text-xs">Video URL (YouTube or MP4)</Label>
                            <Input 
                                placeholder="https://youtube.com/watch?v=..." 
                                value={slide.url || ''} 
                                onChange={e => handleUpdateSlide('video', idx, 'url', e.target.value)} 
                                className="h-8 text-sm"
                            />
                         </div>
                         <div className="grid grid-cols-2 gap-2">
                             <Input 
                                placeholder="Title (e.g. Drama Reel)" 
                                value={slide.title} 
                                onChange={e => handleUpdateSlide('video', idx, 'title', e.target.value)} 
                                className="h-8 text-sm"
                             />
                             <Input 
                                placeholder="Caption (Optional)" 
                                value={slide.caption} 
                                onChange={e => handleUpdateSlide('video', idx, 'caption', e.target.value)} 
                                className="h-8 text-sm"
                             />
                         </div>
                      </div>
                  </div>
               </div>
            ))}
            
            {(formData.videos || []).length === 0 && (
                <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground text-sm">
                    No videos added yet. Click "Add Video" to begin.
                </div>
            )}
         </div>
      </div>
    </div>
  );

      case 'gallery':
  return (
    <div className="space-y-6">
      <div className="space-y-2">
         <Label>Section Title</Label>
         <Input value={formData.title || 'Gallery'} onChange={e => updateField('title', e.target.value)} />
      </div>

      {/* 1. LAYOUT VARIANT */}
      <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
         <Label>Layout Style</Label>
         <Select 
           value={formData.variant || 'masonry'} 
           onValueChange={(val) => updateField('variant', val)}
         >
           <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
           <SelectContent>
             <SelectItem value="masonry">Masonry (Pinterest Style)</SelectItem>
             <SelectItem value="carousel">Film Strip (Horizontal Scroll)</SelectItem>
             <SelectItem value="grid">Uniform Grid (Instagram Style)</SelectItem>
           </SelectContent>
         </Select>

         {/* Options for Grid Variant Only */}
         {formData.variant === 'grid' && (
             <div className="grid grid-cols-2 gap-4 mt-2">
                 <div className="space-y-2">
                     <Label className="text-xs">Aspect Ratio</Label>
                     <Select value={formData.aspectRatio || 'square'} onValueChange={(val) => updateField('aspectRatio', val)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="square">Square (1:1)</SelectItem>
                            <SelectItem value="portrait">Portrait (2:3)</SelectItem>
                            <SelectItem value="landscape">Landscape (16:9)</SelectItem>
                        </SelectContent>
                     </Select>
                 </div>
                 <div className="space-y-2">
                     <Label className="text-xs">Columns</Label>
                     <Select value={String(formData.gridColumns || '3')} onValueChange={(val) => updateField('gridColumns', parseInt(val))}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="2">2 Columns</SelectItem>
                            <SelectItem value="3">3 Columns</SelectItem>
                            <SelectItem value="4">4 Columns</SelectItem>
                        </SelectContent>
                     </Select>
                 </div>
             </div>
         )}
      </div>
      
      {/* 2. IMAGE MANAGER */}
      <div className="space-y-3 pt-2">
         <div className="flex justify-between items-center">
            <Label>Gallery Images</Label>
            <Button size="sm" variant="outline" onClick={() => { setActiveMediaField('gallery'); setIsMediaPickerOpen(true); }}>
               <Plus className="w-4 h-4 mr-2" /> Add Media
            </Button>
         </div>
         
         <div className="grid grid-cols-3 gap-2 mt-2">
           {(formData.images || []).map((img: any, idx: number) => (
             <div key={idx} className="relative group aspect-square bg-muted rounded-md overflow-hidden border">
               {/* Video Indicator */}
               {img.url.match(/\.(mp4|webm)$/i) ? (
                   <video src={img.url} className="w-full h-full object-cover opacity-50" />
               ) : (
                   <img src={img.url} alt="Gallery" className="w-full h-full object-cover" />
               )}
               
               <button 
                 className="absolute top-1 right-1 bg-destructive/90 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
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
           {(!formData.images || formData.images.length === 0) && (
               <div className="col-span-3 py-8 text-center border-2 border-dashed rounded-lg text-muted-foreground text-sm">
                   No images added yet.
               </div>
           )}
         </div>
      </div>
    </div>
  );
      case 'contact':
  return (
    <div className="space-y-6">
      
      {/* 1. LAYOUT VARIANT */}
      <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
         <Label>Layout Style</Label>
         <Select 
           value={formData.variant || 'minimal'} 
           onValueChange={(val) => updateField('variant', val)}
         >
           <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
           <SelectContent>
             <SelectItem value="minimal">Minimal (Center Text)</SelectItem>
             <SelectItem value="split">Split (Image + Info)</SelectItem>
             <SelectItem value="card">Floating Card (Premium)</SelectItem>
           </SelectContent>
         </Select>
      </div>

      {/* 2. TEXT CONTENT */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Section Title</Label>
          <Input value={formData.title || ''} onChange={e => updateField('title', e.target.value)} placeholder="Let's Work Together" />
        </div>
        
        {/* NEW: Subtitle/Description */}
        <div className="space-y-2">
          <Label>Subtitle / Note</Label>
          <Textarea 
            value={formData.subheadline || ''} 
            onChange={e => updateField('subheadline', e.target.value)} 
            placeholder="Available for projects worldwide. Reach out for rates and availability."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>Email Address</Label>
          <Input value={formData.email || ''} onChange={e => updateField('email', e.target.value)} placeholder="your@email.com" />
        </div>
        <div className="space-y-2">
          <Label>Main Button Text</Label>
          <Input value={formData.ctaText || "Send Email"} onChange={e => updateField('ctaText', e.target.value)} />
        </div>
        
        {/* CONTACT METHODS */}
        <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
                <Label className="text-xs">Phone Number</Label>
                <Input value={formData.phone || ''} onChange={e => updateField('phone', e.target.value)} placeholder="+1 555 000 0000" />
            </div>
            <div className="space-y-2">
                <Label className="text-xs">WhatsApp Number</Label>
                <Input value={formData.whatsapp || ''} onChange={e => updateField('whatsapp', e.target.value)} placeholder="e.g. 15550000000" />
                <p className="text-[10px] text-muted-foreground">Include country code, no symbols (e.g. 15551234567)</p>
            </div>
        </div>
      </div>
      
      {/* 3. IMAGE PICKER */}
      {formData.variant !== 'minimal' && (
         <div className="space-y-4 pt-4 border-t">
            <Label>Featured Image</Label>
            <div className="flex gap-3 items-center p-3 border rounded-md bg-muted/10">
               {formData.image && (
                  <div className="h-16 w-16 rounded overflow-hidden border shrink-0 bg-muted">
                     <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                  </div>
               )}
               <Button variant="outline" className="w-full" onClick={() => { setActiveMediaField('image'); setIsMediaPickerOpen(true); }}>
                   {formData.image ? "Change Image" : "Select Image"}
               </Button>
            </div>
         </div>
      )}

      {/* 4. SOCIAL LINKS */}
      <div className="pt-4 border-t space-y-4">
          <Label>Social Profiles</Label>
          <div className="grid gap-3">
              <div className="flex items-center gap-2">
                  <span className="text-xs w-20 text-muted-foreground">LinkedIn</span>
                  <Input className="h-8" value={formData.linkedin || ''} onChange={e => updateField('linkedin', e.target.value)} placeholder="URL" />
              </div>
              <div className="flex items-center gap-2">
                  <span className="text-xs w-20 text-muted-foreground">Instagram</span>
                  <Input className="h-8" value={formData.instagram || ''} onChange={e => updateField('instagram', e.target.value)} placeholder="URL" />
              </div>
              <div className="flex items-center gap-2">
                  <span className="text-xs w-20 text-muted-foreground">Twitter (X)</span>
                  <Input className="h-8" value={formData.twitter || ''} onChange={e => updateField('twitter', e.target.value)} placeholder="URL" />
              </div>
              <div className="flex items-center gap-2">
                  <span className="text-xs w-20 text-muted-foreground">Website</span>
                  <Input className="h-8" value={formData.website || ''} onChange={e => updateField('website', e.target.value)} placeholder="URL" />
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

          {/* --- THE FIX: WRAP EDITORS IN TABS --- */}
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="design">Design</TabsTrigger>
            </TabsList>

            {/* TAB 1: CORE CONTENT (Your existing hardcoded fields) */}
            <TabsContent value="content" className="space-y-4">
               {renderFields()}
            </TabsContent>

            {/* TAB 2: THEME SETTINGS (The new dynamic schema) */}
            <TabsContent value="design" className="space-y-4">
               {renderThemeSettings()}
            </TabsContent>
          </Tabs>
          {/* ------------------------------------- */}

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