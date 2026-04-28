import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../../supabaseClient";
import { useQuery } from "@tanstack/react-query";
import {
  useOutletContext,
  useSearchParams,
  useNavigate,
} from "react-router-dom";
import { ActorDashboardContextType } from "../../layouts/ActorDashboardLayout";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useBuilderStore } from "../../store/useBuilderStore";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  GripVertical,
  Eye,
  ArrowLeft,
  EyeOff,
  Save,
  ExternalLink,
  Loader2,
  Plus,
  Palette,
  Layers,
  Smartphone,
  Settings,
  Globe,
  CheckCircle2,
  Pencil,
  Check,
  X,
  Lock,
  RefreshCw,
  Zap,
  Circle,
  LayoutTemplate,
  PaintBucket,
  Square,
  Type,
  Component as ComponentIcon,
  Undo2,
  Redo2,
  Cloud,
  CloudOff,
  Monitor,
  Tablet,
  Trash2,
  Coins,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  MonitorPlay,
  PanelTop,
  Star,
  Image as ImageIcon,
  Images,
  Video,
  Mail,
  ClipboardList,
  MapPin,
  Users,
  User,
  CreditCard,
  BarChart,
  MessageSquare,
  Briefcase,
  Store,
} from "lucide-react";
import {
  PortfolioSection,
  DEFAULT_PORTFOLIO_SECTIONS,
  SectionType,
} from "../../types/portfolio";
import SectionEditor from "../../components/dashboard/SectionEditor";
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
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useSubscription } from "../../context/SubscriptionContext";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PORTFOLIO_TEMPLATES } from "../../lib/templates";
import { Badge } from "@/components/ui/badge";

// --- AVAILABLE BLOCKS LIST ---
const AVAILABLE_BLOCKS: {
  type: SectionType;
  label: string;
  module?: "shop" | "appointments";
  icon: any;
}[] = [
  { type: "header", label: "Header", icon: PanelTop },
  { type: "hero", label: "Hero", icon: Star },
  { type: "about", label: "About", icon: User },
  { type: "shop", label: "Quick Shop", module: "shop", icon: ShoppingBag },
  { type: "dynamic_store", label: "E-commerce", module: "shop", icon: Store },
  { type: "gallery", label: "Gallery", icon: ImageIcon },
  { type: "image_slider", label: "Image Slider", icon: Images },
  { type: "video_slider", label: "Video Slider", icon: Video },
  { type: "contact", label: "Contact Form", icon: Mail },
  { type: "lead_form", label: "Lead Form", icon: ClipboardList },
  { type: "map", label: "Map", icon: MapPin },
  { type: "team", label: "Team", icon: Users },
  { type: "pricing", label: "Pricing", icon: CreditCard },
  { type: "stats", label: "Statistics", icon: BarChart },
  { type: "reviews", label: "Reviews", icon: MessageSquare },
  { type: "services_showcase", label: "Services", icon: Briefcase },
];

const LOCAL_FONT_OPTIONS = [
  { id: "Inter", name: "Inter (Clean & Modern)" },
  { id: "Playfair Display", name: "Playfair (Elegant Serif)" },
  { id: "Montserrat", name: "Montserrat (Geometric Sans)" },
  { id: "Merriweather", name: "Merriweather (Classic Serif)" },
  { id: "Poppins", name: "Poppins (Friendly Sans)" },
  { id: "Oswald", name: "Oswald (Bold & Condensed)" },
  { id: "Outfit", name: "Outfit (Tech & Startup)" },
  { id: "Space Mono", name: "Space Mono (Developer)" },
];

const VISUAL_THEMES = [
  {
    id: "modern",
    name: "Modern Minimal",
    description: "Clean whitespace, classic layout.",
    previewColor: "#f3f4f6",
    sitePrice: 0,
    globalPrice: 0,
  },
  {
    id: "cinematic",
    name: "Cinematic Dark",
    description: "Immersive dark mode, dramatic transitions.",
    previewColor: "#1e293b",
    sitePrice: 200,
    globalPrice: 500,
  },
  {
    id: "cupertino",
    name: "Cupertino",
    description: "Apple-inspired. Bento grids, glassmorphism.",
    previewColor: "#3b82f6",
    sitePrice: 300,
    globalPrice: 800,
  },
];

// --- IFRAME PREVIEW COMPONENT ---
const IframePreview = ({
  sections,
  theme,
  actorId,
  onEditSection,
  updateSection,
  activePageId,
  globalSections,
  customPages,
  publicSlug,
}: {
  sections: PortfolioSection[];
  theme: any;
  actorId: string;
  onEditSection: (section: PortfolioSection) => void;
  updateSection: (id: string, updates: Partial<PortfolioSection>) => void;
  activePageId: string;
  globalSections: PortfolioSection[];
  customPages: any[];
  publicSlug: string;
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">(
    "desktop"
  );
  const [dims, setDims] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setDims({
          w: entries[0].contentRect.width,
          h: entries[0].contentRect.height,
        });
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const sendDataToIframe = useCallback(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      let previewSections = sections.map((s) => {
        if (s.type === "header")
          return { ...s, data: { ...s.data, customPages, publicSlug } };
        return s;
      });

      if (activePageId !== "home" && globalSections.length > 0) {
        const header = globalSections.find((s) => s.type === "header");
        if (header && header.isVisible)
          previewSections.unshift({
            ...header,
            data: { ...header.data, customPages, publicSlug },
          });
      }

      iframeRef.current.contentWindow.postMessage(
        {
          type: "UPDATE_PREVIEW",
          payload: { sections: previewSections, themeConfig: theme, actorId },
        },
        "*"
      );
    }
  }, [
    sections,
    theme,
    actorId,
    activePageId,
    globalSections,
    customPages,
    publicSlug,
  ]);

  useEffect(() => {
    sendDataToIframe();
  }, [sendDataToIframe]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "PREVIEW_READY") sendDataToIframe();
      else if (event.data?.type === "EDIT_SECTION") {
        const clickedSection = sections.find(
          (s) => s.id === event.data.payload
        );
        if (clickedSection) onEditSection(clickedSection);
      } else if (event.data?.type === "INLINE_EDIT") {
        const { sectionId, fieldKey, value } = event.data.payload;
        updateSection(sectionId, { data: { [fieldKey]: value } });
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [sendDataToIframe, sections, onEditSection, updateSection]);

  const DESKTOP_W = 1280;
  const PADDING = 32;

  let scale = 1;
  let width = "100%";
  let height = "100%";

  if (viewport === "desktop") {
    const availableW = Math.max(dims.w - PADDING * 2, 100);
    const availableH = Math.max(dims.h - PADDING * 2, 100);
    scale = Math.min(1, availableW / DESKTOP_W);
    width = `${DESKTOP_W}px`;
    height = `${availableH / scale}px`;
  } else if (viewport === "tablet") width = "768px";
  else if (viewport === "mobile") width = "375px";

  return (
    <div className="flex flex-col h-full w-full relative overflow-hidden">
      <div className="flex justify-center items-center gap-2 p-2 shrink-0 h-14 z-10 relative">
        <div className="flex items-center bg-background/80 backdrop-blur-md p-1 rounded-full border shadow-sm">
          <Button
            variant={viewport === "desktop" ? "secondary" : "ghost"}
            size="icon"
            className={cn(
              "h-8 w-8 rounded-full",
              viewport === "desktop" && "shadow-sm"
            )}
            onClick={() => setViewport("desktop")}
          >
            <Monitor size={16} />
          </Button>
          <Button
            variant={viewport === "tablet" ? "secondary" : "ghost"}
            size="icon"
            className={cn(
              "h-8 w-8 rounded-full",
              viewport === "tablet" && "shadow-sm"
            )}
            onClick={() => setViewport("tablet")}
          >
            <Tablet size={16} />
          </Button>
          <Button
            variant={viewport === "mobile" ? "secondary" : "ghost"}
            size="icon"
            className={cn(
              "h-8 w-8 rounded-full",
              viewport === "mobile" && "shadow-sm"
            )}
            onClick={() => setViewport("mobile")}
          >
            <Smartphone size={16} />
          </Button>
        </div>
        <div className="absolute right-4 text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
          Live Canvas
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-grow flex items-start justify-center overflow-y-auto custom-scrollbar pt-2 pb-12"
      >
        <div
          className="bg-background transition-all duration-300 overflow-hidden flex flex-col shrink-0"
          style={{
            width,
            height,
            transform: `scale(${scale})`,
            transformOrigin: "top center",
            borderRadius: viewport === "desktop" ? "0.75rem" : "2.5rem",
            border: viewport !== "desktop" ? "1px solid var(--border)" : "none",
            boxShadow:
              viewport === "desktop"
                ? "0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px var(--border)"
                : "0 35px 60px -15px rgba(0, 0, 0, 0.4)",
          }}
        >
          <iframe
            ref={iframeRef}
            src="/builder-preview"
            className="flex-grow w-full h-full border-0 bg-background custom-scrollbar"
            title="Live Preview Canvas"
            onLoad={sendDataToIframe}
          />
        </div>
      </div>
    </div>
  );
};

const PortfolioBuilderPage = () => {
  const { actorData } = useOutletContext<ActorDashboardContextType>();
  const { limits, siteSlots, isLoading: isSubLoading } = useSubscription();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activePortfolioIdParam = searchParams.get("id");
  const [isBrowsingThemes, setIsBrowsingThemes] = useState(false);

  const {
    sections,
    themeConfig,
    hasUnsavedChanges,
    past,
    future,
    setInitialState,
    addSection,
    removeSection,
    updateSection,
    reorderSections,
    updateThemeConfig,
    markSaved,
    undo,
    redo,
  } = useBuilderStore();

  const [activePortfolioId, setActivePortfolioId] = useState<string | null>(
    activePortfolioIdParam
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [editingSection, setEditingSection] = useState<PortfolioSection | null>(
    null
  );
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [tempLabel, setTempLabel] = useState("");

  // Create Site / Onboarding State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newSiteName, setNewSiteName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>(
    PORTFOLIO_TEMPLATES[0].id
  );

  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [siteIdentity, setSiteIdentity] = useState({
    name: "",
    slug: "",
    customDomain: "",
  });
  const [isSavingIdentity, setIsSavingIdentity] = useState(false);
  const [domainStatus, setDomainStatus] = useState<any>(null);
  const [isCheckingDomain, setIsCheckingDomain] = useState(false);
  const [activeDomain, setActiveDomain] = useState("");

  // Page Tracker
  const [activePageId, setActivePageId] = useState<string | "home">("home");
  const [lastLoadedPage, setLastLoadedPage] = useState<string | null>(null);

  const [isPageModalOpen, setIsPageModalOpen] = useState(false);
  const [newPageName, setNewPageName] = useState("");
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  const [isDeletingPage, setIsDeletingPage] = useState(false);
  const [isPurchasingTheme, setIsPurchasingTheme] = useState<string | null>(
    null
  );

  const handleTogglePublish = async (checked: boolean) => {
    if (!activePortfolioId) return;
    setIsPublished(checked);
    const { error } = await supabase
      .from("portfolios")
      .update({ is_published: checked, updated_at: new Date().toISOString() })
      .eq("id", activePortfolioId);
    if (error) setIsPublished(!checked);
  };

  const { data: actorWalletData, refetch: fetchActorWallet } = useQuery({
    queryKey: ["actorWallet", actorData?.id],
    queryFn: async () => {
      if (!actorData?.id) return null;
      const { data, error } = await supabase
        .from("actors")
        .select("purchased_themes")
        .eq("id", actorData.id)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!actorData?.id,
  });

  const globalOwnedThemes = actorWalletData?.purchased_themes || ["modern"];
  const walletBalance = actorData.wallet_balance || 0;

  // 🚀 FIX: Removed the unstable fallback = [] from the destructuring
  const { data: fetchedSiteList, refetch: fetchSiteList } = useQuery({
    queryKey: ["siteList", actorData?.id],
    queryFn: async () => {
      if (!actorData?.id) return [];
      const { data, error } = await supabase
        .from("portfolios")
        .select("id, site_name")
        .eq("actor_id", actorData.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!actorData?.id,
  });

  // Create a stable local variable directly from the cached query
  const siteList = fetchedSiteList || [];

  const { data: customPagesData, refetch: fetchCustomPages } = useQuery({
    queryKey: ["pro_pages", activePortfolioId],
    queryFn: async () => {
      if (!activePortfolioId) return [];
      const { data } = await supabase
        .from("pro_pages")
        .select("*")
        .eq("portfolio_id", activePortfolioId)
        .order("created_at", { ascending: true });
      return data || [];
    },
    enabled: !!activePortfolioId,
    refetchOnWindowFocus: false,
  });

  const customPages = customPagesData || [];

  const {
    data: fetchedPortfolio,
    isLoading: isPortfolioLoading,
    refetch: fetchPortfolio,
  } = useQuery({
    queryKey: ["portfolio", actorData?.id, activePortfolioIdParam],
    queryFn: async () => {
      if (!actorData?.id) return null;
      let query = supabase.from("portfolios").select("*");
      if (activePortfolioIdParam)
        query = query.eq("id", activePortfolioIdParam);
      else
        query = query
          .eq("actor_id", actorData.id)
          .order("created_at", { ascending: false })
          .limit(1);
      const { data, error } = await query.single();
      if (error && error.code !== "PGRST116") throw error;
      return data || null;
    },
    enabled: !!actorData?.id,
    refetchOnWindowFocus: false,
  });

  const siteOwnedThemes = fetchedPortfolio?.purchased_themes || [];
  const hasThemeAccess = (themeId: string) =>
    globalOwnedThemes.includes(themeId) || siteOwnedThemes.includes(themeId);

  // 🚀 FIX: BULLETPROOF STATE INITIALIZATION
  useEffect(() => {
    if (isPortfolioLoading || isSubLoading) return;

    if (fetchedPortfolio) {
      // Safe setters to avoid infinite renders
      setActivePortfolioId((prev) =>
        prev !== fetchedPortfolio.id ? fetchedPortfolio.id : prev
      );
      setIsPublished((prev) =>
        prev !== fetchedPortfolio.is_published
          ? fetchedPortfolio.is_published
          : prev
      );

      setSiteIdentity((prev) => {
        const newName = fetchedPortfolio.site_name || "";
        const newSlug = fetchedPortfolio.public_slug || "";
        const newDomain = fetchedPortfolio.custom_domain || "";
        if (
          prev.name === newName &&
          prev.slug === newSlug &&
          prev.customDomain === newDomain
        )
          return prev;
        return { name: newName, slug: newSlug, customDomain: newDomain };
      });

      const currentDomain = fetchedPortfolio.custom_domain || "";
      setActiveDomain((prev) =>
        prev !== currentDomain ? currentDomain : prev
      );
      if (!currentDomain) setDomainStatus(null);

      if (activePageId !== lastLoadedPage) {
        if (activePageId === "home") {
          setInitialState(fetchedPortfolio.sections || [], {
            ...fetchedPortfolio.theme_config,
            radius: fetchedPortfolio.theme_config?.radius ?? 0.5,
            buttonStyle: fetchedPortfolio.theme_config?.buttonStyle ?? "solid",
          });
        } else {
          const page = customPages.find((p) => p.id === activePageId);
          setInitialState(page?.sections || [], themeConfig);
        }
        setLastLoadedPage(activePageId);
      }
    } else {
      setActivePortfolioId(null);
      if (activePageId !== lastLoadedPage) {
        setInitialState(DEFAULT_PORTFOLIO_SECTIONS, {
          templateId: "modern",
          primaryColor: "violet",
          font: "sans",
          radius: 0.5,
          buttonStyle: "solid",
        });
        setLastLoadedPage(activePageId);
      }

      if (!isSubLoading && fetchedSiteList && fetchedSiteList.length === 0) {
        setShowOnboarding(true);
      }
    }
  }, [
    fetchedPortfolio,
    isPortfolioLoading,
    isSubLoading,
    activePageId,
    lastLoadedPage,
    customPagesData,
    fetchedSiteList,
  ]);

  const isLoading = isPortfolioLoading;

  // AUTO-SAVE ENGINE
  useEffect(() => {
    if (!hasUnsavedChanges || isLoading || !activePortfolioId) return;
    const autoSaveTimer = setTimeout(async () => {
      setIsSaving(true);
      if (activePageId === "home") {
        await supabase
          .from("portfolios")
          .update({
            sections: sections,
            theme_config: themeConfig,
            updated_at: new Date().toISOString(),
          })
          .eq("id", activePortfolioId);
      } else {
        await supabase
          .from("pro_pages")
          .update({ sections: sections })
          .eq("id", activePageId);
        await supabase
          .from("portfolios")
          .update({ theme_config: themeConfig })
          .eq("id", activePortfolioId);
      }
      markSaved();
      setIsSaving(false);
    }, 1500);
    return () => clearTimeout(autoSaveTimer);
  }, [
    sections,
    themeConfig,
    hasUnsavedChanges,
    isLoading,
    activePortfolioId,
    activePageId,
  ]);

  // KEYBOARD SHORTCUTS
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  // DOMAIN LOGIC
  const { data: polledDomainStatus, refetch: checkDomainStatus } = useQuery({
    queryKey: ["domainStatus", activeDomain],
    queryFn: async () => {
      const { data } = await supabase.functions.invoke("manage-domains", {
        body: { action: "check", domain: activeDomain },
      });
      return data;
    },
    enabled: !!activeDomain && isSettingsOpen,
    refetchInterval: (query) => {
      const status = query.state.data;
      if (status?.verified && status?.configured) return false;
      return 10000;
    },
  });

  useEffect(() => {
    if (polledDomainStatus) setDomainStatus(polledDomainStatus);
  }, [polledDomainStatus]);

  const handleSaveIdentity = async () => {
    if (!activePortfolioId) return;
    if (siteIdentity.customDomain && !limits?.canConnectDomain)
      return alert("Please upgrade to connect a domain.");
    setIsSavingIdentity(true);
    const cleanSlug = siteIdentity.slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-");
    const cleanDomain = siteIdentity.customDomain
      .trim()
      .replace(/^https?:\/\//, "");
    const { error } = await supabase
      .from("portfolios")
      .update({
        site_name: siteIdentity.name,
        public_slug: cleanSlug,
        custom_domain: cleanDomain || null,
      })
      .eq("id", activePortfolioId);

    if (error) alert("Error saving settings. The URL might be taken.");
    else {
      setSiteIdentity((prev) => ({
        ...prev,
        slug: cleanSlug,
        customDomain: cleanDomain,
      }));
      setActiveDomain(cleanDomain);
      setIsSettingsOpen(false);
    }
    setIsSavingIdentity(false);
  };

  const handleAddDomain = async () => {
    if (!siteIdentity.customDomain) return;
    const cleanDomain = siteIdentity.customDomain
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "")
      .toLowerCase();
    setIsCheckingDomain(true);
    const { data, error } = await supabase.functions.invoke("manage-domains", {
      body: {
        action: "add",
        domain: cleanDomain,
        portfolioId: activePortfolioId,
      },
    });
    if (error || data?.error)
      alert(`Could not add domain:\n${data?.error || error?.message}`);
    else {
      setSiteIdentity((prev) => ({ ...prev, customDomain: cleanDomain }));
      setActiveDomain(cleanDomain);
    }
    setIsCheckingDomain(false);
  };

  const handleRemoveDomain = async () => {
    if (!confirm("Remove this custom domain?")) return;
    setIsCheckingDomain(true);
    await supabase.functions.invoke("manage-domains", {
      body: {
        action: "remove",
        domain: activeDomain,
        portfolioId: activePortfolioId,
      },
    });
    setActiveDomain("");
    setSiteIdentity((prev) => ({ ...prev, customDomain: "" }));
    setDomainStatus(null);
    setIsCheckingDomain(false);
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination || result.source.index === result.destination.index)
      return;
    const items = Array.from(sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    reorderSections(items);
  };

  const handleAddSectionAction = (type: SectionType) => {
    if (sections.length >= (limits?.maxBlocksPerSite || 10))
      return alert(
        `Plan Limit Reached! You can only add ${limits?.maxBlocksPerSite} sections.`
      );
    addSection({
      id: `${type}_${crypto.randomUUID()}`,
      type: type,
      isVisible: true,
      data: {
        title:
          AVAILABLE_BLOCKS.find((b) => b.type === type)?.label || "New Section",
      },
    });
  };

  const handleManualSave = async () => {
    if (!activePortfolioId) return;
    setIsSaving(true);
    if (activePageId === "home") {
      await supabase
        .from("portfolios")
        .update({
          sections: sections,
          theme_config: themeConfig,
          is_published: isPublished,
          updated_at: new Date().toISOString(),
        })
        .eq("id", activePortfolioId);
    } else {
      await supabase
        .from("pro_pages")
        .update({ sections: sections })
        .eq("id", activePageId);
      await supabase
        .from("portfolios")
        .update({ theme_config: themeConfig })
        .eq("id", activePortfolioId);
    }
    markSaved();
    setIsSaving(false);
  };

  const handlePurchaseTheme = async (
    themeId: string,
    price: number,
    themeName: string,
    scope: "site" | "global"
  ) => {
    if (!actorData?.id || !activePortfolioId) return;
    if (walletBalance < price)
      return alert(
        `You need ${price} Coins, but you only have ${walletBalance}. Please top up!`
      );
    const scopeText =
      scope === "global" ? "all your sites forever" : "this specific site only";
    if (!confirm(`Unlock ${themeName} for ${scopeText} for ${price} Coins?`))
      return;
    setIsPurchasingTheme(`${themeId}-${scope}`);
    const { data, error } = await supabase.rpc("purchase_theme", {
      p_actor_id: actorData.id,
      p_theme_id: themeId,
      p_cost: price,
      p_scope: scope,
      p_portfolio_id: activePortfolioId,
    });
    setIsPurchasingTheme(null);
    if (error || (data && !data.success))
      alert(data?.message || error?.message || "Failed to purchase theme.");
    else {
      fetchActorWallet();
      fetchPortfolio();
    }
  };

  const handleCreateSite = async () => {
    if (!newSiteName.trim()) return alert("Please enter a site name");
    if (!limits || isSubLoading)
      return alert("Subscription data is still loading. Please wait a moment.");

    const maxSites = siteSlots?.total || 1;
    if (siteList.length >= maxSites) {
      alert(
        `Plan limit reached. You can only have ${maxSites} site(s) on your current plan.`
      );
      setIsCreateOpen(false);
      setShowOnboarding(false);
      return;
    }

    setIsCreating(true);
    try {
      const template =
        PORTFOLIO_TEMPLATES.find((t) => t.id === selectedTemplate) ||
        PORTFOLIO_TEMPLATES[0];
      const baseSlug = newSiteName.toLowerCase().replace(/[^a-z0-9]/g, "-");
      const uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
      const { data, error } = await supabase
        .from("portfolios")
        .insert({
          actor_id: actorData.id,
          site_name: newSiteName,
          public_slug: uniqueSlug,
          is_published: false,
          sections: template.sections,
          theme_config: {
            templateId: "modern",
            primaryColor: "violet",
            font: "sans",
            radius: 0.5,
            buttonStyle: "solid",
          },
        })
        .select()
        .single();

      if (error) throw error;

      setIsCreateOpen(false);
      setShowOnboarding(false);
      setNewSiteName("");
      await fetchSiteList();
      navigate(`/dashboard/portfolio?id=${data.id}`);
    } catch (error: any) {
      alert("Failed to create site: " + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreatePage = async () => {
    if (!activePortfolioId) return;
    if (!newPageName.trim()) return alert("Please enter a page name.");
    setIsCreatingPage(true);
    const cleanSlug = newPageName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    const { data, error } = await supabase
      .from("pro_pages")
      .insert({
        portfolio_id: activePortfolioId,
        title: newPageName.trim(),
        slug: cleanSlug,
        sections: [],
      })
      .select()
      .single();
    setIsCreatingPage(false);
    if (error) {
      if (error.code === "23505")
        alert(
          "A page with this name/URL already exists. Please choose a different name."
        );
      else alert("Failed to create page. Please try again.");
      return;
    }
    setIsPageModalOpen(false);
    setNewPageName("");
    await fetchCustomPages();
    setActivePageId(data.id);
  };

  const handleDeletePage = async () => {
    if (activePageId === "home") return;
    if (
      !confirm(
        "Are you sure you want to delete this page? This cannot be undone."
      )
    )
      return;
    setIsDeletingPage(true);
    const { error } = await supabase
      .from("pro_pages")
      .delete()
      .eq("id", activePageId);
    setIsDeletingPage(false);
    if (error) return alert("Failed to delete page.");
    setActivePageId("home");
    await fetchCustomPages();
  };

  const saveLabel = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (!renamingId) return;
    updateSection(renamingId, { data: { _label: tempLabel } });
    setRenamingId(null);
  };

  const activeCustomPage = customPages.find((p) => p.id === activePageId);
  const liveUrl =
    activePageId === "home"
      ? `/pro/${siteIdentity.slug || "portfolio"}`
      : `/pro/${siteIdentity.slug || "portfolio"}/${
          activeCustomPage?.slug || ""
        }`;

  if (isLoading || isSubLoading)
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );

  // EMPTY STATE IF NO PORTFOLIO EXISTS (AND ONBOARDING WAS CLOSED)
  if (!activePortfolioId && !showOnboarding) {
    return (
      <div className="p-4 md:p-8 flex flex-col items-center justify-center min-h-[70vh] w-full text-center">
        <div className="bg-primary/10 p-6 rounded-full mb-6 text-primary border border-primary/20">
          <Globe className="w-16 h-16" />
        </div>
        <h2 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">
          No Websites Found
        </h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          You haven't created any websites yet. Click the button below to launch
          the builder and create your first portfolio.
        </p>
        <Button
          size="lg"
          className="h-12 px-8 font-bold rounded-xl"
          onClick={() => setShowOnboarding(true)}
        >
          <Plus className="w-5 h-5 mr-2" /> Create Your First Site
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 w-full max-w-8xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
      {/* Header / Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div className="flex items-end gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Editing Site
            </span>
            <Select
              value={activePortfolioId || ""}
              onValueChange={(val) =>
                val === "new"
                  ? setIsCreateOpen(true)
                  : navigate(`/dashboard/portfolio?id=${val}`)
              }
            >
              <SelectTrigger className="h-9 border-0 p-0 shadow-none text-2xl md:text-3xl font-bold tracking-tight bg-transparent focus:ring-0 w-auto min-w-[200px] justify-start gap-2">
                <SelectValue placeholder="Select Site">
                  {siteList.find((s) => s.id === activePortfolioId)
                    ?.site_name ||
                    siteIdentity.name ||
                    "Untitled Site"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {siteList.map((site) => (
                  <SelectItem
                    key={site.id}
                    value={site.id}
                    className="font-medium cursor-pointer"
                  >
                    {site.site_name || "Untitled Site"}
                  </SelectItem>
                ))}
                <SelectItem
                  value="new"
                  className="text-muted-foreground italic border-t mt-1 pt-2"
                >
                  + Create New Site...
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {activePortfolioId && (
            <div className="flex flex-col gap-1 border-l pl-4">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Editing Page
              </span>
              <div className="flex items-center gap-2">
                <Select
                  value={activePageId}
                  onValueChange={(val) => {
                    if (val === "new") setIsPageModalOpen(true);
                    else setActivePageId(val);
                  }}
                >
                  <SelectTrigger className="h-9 border-0 p-0 shadow-none text-xl font-bold tracking-tight bg-transparent focus:ring-0 w-auto min-w-[150px] justify-start gap-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home" className="font-medium">
                      Home Page
                    </SelectItem>
                    {customPages.map((page) => (
                      <SelectItem
                        key={page.id}
                        value={page.id}
                        className="font-medium"
                      >
                        {page.title} (/{page.slug})
                      </SelectItem>
                    ))}
                    <SelectItem
                      value="new"
                      className="text-primary italic border-t mt-1 pt-2"
                    >
                      + Add New Page...
                    </SelectItem>
                  </SelectContent>
                </Select>

                {activePageId !== "home" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDeletePage}
                    disabled={isDeletingPage}
                    className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                    title="Delete Page"
                  >
                    {isDeletingPage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1 border-r pr-3 mr-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={undo}
              disabled={past.length === 0}
              title="Undo (Cmd+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={redo}
              disabled={future.length === 0}
              title="Redo (Cmd+Shift+Z)"
            >
              <Redo2 className="w-4 h-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSettingsOpen(true)}
            className="gap-2"
          >
            <Settings className="w-4 h-4" />{" "}
            <span className="hidden sm:inline">Site Settings</span>
          </Button>

          <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg border">
            <span className="text-xs font-medium uppercase text-muted-foreground">
              Published
            </span>
            <Switch
              checked={isPublished}
              onCheckedChange={handleTogglePublish}
            />
          </div>

          <div className="flex items-center gap-2 ml-auto sm:ml-0">
            {isPublished && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="px-2 sm:px-4"
              >
                <a
                  href={liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  title="View Live Page"
                >
                  <ExternalLink className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Live</span>
                </a>
              </Button>
            )}

            <Button
              onClick={handleManualSave}
              disabled={isSaving}
              size="sm"
              className={cn(
                "min-w-[100px] transition-all",
                hasUnsavedChanges
                  ? "bg-amber-500 hover:bg-amber-600 text-white"
                  : ""
              )}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : hasUnsavedChanges ? (
                <CloudOff className="w-4 h-4 mr-2" />
              ) : (
                <Cloud className="w-4 h-4 mr-2" />
              )}
              {isSaving ? "Saving..." : hasUnsavedChanges ? "Save" : "Saved"}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 flex-grow overflow-hidden min-h-0 relative pb-2">
        <div className="lg:col-span-1 flex flex-col h-full min-h-0 overflow-hidden pr-1">
          <Tabs defaultValue="content" className="flex flex-col h-full min-h-0">
            <TabsList className="w-full grid grid-cols-3 lg:grid-cols-2 shrink-0 rounded-xl bg-muted/40 p-1 h-12 mb-4">
              <TabsTrigger
                value="content"
                className="h-full rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary"
              >
                <Layers className="w-4 h-4 mr-2 hidden sm:block" /> Content
              </TabsTrigger>
              <TabsTrigger
                value="design"
                className="h-full rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary"
              >
                <Palette className="w-4 h-4 mr-2 hidden sm:block" /> Design
              </TabsTrigger>
              <TabsTrigger
                value="preview"
                className="lg:hidden h-full rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary"
              >
                <Smartphone className="w-4 h-4 mr-2" /> Preview
              </TabsTrigger>
            </TabsList>

            {/* CONTENT TAB */}
            <TabsContent
              value="content"
              className="flex-grow flex flex-col overflow-hidden mt-0 data-[state=inactive]:hidden"
            >
              {editingSection ? (
                <div className="flex flex-col h-full w-full animate-in slide-in-from-right-4 duration-200">
                  <div className="pb-3 mb-2 border-b flex items-center justify-between shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingSection(null)}
                      className="h-8 px-3 rounded-full"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
                    </Button>
                    <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground mr-2 truncate">
                      {editingSection.data._label ||
                        editingSection.type.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex-grow overflow-y-auto custom-scrollbar p-0 pb-12">
                    <SectionEditor
                      sections={sections}
                      section={editingSection}
                      isOpen={true}
                      onClose={() => setEditingSection(null)}
                      actorId={actorData?.id || ""}
                      themeId={themeConfig.templateId || "modern"}
                      isInline={true}
                      pages={customPages}
                      portfolioId={activePortfolioId || ""}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-grow overflow-y-auto min-h-[400px] lg:min-h-0 custom-scrollbar animate-in slide-in-from-left-4 duration-200 p-4 pt-2">
                    <div className="mb-4 flex justify-between items-center text-xs font-bold text-muted-foreground uppercase tracking-wider sticky top-0 bg-card z-10 py-2">
                      <span className="flex items-center gap-2">
                        Sections: {sections.length} /{" "}
                        {limits?.maxBlocksPerSite || 10}
                        {sections.length >=
                          (limits?.maxBlocksPerSite || 10) && (
                          <span className="text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded">
                            Limit Reached
                          </span>
                        )}
                      </span>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            className="h-7 px-3 rounded-full text-[10px] tracking-wider shadow-sm transition-all hover:scale-105"
                          >
                            <Plus className="w-3 h-3 mr-1" /> Add Block
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          className="w-72 max-h-[400px] overflow-y-auto rounded-2xl p-3 shadow-xl [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [&::-webkit-scrollbar-thumb]:rounded-full"
                          align="end"
                          sideOffset={10}
                        >
                          <div className="text-xs font-black text-muted-foreground uppercase tracking-wider mb-3 px-1">
                            Block Library
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {AVAILABLE_BLOCKS.map((block) => {
                              const isLocked =
                                block.module && !limits?.modules[block.module];
                              const Icon = block.icon;
                              return (
                                <DropdownMenuItem
                                  key={block.type}
                                  disabled={isLocked}
                                  onClick={() =>
                                    !isLocked &&
                                    handleAddSectionAction(block.type)
                                  }
                                  className={cn(
                                    "flex flex-col items-center justify-center gap-2 p-3 h-20 cursor-pointer rounded-xl text-center transition-all bg-muted/30 border border-border/50",
                                    isLocked
                                      ? "opacity-50 cursor-not-allowed"
                                      : "hover:bg-primary/5 hover:text-primary hover:border-primary/30"
                                  )}
                                >
                                  <Icon className="w-6 h-6 mb-0.5 opacity-80" />
                                  <span className="text-[9px] font-bold leading-tight tracking-wide">
                                    {block.label}
                                  </span>
                                  {isLocked && (
                                    <Lock className="absolute top-1.5 right-1.5 h-3 w-3 text-amber-500" />
                                  )}
                                </DropdownMenuItem>
                              );
                            })}
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <DragDropContext onDragEnd={handleDragEnd}>
                      <Droppable droppableId="sections">
                        {(provided) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="space-y-3 pb-24"
                          >
                            {sections.map((section, index) => (
                              <Draggable
                                key={section.id}
                                draggableId={section.id}
                                index={index}
                              >
                                {(provided, snapshot) => (
                                  <Card
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={cn(
                                      "border-l-4 transition-all cursor-pointer group active:scale-[0.99] border-y-0 border-r-0 rounded-xl",
                                      section.isVisible
                                        ? "border-l-primary shadow-sm bg-background"
                                        : "border-l-muted opacity-60 bg-muted/40",
                                      snapshot.isDragging &&
                                        "shadow-2xl scale-105 rotate-2 opacity-95 z-50 ring-1 ring-border"
                                    )}
                                    onClick={() => {
                                      if (!renamingId)
                                        setEditingSection(section);
                                    }}
                                  >
                                    <CardContent className="p-3 sm:p-4 flex items-center gap-3">
                                      <div
                                        {...provided.dragHandleProps}
                                        className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-foreground p-1 transition-colors"
                                      >
                                        <GripVertical size={20} />
                                      </div>
                                      {renamingId === section.id ? (
                                        <div
                                          className="flex-grow flex items-center gap-2"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <Input
                                            value={tempLabel}
                                            onChange={(e) =>
                                              setTempLabel(e.target.value)
                                            }
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter")
                                                saveLabel(e);
                                            }}
                                            autoFocus
                                            className="h-8 text-sm border-primary/50"
                                          />
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-green-500 hover:bg-green-500/10"
                                            onClick={saveLabel}
                                          >
                                            <Check size={16} />
                                          </Button>
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-muted-foreground"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setRenamingId(null);
                                            }}
                                          >
                                            <X size={16} />
                                          </Button>
                                        </div>
                                      ) : (
                                        <div
                                          className="flex-grow min-w-0"
                                          onDoubleClick={(e) => {
                                            e.stopPropagation();
                                            setRenamingId(section.id);
                                            setTempLabel(
                                              section.data._label ||
                                                section.type.replace("_", " ")
                                            );
                                          }}
                                        >
                                          <div className="flex items-center gap-2">
                                            <p className="font-semibold text-sm capitalize select-none truncate">
                                              {section.data._label ||
                                                section.type.replace("_", " ")}
                                            </p>
                                          </div>
                                          {section.data.title &&
                                            section.data.title !==
                                              section.data._label && (
                                              <p className="text-xs text-muted-foreground truncate max-w-[150px] mt-0.5">
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
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setRenamingId(section.id);
                                            setTempLabel(
                                              section.data._label ||
                                                section.type.replace("_", " ")
                                            );
                                          }}
                                        >
                                          <Pencil size={16} />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            updateSection(section.id, {
                                              isVisible: !section.isVisible,
                                            });
                                          }}
                                        >
                                          {section.isVisible ? (
                                            <Eye size={18} />
                                          ) : (
                                            <EyeOff size={18} />
                                          )}
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm("Remove section?"))
                                              removeSection(section.id);
                                          }}
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
                </>
              )}
            </TabsContent>

            {/* DESIGN TAB */}
            <TabsContent
              value="design"
              className="flex-grow flex flex-col overflow-hidden mt-0 data-[state=inactive]:hidden"
            >
              {isBrowsingThemes ? (
                <div className="flex flex-col h-full w-full animate-in slide-in-from-right-4 duration-200">
                  <div className="pb-3 mb-2 border-b flex items-center justify-between shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsBrowsingThemes(false)}
                      className="h-8 px-3 rounded-full"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
                    </Button>
                    <span className="font-bold text-xs uppercase tracking-wider text-primary mr-2 flex items-center">
                      <ShoppingBag size={12} className="mr-1" /> Theme Store
                    </span>
                  </div>
                  <div className="flex-grow overflow-y-auto pb-12 space-y-4 custom-scrollbar">
                    {VISUAL_THEMES.map((theme) => {
                      const isOwned = hasThemeAccess(theme.id);
                      const isPreviewing = themeConfig.templateId === theme.id;
                      return (
                        <Card
                          key={theme.id}
                          className={cn(
                            "overflow-hidden border-2 transition-all rounded-2xl",
                            isPreviewing
                              ? "border-primary shadow-md"
                              : "hover:border-primary/30"
                          )}
                        >
                          <div
                            className="h-32 w-full relative"
                            style={{ backgroundColor: theme.previewColor }}
                          >
                            {isOwned && (
                              <Badge className="absolute top-3 right-3 bg-green-500 border-none">
                                Owned
                              </Badge>
                            )}
                          </div>
                          <CardContent className="p-5">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-bold text-lg leading-tight">
                                  {theme.name}
                                </h4>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {theme.description}
                                </p>
                              </div>
                              {!isOwned && (
                                <div className="flex flex-col items-end gap-1">
                                  <div className="flex items-center gap-1 font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 text-[10px] whitespace-nowrap">
                                    <Coins size={10} /> {theme.sitePrice} / Site
                                  </div>
                                  <div className="flex items-center gap-1 font-black text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20 text-[10px] whitespace-nowrap">
                                    <Coins size={10} /> {theme.globalPrice} /
                                    Global
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col gap-2 mt-4">
                              <Button
                                variant={
                                  isPreviewing && isOwned
                                    ? "default"
                                    : isOwned
                                    ? "outline"
                                    : isPreviewing
                                    ? "secondary"
                                    : "outline"
                                }
                                className={cn(
                                  "w-full transition-all rounded-xl",
                                  isPreviewing &&
                                    isOwned &&
                                    "bg-green-600 hover:bg-green-700 text-white"
                                )}
                                onClick={() =>
                                  updateThemeConfig({ templateId: theme.id })
                                }
                                disabled={isPreviewing && isOwned}
                              >
                                {isPreviewing && isOwned ? (
                                  <>
                                    <CheckCircle2 size={16} className="mr-2" />{" "}
                                    Active Theme
                                  </>
                                ) : isOwned ? (
                                  <>
                                    <LayoutTemplate
                                      size={16}
                                      className="mr-2"
                                    />{" "}
                                    Activate Theme
                                  </>
                                ) : isPreviewing ? (
                                  <>
                                    <Eye size={16} className="mr-2" />{" "}
                                    Previewing...
                                  </>
                                ) : (
                                  <>
                                    <Eye
                                      size={16}
                                      className="mr-2 text-muted-foreground"
                                    />{" "}
                                    Preview in Canvas
                                  </>
                                )}
                              </Button>
                              {!isOwned && (
                                <div className="flex gap-2 w-full mt-2 border-t pt-3">
                                  <Button
                                    className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-sm flex-1 text-xs h-10 font-bold"
                                    onClick={() =>
                                      handlePurchaseTheme(
                                        theme.id,
                                        theme.sitePrice,
                                        theme.name,
                                        "site"
                                      )
                                    }
                                    disabled={!!isPurchasingTheme}
                                  >
                                    {isPurchasingTheme ===
                                    `${theme.id}-site` ? (
                                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                    ) : null}{" "}
                                    1 Site ({theme.sitePrice})
                                  </Button>
                                  <Button
                                    className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-sm flex-1 text-xs h-10 font-bold"
                                    onClick={() =>
                                      handlePurchaseTheme(
                                        theme.id,
                                        theme.globalPrice,
                                        theme.name,
                                        "global"
                                      )
                                    }
                                    disabled={!!isPurchasingTheme}
                                  >
                                    {isPurchasingTheme ===
                                    `${theme.id}-global` ? (
                                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                    ) : null}{" "}
                                    All Sites ({theme.globalPrice})
                                  </Button>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex-grow overflow-y-auto pb-12 space-y-8 custom-scrollbar animate-in slide-in-from-left-4 duration-200">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Active Theme
                      </Label>
                    </div>
                    <div className="border border-border bg-background rounded-2xl p-3 flex items-center gap-4 relative overflow-hidden shadow-sm">
                      <div className="w-12 h-12 rounded-xl border border-primary/20 bg-primary/10 flex items-center justify-center shrink-0">
                        <LayoutTemplate className="text-primary" />
                      </div>
                      <div className="flex-grow">
                        <h4 className="font-bold text-sm">
                          {VISUAL_THEMES.find(
                            (t) => t.id === themeConfig.templateId
                          )?.name || "Modern Minimal"}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Currently applied to your site.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setIsBrowsingThemes(true)}
                        className="rounded-full"
                      >
                        Change
                      </Button>
                    </div>
                    {!hasThemeAccess(themeConfig.templateId) &&
                      (() => {
                        const activePremiumTheme = VISUAL_THEMES.find(
                          (t) => t.id === themeConfig.templateId
                        );
                        if (!activePremiumTheme) return null;
                        return (
                          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex flex-col gap-3 animate-in fade-in mt-4">
                            <div className="flex items-center gap-2 text-amber-800 text-sm font-bold">
                              <Eye size={16} className="text-amber-600" />{" "}
                              Previewing Premium Theme
                            </div>
                            <p className="text-xs text-amber-700/80 leading-relaxed">
                              You must unlock this theme to save your changes to
                              the live site.
                            </p>
                            <div className="grid grid-cols-2 gap-2 mt-1">
                              <Button
                                size="sm"
                                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] h-9 rounded-xl"
                                onClick={() =>
                                  handlePurchaseTheme(
                                    activePremiumTheme.id,
                                    activePremiumTheme.sitePrice,
                                    activePremiumTheme.name,
                                    "site"
                                  )
                                }
                                disabled={!!isPurchasingTheme}
                              >
                                {isPurchasingTheme ===
                                `${activePremiumTheme.id}-site` ? (
                                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                ) : null}{" "}
                                This Site ({activePremiumTheme.sitePrice})
                              </Button>
                              <Button
                                size="sm"
                                className="w-full bg-primary hover:bg-primary/90 text-white font-bold text-[10px] h-9 rounded-xl"
                                onClick={() =>
                                  handlePurchaseTheme(
                                    activePremiumTheme.id,
                                    activePremiumTheme.globalPrice,
                                    activePremiumTheme.name,
                                    "global"
                                  )
                                }
                                disabled={!!isPurchasingTheme}
                              >
                                {isPurchasingTheme ===
                                `${activePremiumTheme.id}-global` ? (
                                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                ) : null}{" "}
                                All Sites ({activePremiumTheme.globalPrice})
                              </Button>
                            </div>
                          </div>
                        );
                      })()}
                    <div className="pt-6 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        <PaintBucket size={14} /> Brand Color
                      </div>
                      <div className="flex items-center gap-4 bg-background p-4 rounded-2xl border shadow-sm">
                        <div
                          className="relative w-12 h-12 rounded-full overflow-hidden border-2 shadow-sm shrink-0 cursor-pointer"
                          style={{
                            borderColor: themeConfig.primaryColor || "#8b5cf6",
                          }}
                        >
                          <input
                            type="color"
                            value={themeConfig.primaryColor || "#8b5cf6"}
                            onChange={(e) =>
                              updateThemeConfig({
                                primaryColor: e.target.value,
                              })
                            }
                            className="absolute -top-4 -left-4 w-20 h-20 cursor-pointer"
                          />
                        </div>
                        <div className="flex-grow">
                          <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1 block">
                            Hex Code
                          </Label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-muted-foreground font-bold">
                              #
                            </span>
                            <Input
                              value={(
                                themeConfig.primaryColor || "8b5cf6"
                              ).replace("#", "")}
                              onChange={(e) =>
                                updateThemeConfig({
                                  primaryColor: `#${e.target.value}`,
                                })
                              }
                              className="pl-7 font-mono uppercase font-bold h-10 rounded-xl bg-muted/50 border-transparent focus-visible:border-primary"
                              maxLength={7}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="pt-6 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        <Type size={14} /> Typography
                      </div>
                      <Select
                        value={themeConfig.font}
                        onValueChange={(val) =>
                          updateThemeConfig({ font: val })
                        }
                      >
                        <SelectTrigger className="h-12 bg-background rounded-2xl shadow-sm border border-border">
                          <SelectValue placeholder="Select a font" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {LOCAL_FONT_OPTIONS.map((font) => (
                            <SelectItem
                              key={font.id}
                              value={font.id}
                              className="py-2.5 font-medium"
                            >
                              {font.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-5 pt-8 border-t">
                      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        <ComponentIcon size={14} /> Interface
                      </div>
                      <div className="space-y-4 bg-background p-4 rounded-2xl border shadow-sm">
                        <div className="flex justify-between text-xs font-bold text-foreground">
                          <span className="flex items-center gap-1.5">
                            <Square
                              size={14}
                              className="text-muted-foreground"
                            />{" "}
                            Sharp
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Circle
                              size={14}
                              className="text-muted-foreground"
                            />{" "}
                            Round
                          </span>
                        </div>
                        <Slider
                          defaultValue={[0.5]}
                          max={1}
                          step={0.1}
                          value={[
                            themeConfig.radius !== undefined
                              ? themeConfig.radius
                              : 0.5,
                          ]}
                          onValueChange={(val) =>
                            updateThemeConfig({ radius: val[0] })
                          }
                          className="py-2"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                          Button Style
                        </Label>
                        <ToggleGroup
                          type="single"
                          value={themeConfig.buttonStyle || "solid"}
                          onValueChange={(val) =>
                            val && updateThemeConfig({ buttonStyle: val })
                          }
                          className="justify-start gap-2 bg-background p-1.5 rounded-2xl border shadow-sm w-max"
                        >
                          <ToggleGroupItem
                            value="solid"
                            className="rounded-xl px-5 py-2 h-10 font-bold data-[state=on]:bg-primary data-[state=on]:text-white transition-all"
                          >
                            Solid
                          </ToggleGroupItem>
                          <ToggleGroupItem
                            value="outline"
                            className="rounded-xl px-5 py-2 h-10 font-bold border-transparent data-[state=on]:border-primary data-[state=on]:bg-primary/5 data-[state=on]:text-primary transition-all"
                          >
                            Outline
                          </ToggleGroupItem>
                          <ToggleGroupItem
                            value="shadow"
                            className="rounded-xl px-5 py-2 h-10 font-bold shadow-sm data-[state=on]:ring-2 ring-primary data-[state=on]:shadow-md transition-all"
                          >
                            Retro
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* PREVIEW TAB (MOBILE DEVICES ONLY) */}
            <TabsContent
              value="preview"
              className="lg:hidden flex-grow flex flex-col mt-0 h-[70vh] data-[state=inactive]:hidden"
            >
              <IframePreview
                sections={sections}
                theme={themeConfig}
                actorId={actorData?.id || ""}
                onEditSection={setEditingSection}
                updateSection={updateSection}
                activePageId={activePageId}
                globalSections={fetchedPortfolio?.sections || []}
                customPages={customPages}
                publicSlug={siteIdentity.slug}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* RIGHT COLUMN: Desktop Live Preview Canvas */}
        <div className="lg:col-span-2 hidden lg:flex flex-col h-full min-h-0 relative">
          <IframePreview
            sections={sections}
            theme={themeConfig}
            actorId={actorData?.id || ""}
            onEditSection={setEditingSection}
            updateSection={updateSection}
            activePageId={activePageId}
            globalSections={fetchedPortfolio?.sections || []}
            customPages={customPages}
            publicSlug={siteIdentity.slug}
          />
        </div>
      </div>

      {/* --- CREATE NEW PAGE MODAL --- */}
      <Dialog open={isPageModalOpen} onOpenChange={setIsPageModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Page</DialogTitle>
            <DialogDescription>
              Add a new custom page to your website.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Page Name</Label>
              <Input
                placeholder="e.g. Tour Dates"
                value={newPageName}
                onChange={(e) => setNewPageName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreatePage();
                }}
                autoFocus
              />
              {newPageName && (
                <p className="text-xs text-muted-foreground mt-2">
                  URL will be:{" "}
                  <span className="font-mono text-primary">
                    /pro/{siteIdentity.slug || "username"}/
                    {newPageName
                      .toLowerCase()
                      .replace(/[^a-z0-9]/g, "-")
                      .replace(/-+/g, "-")
                      .replace(/^-|-$/g, "")}
                  </span>
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPageModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePage} disabled={isCreatingPage}>
              {isCreatingPage && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}{" "}
              Create Page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- SITE SETTINGS MODAL --- */}
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
            <TabsContent value="general" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Site Name</Label>
                <Input
                  value={siteIdentity.name}
                  onChange={(e) =>
                    setSiteIdentity((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="e.g. My Portfolio"
                />
              </div>
              <div className="space-y-2">
                <Label>Portfolio URL</Label>
                <div className="flex items-center">
                  <span className="text-sm text-muted-foreground bg-muted h-10 px-3 flex items-center rounded-l-md border border-r-0 border-input shrink-0">
                    {window.location.host}/pro/
                  </span>
                  <Input
                    value={siteIdentity.slug}
                    onChange={(e) =>
                      setSiteIdentity((prev) => ({
                        ...prev,
                        slug: e.target.value,
                      }))
                    }
                    className="rounded-l-none"
                    placeholder="username"
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="domains" className="space-y-4 py-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Custom Domain</Label>
                  {!limits?.canConnectDomain && (
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
                        onChange={(e) =>
                          setSiteIdentity((prev) => ({
                            ...prev,
                            customDomain: e.target.value,
                          }))
                        }
                        className="pl-9"
                        placeholder={
                          limits?.canConnectDomain
                            ? "example.com"
                            : "Upgrade to connect"
                        }
                        disabled={!limits?.canConnectDomain}
                      />
                    </div>
                    <Button
                      onClick={handleAddDomain}
                      disabled={
                        !siteIdentity.customDomain ||
                        isCheckingDomain ||
                        !limits?.canConnectDomain
                      }
                    >
                      {isCheckingDomain ? (
                        <Loader2 className="animate-spin h-4 w-4" />
                      ) : (
                        "Connect"
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="bg-muted/30 border rounded-xl p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {domainStatus?.verified && domainStatus?.configured ? (
                          <CheckCircle2 className="text-green-500 h-5 w-5" />
                        ) : (
                          <Loader2 className="text-amber-500 h-5 w-5 animate-spin" />
                        )}
                        <span className="font-bold text-lg">
                          {activeDomain}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-600 h-8"
                        onClick={handleRemoveDomain}
                      >
                        Disconnect
                      </Button>
                    </div>
                    {(!domainStatus?.verified || !domainStatus?.configured) && (
                      <div className="space-y-3 text-sm">
                        <div className="p-3 bg-background border rounded-lg space-y-3">
                          <div className="flex items-start gap-2">
                            <div className="p-1 bg-blue-100 text-blue-600 rounded mt-0.5">
                              <Zap size={12} fill="currentColor" />
                            </div>
                            <div className="space-y-1">
                              <p className="font-semibold text-xs uppercase text-muted-foreground">
                                Configuration Required
                              </p>
                              {!domainStatus?.verified ? (
                                <p className="text-amber-600 font-bold text-xs">
                                  Domain Ownership Not Verified
                                </p>
                              ) : (
                                <p className="text-amber-600 font-bold text-xs">
                                  Ownership Verified •{" "}
                                  <span className="underline">
                                    Waiting for DNS Record
                                  </span>
                                </p>
                              )}
                              <p className="text-muted-foreground text-xs">
                                Log in to your domain provider and add these{" "}
                                <strong>2 records</strong>:
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-[0.5fr_1fr_2fr] gap-2 font-mono text-xs items-center bg-muted/50 p-2 rounded">
                            <div className="bg-white border px-1.5 py-0.5 rounded text-center font-bold">
                              A
                            </div>
                            <div className="text-muted-foreground">@</div>
                            <div
                              className="text-right select-all cursor-pointer font-medium"
                              onClick={() =>
                                navigator.clipboard.writeText("76.76.21.21")
                              }
                            >
                              76.76.21.21
                            </div>
                          </div>
                          <div className="grid grid-cols-[0.5fr_1fr_2fr] gap-2 font-mono text-xs items-center bg-muted/50 p-2 rounded">
                            <div className="bg-white border px-1.5 py-0.5 rounded text-center font-bold">
                              CNAME
                            </div>
                            <div className="text-muted-foreground">www</div>
                            <div
                              className="text-right select-all cursor-pointer font-medium"
                              onClick={() =>
                                navigator.clipboard.writeText(
                                  "cname.vercel-dns.com"
                                )
                              }
                            >
                              cname.vercel-dns.com
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full gap-2"
                          onClick={() => checkDomainStatus()}
                          disabled={isCheckingDomain}
                        >
                          {isCheckingDomain ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3 w-3" />
                          )}{" "}
                          Refresh Status
                        </Button>
                      </div>
                    )}
                    {domainStatus?.verified && domainStatus?.configured && (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                          <CheckCircle2 size={16} />
                          <span className="font-medium">
                            Domain Active & SSL Secured
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground px-1">
                          Your site is live at{" "}
                          <a
                            href={`https://${activeDomain}`}
                            target="_blank"
                            rel="noreferrer"
                            className="underline font-bold text-primary"
                          >
                            https://{activeDomain}
                          </a>
                        </p>
                      </div>
                    )}
                  </div>
                )}
                {!limits?.canConnectDomain && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 mt-2"
                    onClick={() => navigate("/dashboard/settings")}
                  >
                    Upgrade Plan to Connect Domain
                  </Button>
                )}
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveIdentity} disabled={isSavingIdentity}>
              {isSavingIdentity && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}{" "}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- CREATE NEW SITE (OR FROM ONBOARDING) MODAL --- */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Website</DialogTitle>
            <DialogDescription>
              Choose a starting template for your new portfolio.
            </DialogDescription>
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
                      selectedTemplate === template.id
                        ? "border-primary bg-primary/5"
                        : "border-muted"
                    )}
                  >
                    {selectedTemplate === template.id && (
                      <div className="absolute top-2 right-2 text-primary bg-background rounded-full">
                        <CheckCircle2 size={16} />
                      </div>
                    )}
                    <h4 className="font-bold text-sm">{template.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {template.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateSite}
              disabled={isCreating || isSubLoading || !limits}
            >
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{" "}
              {isSubLoading ? "Loading Plan..." : "Create Website"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🚀 AAA+ ONBOARDING MODAL */}
      <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
        <DialogContent className="sm:max-w-[850px] p-0 overflow-hidden bg-background border-border shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="bg-gradient-to-br from-primary/80 to-blue-600 p-10 flex flex-col justify-between text-white relative overflow-hidden">
              <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>

              <div className="relative z-10">
                <Sparkles className="w-12 h-12 mb-6 text-white/90" />
                <h2 className="text-4xl font-black mb-3 tracking-tight leading-tight">
                  Welcome to the Builder
                </h2>
                <p className="text-white/80 font-medium leading-relaxed text-lg">
                  Launch a stunning portfolio, set up your shop, and take
                  bookings in minutes. No coding required.
                </p>
              </div>
              <div className="mt-12 space-y-4 relative z-10">
                <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                  <MonitorPlay className="w-6 h-6 text-white" />
                  <span className="text-base font-bold">
                    1. Choose a template
                  </span>
                </div>
                <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                  <Palette className="w-6 h-6 text-white" />
                  <span className="text-base font-bold">
                    2. Customize your brand
                  </span>
                </div>
                <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                  <Globe className="w-6 h-6 text-white" />
                  <span className="text-base font-bold">
                    3. Publish to the world
                  </span>
                </div>
              </div>
            </div>

            <div className="p-8 md:p-10 bg-background flex flex-col justify-center">
              <h3 className="text-2xl font-extrabold mb-8 flex items-center gap-2 text-foreground">
                Let's get started{" "}
                <ArrowRight className="w-6 h-6 text-primary" />
              </h3>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-muted-foreground font-bold uppercase tracking-wider text-xs">
                    Website Name
                  </Label>
                  <Input
                    placeholder="e.g. My Creative Portfolio"
                    value={newSiteName}
                    onChange={(e) => setNewSiteName(e.target.value)}
                    className="h-12 text-lg font-medium bg-muted/50 border-transparent focus-visible:border-primary focus-visible:bg-background transition-colors"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-muted-foreground font-bold uppercase tracking-wider text-xs">
                    Select Template
                  </Label>
                  <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {PORTFOLIO_TEMPLATES.map((template) => (
                      <div
                        key={template.id}
                        onClick={() => setSelectedTemplate(template.id)}
                        className={cn(
                          "cursor-pointer border-2 rounded-xl p-4 transition-all hover:border-primary/50 relative bg-muted/20",
                          selectedTemplate === template.id
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-muted"
                        )}
                      >
                        {selectedTemplate === template.id && (
                          <div className="absolute top-1/2 -translate-y-1/2 right-4 text-primary bg-background rounded-full">
                            <CheckCircle2 size={20} />
                          </div>
                        )}
                        <h4 className="font-bold text-sm text-foreground">
                          {template.name}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1 pr-6">
                          {template.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                <Button
                  onClick={handleCreateSite}
                  disabled={isCreating || isSubLoading || !limits}
                  className="w-full h-14 text-lg font-bold mt-4 shadow-lg hover:shadow-xl transition-all"
                >
                  {isCreating ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-5 w-5" />
                  )}
                  {isSubLoading ? "Loading Plan..." : "Create My Website"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PortfolioBuilderPage;
