import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import {
  Outlet,
  Link,
  NavLink,
  useNavigate,
  useLocation,
  useParams,
} from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  ListOrdered,
  User,
  Music,
  AudioLines,
  Settings,
  LogOut,
  MessageSquare,
  Menu,
  DollarSign,
  ChevronRight,
  LayoutTemplate,
  BarChart3,
  Globe,
  Briefcase,
  Package,
  Mail,
  Sparkles,
  Lock,
  ShoppingBag,
  Layers,
  CreditCard,
  PanelLeftClose,
  PanelLeftOpen,
  Bell,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { SubscriptionProvider } from "../context/SubscriptionContext";
import ThemeToggle from "../components/ThemeToggle"; // 🚀 1. IMPORTED HERE

export interface ActorDashboardContextType {
  actorData: Partial<Actor>;
  role: string;
}

// --- 1. Interface ---
interface Actor {
  id: string;
  ActorName: string;
  HeadshotURL?: string;
  is_p2p_enabled?: boolean;
}

// --- 2. Nav Group Configuration ---
type NavItem = {
  to: string;
  name: string;
  icon: React.ElementType;
  description?: string;
};

type NavGroup = {
  label: string;
  items: NavItem[];
  p2pOnly?: boolean;
};

// --- NAVIGATION STRUCTURE ---
const NAV_GROUPS: NavGroup[] = [
  {
    label: "Portfolio & Shop",
    items: [
      {
        to: "/dashboard/portfolio",
        name: "Website Editor",
        icon: LayoutTemplate,
        description: "Edit your site",
      },
      {
        to: "/dashboard/analytics",
        name: "Overview",
        icon: BarChart3,
        description: "Traffic & Shop Stats",
      },
      {
        to: "/dashboard/products",
        name: "Products",
        icon: ShoppingBag,
        description: "Manage inventory",
      },
      {
        to: "/dashboard/orders",
        name: "Direct Orders",
        icon: Package,
        description: "Manage sales",
      },
      {
        to: "/dashboard/leads",
        name: "Leads & Inbox",
        icon: Mail,
        description: "Contact submissions",
      },
    ],
  },
  {
    label: "Account & Settings",
    items: [
      {
        to: "/dashboard/settings",
        name: "Settings & Sites",
        icon: Settings,
        description: "Manage domains & profile",
      },
      {
        to: "/dashboard/payments",
        name: "Payments & Integrations",
        icon: CreditCard,
        description: "Stripe & Payouts",
      },
    ],
  },
  {
    label: "Casting Network",
    p2pOnly: true, // Hidden for Creatives
    items: [
      {
        to: "/dashboard",
        name: "Job Orders",
        icon: Briefcase,
        description: "Active jobs",
      },
      {
        to: "/dashboard/messages",
        name: "Inbox",
        icon: MessageSquare,
        description: "Client messages",
      },
      {
        to: "/dashboard/services",
        name: "Services",
        icon: Settings,
        description: "Manage rates",
      },
      {
        to: "/dashboard/demos",
        name: "Demos",
        icon: Music,
        description: "Your audio/video",
      },
      {
        to: "/dashboard/library",
        name: "Library",
        icon: AudioLines,
        description: "Delivered files",
      },
      {
        to: "/dashboard/earnings",
        name: "Earnings",
        icon: DollarSign,
        description: "Payouts & History",
      },
    ],
  },
];

const mobilePrimaryItems = [
  { to: "/dashboard/analytics", name: "Stats", icon: BarChart3 },
  { to: "/dashboard/portfolio", name: "Editor", icon: LayoutTemplate },
  { to: "/dashboard/messages", name: "Inbox", icon: MessageSquare },
];

const ActorDashboardLayout = () => {
  const [actorData, setActorData] = useState<Partial<Actor>>({});
  const [loading, setLoading] = useState(true);

  // Sidebar state
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const isMessagesPage = location.pathname.includes("/dashboard/messages");
  const isShopActive =
    location.pathname.includes("/products") ||
    location.pathname.includes("/collections");

  // Auto-collapse the sidebar if they open the Portfolio Editor
  useEffect(() => {
    if (location.pathname.includes("/dashboard/portfolio")) {
      setIsCollapsed(true);
    } else {
      setIsCollapsed(false);
    }
  }, [location.pathname]);

  const fetchActorData = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      navigate("/actor-login");
      return;
    }

    const { data: actorProfile, error: actorError } = await supabase
      .from("actors")
      .select("id, ActorName, HeadshotURL, is_p2p_enabled")
      .eq("user_id", user.id)
      .single();

    if (actorError || !actorProfile) {
      navigate("/create-profile", { state: { roleToCreate: "actor" } });
      return;
    }

    setActorData(actorProfile);
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    fetchActorData();
  }, [fetchActorData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/actor-login");
  };

  const handleEnableP2P = async () => {
    if (!actorData.id) return;
    const { error } = await supabase
      .from("actors")
      .update({ is_p2p_enabled: true })
      .eq("id", actorData.id);

    if (!error) {
      window.location.reload();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mb-4" />
          <p className="text-muted-foreground text-sm font-medium">
            Loading Workspace...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950 text-foreground flex flex-col antialiased">
      <SubscriptionProvider actorId={actorData.id}>
        {/* ========================================== */}
        {/* 1. THE TOPBAR (New SaaS Global Header)       */}
        {/* ========================================== */}
        <header className="hidden md:flex h-14 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 fixed top-0 w-full z-50 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            {/* Collapse Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-muted-foreground hover:text-foreground"
            >
              {isCollapsed ? (
                <PanelLeftOpen size={18} />
              ) : (
                <PanelLeftClose size={18} />
              )}
            </Button>

            {/* Branding / Page Context */}
            <div className="font-bold tracking-tight text-sm flex items-center gap-2">
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md text-xs">
                PRO
              </span>
              Workspace
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
            >
              <Search size={18} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
            >
              <Bell size={18} />
            </Button>

            {/* 🚀 2. PLACED TOGGLE HERE */}
            <ThemeToggle />

            <div className="h-6 w-px bg-border mx-2" />
            <div className="flex items-center gap-3 ml-2">
              <span className="text-sm font-semibold text-foreground hidden lg:block">
                {actorData.ActorName}
              </span>
              <Avatar className="h-8 w-8 border border-border cursor-pointer hover:opacity-80 transition-opacity">
                <AvatarImage
                  src={actorData.HeadshotURL}
                  className="object-cover"
                />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {actorData.ActorName?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* ========================================== */}
        {/* 2. THE APP BODY (Sidebar + Main Content)     */}
        {/* ========================================== */}
        <div className="flex flex-1 pt-14">
          {/* THE COLLAPSIBLE SIDEBAR */}
          <aside
            className={cn(
              "hidden md:flex flex-col fixed left-0 h-[calc(100vh-3.5rem)] border-r border-border/40 bg-background/80 backdrop-blur-xl z-40 transition-all duration-300 ease-in-out",
              isCollapsed ? "w-[72px]" : "w-[260px]" // CSS transition magic
            )}
          >
            {/* Scrollable Nav Area */}
            <nav className="flex-1 overflow-y-auto py-6 space-y-6 custom-scrollbar overflow-x-hidden">
              {NAV_GROUPS.map((group, idx) => {
                if (group.p2pOnly && !actorData.is_p2p_enabled) return null;

                return (
                  <div key={idx} className="space-y-1">
                    {/* Hide group labels when collapsed */}
                    <h3
                      className={cn(
                        "px-4 text-[11px] font-bold text-muted-foreground/70 uppercase tracking-widest mb-2 transition-opacity duration-200",
                        isCollapsed && "opacity-0 h-0 overflow-hidden mb-0"
                      )}
                    >
                      {group.label}
                    </h3>

                    <div className="space-y-1 px-3">
                      {group.items.map((item) => {
                        const isProductTab = item.to === "/dashboard/products";
                        const isActiveOverride = isProductTab && isShopActive;

                        return (
                          <div key={item.name}>
                            <NavLink
                              to={item.to}
                              end={
                                item.to === "/dashboard" ||
                                item.to === "/dashboard/settings" ||
                                item.to === "/dashboard/payments"
                              }
                              title={isCollapsed ? item.name : undefined} // Native tooltip when collapsed
                              className={({ isActive }) =>
                                cn(
                                  "group flex items-center rounded-lg transition-all duration-200 outline-none select-none relative",
                                  isCollapsed
                                    ? "justify-center h-10 w-10 mx-auto"
                                    : "gap-3 px-3 py-2 w-full",
                                  isActive || isActiveOverride
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                )
                              }
                            >
                              <item.icon
                                className={cn(
                                  "shrink-0 transition-colors",
                                  isCollapsed ? "h-5 w-5" : "h-4 w-4"
                                )}
                              />

                              {/* Hide text when collapsed */}
                              {!isCollapsed && (
                                <>
                                  <span className="text-sm font-medium truncate">
                                    {item.name}
                                  </span>
                                  <ChevronRight
                                    size={14}
                                    className={cn(
                                      "ml-auto transition-all",
                                      isActiveOverride ||
                                        location.pathname === item.to
                                        ? "opacity-100"
                                        : "opacity-0",
                                      isShopActive &&
                                        isProductTab &&
                                        "rotate-90"
                                    )}
                                  />
                                </>
                              )}
                            </NavLink>

                            {/* --- DYNAMIC SUBMENU FOR COLLECTIONS (Hidden when collapsed) --- */}
                            {!isCollapsed && isProductTab && isShopActive && (
                              <div className="ml-9 mt-1 mb-2 flex flex-col space-y-1 border-l-2 border-border/50 pl-3 animate-in slide-in-from-top-2 duration-200">
                                <NavLink
                                  to="/dashboard/products"
                                  end
                                  className={({ isActive }) =>
                                    cn(
                                      "text-sm py-1.5 px-2 rounded-md transition-colors",
                                      isActive
                                        ? "text-foreground font-semibold bg-muted/50"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                                    )
                                  }
                                >
                                  All Products
                                </NavLink>
                                <NavLink
                                  to="/dashboard/collections"
                                  className={({ isActive }) =>
                                    cn(
                                      "text-sm py-1.5 px-2 rounded-md transition-colors flex items-center",
                                      isActive
                                        ? "text-foreground font-semibold bg-muted/50"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                                    )
                                  }
                                >
                                  <Layers className="w-3.5 h-3.5 mr-2 opacity-70" />
                                  Collections
                                </NavLink>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Premium Upsell Card (Hidden when collapsed) */}
              {!actorData.is_p2p_enabled && !isCollapsed && (
                <div className="px-4">
                  <div
                    className="relative overflow-hidden rounded-xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-background p-4 mt-6 group cursor-pointer hover:border-indigo-500/50 transition-all animate-in fade-in"
                    onClick={handleEnableP2P}
                  >
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Sparkles size={48} />
                    </div>
                    <div className="flex items-center gap-2 mb-1 text-indigo-600 dark:text-indigo-400">
                      <Lock size={12} />
                      <h4 className="font-bold text-xs tracking-wide uppercase">
                        Unlock Pro
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3 font-medium">
                      Enable casting features & get hired directly.
                    </p>
                    <Button
                      size="sm"
                      className="w-full h-8 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 shadow-sm shadow-indigo-500/20"
                    >
                      Enable Now
                    </Button>
                  </div>
                </div>
              )}
            </nav>

            {/* Logout Footer */}
            <div className="p-3 border-t border-border/40">
              <Button
                variant="ghost"
                onClick={handleLogout}
                className={cn(
                  "w-full text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all",
                  isCollapsed
                    ? "justify-center px-0 h-10 w-10 mx-auto"
                    : "justify-start px-3 h-9"
                )}
                title={isCollapsed ? "Log Out" : undefined}
              >
                <LogOut
                  className={cn(
                    "shrink-0",
                    isCollapsed ? "h-5 w-5" : "mr-2 h-4 w-4"
                  )}
                />
                {!isCollapsed && <span className="text-sm">Log Out</span>}
              </Button>
            </div>
          </aside>

          {/* ========================================== */}
          {/* 3. THE MAIN CONTENT AREA                     */}
          {/* ========================================== */}
          <main
            className={cn(
              "flex-1 min-h-[calc(100vh-3.5rem)] flex flex-col transition-all duration-300 ease-in-out bg-zinc-50/50 dark:bg-black",
              isCollapsed ? "md:ml-[72px]" : "md:ml-[260px]", // Follows the sidebar width!
              isMessagesPage ? "pb-[88px] md:pb-0" : "pb-[96px] md:pb-8"
            )}
          >
            <Outlet context={{ actorData, role: "actor" }} />
          </main>
        </div>

        {/* --- MOBILE BOTTOM NAV --- */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50">
          <div className="absolute bottom-0 w-full h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />

          <div className="bg-background/80 backdrop-blur-xl border-t border-border/60 pb-safe pt-1">
            <div className="flex justify-around items-center h-16 px-1">
              {mobilePrimaryItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "group flex flex-col items-center justify-center w-full h-full space-y-1 relative active:scale-90 transition-transform duration-200",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute -top-1 w-8 h-1 rounded-b-full bg-primary shadow-[0_0_10px_rgba(0,0,0,0.2)] shadow-primary/50" />
                      )}

                      <div
                        className={cn(
                          "p-1.5 rounded-xl transition-colors",
                          isActive ? "bg-primary/10" : "group-hover:bg-muted"
                        )}
                      >
                        <item.icon
                          className={cn("h-5 w-5", isActive && "fill-current")}
                          strokeWidth={isActive ? 2.5 : 2}
                        />
                      </div>
                      <span className="text-[10px] font-semibold tracking-tight">
                        {item.name}
                      </span>
                    </>
                  )}
                </NavLink>
              ))}

              {/* Mobile Menu Trigger */}
              <Sheet>
                <SheetTrigger asChild>
                  <button className="flex flex-col items-center justify-center w-full h-full space-y-1 text-muted-foreground active:scale-90 transition-transform">
                    <div className="p-1.5 rounded-xl hover:bg-muted">
                      <Menu className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-semibold tracking-tight">
                      Menu
                    </span>
                  </button>
                </SheetTrigger>

                <SheetContent
                  side="right"
                  className="w-full sm:w-[400px] border-l border-border/40 p-0 flex flex-col bg-background/95 backdrop-blur-2xl"
                >
                  <SheetHeader className="px-6 pt-8 pb-4 text-left border-b border-border/40 flex flex-row items-center justify-between">
                    <SheetTitle className="text-2xl font-bold">Menu</SheetTitle>
                    {/* Add ThemeToggle to Mobile Menu as well! */}
                    <ThemeToggle />
                  </SheetHeader>

                  <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
                    <div className="flex items-center gap-4 px-2">
                      <Avatar className="h-12 w-12 border-2 border-primary/20">
                        <AvatarImage
                          src={actorData.HeadshotURL}
                          className="object-cover"
                        />
                        <AvatarFallback>U</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold text-lg">
                          {actorData.ActorName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Managed Account
                        </p>
                      </div>
                    </div>

                    {NAV_GROUPS.map((group, idx) => {
                      if (group.p2pOnly && !actorData.is_p2p_enabled)
                        return null;
                      return (
                        <div key={idx}>
                          <h4 className="px-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                            {group.label}
                          </h4>
                          <div className="grid gap-1">
                            {group.items.map((item) => (
                              <SheetClose asChild key={item.name}>
                                <Link
                                  to={item.to}
                                  className="flex items-center gap-4 p-3 rounded-2xl hover:bg-muted/50 active:bg-muted transition-all"
                                >
                                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                    <item.icon className="h-5 w-5" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-semibold text-base">
                                      {item.name}
                                    </div>
                                    <div className="text-xs text-muted-foreground line-clamp-1">
                                      {item.description || "View section"}
                                    </div>
                                  </div>
                                  <ChevronRight
                                    size={16}
                                    className="text-muted-foreground/50"
                                  />
                                </Link>
                              </SheetClose>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-6 border-t border-border/40 bg-muted/20">
                    <SheetClose asChild>
                      <Button
                        variant="destructive"
                        size="lg"
                        onClick={handleLogout}
                        className="w-full font-bold shadow-lg shadow-destructive/20"
                      >
                        Log Out
                      </Button>
                    </SheetClose>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </nav>
      </SubscriptionProvider>
    </div>
  );
};

export default ActorDashboardLayout;
