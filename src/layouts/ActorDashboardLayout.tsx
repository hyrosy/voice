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
  BarChart3, // New Icon for Analytics
  Globe,
  Briefcase,
  Package,
  Mail,
  Sparkles,
  Lock,
  ShoppingBag,
  Layers,
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

// 2. EXPORT THE CONTEXT TYPE (This fixes your error)
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
  p2pOnly?: boolean; // Whole group hidden if not Actor
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
      }, // NEW
      // --- ADDED PRODUCTS HERE ---
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
      }, // Ensure you import 'Mail' from lucide-react

      // Future: Products, Orders
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
  {
    label: "Account",
    items: [
      { to: "/dashboard/settings", name: "Settings & Sites", icon: Settings },
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
  const navigate = useNavigate();
  const location = useLocation();
  const isMessagesPage = location.pathname.includes("/dashboard/messages");
  const isShopActive =
    location.pathname.includes("/products") ||
    location.pathname.includes("/collections");
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
        Loading Dashboard...
      </div>
    );
  }

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 outline-none select-none",
      "hover:bg-muted/50 active:scale-[0.98]", // Tactile feel
      isActive
        ? "bg-primary/10 text-primary hover:bg-primary/15"
        : "text-muted-foreground hover:text-foreground"
    );

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950 text-foreground flex antialiased">
      <SubscriptionProvider actorId={actorData.id}>
        {/* --- DESKTOP SIDEBAR (Glassy & Floating Feel) --- */}
        <aside className="pt-14 hidden md:flex flex-col w-[280px] h-screen fixed left-0 top-0 border-r border-border/40 bg-background/80 backdrop-blur-xl z-40">
          {/* Profile Card Section */}
          <div className="p-6 pb-2 pt-8">
            <div className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-card/50 shadow-sm transition-colors hover:bg-card">
              <Avatar className="h-10 w-10 border border-border">
                <AvatarImage
                  src={actorData.HeadshotURL}
                  alt={actorData.ActorName}
                  className="object-cover"
                />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {actorData.ActorName?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold truncate leading-none mb-1">
                  {actorData.ActorName}
                </h2>
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full animate-pulse",
                      actorData.is_p2p_enabled
                        ? "bg-emerald-500"
                        : "bg-amber-500"
                    )}
                  />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                    {actorData.is_p2p_enabled ? "Pro Actor" : "Creative"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Scrollable Nav Area */}
          <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-8 custom-scrollbar">
            {NAV_GROUPS.map((group, idx) => {
              if (group.p2pOnly && !actorData.is_p2p_enabled) return null;

              return (
                <div key={idx} className="space-y-1">
                  <h3 className="px-3 text-[11px] font-bold text-muted-foreground/70 uppercase tracking-widest mb-2 select-none">
                    {group.label}
                  </h3>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      // Custom rule to highlight the Products tab if we are on Products OR Collections
                      const isProductTab = item.to === "/dashboard/products";
                      const isActiveOverride = isProductTab && isShopActive;

                      return (
                        <div key={item.name}>
                          <NavLink
                            to={item.to}
                            end={item.to === "/dashboard"}
                            className={({ isActive }) =>
                              getNavLinkClass({
                                isActive: isActive || isActiveOverride,
                              })
                            }
                          >
                            <item.icon
                              className={cn(
                                "h-4 w-4 transition-colors",
                                item.name === "Overview"
                                  ? "text-blue-500"
                                  : "group-hover:text-foreground"
                              )}
                            />
                            <span>{item.name}</span>
                            <ChevronRight
                              size={14}
                              className={cn(
                                "ml-auto transition-all",
                                (isShopActive && isProductTab) ||
                                  location.pathname === item.to
                                  ? "opacity-100 text-primary"
                                  : "opacity-0 text-primary/50",
                                isShopActive && isProductTab && "rotate-90"
                              )}
                            />
                          </NavLink>

                          {/* --- DYNAMIC SUBMENU FOR COLLECTIONS --- */}
                          {isProductTab && isShopActive && (
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
                          {/* --- END SUBMENU --- */}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Premium Upsell Card (Styled) */}

            {/* Premium Upsell Card (Styled) */}
            {!actorData.is_p2p_enabled && (
              <div
                className="relative overflow-hidden rounded-xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-background p-4 mt-6 group cursor-pointer hover:border-indigo-500/50 transition-all"
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
            )}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border/40">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/5 h-9 px-3"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span className="text-sm">Log Out</span>
            </Button>
          </div>
        </aside>

        {/* --- MAIN CONTENT --- */}
        <main
          className={cn(
            "flex-1 md:ml-[280px] min-h-screen flex flex-col transition-all duration-300",
            "bg-zinc-50/50 dark:bg-black", // Subtle background contrast
            isMessagesPage ? "pb-[88px] md:pb-0" : "pb-[96px] md:pb-8" // Exact padding for nav + safe area
          )}
        >
          <Outlet context={{ actorData, role: "actor" }} />
        </main>

        {/* --- MOBILE BOTTOM NAV (iOS Style Island) --- */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50">
          {/* Gradient fade to integrate with content */}
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
                      {/* Active Indicator Line at top */}
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

                {/* FULL SCREEN MOBILE MENU (Immersive) */}
                <SheetContent
                  side="right"
                  className="w-full sm:w-[400px] border-l border-border/40 p-0 flex flex-col bg-background/95 backdrop-blur-2xl"
                >
                  <SheetHeader className="px-6 pt-8 pb-4 text-left border-b border-border/40">
                    <SheetTitle className="text-2xl font-bold">Menu</SheetTitle>
                  </SheetHeader>

                  <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
                    {/* Profile Snippet in Menu */}
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
