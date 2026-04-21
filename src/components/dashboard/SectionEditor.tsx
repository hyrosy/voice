// src/components/dashboard/SectionEditor.tsx

import React, { useState, useEffect } from "react";
import { useBuilderStore } from "../../store/useBuilderStore"; // <-- ZUSTAND IMPORT
import { supabase } from "@/supabaseClient";
import { useSubscription } from "../../context/SubscriptionContext";
// --- shadcn/ui Imports ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// --- Icons ---
import {
  Video,
  Map,
  Users,
  ShoppingBag,
  DollarSign,
  Trash2,
  FileText,
  X,
  Plus,
  Image as ImageIcon,
  Link as LinkIcon,
  MessageCircle,
  ExternalLink,
  Package,
  Monitor,
  Smartphone,
  Film,
  Instagram,
  Twitter,
  Youtube,
  Lock,
  Layers,
  Star,
  LayoutTemplate,
  Palette,
} from "lucide-react";

import PortfolioMediaManager, {
  UnifiedMediaItem,
} from "./PortfolioMediaManager";
import { PortfolioSection } from "../../types/portfolio";
import { THEME_REGISTRY } from "../../themes/registry";
import { cn } from "@/lib/utils";

interface SectionEditorProps {
  section: PortfolioSection | null;
  sections: PortfolioSection[]; // Kept for backwards compatibility if needed
  isOpen: boolean;
  isInline: boolean;
  onClose: () => void;
  // onSave is no longer needed! Zustand handles it.
  actorId: string;
  themeId?: string;
  pages?: any[]; // 🚀 1. ADD THIS HERE
}

const SectionEditor: React.FC<SectionEditorProps> = ({
  section,
  sections,
  pages = [], // 🚀 2. EXTRACT IT HERE (with a default empty array)
  isOpen,
  isInline, // 🚀 YOU MUST ADD THIS HERE!
  onClose,
  actorId,
  themeId = "modern",
}) => {
  // --- ZUSTAND HOOK ---
  // We grab the update action from the store.
  const updateSectionInStore = useBuilderStore((state) => state.updateSection);

  // --- LOCAL UI STATE ---
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [activeMediaField, setActiveMediaField] = useState<string>("");
  const [isProductManagerOpen, setIsProductManagerOpen] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const { limits } = useSubscription();

  // Tier 2 is eCommerce, Tier 3 is Pro
  const hasMegaMenuAccess = limits?.hasMegaMenu === true;
  useEffect(() => {
    const fetchActorProducts = async () => {
      if (!actorId) return;
      const { data, error } = await supabase
        .from("pro_products")
        .select("id, title, status")
        .eq("actor_id", actorId)
        .order("created_at", { ascending: false });

      if (!error && data) setAvailableProducts(data);
    };

    if (section?.type === "dynamic_store") {
      fetchActorProducts();
    }
  }, [actorId, section?.type]);

  if (!section) return null;

  // =========================================================
  // THE LOCAL STATE BUFFER (Fixes cursor jumping & freezing!)
  // =========================================================

  // 1. We keep a local copy of the data so typing is buttery smooth
  const [formData, setFormData] = useState(section?.data || {});
  const [settingsData, setSettingsData] = useState(section?.settings || {});

  // 2. If the user clicks a DIFFERENT section, or if the canvas iframe
  // sends an inline-edit update, we sync the local state to match.
  useEffect(() => {
    if (section) {
      setFormData(section.data || {});
      setSettingsData(section.settings || {});
    }
  }, [section]);

  // =========================================================
  // CORE UPDATE HANDLERS (Zustand Connected)
  // =========================================================

  // Update Core Content (Zone A)
  const updateField = (key: string, value: any) => {
    // 1. Update Local UI instantly
    const newFormData = { ...formData, [key]: value };
    setFormData(newFormData);

    // 2. Send to Zustand in the background
    updateSectionInStore(section.id, {
      data: newFormData,
    });
  };

  // Update Theme Settings (Zone B)
  const updateSetting = (key: string, value: any) => {
    // 1. Update Local UI instantly
    const newSettingsData = { ...settingsData, [key]: value };
    setSettingsData(newSettingsData);

    // 2. Send to Zustand in the background
    updateSectionInStore(section.id, {
      settings: newSettingsData,
    });
  };

  // =========================================================
  // MEDIA HANDLER (Adapted to Zustand)
  // =========================================================
  const handleMediaSelect = (item: UnifiedMediaItem) => {
    if (activeMediaField === "logoImage") {
      updateField("logoImage", item.url);
    } else if (activeMediaField.startsWith("member-image-")) {
      const index = parseInt(activeMediaField.split("-").pop() || "0");
      updateMember(index, "image", item.url);
    } else if (activeMediaField.startsWith("slider-image-")) {
      const index = parseInt(activeMediaField.split("-").pop() || "0");
      handleUpdateSlide("image", index, "url", item.url);
    } else if (activeMediaField.startsWith("slider-video-")) {
      const index = parseInt(activeMediaField.split("-").pop() || "0");
      handleUpdateSlide("video", index, "url", item.url);
      if (!formData.videos?.[index]?.title) {
        handleUpdateSlide("video", index, "title", item.title || "Video");
      }
    } else if (activeMediaField === "gallery") {
      const currentList = formData.images || [];
      updateField("images", [
        ...currentList,
        { url: item.url, type: item.type },
      ]);
    } else if (activeMediaField === "backgroundImage") {
      if (section.type === "header") {
        updateSetting("backgroundImage", item.url);
      } else {
        updateField("backgroundImage", item.url);
      }
    } else if (activeMediaField === "image") {
      updateField("image", item.url);
    } else if (activeMediaField === "videoUrl") {
      updateField("videoUrl", item.url);
    } else if (activeMediaField.startsWith("product-image-")) {
      const index = parseInt(activeMediaField.split("-").pop() || "0");
      const currentProducts = [...(formData.products || [])];
      if (currentProducts[index]) {
        currentProducts[index].image = item.url;
        if (!currentProducts[index].images) currentProducts[index].images = [];
        if (currentProducts[index].images.length === 0)
          currentProducts[index].images.push(item.url);
        updateField("products", currentProducts);
      }
    } else if (activeMediaField.startsWith("product-gallery-add-")) {
      const index = parseInt(activeMediaField.split("product-gallery-add-")[1]);
      const currentProducts = [...(formData.products || [])];
      if (currentProducts[index]) {
        const currentImages = currentProducts[index].images || [];
        currentProducts[index].images = [...currentImages, item.url];
        if (!currentProducts[index].image)
          currentProducts[index].image = item.url;
        updateField("products", currentProducts);
      }
    }
    setIsMediaPickerOpen(false);
  };

  // =========================================================
  // ARRAY HELPERS (Adapted to use formData directly)
  // =========================================================
  const addStat = () =>
    updateField("customStats", [
      ...(formData.customStats || []),
      { label: "New Stat", value: "100" },
    ]);
  const updateStat = (index: number, field: "label" | "value", val: string) => {
    const currentStats = [...(formData.customStats || [])];
    currentStats[index][field] = val;
    updateField("customStats", currentStats);
  };
  const removeStat = (index: number) => {
    const currentStats = [...(formData.customStats || [])];
    currentStats.splice(index, 1);
    updateField("customStats", currentStats);
  };

  const handleAddSlide = (type: "image" | "video") => {
    const field = type === "image" ? "images" : "videos";
    const newItem =
      type === "image"
        ? { url: "", caption: "" }
        : { url: "", title: "", poster: "" };
    updateField(field, [...(formData[field] || []), newItem]);
  };
  const handleUpdateSlide = (
    type: "image" | "video",
    index: number,
    key: string,
    val: string
  ) => {
    const field = type === "image" ? "images" : "videos";
    const newSlides = [...(formData[field] || [])];
    newSlides[index][key] = val;
    updateField(field, newSlides);
  };
  const handleRemoveSlide = (type: "image" | "video", index: number) => {
    const field = type === "image" ? "images" : "videos";
    const newSlides = [...(formData[field] || [])];
    newSlides.splice(index, 1);
    updateField(field, newSlides);
  };

  const updateMenuConfig = (
    targetSectionId: string,
    field: "label" | "visible" | "folderId",
    value: any
  ) => {
    const currentConfig = formData.menuConfig || {};
    const sectionConfig = currentConfig[targetSectionId] || {
      visible: true,
      label: "",
    };
    updateField("menuConfig", {
      ...currentConfig,
      [targetSectionId]: { ...sectionConfig, [field]: value },
    });
  };

  const handleAddMember = () =>
    updateField("members", [
      ...(formData.members || []),
      { name: "New Member", role: "Role", image: "" },
    ]);
  const updateMember = (idx: number, field: string, val: any) => {
    const current = [...(formData.members || [])];
    current[idx][field] = val;
    updateField("members", current);
  };
  const removeMember = (idx: number) => {
    const current = [...(formData.members || [])];
    current.splice(idx, 1);
    updateField("members", current);
  };

  const handleAddPlan = () =>
    updateField("plans", [
      ...(formData.plans || []),
      { name: "Basic", price: "1000", features: "Feature 1, Feature 2" },
    ]);
  const updatePlan = (idx: number, field: string, val: any) => {
    const current = [...(formData.plans || [])];
    current[idx][field] = val;
    updateField("plans", current);
  };
  const removePlan = (idx: number) => {
    const current = [...(formData.plans || [])];
    current.splice(idx, 1);
    updateField("plans", current);
  };

  const handleAddProduct = () =>
    updateField("products", [
      ...(formData.products || []),
      {
        title: "New Product",
        price: "$19.99",
        buttonText: "Buy Now",
        link: "",
      },
    ]);
  const updateProduct = (idx: number, field: string, val: any) => {
    const current = [...(formData.products || [])];
    current[idx][field] = val;
    updateField("products", current);
  };
  const removeProduct = (idx: number) => {
    const current = [...(formData.products || [])];
    current.splice(idx, 1);
    updateField("products", current);
  };

  // =========================================================
  // DYNAMIC FORM BUILDER (Theme Settings)
  // =========================================================
  const renderThemeSettings = () => {
    const ActiveTheme = THEME_REGISTRY[themeId];
    if (!ActiveTheme) return <p>Theme not found.</p>;

    const ComponentKey =
      section.type.charAt(0).toUpperCase() +
      section.type.slice(1).replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    const SectionComponent =
      (ActiveTheme as any)[ComponentKey] || (ActiveTheme as any)["Header"];
    const schema = (SectionComponent as any)?.schema || [];

    if (schema.length === 0) {
      return (
        <div className="p-8 text-center text-muted-foreground bg-muted/10 rounded-lg">
          <p>This section has no design settings for the current theme.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-in fade-in">
        {schema.map((field: any) => (
          <div
            key={field.id}
            className="space-y-3 p-4 border rounded-lg bg-muted/20"
          >
            <div className="flex items-center justify-between">
              <Label htmlFor={field.id} className="text-base font-medium">
                {field.label}
              </Label>
            </div>

            {field.type === "toggle" && (
              <Switch
                id={field.id}
                checked={
                  settingsData[field.id] !== undefined
                    ? settingsData[field.id]
                    : field.defaultValue
                }
                onCheckedChange={(val) => updateSetting(field.id, val)}
              />
            )}

            {field.type === "select" && (
              <Select
                value={settingsData[field.id] || field.defaultValue}
                onValueChange={(val) => updateSetting(field.id, val)}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {field.options.map((opt: string) => (
                    <SelectItem key={opt} value={opt}>
                      {opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {field.type === "slider" && (
              <div className="pt-2">
                <Slider
                  value={[settingsData[field.id] || field.defaultValue]}
                  min={field.min || 0}
                  max={field.max || 100}
                  step={field.step || 1}
                  onValueChange={([val]) => updateSetting(field.id, val)}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-muted-foreground">
                    {field.min}
                  </span>
                  <span className="text-xs font-medium">
                    {settingsData[field.id] || field.defaultValue}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {field.max}
                  </span>
                </div>
              </div>
            )}

            {field.type === "color" && (
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

            {field.type === "image" && (
              <div className="flex gap-2">
                {settingsData[field.id] && (
                  <img
                    src={settingsData[field.id]}
                    className="h-10 w-10 rounded object-cover border"
                    alt="preview"
                  />
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveMediaField(field.id);
                    setIsMediaPickerOpen(true);
                  }}
                >
                  <ImageIcon className="w-4 h-4 mr-2" /> Select Image
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // =========================================================
  // CORE CONTENT FIELDS
  // =========================================================
  const renderFields = () => {
    switch (section.type) {
      case "header":
        const megaFolders = formData.megaMenuFolders || []; // Helper for the dropdowns

        return (
          <div className="space-y-6">
            {/* --- UPGRADED: AAA+ ANNOUNCEMENT BAR (MULTIPLE MESSAGES) --- */}
            <div className="space-y-4 p-4 border rounded-lg bg-indigo-500/5 border-indigo-500/20">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold text-indigo-400">
                  Announcement Bar
                </Label>
                <Switch
                  checked={formData.showAnnouncement === true}
                  onCheckedChange={(checked) =>
                    updateField("showAnnouncement", checked)
                  }
                />
              </div>
              {formData.showAnnouncement && (
                <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-3">
                    {(
                      formData.announcements ||
                      (formData.announcementText
                        ? [
                            {
                              id: "legacy",
                              text: formData.announcementText,
                              link: formData.announcementLink,
                            },
                          ]
                        : [])
                    ).map((ann: any, index: number) => (
                      <div
                        key={ann.id || index}
                        className="grid grid-cols-[1fr_1fr_auto] gap-2 items-start bg-background p-2 rounded-md border shadow-sm relative group"
                      >
                        <div className="space-y-1.5">
                          <Label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
                            Message {index + 1}
                          </Label>
                          <Input
                            value={ann.text || ""}
                            onChange={(e) => {
                              const newAnns = [
                                ...(formData.announcements || []),
                              ];
                              if (!newAnns.length && formData.announcementText)
                                newAnns.push({
                                  id: "legacy",
                                  text: formData.announcementText,
                                  link: formData.announcementLink,
                                });
                              newAnns[index] = {
                                ...newAnns[index],
                                text: e.target.value,
                              };
                              updateField("announcements", newAnns);
                            }}
                            placeholder="e.g. Free shipping!"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
                            Link
                          </Label>
                          <Input
                            value={ann.link || ""}
                            onChange={(e) => {
                              const newAnns = [
                                ...(formData.announcements || []),
                              ];
                              if (!newAnns.length && formData.announcementText)
                                newAnns.push({
                                  id: "legacy",
                                  text: formData.announcementText,
                                  link: formData.announcementLink,
                                });
                              newAnns[index] = {
                                ...newAnns[index],
                                link: e.target.value,
                              };
                              updateField("announcements", newAnns);
                            }}
                            placeholder="/shop"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="pt-5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
                            onClick={() => {
                              const currentAnns = formData.announcements || [
                                {
                                  id: "legacy",
                                  text: formData.announcementText,
                                  link: formData.announcementLink,
                                },
                              ];
                              const newAnns = currentAnns.filter(
                                (_: any, i: number) => i !== index
                              );
                              updateField("announcements", newAnns);
                            }}
                          >
                            <X size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {(formData.announcements?.length || 0) < 5 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-dashed text-xs h-8 text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 border-indigo-200"
                        onClick={() => {
                          const currentAnns =
                            formData.announcements ||
                            (formData.announcementText
                              ? [
                                  {
                                    id: "legacy",
                                    text: formData.announcementText,
                                    link: formData.announcementLink,
                                  },
                                ]
                              : []);
                          updateField("announcements", [
                            ...currentAnns,
                            {
                              id: `ann_${crypto.randomUUID()}`,
                              text: "",
                              link: "",
                            },
                          ]);
                        }}
                      >
                        <Plus className="w-3 h-3 mr-2" /> Add Message
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 p-3 bg-background rounded-md border mt-2">
                    <div className="space-y-2">
                      <Label className="text-xs">Background Color</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={formData.announcementBgColor || "#000000"}
                          onChange={(e) =>
                            updateField("announcementBgColor", e.target.value)
                          }
                          className="h-8 w-8 rounded cursor-pointer border"
                        />
                        <Input
                          value={formData.announcementBgColor || "#000000"}
                          onChange={(e) =>
                            updateField("announcementBgColor", e.target.value)
                          }
                          className="h-8 font-mono text-xs uppercase"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Text Color</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={formData.announcementTextColor || "#ffffff"}
                          onChange={(e) =>
                            updateField("announcementTextColor", e.target.value)
                          }
                          className="h-8 w-8 rounded cursor-pointer border"
                        />
                        <Input
                          value={formData.announcementTextColor || "#ffffff"}
                          onChange={(e) =>
                            updateField("announcementTextColor", e.target.value)
                          }
                          className="h-8 font-mono text-xs uppercase"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border p-3 rounded-md bg-background">
                    <div className="space-y-0.5">
                      <Label className="cursor-pointer">
                        Sliding Animation (Marquee)
                      </Label>
                      <p className="text-[10px] text-muted-foreground">
                        Makes the text scroll continuously.
                      </p>
                    </div>
                    <Switch
                      checked={formData.announcementMarquee === true}
                      onCheckedChange={(checked) =>
                        updateField("announcementMarquee", checked)
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
              <Label className="text-base font-semibold">Branding</Label>
              <div className="space-y-2">
                <Label>Logo Text</Label>
                <Input
                  value={formData.logoText || ""}
                  onChange={(e) => updateField("logoText", e.target.value)}
                  placeholder="e.g. HAMZA KAEL"
                />
              </div>
              <div className="space-y-2">
                <Label>Logo Image</Label>
                <div className="flex items-center gap-4">
                  {formData.logoImage && (
                    <div className="h-10 w-10 bg-black rounded border flex items-center justify-center p-1">
                      <img
                        src={formData.logoImage}
                        alt="Logo"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setActiveMediaField("logoImage");
                      setIsMediaPickerOpen(true);
                    }}
                  >
                    {formData.logoImage ? "Change Logo" : "Upload Logo"}
                  </Button>
                </div>
              </div>
              {formData.logoImage && (
                <div className="space-y-5 pt-2">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label className="flex items-center gap-2">
                        <Monitor size={14} /> Desktop Size
                      </Label>
                      <span className="text-xs text-muted-foreground">
                        {formData.logoHeight || 40}px
                      </span>
                    </div>
                    <Slider
                      value={[formData.logoHeight || 40]}
                      min={20}
                      max={120}
                      step={2}
                      onValueChange={([val]) => updateField("logoHeight", val)}
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label className="flex items-center gap-2">
                        <Smartphone size={14} /> Mobile Size
                      </Label>
                      <span className="text-xs text-muted-foreground">
                        {formData.mobileLogoHeight || 30}px
                      </span>
                    </div>
                    <Slider
                      value={[formData.mobileLogoHeight || 30]}
                      min={16}
                      max={80}
                      step={2}
                      onValueChange={([val]) =>
                        updateField("mobileLogoHeight", val)
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
              <Label className="text-base font-semibold">Layout & Style</Label>
              <div className="space-y-2">
                <Label>Header Variant</Label>
                <Select
                  value={formData.variant || "transparent"}
                  onValueChange={(val) => updateField("variant", val)}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transparent">
                      Transparent (Standard)
                    </SelectItem>
                    <SelectItem value="centered">
                      Editorial (Centered Logo)
                    </SelectItem>
                    <SelectItem value="floating">
                      Floating Island (Pill Shape)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between border p-3 rounded-md bg-background">
                <div className="space-y-0.5">
                  <Label htmlFor="isSticky" className="cursor-pointer">
                    Sticky Header
                  </Label>
                  <p className="text-[10px] text-muted-foreground">
                    Keep header at top while scrolling
                  </p>
                </div>
                <Switch
                  id="isSticky"
                  checked={formData.isSticky !== false}
                  onCheckedChange={(checked) =>
                    updateField("isSticky", checked)
                  }
                />
              </div>
            </div>

            <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
              <Label className="text-base font-semibold">Social Icons</Label>
              <p className="text-[10px] text-muted-foreground mb-2">
                Leave blank to hide. They will appear next to the navigation
                links.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="relative">
                  <div className="absolute left-2.5 top-2.5 text-muted-foreground">
                    <Instagram size={14} />
                  </div>
                  <Input
                    className="pl-8 text-xs"
                    value={formData.socialInstagram || ""}
                    onChange={(e) =>
                      updateField("socialInstagram", e.target.value)
                    }
                    placeholder="Instagram URL"
                  />
                </div>
                <div className="relative">
                  <div className="absolute left-2.5 top-2.5 text-muted-foreground">
                    <Twitter size={14} />
                  </div>
                  <Input
                    className="pl-8 text-xs"
                    value={formData.socialTwitter || ""}
                    onChange={(e) =>
                      updateField("socialTwitter", e.target.value)
                    }
                    placeholder="Twitter/X URL"
                  />
                </div>
                <div className="relative">
                  <div className="absolute left-2.5 top-2.5 text-muted-foreground">
                    <Youtube size={14} />
                  </div>
                  <Input
                    className="pl-8 text-xs"
                    value={formData.socialYoutube || ""}
                    onChange={(e) =>
                      updateField("socialYoutube", e.target.value)
                    }
                    placeholder="YouTube URL"
                  />
                </div>
                <div className="relative">
                  <div className="absolute left-2.5 top-2.5 text-muted-foreground">
                    <Film size={14} />
                  </div>
                  <Input
                    className="pl-8 text-xs"
                    value={formData.socialImdb || ""}
                    onChange={(e) => updateField("socialImdb", e.target.value)}
                    placeholder="IMDb URL"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex flex-col gap-2">
                <Label className="text-base font-semibold">
                  Navigation Menu
                </Label>

                <div className="flex bg-muted/50 p-1 rounded-lg border">
                  <button
                    className={cn(
                      "flex-1 text-xs font-semibold py-1.5 rounded-md transition-all",
                      formData.menuType !== "mega"
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => updateField("menuType", "simple")}
                  >
                    Simple Menu
                  </button>
                  <button
                    className={cn(
                      "flex-1 text-xs font-semibold py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5",
                      formData.menuType === "mega"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => updateField("menuType", "mega")}
                  >
                    Mega Menu{" "}
                    {!hasMegaMenuAccess && (
                      <Lock
                        size={10}
                        className={
                          formData.menuType === "mega"
                            ? "text-primary-foreground/70"
                            : "text-amber-500"
                        }
                      />
                    )}
                  </button>
                </div>
              </div>

              {formData.menuType === "mega" ? (
                hasMegaMenuAccess ? (
                  /* --- 🚀 ACTIVE MEGA MENU BUILDER --- */
                  <div className="space-y-4 p-4 border rounded-lg bg-primary/5 animate-in slide-in-from-right-2">
                    <div className="flex items-center gap-3 border-b border-primary/10 pb-3">
                      <div className="p-2 bg-primary/10 text-primary rounded-md">
                        <Layers size={16} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-primary">
                          Mega Menu Organizer
                        </h4>
                        <p className="text-[10px] text-muted-foreground">
                          eCommerce & Pro feature unlocked.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-primary">
                        1. Create Folders
                      </Label>
                      {(formData.megaMenuFolders || []).map(
                        (folder: any, i: number) => (
                          <div
                            key={folder.id}
                            className="flex items-center gap-2 p-2 bg-background border rounded-md shadow-sm"
                          >
                            <Layers
                              size={14}
                              className="text-muted-foreground"
                            />
                            <Input
                              value={folder.label}
                              onChange={(e) => {
                                const newF = [...formData.megaMenuFolders];
                                newF[i].label = e.target.value;
                                updateField("megaMenuFolders", newF);
                              }}
                              className="h-7 text-xs"
                              placeholder="Folder Name (e.g. Services)"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive/70 hover:text-destructive"
                              onClick={() => {
                                const newF = formData.megaMenuFolders.filter(
                                  (_: any, idx: number) => idx !== i
                                );
                                updateField("megaMenuFolders", newF);
                              }}
                            >
                              <X size={14} />
                            </Button>
                          </div>
                        )
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs border-dashed bg-background"
                        onClick={() => {
                          const newF = [
                            ...(formData.megaMenuFolders || []),
                            { id: `folder_${crypto.randomUUID()}`, label: "" },
                          ];
                          updateField("megaMenuFolders", newF);
                        }}
                      >
                        <Plus className="w-3 h-3 mr-2" /> Add Dropdown Folder
                      </Button>
                    </div>

                    {/* 🚀 NEW: LINK ASSIGNMENT UI */}
                    <div className="pt-4 mt-4 border-t border-primary/10 space-y-4">
                      <Label className="text-xs font-bold text-primary">
                        2. Assign Links to Folders
                      </Label>

                      {/* Mega Menu Pages */}
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase text-muted-foreground">
                          Pages
                        </Label>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={
                              formData.menuConfig?.page_shop?.visible !== false
                            }
                            onCheckedChange={(c) =>
                              updateMenuConfig("page_shop", "visible", c)
                            }
                          />
                          <Input
                            value={
                              formData.menuConfig?.page_shop?.label || "Shop"
                            }
                            onChange={(e) =>
                              updateMenuConfig(
                                "page_shop",
                                "label",
                                e.target.value
                              )
                            }
                            disabled={
                              formData.menuConfig?.page_shop?.visible === false
                            }
                            className="h-8 text-xs flex-1"
                          />
                          <Select
                            value={
                              formData.menuConfig?.page_shop?.folderId || "none"
                            }
                            onValueChange={(val) =>
                              updateMenuConfig(
                                "page_shop",
                                "folderId",
                                val === "none" ? null : val
                              )
                            }
                          >
                            <SelectTrigger className="w-[130px] h-8 text-xs bg-background">
                              <SelectValue placeholder="Parent" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No Folder</SelectItem>
                              {megaFolders.map((f: any) => (
                                <SelectItem key={f.id} value={f.id}>
                                  {f.label || "Unnamed"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {(pages || [])
                          .filter((p) => !p.isHome)
                          .map((page) => {
                            const configKey = `page_${page.id}`;
                            const config =
                              formData.menuConfig?.[configKey] || {};
                            return (
                              <div
                                key={page.id}
                                className="flex items-center gap-2"
                              >
                                <Switch
                                  checked={config.visible !== false}
                                  onCheckedChange={(c) =>
                                    updateMenuConfig(configKey, "visible", c)
                                  }
                                />
                                <Input
                                  value={config.label || page.title}
                                  onChange={(e) =>
                                    updateMenuConfig(
                                      configKey,
                                      "label",
                                      e.target.value
                                    )
                                  }
                                  disabled={config.visible === false}
                                  className="h-8 text-xs flex-1"
                                />
                                <Select
                                  value={config.folderId || "none"}
                                  onValueChange={(val) =>
                                    updateMenuConfig(
                                      configKey,
                                      "folderId",
                                      val === "none" ? null : val
                                    )
                                  }
                                >
                                  <SelectTrigger className="w-[130px] h-8 text-xs bg-background">
                                    <SelectValue placeholder="Parent" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">
                                      No Folder
                                    </SelectItem>
                                    {megaFolders.map((f: any) => (
                                      <SelectItem key={f.id} value={f.id}>
                                        {f.label || "Unnamed"}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            );
                          })}
                      </div>

                      {/* Mega Menu Custom Links */}
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase text-muted-foreground">
                          Custom Links
                        </Label>
                        {(formData.customNavLinks || []).map(
                          (link: any, index: number) => (
                            <div
                              key={link.id}
                              className="flex items-start gap-2 bg-background p-2 border rounded-md relative group shadow-sm"
                            >
                              <Switch
                                checked={link.visible !== false}
                                className="mt-2"
                                onCheckedChange={(c) => {
                                  const newLinks = formData.customNavLinks.map(
                                    (l: any, i: number) =>
                                      i === index ? { ...l, visible: c } : l
                                  );
                                  updateField("customNavLinks", newLinks);
                                }}
                              />
                              <div className="flex-grow space-y-2">
                                <div className="flex gap-2">
                                  <Input
                                    value={link.label}
                                    placeholder="Link Name"
                                    onChange={(e) => {
                                      const newLinks =
                                        formData.customNavLinks.map(
                                          (l: any, i: number) =>
                                            i === index
                                              ? { ...l, label: e.target.value }
                                              : l
                                        );
                                      updateField("customNavLinks", newLinks);
                                    }}
                                    className="h-8 text-xs"
                                  />
                                  <Select
                                    value={link.folderId || "none"}
                                    onValueChange={(val) => {
                                      const newLinks =
                                        formData.customNavLinks.map(
                                          (l: any, i: number) =>
                                            i === index
                                              ? {
                                                  ...l,
                                                  folderId:
                                                    val === "none" ? null : val,
                                                }
                                              : l
                                        );
                                      updateField("customNavLinks", newLinks);
                                    }}
                                  >
                                    <SelectTrigger className="w-[130px] h-8 text-xs">
                                      <SelectValue placeholder="Parent" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">
                                        No Folder
                                      </SelectItem>
                                      {megaFolders.map((f: any) => (
                                        <SelectItem key={f.id} value={f.id}>
                                          {f.label || "Unnamed"}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Input
                                  value={link.url}
                                  placeholder="https://..."
                                  onChange={(e) => {
                                    const newLinks =
                                      formData.customNavLinks.map(
                                        (l: any, i: number) =>
                                          i === index
                                            ? { ...l, url: e.target.value }
                                            : l
                                      );
                                    updateField("customNavLinks", newLinks);
                                  }}
                                  className="h-8 text-xs text-muted-foreground"
                                />
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive/50 hover:text-destructive absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background border shadow-sm rounded-full"
                                onClick={() => {
                                  const newLinks =
                                    formData.customNavLinks.filter(
                                      (l: any) => l.id !== link.id
                                    );
                                  updateField("customNavLinks", newLinks);
                                }}
                              >
                                <X size={14} />
                              </Button>
                            </div>
                          )
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-dashed text-xs bg-background"
                          onClick={() => {
                            const currentLinks = formData.customNavLinks || [];
                            updateField("customNavLinks", [
                              ...currentLinks,
                              {
                                id: `link_${Date.now()}`,
                                label: "",
                                url: "",
                                visible: true,
                                folderId: null,
                              },
                            ]);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" /> Add Custom Link
                        </Button>
                      </div>

                      {/* Mega Menu Sections */}
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase text-muted-foreground">
                          On-Page Sections
                        </Label>
                        {sections
                          .filter(
                            (s: any) => s.type !== "header" && s.isVisible
                          )
                          .map((s: any) => {
                            const config = formData.menuConfig?.[s.id] || {};
                            return (
                              <div
                                key={s.id}
                                className="flex items-center gap-2"
                              >
                                <Switch
                                  checked={config.visible !== false}
                                  onCheckedChange={(c) =>
                                    updateMenuConfig(s.id, "visible", c)
                                  }
                                />
                                <Input
                                  value={config.label || s.data.title || s.type}
                                  onChange={(e) =>
                                    updateMenuConfig(
                                      s.id,
                                      "label",
                                      e.target.value
                                    )
                                  }
                                  disabled={config.visible === false}
                                  className="h-8 text-xs flex-1"
                                />
                                <Select
                                  value={config.folderId || "none"}
                                  onValueChange={(val) =>
                                    updateMenuConfig(
                                      s.id,
                                      "folderId",
                                      val === "none" ? null : val
                                    )
                                  }
                                >
                                  <SelectTrigger className="w-[130px] h-8 text-xs bg-background">
                                    <SelectValue placeholder="Parent" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">
                                      No Folder
                                    </SelectItem>
                                    {megaFolders.map((f: any) => (
                                      <SelectItem key={f.id} value={f.id}>
                                        {f.label || "Unnamed"}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* --- 🚀 LOCKED MEGA MENU STATE (Starter / Free) --- */
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center space-y-3 animate-in slide-in-from-right-2">
                    <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-2 text-amber-600">
                      <Layers size={24} />
                    </div>
                    <h4 className="font-bold text-amber-900">
                      Mega Menu unlocked in eCommerce & Pro
                    </h4>
                    <p className="text-xs text-amber-700 max-w-[250px] mx-auto">
                      Upgrade your plan to organize your links into nested
                      folders, add images to dropdowns, and create rich
                      navigation experiences.
                    </p>
                    <Button
                      asChild
                      variant="outline"
                      className="bg-white hover:bg-amber-100 text-amber-700 border-amber-300 w-full max-w-[200px] mt-2"
                    >
                      <a href="/dashboard/settings">View Upgrade Plans</a>
                    </Button>
                  </div>
                )
              ) : (
                /* --- 🚀 SIMPLE MENU BUILDER --- */
                <div className="space-y-4 animate-in slide-in-from-left-2">
                  <div className="flex items-center justify-between bg-muted/30 p-3 rounded-md border">
                    <Label
                      htmlFor="autoMenu"
                      className="text-xs font-bold text-foreground"
                    >
                      Auto-Generate Links
                    </Label>
                    <Switch
                      id="autoMenu"
                      checked={formData.autoMenu !== false}
                      onCheckedChange={(checked) =>
                        updateField("autoMenu", checked)
                      }
                    />
                  </div>

                  {formData.autoMenu !== false ? (
                    <div className="bg-muted/10 border border-dashed p-4 rounded-md space-y-3">
                      <p className="text-xs text-muted-foreground text-center">
                        Auto-Generate is <strong>ON</strong>. The system is
                        currently displaying these visible sections:
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center pointer-events-none opacity-70">
                        {sections
                          .filter(
                            (s: any) => s.isVisible && s.type !== "header"
                          )
                          .map((s: any) => (
                            <span
                              key={s.id}
                              className="px-2 py-1 bg-secondary text-secondary-foreground text-[10px] uppercase font-bold tracking-widest rounded-md shadow-sm"
                            >
                              {s.data.title || s.type}
                            </span>
                          ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground text-center pt-3 border-t border-dashed mt-4">
                        Turn off Auto-Generate to manually reorder, rename, or
                        hide links.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6 bg-muted/20 p-4 rounded-md border">
                      {/* --- PAGES --- */}
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                          <span className="h-px bg-border flex-grow"></span>{" "}
                          Pages{" "}
                          <span className="h-px bg-border flex-grow"></span>
                        </Label>
                        <p className="text-[10px] text-muted-foreground text-center mb-3">
                          Links to specific pages on your website.
                        </p>

                        <div className="flex items-center gap-3">
                          <Switch
                            checked={
                              formData.menuConfig?.page_shop?.visible !== false
                            }
                            onCheckedChange={(c) =>
                              updateMenuConfig("page_shop", "visible", c)
                            }
                          />
                          <Input
                            value={
                              formData.menuConfig?.page_shop?.label || "Shop"
                            }
                            onChange={(e) =>
                              updateMenuConfig(
                                "page_shop",
                                "label",
                                e.target.value
                              )
                            }
                            disabled={
                              formData.menuConfig?.page_shop?.visible === false
                            }
                            className="h-8 text-sm"
                          />
                          <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest w-16 text-right">
                            System
                          </span>
                        </div>

                        {(pages || [])
                          .filter((p) => !p.isHome)
                          .map((page) => {
                            const configKey = `page_${page.id}`;
                            const config =
                              formData.menuConfig?.[configKey] || {};
                            const isSelected = config.visible !== false;
                            const label = config.label || page.title;

                            return (
                              <div
                                key={page.id}
                                className="flex items-center gap-3"
                              >
                                <Switch
                                  checked={isSelected}
                                  onCheckedChange={(c) =>
                                    updateMenuConfig(configKey, "visible", c)
                                  }
                                />
                                <Input
                                  value={label}
                                  onChange={(e) =>
                                    updateMenuConfig(
                                      configKey,
                                      "label",
                                      e.target.value
                                    )
                                  }
                                  disabled={!isSelected}
                                  className="h-8 text-sm"
                                />
                                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest w-16 text-right truncate">
                                  Custom
                                </span>
                              </div>
                            );
                          })}
                      </div>

                      {/* --- CUSTOM EXTERNAL LINKS --- */}
                      <div className="space-y-3">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                          <span className="h-px bg-border flex-grow"></span>{" "}
                          Custom Links{" "}
                          <span className="h-px bg-border flex-grow"></span>
                        </Label>
                        <p className="text-[10px] text-muted-foreground text-center mb-3">
                          Link to specific products, collections, or external
                          websites.
                        </p>

                        {(formData.customNavLinks || []).map(
                          (link: any, index: number) => (
                            <div
                              key={link.id}
                              className="flex items-start gap-3 bg-background p-2 border rounded-md relative group shadow-sm"
                            >
                              <Switch
                                checked={link.visible !== false}
                                className="mt-2"
                                onCheckedChange={(c) => {
                                  const newLinks = formData.customNavLinks.map(
                                    (l: any, i: number) =>
                                      i === index ? { ...l, visible: c } : l
                                  );
                                  updateField("customNavLinks", newLinks);
                                }}
                              />
                              <div className="flex-grow space-y-2">
                                <Input
                                  value={link.label}
                                  placeholder="Link Name (e.g. My IMDb)"
                                  onChange={(e) => {
                                    const newLinks =
                                      formData.customNavLinks.map(
                                        (l: any, i: number) =>
                                          i === index
                                            ? { ...l, label: e.target.value }
                                            : l
                                      );
                                    updateField("customNavLinks", newLinks);
                                  }}
                                  className="h-8 text-sm"
                                />
                                <Input
                                  value={link.url}
                                  placeholder="https:// or /shop/product"
                                  onChange={(e) => {
                                    const newLinks =
                                      formData.customNavLinks.map(
                                        (l: any, i: number) =>
                                          i === index
                                            ? { ...l, url: e.target.value }
                                            : l
                                      );
                                    updateField("customNavLinks", newLinks);
                                  }}
                                  className="h-8 text-sm text-muted-foreground"
                                />
                              </div>
                              {/* Delete Button */}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive/50 hover:text-destructive absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background border shadow-sm rounded-full"
                                onClick={() => {
                                  const newLinks =
                                    formData.customNavLinks.filter(
                                      (l: any) => l.id !== link.id
                                    );
                                  updateField("customNavLinks", newLinks);
                                }}
                              >
                                <X size={14} />
                              </Button>
                            </div>
                          )
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-dashed text-xs"
                          onClick={() => {
                            const currentLinks = formData.customNavLinks || [];
                            updateField("customNavLinks", [
                              ...currentLinks,
                              {
                                id: `link_${Date.now()}`,
                                label: "",
                                url: "",
                                visible: true,
                              },
                            ]);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" /> Add Custom Link
                        </Button>
                      </div>

                      {/* --- ON-PAGE SECTIONS --- */}
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                          <span className="h-px bg-border flex-grow"></span>{" "}
                          On-Page Sections{" "}
                          <span className="h-px bg-border flex-grow"></span>
                        </Label>
                        <p className="text-[10px] text-muted-foreground text-center mb-3">
                          Links that scroll down to sections on the Home page.
                        </p>

                        {sections
                          .filter(
                            (s: any) => s.type !== "header" && s.isVisible
                          )
                          .map((s: any) => {
                            const config = formData.menuConfig?.[s.id] || {};
                            const isSelected = config.visible !== false;
                            const label =
                              config.label || s.data.title || s.type;
                            return (
                              <div
                                key={s.id}
                                className="flex items-center gap-3"
                              >
                                <Switch
                                  checked={isSelected}
                                  onCheckedChange={(c) =>
                                    updateMenuConfig(s.id, "visible", c)
                                  }
                                />
                                <Input
                                  value={label}
                                  onChange={(e) =>
                                    updateMenuConfig(
                                      s.id,
                                      "label",
                                      e.target.value
                                    )
                                  }
                                  disabled={!isSelected}
                                  className="h-8 text-sm"
                                />
                                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest w-16 text-right truncate">
                                  Section
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-4 border-t space-y-2">
              <Label>Call to Action Button</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={formData.ctaText || ""}
                  onChange={(e) => updateField("ctaText", e.target.value)}
                  placeholder="Button Text"
                />
                <Input
                  value={formData.ctaLink || ""}
                  onChange={(e) => updateField("ctaLink", e.target.value)}
                  placeholder="/checkout or #contact"
                />
              </div>
            </div>
          </div>
        );
      case "dynamic_store":
        return (
          <div className="space-y-6">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-3">
              <div className="bg-primary/10 p-3 rounded-full">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Store Inventory</h4>
                <p className="text-xs text-muted-foreground mb-3 mt-1 max-w-[250px] mx-auto">
                  Add or edit the actual products in your database.
                </p>
              </div>
              <Button
                onClick={() => setIsProductManagerOpen(true)}
                className="w-full shadow-sm"
              >
                Manage Inventory
              </Button>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-semibold text-sm uppercase text-muted-foreground tracking-wider">
                Display Settings
              </h4>
              <div className="space-y-2">
                <Label>Section Title</Label>
                <Input
                  value={formData.title || ""}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="e.g., My Store"
                />
              </div>
              <div className="space-y-2">
                <Label>Subtitle (Optional)</Label>
                <Input
                  value={formData.subtitle || ""}
                  onChange={(e) => updateField("subtitle", e.target.value)}
                  placeholder="e.g., Browse my available services and packages."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Layout Style</Label>
                  <Select
                    value={formData.variant || "grid"}
                    onValueChange={(val) => updateField("variant", val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grid">Grid (Standard)</SelectItem>
                      <SelectItem value="carousel">
                        Carousel (Horizontal)
                      </SelectItem>
                      <SelectItem value="spotlight">
                        Spotlight (Single Product)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Max Products</Label>
                  <Input
                    type="number"
                    min="1"
                    max="24"
                    value={formData.maxProductsToShow || 6}
                    onChange={(e) =>
                      updateField("maxProductsToShow", parseInt(e.target.value))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <div className="space-y-1">
                <Label>Select Specific Products</Label>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Choose exactly which products show here. If none are selected,
                  your most recent active products will display automatically.
                </p>
              </div>
              <div className="max-h-[200px] overflow-y-auto border rounded-md p-3 space-y-2 bg-muted/10">
                {availableProducts.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No products found in your inventory.
                  </p>
                ) : (
                  availableProducts.map((prod) => {
                    const isSelected = (
                      formData.selectedProductIds || []
                    ).includes(prod.id);
                    return (
                      <div
                        key={prod.id}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="checkbox"
                          id={`prod-${prod.id}`}
                          checked={isSelected}
                          onChange={(e) => {
                            const currentList =
                              formData.selectedProductIds || [];
                            let newList;
                            if (e.target.checked)
                              newList = [...currentList, prod.id];
                            else
                              newList = currentList.filter(
                                (id: string) => id !== prod.id
                              );
                            updateField("selectedProductIds", newList);
                          }}
                          className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                        />
                        <Label
                          htmlFor={`prod-${prod.id}`}
                          className="text-sm font-normal cursor-pointer flex-1 flex justify-between items-center"
                        >
                          <span className="truncate pr-2">{prod.title}</span>
                          {prod.status !== "active" && (
                            <Badge
                              variant="destructive"
                              className="text-[9px] uppercase px-1 py-0 h-4"
                            >
                              Draft
                            </Badge>
                          )}
                        </Label>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        );

      case "lead_form":
        return (
          <div className="space-y-8">
            {/* 1. BASIC SETTINGS */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Section Title</Label>
                <Input
                  value={formData.title || ""}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="Get in Touch"
                />
              </div>
              <div className="space-y-2">
                <Label>Subheadline</Label>
                <Textarea
                  value={formData.subheadline || ""}
                  onChange={(e) => updateField("subheadline", e.target.value)}
                  placeholder="Send me a message..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Button Text</Label>
                <Input
                  value={formData.buttonText || ""}
                  onChange={(e) => updateField("buttonText", e.target.value)}
                  placeholder="Send Message"
                />
              </div>
            </div>

            {/* 2. LAYOUT VARIANT */}
            <div className="space-y-3 pt-4 border-t">
              <Label>Layout Style</Label>
              <Select
                value={formData.variant || "centered"}
                onValueChange={(val) => updateField("variant", val)}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="centered">
                    Centered Box (Standard)
                  </SelectItem>
                  <SelectItem value="split">
                    Split Screen (Image Left)
                  </SelectItem>
                  <SelectItem value="minimal">
                    Minimal (No Background)
                  </SelectItem>
                </SelectContent>
              </Select>

              {formData.variant === "split" && (
                <div className="mt-2">
                  <Label className="text-xs">Side Image</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={formData.image || ""}
                      onChange={(e) => updateField("image", e.target.value)}
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
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const newField = {
                      id: `custom_${Date.now()}`,
                      label: "New Field",
                      type: "text",
                      placeholder: "",
                      required: false,
                      width: "full",
                    };
                    updateField("fields", [
                      ...(formData.fields || []),
                      newField,
                    ]);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Field
                </Button>
              </div>

              <div className="space-y-3">
                {(formData.fields || []).map((field: any, idx: number) => (
                  <div
                    key={idx}
                    className="border p-3 rounded-lg bg-muted/10 space-y-3 group relative"
                  >
                    {/* Remove Button */}
                    <button
                      onClick={() => {
                        const newFields = [...formData.fields];
                        newFields.splice(idx, 1);
                        updateField("fields", newFields);
                      }}
                      className="absolute top-2 right-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={14} />
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground uppercase">
                          Label
                        </Label>
                        <Input
                          value={field.label}
                          onChange={(e) => {
                            const newFields = [...formData.fields];
                            newFields[idx].label = e.target.value;
                            updateField("fields", newFields);
                          }}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground uppercase">
                          Type
                        </Label>
                        <Select
                          value={field.type}
                          onValueChange={(val) => {
                            const newFields = [...formData.fields];
                            newFields[idx].type = val;
                            updateField("fields", newFields);
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
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
                        <Label className="text-[10px] text-muted-foreground uppercase">
                          Placeholder
                        </Label>
                        <Input
                          value={field.placeholder || ""}
                          onChange={(e) => {
                            const newFields = [...formData.fields];
                            newFields[idx].placeholder = e.target.value;
                            updateField("fields", newFields);
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
                              updateField("fields", newFields);
                            }}
                            className="accent-primary"
                          />
                          <span className="text-xs">Required</span>
                        </div>
                        <div className="flex items-center gap-2 border rounded px-2 h-8 w-full bg-background">
                          <input
                            type="checkbox"
                            checked={field.width === "half"}
                            onChange={(e) => {
                              const newFields = [...formData.fields];
                              newFields[idx].width = e.target.checked
                                ? "half"
                                : "full";
                              updateField("fields", newFields);
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
      case "shop":
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Section Title</Label>
              <Input
                value={formData.title || ""}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="Shop"
              />
            </div>

            {/* 1. CONFIGURATION */}
            <div className="grid grid-cols-1 gap-4 p-4 border rounded-lg bg-muted/20">
              <div className="space-y-2">
                <Label>Layout Style</Label>
                <Select
                  value={formData.variant || "grid"}
                  onValueChange={(val) => updateField("variant", val)}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">Grid (Standard)</SelectItem>
                    <SelectItem value="carousel">
                      Carousel (Horizontal)
                    </SelectItem>
                    <SelectItem value="spotlight">
                      Spotlight (Hero Product)
                    </SelectItem>
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
                  <div
                    key={idx}
                    className="border p-4 rounded-lg bg-muted/10 space-y-4 relative group"
                  >
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
                        <Label className="text-xs text-muted-foreground">
                          Product Gallery (First image is featured)
                        </Label>

                        <div className="flex flex-wrap gap-2">
                          {/* Existing Images */}
                          {(
                            product.images ||
                            (product.image ? [product.image] : [])
                          ).map((imgUrl: string, imgIdx: number) => (
                            <div
                              key={imgIdx}
                              className="relative group/thumb w-16 h-16 border rounded overflow-hidden"
                            >
                              <img
                                src={imgUrl}
                                className="w-full h-full object-cover"
                                alt="thumb"
                              />

                              {/* Remove Image Button */}
                              <button
                                className="absolute top-0 right-0 bg-red-500/90 text-white p-1 opacity-0 group-hover/thumb:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation(); // Stop bubble
                                  const newProds = [
                                    ...(formData.products || []),
                                  ];
                                  const newImages = [...(product.images || [])];
                                  newImages.splice(imgIdx, 1);
                                  newProds[idx].images = newImages;
                                  // Update legacy 'image' field to always be the first one
                                  newProds[idx].image = newImages[0] || "";
                                  updateField("products", newProds);
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
                            <span className="text-[9px] font-semibold mt-1">
                              ADD
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex-grow space-y-2">
                        <Input
                          placeholder="Product Title"
                          value={product.title}
                          onChange={(e) =>
                            updateProduct(idx, "title", e.target.value)
                          }
                          className="font-medium"
                        />
                        <div className="flex gap-2">
                          <Input
                            placeholder="Price"
                            value={product.price}
                            onChange={(e) =>
                              updateProduct(idx, "price", e.target.value)
                            }
                            className="w-1/2"
                          />
                          <Input
                            placeholder="Stock"
                            value={product.stock}
                            onChange={(e) =>
                              updateProduct(idx, "stock", e.target.value)
                            }
                            className="w-1/2"
                          />
                        </div>
                      </div>
                    </div>

                    <Textarea
                      placeholder="Short description..."
                      value={product.description}
                      onChange={(e) =>
                        updateProduct(idx, "description", e.target.value)
                      }
                      rows={2}
                      className="text-sm resize-none"
                    />

                    {/* CHECKOUT METHOD SELECTOR */}
                    <div className="p-3 bg-background border rounded-md space-y-3">
                      <Label className="text-xs font-bold text-muted-foreground uppercase">
                        Checkout Action
                      </Label>
                      <Select
                        value={product.actionType || "whatsapp"}
                        onValueChange={(val) =>
                          updateProduct(idx, "actionType", val)
                        }
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Select Action" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="whatsapp">
                            <div className="flex items-center gap-2">
                              <MessageCircle
                                size={14}
                                className="text-green-500"
                              />{" "}
                              WhatsApp Order
                            </div>
                          </SelectItem>
                          <SelectItem value="form_order">
                            {/* NEW OPTION */}
                            <div className="flex items-center gap-2">
                              <FileText size={14} className="text-orange-500" />{" "}
                              Direct Order Form
                            </div>
                          </SelectItem>
                          <SelectItem value="link">
                            <div className="flex items-center gap-2">
                              <ExternalLink
                                size={14}
                                className="text-blue-500"
                              />{" "}
                              External Link
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      {/* CONDITIONAL INPUTS */}
                      {product.actionType === "link" && (
                        <Input
                          placeholder="https://buy.stripe.com/..."
                          value={product.checkoutUrl || ""}
                          onChange={(e) =>
                            updateProduct(idx, "checkoutUrl", e.target.value)
                          }
                          className="h-9 text-xs"
                        />
                      )}

                      {product.actionType === "whatsapp" && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground whitespace-nowrap">
                            wa.me/
                          </span>
                          <Input
                            placeholder="212600000000"
                            value={product.whatsappNumber || ""}
                            onChange={(e) =>
                              updateProduct(
                                idx,
                                "whatsappNumber",
                                e.target.value
                              )
                            }
                            className="h-9 text-xs"
                          />
                        </div>
                      )}

                      {/* Note: 'form_order' doesn't need extra inputs, just the button label below */}

                      <Input
                        placeholder="Button Label (e.g. Buy Now)"
                        value={product.buttonText}
                        onChange={(e) =>
                          updateProduct(idx, "buttonText", e.target.value)
                        }
                        className="h-9 text-xs"
                      />
                    </div>

                    {/* VISUAL VARIANT BUILDER (Only for WhatsApp flow mostly, but useful for display too) */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-end">
                        <Label className="text-xs">Product Variants</Label>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-[10px]"
                          onClick={() => {
                            const current = product.variants || [];
                            updateProduct(idx, "variants", [
                              ...current,
                              { name: "Size", options: "S, M, L" },
                            ]);
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
                              updateProduct(idx, "variants", newVars);
                            }}
                            className="w-1/3 h-8 text-xs"
                          />
                          <Input
                            placeholder="Options (Red, Blue)"
                            value={v.options}
                            onChange={(e) => {
                              const newVars = [...(product.variants || [])];
                              newVars[vIdx].options = e.target.value;
                              updateProduct(idx, "variants", newVars);
                            }}
                            className="flex-grow h-8 text-xs"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground"
                            onClick={() => {
                              const newVars = [...(product.variants || [])];
                              newVars.splice(vIdx, 1);
                              updateProduct(idx, "variants", newVars);
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

        case "hero":
          return (
            <div className="space-y-6">
              {/* --- LAYOUT & STYLE --- */}
              <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                <div className="flex items-center gap-2 mb-2 border-b pb-2">
                  <LayoutTemplate size={16} className="text-primary" />
                  <Label className="text-base font-semibold text-primary">
                    Layout Architecture
                  </Label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Hero Structure</Label>
                    <Select
                      value={formData.layout || "center"}
                      onValueChange={(val) => updateField("layout", val)}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select Layout" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="center">Immersive Center</SelectItem>
                        <SelectItem value="split-left">
                          Split (Text Left)
                        </SelectItem>
                        <SelectItem value="split-right">
                          Split (Text Right)
                        </SelectItem>
                        <SelectItem value="bottom">Bottom Aligned</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Text Alignment</Label>
                    <Select
                      value={formData.alignment || "center"}
                      onValueChange={(val) => updateField("alignment", val)}
                    >
                      <SelectTrigger className="bg-background">
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
  
              {/* --- CONTENT & TYPOGRAPHY --- */}
              <div className="space-y-4 p-4 border rounded-lg bg-muted/5">
                <Label className="text-base font-semibold">
                  Content & Typography
                </Label>
                <div className="grid gap-2">
                  <Label>Eyebrow Label (Small Top Text)</Label>
                  <Input
                    value={formData.label || ""}
                    onChange={(e) => updateField("label", e.target.value)}
                    placeholder="e.g. Welcome to my portfolio"
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label>Main Headline</Label>
                    <div className="flex items-center gap-2">
                      <Label
                        className="text-[10px] text-muted-foreground cursor-pointer"
                        htmlFor="typewriter"
                      >
                        Typewriter Effect?
                      </Label>
                      <Switch
                        id="typewriter"
                        checked={formData.animateHeadline === true}
                        onCheckedChange={(c) => updateField("animateHeadline", c)}
                      />
                    </div>
                  </div>
                  <Textarea
                    value={formData.headline || ""}
                    onChange={(e) => updateField("headline", e.target.value)}
                    placeholder="Creative & Voice Actor"
                    className="font-bold text-lg h-20"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Subheadline</Label>
                  <Textarea
                    value={formData.subheadline || ""}
                    onChange={(e) => updateField("subheadline", e.target.value)}
                    placeholder="Based in Los Angeles. Available for worldwide bookings."
                    className="h-20"
                  />
                </div>
              </div>
  
              {/* --- 🚀 NEW: TRUST SIGNALS (Conversion Booster) --- */}
              <div className="space-y-4 p-4 border rounded-lg border-amber-500/20 bg-amber-500/5">
                <div className="flex items-center justify-between border-b border-amber-500/10 pb-2">
                  <div className="flex items-center gap-2">
                    <Star size={16} className="text-amber-500 fill-amber-500" />
                    <Label className="text-base font-semibold text-amber-700">
                      Trust Badge
                    </Label>
                  </div>
                  <Switch
                    checked={formData.showTrustBadge === true}
                    onCheckedChange={(checked) =>
                      updateField("showTrustBadge", checked)
                    }
                  />
                </div>
                {formData.showTrustBadge && (
                  <div className="grid gap-2 animate-in fade-in slide-in-from-top-2 pt-2">
                    <Label className="text-amber-900">Badge Text</Label>
                    <Input
                      value={formData.trustText || "★★★★★ 5.0 from 100+ Reviews"}
                      onChange={(e) => updateField("trustText", e.target.value)}
                      placeholder="e.g. Trusted by 50+ Brands"
                      className="border-amber-200 focus-visible:ring-amber-500"
                    />
                    <p className="text-[10px] text-amber-700/70">
                      Appears directly above or below the primary Call to Action.
                    </p>
                  </div>
                )}
              </div>
  
              {/* --- MEDIA BACKGROUND --- */}
              <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                <Label className="text-base font-semibold">
                  Background Media
                </Label>
  
                <div className="flex bg-muted/50 p-1 rounded-lg border mb-4">
                  <button
                    className={cn(
                      "flex-1 text-xs font-semibold py-1.5 rounded-md transition-all",
                      formData.variant !== "video" && formData.variant !== "color"
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => updateField("variant", "static")}
                  >
                    <ImageIcon size={14} className="inline mr-2" /> Image
                  </button>
                  <button
                    className={cn(
                      "flex-1 text-xs font-semibold py-1.5 rounded-md transition-all",
                      formData.variant === "video"
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => updateField("variant", "video")}
                  >
                    <Video size={14} className="inline mr-2" /> Video
                  </button>
                  <button
                    className={cn(
                      "flex-1 text-xs font-semibold py-1.5 rounded-md transition-all",
                      formData.variant === "color"
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => updateField("variant", "color")}
                  >
                    <Palette size={14} className="inline mr-2" /> Color
                  </button>
                </div>
  
                {/* 🚀 OPTION 1: VIDEO (Upgraded for Mobile) */}
                {formData.variant === "video" ? (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    
                    {/* Desktop Video Block */}
                    <div className="grid gap-4 p-3 border rounded-md bg-background">
                      <div className="grid gap-2">
                        <Label className="flex items-center gap-2">
                          <Monitor size={14} /> Desktop Video Source
                        </Label>
                        <div className="flex gap-2">
                          <div className="relative flex-grow">
                            <LinkIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              value={formData.videoUrl || ""}
                              onChange={(e) => updateField("videoUrl", e.target.value)}
                              placeholder="Paste link or select from library..."
                              className="pl-9"
                            />
                          </div>
                          <Button
                            variant="secondary"
                            type="button"
                            onClick={() => {
                              setActiveMediaField("videoUrl");
                              setIsMediaPickerOpen(true);
                            }}
                            title="Select from Library"
                          >
                            <Video className="h-4 w-4 mr-2" /> Library
                          </Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          Supports direct MP4 links or YouTube videos.
                        </p>
                      </div>
  
                      <div className="grid gap-2 pt-2 border-t">
                        <Label className="text-xs">Desktop Poster (Fallback)</Label>
                        <div className="flex gap-2 items-center">
                          {formData.backgroundImage && (
                            <div className="h-9 w-9 rounded overflow-hidden border shrink-0 bg-muted relative group">
                              <img src={formData.backgroundImage} className="h-full w-full object-cover" alt="preview" />
                            </div>
                          )}
                          <Button
                            variant="outline" size="sm" className="flex-grow justify-start"
                            onClick={() => {
                              setActiveMediaField("backgroundImage");
                              setIsMediaPickerOpen(true);
                            }}
                          >
                            <ImageIcon className="h-4 w-4 mr-2" />{" "}
                            {formData.backgroundImage ? "Change Poster" : "Select Poster Image"}
                          </Button>
                          {formData.backgroundImage && (
                            <Button
                              variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0"
                              onClick={() => updateField("backgroundImage", "")}
                              title="Remove Image"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
  
                    {/* Mobile Video Block */}
                    <div className="grid gap-4 p-3 border rounded-md bg-background">
                      <div className="grid gap-2">
                        <Label className="flex items-center gap-2">
                          <Smartphone size={14} /> Mobile Video (Optional)
                        </Label>
                        <p className="text-[10px] text-muted-foreground mb-1">
                          Upload a vertical reel specifically for phones.
                        </p>
                        <div className="flex gap-2">
                          <div className="relative flex-grow">
                            <LinkIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              value={formData.mobileVideoUrl || ""}
                              onChange={(e) => updateField("mobileVideoUrl", e.target.value)}
                              placeholder="Vertical video link..."
                              className="pl-9"
                            />
                          </div>
                          <Button
                            variant="secondary" type="button"
                            onClick={() => {
                              setActiveMediaField("mobileVideoUrl");
                              setIsMediaPickerOpen(true);
                            }}
                          >
                            <Video className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
  
                      {!formData.mobileVideoUrl ? (
                        <div className="grid gap-2 pt-2 border-t">
                          <Label className="text-xs">Desktop Video Fit (On Mobile)</Label>
                          <Select
                            value={formData.mobileVideoFit || "cover"}
                            onValueChange={(val) => updateField("mobileVideoFit", val)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cover">Crop to Fill Screen (Default)</SelectItem>
                              <SelectItem value="fill">Stretch to Fill Screen</SelectItem>
                              <SelectItem value="contain">Show Original (Letterbox)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <div className="grid gap-2 pt-2 border-t">
                          <Label className="text-xs">Mobile Poster (Fallback)</Label>
                          <div className="flex gap-2 items-center">
                            {formData.mobileBackgroundImage && (
                              <div className="h-9 w-6 rounded overflow-hidden border shrink-0 bg-muted relative group">
                                <img src={formData.mobileBackgroundImage} className="h-full w-full object-cover" alt="preview" />
                              </div>
                            )}
                            <Button
                              variant="outline" size="sm" className="flex-grow justify-start"
                              onClick={() => {
                                setActiveMediaField("mobileBackgroundImage");
                                setIsMediaPickerOpen(true);
                              }}
                            >
                              <ImageIcon className="h-4 w-4 mr-2" />{" "}
                              {formData.mobileBackgroundImage ? "Change Mobile Poster" : "Select Mobile Poster"}
                            </Button>
                            {formData.mobileBackgroundImage && (
                              <Button
                                variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0"
                                onClick={() => updateField("mobileBackgroundImage", "")}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : /* 🚀 OPTION 2: COLOR / GRADIENT */
                formData.variant === "color" ? (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 p-3 border rounded-md bg-background">
                    <div className="space-y-2">
                      <Label>Background Type</Label>
                      <Select
                        value={formData.colorType || "solid"}
                        onValueChange={(val) => updateField("colorType", val)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="solid">Solid Color</SelectItem>
                          <SelectItem value="gradient">
                            Creative Gradient
                          </SelectItem>
                          <SelectItem value="mesh">
                            Animated Glass Mesh
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
  
                    {formData.colorType === "solid" ? (
                      <div className="space-y-2 pt-2">
                        <Label className="text-xs">Select Color</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={formData.backgroundColor || "#000000"}
                            onChange={(e) =>
                              updateField("backgroundColor", e.target.value)
                            }
                            className="h-8 w-8 rounded cursor-pointer border"
                          />
                          <Input
                            value={formData.backgroundColor || "#000000"}
                            onChange={(e) =>
                              updateField("backgroundColor", e.target.value)
                            }
                            className="h-8 font-mono text-xs uppercase"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 pt-3 border-t">
                        <Label className="text-xs font-bold text-primary">
                          Custom Gradient Colors
                        </Label>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                              Color 1
                            </Label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={formData.gradientColor1 || "#0f172a"}
                                onChange={(e) =>
                                  updateField("gradientColor1", e.target.value)
                                }
                                className="h-8 w-8 rounded cursor-pointer border"
                              />
                              <Input
                                value={formData.gradientColor1 || "#0f172a"}
                                onChange={(e) =>
                                  updateField("gradientColor1", e.target.value)
                                }
                                className="h-8 font-mono text-[10px] uppercase px-2"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                              Color 2
                            </Label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={formData.gradientColor2 || "#3b82f6"}
                                onChange={(e) =>
                                  updateField("gradientColor2", e.target.value)
                                }
                                className="h-8 w-8 rounded cursor-pointer border"
                              />
                              <Input
                                value={formData.gradientColor2 || "#3b82f6"}
                                onChange={(e) =>
                                  updateField("gradientColor2", e.target.value)
                                }
                                className="h-8 font-mono text-[10px] uppercase px-2"
                              />
                            </div>
                          </div>
                        </div>
                        {formData.colorType === "mesh" && (
                          <p className="text-[10px] text-muted-foreground">
                            The mesh animation will smoothly loop between these
                            two colors.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* 🚀 OPTION 3: STATIC IMAGE */
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="grid gap-2 p-3 border rounded-md bg-background">
                      <Label className="flex items-center gap-2">
                        <Monitor size={14} /> Desktop Background Image
                      </Label>
                      <div className="flex gap-2 items-center">
                        {formData.backgroundImage && (
                          <div className="h-9 w-9 rounded overflow-hidden border shrink-0 bg-muted relative group">
                            <img
                              src={formData.backgroundImage}
                              className="h-full w-full object-cover"
                              alt="preview"
                            />
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-grow justify-start"
                          onClick={() => {
                            setActiveMediaField("backgroundImage");
                            setIsMediaPickerOpen(true);
                          }}
                        >
                          <ImageIcon className="h-4 w-4 mr-2" />{" "}
                          {formData.backgroundImage
                            ? "Change Desktop Image"
                            : "Select Image"}
                        </Button>
                        {formData.backgroundImage && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0"
                            onClick={() => updateField("backgroundImage", "")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
  
                    <div className="grid gap-2 p-3 border rounded-md bg-background">
                      <div className="flex justify-between items-center">
                        <Label className="flex items-center gap-2">
                          <Smartphone size={14} /> Mobile Background (Optional)
                        </Label>
                      </div>
                      <p className="text-[10px] text-muted-foreground mb-1">
                        Upload a vertical image so faces/subjects aren't cropped
                        out on phones.
                      </p>
                      <div className="flex gap-2 items-center">
                        {formData.mobileBackgroundImage && (
                          <div className="h-9 w-6 rounded overflow-hidden border shrink-0 bg-muted relative group">
                            <img
                              src={formData.mobileBackgroundImage}
                              className="h-full w-full object-cover"
                              alt="preview"
                            />
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-grow justify-start"
                          onClick={() => {
                            setActiveMediaField("mobileBackgroundImage");
                            setIsMediaPickerOpen(true);
                          }}
                        >
                          <ImageIcon className="h-4 w-4 mr-2" />{" "}
                          {formData.mobileBackgroundImage
                            ? "Change Mobile Image"
                            : "Select Mobile Image"}
                        </Button>
                        {formData.mobileBackgroundImage && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0"
                            onClick={() =>
                              updateField("mobileBackgroundImage", "")
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
  
                <div className="grid gap-4 pt-4 border-t">
                  <div className="flex justify-between">
                    <Label>Overlay Darkness</Label>
                    <span className="text-xs text-muted-foreground">
                      {formData.overlayOpacity || 60}%
                    </span>
                  </div>
                  <Slider
                    value={[formData.overlayOpacity || 60]}
                    max={95}
                    step={5}
                    onValueChange={([val]: [number]) =>
                      updateField("overlayOpacity", val)
                    }
                  />
                </div>
              </div>
  
              {/* --- CALL TO ACTION --- */}
              <div className="space-y-4 p-4 border rounded-lg bg-muted/5">
                <Label className="text-base font-semibold">
                  Call to Action Buttons
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2 border p-3 rounded bg-background">
                    <Label className="text-xs font-bold text-primary">
                      Primary Button
                    </Label>
                    <Input
                      value={formData.ctaText || ""}
                      onChange={(e) => updateField("ctaText", e.target.value)}
                      placeholder="e.g. Book Me"
                      className="h-8 text-sm"
                    />
                    <Input
                      value={formData.ctaLink || ""}
                      onChange={(e) => updateField("ctaLink", e.target.value)}
                      placeholder="/contact"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="grid gap-2 border p-3 rounded bg-background">
                    <Label className="text-xs font-bold">Secondary Button</Label>
                    <Input
                      value={formData.secondaryCtaText || ""}
                      onChange={(e) =>
                        updateField("secondaryCtaText", e.target.value)
                      }
                      placeholder="e.g. Watch Reel"
                      className="h-8 text-sm"
                    />
                    <Input
                      value={formData.secondaryCtaLink || ""}
                      onChange={(e) =>
                        updateField("secondaryCtaLink", e.target.value)
                      }
                      placeholder="#reel"
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          );
      case "team":
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Section Title</Label>
              <Input
                value={formData.title || ""}
                onChange={(e) => updateField("title", e.target.value)}
              />
            </div>

            {/* 1. CONFIGURATION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/20">
              <div className="space-y-2">
                <Label>Layout Style</Label>
                <Select
                  value={formData.variant || "grid"}
                  onValueChange={(val) => updateField("variant", val)}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">Classic Grid (Equal)</SelectItem>
                    <SelectItem value="spotlight">
                      Founder Spotlight (First Large)
                    </SelectItem>
                    <SelectItem value="carousel">
                      Horizontal Scroll (Compact)
                    </SelectItem>
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
                  <div
                    key={idx}
                    className="border p-4 rounded-lg bg-muted/10 space-y-4 relative group"
                  >
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
                        onClick={() => {
                          setActiveMediaField(`member-image-${idx}`);
                          setIsMediaPickerOpen(true);
                        }}
                      >
                        {member.image ? (
                          <img
                            src={member.image}
                            className="w-full h-full object-cover transition-transform group-hover/img:scale-110"
                            alt={member.name}
                          />
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
                          onChange={(e) =>
                            updateMember(idx, "name", e.target.value)
                          }
                          className="font-medium"
                        />
                        <Input
                          placeholder="Role / Title"
                          value={member.role}
                          onChange={(e) =>
                            updateMember(idx, "role", e.target.value)
                          }
                          className="text-xs text-muted-foreground"
                        />
                      </div>
                    </div>

                    {/* Bio */}
                    <Textarea
                      placeholder="Short Bio..."
                      value={member.bio}
                      onChange={(e) => updateMember(idx, "bio", e.target.value)}
                      rows={2}
                      className="text-sm resize-none"
                    />

                    {/* Social Links (Collapsible-ish) */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative">
                        <Input
                          placeholder="LinkedIn URL"
                          value={member.linkedin || ""}
                          onChange={(e) =>
                            updateMember(idx, "linkedin", e.target.value)
                          }
                          className="pl-8 text-xs h-8"
                        />
                        <span className="absolute left-2.5 top-2 text-muted-foreground font-bold text-xs">
                          in
                        </span>
                      </div>
                      <div className="relative">
                        <Input
                          placeholder="Instagram URL"
                          value={member.instagram || ""}
                          onChange={(e) =>
                            updateMember(idx, "instagram", e.target.value)
                          }
                          className="pl-8 text-xs h-8"
                        />
                        <span className="absolute left-2.5 top-2 text-muted-foreground font-bold text-xs">
                          IG
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      // --- MAP SECTION EDITOR ---
      case "map":
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Section Title</Label>
              <Input
                value={formData.title || ""}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="e.g. My Studio"
              />
            </div>

            {/* 1. CONFIGURATION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/20">
              <div className="space-y-2">
                <Label>Map Style</Label>
                <Select
                  value={formData.variant || "standard"}
                  onValueChange={(val) => updateField("variant", val)}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">
                      Standard (Full Width)
                    </SelectItem>
                    <SelectItem value="dark">
                      Cinematic (Full Width Dark)
                    </SelectItem>
                    <SelectItem value="card">Overlay Card (Boxed)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Height</Label>
                <Select
                  value={formData.height || "medium"}
                  onValueChange={(val) => updateField("height", val)}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
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
                  value={formData.mapUrl || ""}
                  onChange={(e) => updateField("mapUrl", e.target.value)}
                  placeholder='Paste the "src" from the Embed code'
                />
                <p className="text-[11px] text-muted-foreground">
                  Google Maps → Share → Embed a map → Copy HTML → Paste the{" "}
                  <strong>src="..."</strong> URL.
                </p>
              </div>

              {/* Direction Link (For the Button) */}
              <div className="space-y-2">
                <Label>Get Directions Link</Label>
                <Input
                  value={formData.directionUrl || ""}
                  onChange={(e) => updateField("directionUrl", e.target.value)}
                  placeholder="https://maps.app.goo.gl/..."
                />
                <p className="text-[11px] text-muted-foreground">
                  Paste the direct "Share Location" link here. If empty, we'll
                  try to generate one from the address.
                </p>
              </div>

              {/* Address (Used for Card Display or Fallback Link) */}
              <div className="space-y-2 animate-in fade-in">
                <Label>Address / Label</Label>
                <Textarea
                  value={formData.address || ""}
                  onChange={(e) => updateField("address", e.target.value)}
                  placeholder="e.g. 123 Hollywood Blvd, Los Angeles"
                  rows={2}
                />
              </div>
            </div>
          </div>
        );
      // --- PRICING SECTION EDITOR ---
      case "pricing":
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Section Title</Label>
              <Input
                value={formData.title || ""}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="Pricing & Rates"
              />
            </div>

            {/* 1. CONFIGURATION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/20">
              <div className="space-y-2">
                <Label>Layout Style</Label>
                <Select
                  value={formData.variant || "cards"}
                  onValueChange={(val) => updateField("variant", val)}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cards">Grid Cards (Standard)</SelectItem>
                    <SelectItem value="slider">
                      Carousel (Horizontal Scroll)
                    </SelectItem>
                    <SelectItem value="list">
                      Rate Card (Minimal List)
                    </SelectItem>
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
                  <div
                    key={idx}
                    className="border p-4 rounded-lg bg-muted/10 space-y-4 relative group"
                  >
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
                          onChange={(e) =>
                            updatePlan(idx, "name", e.target.value)
                          }
                          className="font-medium"
                        />
                      </div>
                      <div className="col-span-8 md:col-span-4 space-y-1">
                        <Label className="text-xs">Price</Label>
                        <Input
                          placeholder="e.g. 500"
                          value={plan.price}
                          onChange={(e) =>
                            updatePlan(idx, "price", e.target.value)
                          }
                        />
                      </div>
                      <div className="col-span-4 md:col-span-4 space-y-1">
                        <Label className="text-xs">Unit (Optional)</Label>
                        <Input
                          placeholder="/mo"
                          value={plan.unit}
                          onChange={(e) =>
                            updatePlan(idx, "unit", e.target.value)
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Description / Features</Label>
                      <Textarea
                        placeholder="Feature 1, Feature 2, Feature 3..."
                        value={plan.features}
                        onChange={(e) =>
                          updatePlan(idx, "features", e.target.value)
                        }
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Button Text</Label>
                        <Input
                          placeholder="e.g. Book Now"
                          value={plan.cta}
                          onChange={(e) =>
                            updatePlan(idx, "cta", e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Button Link (URL)</Label>
                        <Input
                          placeholder="https://..."
                          value={plan.buttonUrl}
                          onChange={(e) =>
                            updatePlan(idx, "buttonUrl", e.target.value)
                          }
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <Switch
                        id={`pop-${idx}`}
                        checked={plan.isPopular || false}
                        onCheckedChange={(c) => updatePlan(idx, "isPopular", c)}
                      />
                      <Label
                        htmlFor={`pop-${idx}`}
                        className="text-xs cursor-pointer text-muted-foreground"
                      >
                        Highlight as Popular
                      </Label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "about":
        return (
          <div className="space-y-6">
            {/* 1. LAYOUT & VARIANT */}
            <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
              <Label>Layout Style</Label>
              <Select
                value={formData.variant || "split"}
                onValueChange={(val) => updateField("variant", val)}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="split">
                    Standard Split (Bio + Media)
                  </SelectItem>
                  <SelectItem value="profile">
                    Actor Profile (Bio + Media + Stats)
                  </SelectItem>
                  <SelectItem value="simple">Minimal (Text Only)</SelectItem>
                </SelectContent>
              </Select>

              {/* Alignment Buttons (Hidden for Simple mode) */}
              {formData.variant !== "simple" && (
                <div className="flex items-center justify-between mt-2">
                  <Label className="text-xs text-muted-foreground">
                    Media Position
                  </Label>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={
                        formData.layout === "left" ? "default" : "outline"
                      }
                      onClick={() => updateField("layout", "left")}
                      className="h-7 text-xs"
                    >
                      Left
                    </Button>
                    <Button
                      size="sm"
                      variant={
                        formData.layout === "right" || !formData.layout
                          ? "default"
                          : "outline"
                      }
                      onClick={() => updateField("layout", "right")}
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
                <Input
                  value={formData.label || ""}
                  onChange={(e) => updateField("label", e.target.value)}
                  placeholder="e.g. Who I Am"
                />
              </div>
              <div className="grid gap-2">
                <Label>Main Title</Label>
                <Input
                  value={formData.title || ""}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="e.g. About Me"
                />
              </div>
              <div className="grid gap-2">
                <Label>Bio Content</Label>
                <Textarea
                  rows={6}
                  value={formData.content || ""}
                  onChange={(e) => updateField("content", e.target.value)}
                  placeholder="Write your bio here..."
                />
              </div>
            </div>

            {/* 3. MEDIA PICKER (Hidden in Simple Mode) */}
            {formData.variant !== "simple" && (
              <div className="space-y-4 pt-4 border-t">
                <Label>Featured Media</Label>
                <div className="flex gap-3 items-start p-3 border rounded-md bg-muted/10">
                  {/* Smart Preview (Video or Image) */}
                  {formData.image && (
                    <div className="h-20 w-20 rounded overflow-hidden border shrink-0 bg-black relative">
                      {formData.image.match(/\.(mp4|webm|mov)$/i) ? (
                        <video
                          src={formData.image}
                          className="w-full h-full object-cover opacity-80"
                          muted
                        />
                      ) : (
                        <img
                          src={formData.image}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  )}

                  <div className="flex-grow space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setActiveMediaField("image");
                        setIsMediaPickerOpen(true);
                      }}
                    >
                      {formData.image
                        ? "Change Media"
                        : "Select Image or Video"}
                    </Button>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      Tip: You can use a headshot or a vertical video loop
                      (reels work great here!).
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 4. KEY FEATURES (Good for 'Split' Variant) */}
            <div className="pt-4 border-t space-y-3">
              <div className="flex justify-between items-center">
                <Label>Key Highlights / Features</Label>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-xs"
                  onClick={() => {
                    const current = formData.features || [];
                    updateField("features", [...current, "New Highlight"]);
                  }}
                >
                  <Plus className="w-3 h-3 mr-1" /> Add
                </Button>
              </div>
              <div className="space-y-2">
                {(formData.features || []).map(
                  (feature: string, idx: number) => (
                    <div key={idx} className="flex gap-2">
                      <Input
                        value={feature}
                        onChange={(e) => {
                          const newFeatures = [...formData.features];
                          newFeatures[idx] = e.target.value;
                          updateField("features", newFeatures);
                        }}
                        className="h-8 text-sm"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          const newFeatures = [...formData.features];
                          newFeatures.splice(idx, 1);
                          updateField("features", newFeatures);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* 5. PROFILE STATS (Only shows for 'Profile' variant) */}
            {formData.variant === "profile" && (
              <div className="pt-4 border-t space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between">
                  <Label className="text-primary">Actor Stats Grid</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => {
                      const current = formData.stats || [];
                      updateField("stats", [
                        ...current,
                        { label: "Label", value: "Value" },
                      ]);
                    }}
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add Stat
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {(formData.stats || []).map((stat: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex gap-1 items-center bg-muted/30 p-1 rounded border"
                    >
                      <Input
                        placeholder="Label"
                        value={stat.label}
                        onChange={(e) => {
                          const newStats = [...formData.stats];
                          newStats[idx].label = e.target.value;
                          updateField("stats", newStats);
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
                          updateField("stats", newStats);
                        }}
                        className="h-7 text-xs border-transparent focus-visible:ring-0 bg-transparent text-right font-medium"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => {
                          const newStats = [...formData.stats];
                          newStats.splice(idx, 1);
                          updateField("stats", newStats);
                        }}
                      >
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
                <Input
                  value={formData.ctaText || ""}
                  onChange={(e) => updateField("ctaText", e.target.value)}
                  placeholder="Text"
                />
                <Input
                  value={formData.ctaLink || ""}
                  onChange={(e) => updateField("ctaLink", e.target.value)}
                  placeholder="Link (#contact)"
                />
              </div>
            </div>
          </div>
        );

      case "stats":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Choose which statistics to display.
            </p>
            <div className="flex items-center justify-between border p-3 rounded-md">
              <Label htmlFor="showProjects">
                Show Completed Projects (Auto)
              </Label>
              <Switch
                id="showProjects"
                checked={formData.showProjects !== false}
                onCheckedChange={(checked) =>
                  updateField("showProjects", checked)
                }
              />
            </div>
            <div className="flex items-center justify-between border p-3 rounded-md">
              <Label htmlFor="showExperience">
                Show Years of Experience (Auto)
              </Label>
              <Switch
                id="showExperience"
                checked={formData.showExperience !== false}
                onCheckedChange={(checked) =>
                  updateField("showExperience", checked)
                }
              />
            </div>

            <div className="pt-4 border-t">
              <div className="flex justify-between items-center mb-2">
                <Label>Custom Stats</Label>
                <Button size="sm" variant="ghost" onClick={addStat}>
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>
              <div className="space-y-2">
                {(formData.customStats || []).map(
                  (stat: any, index: number) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        placeholder="Label (e.g. Clients)"
                        value={stat.label}
                        onChange={(e) =>
                          updateStat(index, "label", e.target.value)
                        }
                        className="flex-1"
                      />
                      <Input
                        placeholder="Value (e.g. 50+)"
                        value={stat.value}
                        onChange={(e) =>
                          updateStat(index, "value", e.target.value)
                        }
                        className="w-24"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeStat(index)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        );

      case "services_showcase":
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Section Title</Label>
              <Input
                value={formData.title || "My Services & Work"}
                onChange={(e) => updateField("title", e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between border p-3 rounded-md">
              <div className="space-y-0.5">
                <Label htmlFor="showRates">Show Rates & Description</Label>
                <p className="text-xs text-muted-foreground">
                  Display the starting price and details for each service.
                </p>
              </div>
              <Switch
                id="showRates"
                checked={formData.showRates !== false}
                onCheckedChange={(checked) => updateField("showRates", checked)}
              />
            </div>

            <div className="flex items-center justify-between border p-3 rounded-md">
              <div className="space-y-0.5">
                <Label htmlFor="showDemos">Show Demos</Label>
                <p className="text-xs text-muted-foreground">
                  Display your uploaded demos for each service category.
                </p>
              </div>
              <Switch
                id="showDemos"
                checked={formData.showDemos !== false}
                onCheckedChange={(checked) => updateField("showDemos", checked)}
              />
            </div>

            <div className="pt-4 border-t space-y-2">
              <Label>Call to Action Button</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={formData.ctaText || ""}
                  onChange={(e) => updateField("ctaText", e.target.value)}
                  placeholder="Button Text"
                />
                <Input
                  value={formData.ctaLink || ""}
                  onChange={(e) => updateField("ctaLink", e.target.value)}
                  placeholder="#contact"
                />
              </div>
            </div>
          </div>
        );

      case "reviews":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Section Title</Label>
              <Input
                value={formData.title || "Client Love"}
                onChange={(e) => updateField("title", e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between border p-3 rounded-md">
              <Label htmlFor="autoScroll">Auto-scroll Reviews</Label>
              <Switch
                id="autoScroll"
                checked={formData.autoScroll !== false}
                onCheckedChange={(checked) =>
                  updateField("autoScroll", checked)
                }
              />
            </div>
          </div>
        );

      case "image_slider":
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Section Title (Optional)</Label>
              <Input
                value={formData.title || ""}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="e.g. My Best Shots"
              />
            </div>

            {/* 1. CONFIGURATION GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/20">
              {/* Variant Selector */}
              <div className="space-y-2">
                <Label>Slider Style</Label>
                <Select
                  value={formData.variant || "standard"}
                  onValueChange={(val) => updateField("variant", val)}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard Swipe</SelectItem>
                    <SelectItem value="cinematic">
                      Cinematic Fade (Ken Burns)
                    </SelectItem>
                    <SelectItem value="cards">
                      Focus Cards (Center Mode)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Height Selector */}
              <div className="space-y-2">
                <Label>Slider Height</Label>
                <Select
                  value={formData.height || "large"}
                  onValueChange={(val) => updateField("height", val)}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
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
                <Select
                  value={String(formData.interval || "5")}
                  onValueChange={(val) =>
                    updateField("interval", parseInt(val))
                  }
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
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
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAddSlide("image")}
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Slide
                </Button>
              </div>
              <div className="space-y-2">
                {(formData.images || []).map((slide: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex gap-3 items-start border p-3 rounded-md bg-background shadow-sm group"
                  >
                    {/* Image Preview & Picker */}
                    <div
                      className="w-20 h-20 bg-muted rounded-md flex-shrink-0 relative overflow-hidden cursor-pointer border"
                      onClick={() => {
                        setActiveMediaField(`slider-image-${idx}`);
                        setIsMediaPickerOpen(true);
                      }}
                    >
                      {slide.url ? (
                        <img
                          src={slide.url}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          alt="slide"
                        />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] text-white font-medium uppercase tracking-wider">
                        Change
                      </div>
                    </div>

                    {/* Caption Input */}
                    <div className="flex-grow space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Caption
                      </Label>
                      <Input
                        placeholder="e.g. Headshot 2024"
                        value={slide.caption}
                        onChange={(e) =>
                          handleUpdateSlide(
                            "image",
                            idx,
                            "caption",
                            e.target.value
                          )
                        }
                        className="h-9"
                      />
                    </div>

                    {/* Remove Button */}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-muted-foreground hover:text-destructive h-8 w-8"
                      onClick={() => handleRemoveSlide("image", idx)}
                    >
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

      case "video_slider":
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Section Title</Label>
              <Input
                value={formData.title || ""}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="e.g. Showreel & Clips"
              />
            </div>

            {/* 1. CONFIGURATION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/20">
              <div className="space-y-2">
                <Label>Layout Style</Label>
                <Select
                  value={formData.variant || "cinema"}
                  onValueChange={(val) => updateField("variant", val)}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cinema">
                      Cinema Spotlight (One at a time)
                    </SelectItem>
                    <SelectItem value="carousel">
                      Netflix Strip (Horizontal Scroll)
                    </SelectItem>
                    <SelectItem value="grid">
                      Video Grid (Thumbnail Wall)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Height (Cinema Only) */}
              {formData.variant === "cinema" && (
                <div className="space-y-2">
                  <Label>Player Height</Label>
                  <Select
                    value={formData.height || "large"}
                    onValueChange={(val) => updateField("height", val)}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="medium">Medium (400px)</SelectItem>
                      <SelectItem value="large">Large (600px)</SelectItem>
                      <SelectItem value="full">Full Screen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Grid Columns (Grid Only) */}
              {formData.variant === "grid" && (
                <div className="space-y-2">
                  <Label>Grid Columns</Label>
                  <Select
                    value={String(formData.gridColumns || "3")}
                    onValueChange={(val) =>
                      updateField("gridColumns", parseInt(val))
                    }
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
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
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAddSlide("video")}
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Video
                </Button>
              </div>

              <div className="space-y-4">
                {(formData.videos || []).map((slide: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex flex-col gap-3 border p-4 rounded-lg bg-background shadow-sm relative group"
                  >
                    {/* Remove Button (Top Right) */}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute top-2 right-2 text-muted-foreground hover:text-destructive h-8 w-8"
                      onClick={() => handleRemoveSlide("video", idx)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>

                    <div className="flex gap-4 items-start">
                      {/* Thumbnail / Library Picker */}
                      <div
                        className="w-32 h-20 bg-black rounded-md flex-shrink-0 relative overflow-hidden cursor-pointer flex items-center justify-center border border-border"
                        onClick={() => {
                          setActiveMediaField(`slider-video-${idx}`);
                          setIsMediaPickerOpen(true);
                        }}
                        title="Pick from Library"
                      >
                        {slide.url ? (
                          <video
                            src={slide.url}
                            className="w-full h-full object-cover opacity-50 pointer-events-none"
                          />
                        ) : (
                          <LinkIcon className="w-8 h-8 text-muted-foreground" />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-colors">
                          <span className="text-[10px] text-white font-medium bg-black/60 px-2 py-1 rounded">
                            Library
                          </span>
                        </div>
                      </div>

                      {/* Text Inputs */}
                      <div className="flex-grow space-y-3">
                        <div className="grid gap-1.5">
                          <Label className="text-xs">
                            Video URL (YouTube or MP4)
                          </Label>
                          <Input
                            placeholder="https://youtube.com/watch?v=..."
                            value={slide.url || ""}
                            onChange={(e) =>
                              handleUpdateSlide(
                                "video",
                                idx,
                                "url",
                                e.target.value
                              )
                            }
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="Title (e.g. Drama Reel)"
                            value={slide.title}
                            onChange={(e) =>
                              handleUpdateSlide(
                                "video",
                                idx,
                                "title",
                                e.target.value
                              )
                            }
                            className="h-8 text-sm"
                          />
                          <Input
                            placeholder="Caption (Optional)"
                            value={slide.caption}
                            onChange={(e) =>
                              handleUpdateSlide(
                                "video",
                                idx,
                                "caption",
                                e.target.value
                              )
                            }
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

      case "gallery":
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Section Title</Label>
              <Input
                value={formData.title || "Gallery"}
                onChange={(e) => updateField("title", e.target.value)}
              />
            </div>

            {/* 1. LAYOUT VARIANT */}
            <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
              <Label>Layout Style</Label>
              <Select
                value={formData.variant || "masonry"}
                onValueChange={(val) => updateField("variant", val)}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="masonry">
                    Masonry (Pinterest Style)
                  </SelectItem>
                  <SelectItem value="carousel">
                    Film Strip (Horizontal Scroll)
                  </SelectItem>
                  <SelectItem value="grid">
                    Uniform Grid (Instagram Style)
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Options for Grid Variant Only */}
              {formData.variant === "grid" && (
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Aspect Ratio</Label>
                    <Select
                      value={formData.aspectRatio || "square"}
                      onValueChange={(val) => updateField("aspectRatio", val)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="square">Square (1:1)</SelectItem>
                        <SelectItem value="portrait">Portrait (2:3)</SelectItem>
                        <SelectItem value="landscape">
                          Landscape (16:9)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Columns</Label>
                    <Select
                      value={String(formData.gridColumns || "3")}
                      onValueChange={(val) =>
                        updateField("gridColumns", parseInt(val))
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
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
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setActiveMediaField("gallery");
                    setIsMediaPickerOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Media
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-2">
                {(formData.images || []).map((img: any, idx: number) => (
                  <div
                    key={idx}
                    className="relative group aspect-square bg-muted rounded-md overflow-hidden border"
                  >
                    {/* Video Indicator */}
                    {img.url.match(/\.(mp4|webm)$/i) ? (
                      <video
                        src={img.url}
                        className="w-full h-full object-cover opacity-50"
                      />
                    ) : (
                      <img
                        src={img.url}
                        alt="Gallery"
                        className="w-full h-full object-cover"
                      />
                    )}

                    <button
                      className="absolute top-1 right-1 bg-destructive/90 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        const newImages = [...formData.images];
                        newImages.splice(idx, 1);
                        updateField("images", newImages);
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
      case "contact":
        return (
          <div className="space-y-6">
            {/* 1. LAYOUT VARIANT */}
            <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
              <Label>Layout Style</Label>
              <Select
                value={formData.variant || "minimal"}
                onValueChange={(val) => updateField("variant", val)}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
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
                <Input
                  value={formData.title || ""}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="Let's Work Together"
                />
              </div>

              {/* NEW: Subtitle/Description */}
              <div className="space-y-2">
                <Label>Subtitle / Note</Label>
                <Textarea
                  value={formData.subheadline || ""}
                  onChange={(e) => updateField("subheadline", e.target.value)}
                  placeholder="Available for projects worldwide. Reach out for rates and availability."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  value={formData.email || ""}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="your@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Main Button Text</Label>
                <Input
                  value={formData.ctaText || "Send Email"}
                  onChange={(e) => updateField("ctaText", e.target.value)}
                />
              </div>

              {/* CONTACT METHODS */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label className="text-xs">Phone Number</Label>
                  <Input
                    value={formData.phone || ""}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="+1 555 000 0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">WhatsApp Number</Label>
                  <Input
                    value={formData.whatsapp || ""}
                    onChange={(e) => updateField("whatsapp", e.target.value)}
                    placeholder="e.g. 15550000000"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Include country code, no symbols (e.g. 15551234567)
                  </p>
                </div>
              </div>
            </div>

            {/* 3. IMAGE PICKER */}
            {formData.variant !== "minimal" && (
              <div className="space-y-4 pt-4 border-t">
                <Label>Featured Image</Label>
                <div className="flex gap-3 items-center p-3 border rounded-md bg-muted/10">
                  {formData.image && (
                    <div className="h-16 w-16 rounded overflow-hidden border shrink-0 bg-muted">
                      <img
                        src={formData.image}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setActiveMediaField("image");
                      setIsMediaPickerOpen(true);
                    }}
                  >
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
                  <span className="text-xs w-20 text-muted-foreground">
                    LinkedIn
                  </span>
                  <Input
                    className="h-8"
                    value={formData.linkedin || ""}
                    onChange={(e) => updateField("linkedin", e.target.value)}
                    placeholder="URL"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs w-20 text-muted-foreground">
                    Instagram
                  </span>
                  <Input
                    className="h-8"
                    value={formData.instagram || ""}
                    onChange={(e) => updateField("instagram", e.target.value)}
                    placeholder="URL"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs w-20 text-muted-foreground">
                    Twitter (X)
                  </span>
                  <Input
                    className="h-8"
                    value={formData.twitter || ""}
                    onChange={(e) => updateField("twitter", e.target.value)}
                    placeholder="URL"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs w-20 text-muted-foreground">
                    Website
                  </span>
                  <Input
                    className="h-8"
                    value={formData.website || ""}
                    onChange={(e) => updateField("website", e.target.value)}
                    placeholder="URL"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <p className="text-muted-foreground">
            Detailed settings for this section are available in the Design tab.
          </p>
        );
    }
  };

  // =========================================================
  // 🚀 THE CONDITIONAL RENDER LOGIC
  // =========================================================

  // 1. Extract the actual form content into a variable
  const EditorContent = (
    <div className="w-full h-full flex flex-col">
      {/* We only show the Header if it's NOT inline, because the inline sidebar already has a "<- Back" header */}
      {!isInline && (
        <div className="mb-6 px-4 pt-6">
          <h2 className="text-lg font-semibold">
            Edit{" "}
            {section.type.charAt(0).toUpperCase() +
              section.type.slice(1).replace(/_/g, " ")}
          </h2>
        </div>
      )}

      <Tabs defaultValue="content" className="w-full flex-grow flex flex-col">
        <TabsList className="grid w-full grid-cols-2 mb-4 mx-4 w-auto">
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="design">Design</TabsTrigger>
        </TabsList>
        <TabsContent value="content" className="space-y-4 px-4 pb-8">
          {renderFields()}
        </TabsContent>
        <TabsContent value="design" className="space-y-4 px-4 pb-8">
          {renderThemeSettings()}
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <>
      {/* 2. THE SPLIT: Native Div OR Modal Sheet */}
      {isInline ? (
        EditorContent
      ) : (
        <Sheet open={isOpen} onOpenChange={onClose}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-0">
            {EditorContent}
          </SheetContent>
        </Sheet>
      )}

      {/* 3. MEDIA PICKER REMAINS A DIALOG */}
      <Dialog open={isMediaPickerOpen} onOpenChange={setIsMediaPickerOpen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
          <DialogTitle className="sr-only">Media Library</DialogTitle>
          <DialogDescription className="sr-only">
            Select or upload media.
          </DialogDescription>
          <div className="p-6 flex-grow overflow-hidden">
            <PortfolioMediaManager
              actorId={actorId}
              onSelect={handleMediaSelect}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SectionEditor;
