import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Outlet, Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
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
  Mail
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { SubscriptionProvider } from '../context/SubscriptionContext';

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
      { to: "/dashboard/portfolio", name: "Website Editor", icon: LayoutTemplate, description: "Edit your site" },
      { to: "/dashboard/analytics", name: "Overview", icon: BarChart3, description: "Traffic & Shop Stats" }, // NEW     
      { to: "/dashboard/orders", name: "Direct Orders", icon: Package, description: "Manage sales" },
      { to: "/dashboard/leads", name: "Leads & Inbox", icon: Mail, description: "Contact submissions" }, // Ensure you import 'Mail' from lucide-react

      // Future: Products, Orders
    ]
  },
  {
    label: "Casting Network",
    p2pOnly: true, // Hidden for Creatives
    items: [
      { to: "/dashboard", name: "Job Orders", icon: Briefcase, description: "Active jobs" },
      { to: "/dashboard/messages", name: "Inbox", icon: MessageSquare, description: "Client messages" },
      { to: "/dashboard/services", name: "Services", icon: Settings, description: "Manage rates" },
      { to: "/dashboard/demos", name: "Demos", icon: Music, description: "Your audio/video" },
      { to: "/dashboard/library", name: "Library", icon: AudioLines, description: "Delivered files" },      
      { to: "/dashboard/earnings", name: "Earnings", icon: DollarSign, description: "Payouts & History" },

    ]
  },
  {
    label: "Account",
    items: [
     { to: "/dashboard/settings", name: "Settings & Sites", icon: Settings }, 
    ]
  }
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
  const isMessagesPage = location.pathname.includes('/dashboard/messages');

  const fetchActorData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/actor-login');
      return;
    }

    const { data: actorProfile, error: actorError } = await supabase
      .from('actors')
      .select('id, ActorName, HeadshotURL, is_p2p_enabled') 
      .eq('user_id', user.id)
      .single();
    
    if (actorError || !actorProfile) {
       navigate('/create-profile', { state: { roleToCreate: 'actor' } });
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
    navigate('/actor-login');
  };

  const handleEnableP2P = async () => {
      if (!actorData.id) return;
      const { error } = await supabase
          .from('actors')
          .update({ is_p2p_enabled: true })
          .eq('id', actorData.id);
      
      if (!error) {
          window.location.reload(); 
      }
  };

  if (loading) {
    return <div className="min-h-screen bg-background text-foreground flex items-center justify-center">Loading Dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-muted/40 text-foreground flex">
      <SubscriptionProvider actorId={actorData.id}>
      {/* --- Desktop Sidebar --- */}
      <aside className="hidden md:flex flex-col w-64 border-r bg-background pt-8 pb-4 h-screen fixed left-0 top-0 overflow-y-auto custom-scrollbar">
        
        {/* User Header */}
        <div className="flex flex-col items-center text-center px-4 mb-6 pt-12">
          <Avatar className="w-16 h-16 mb-3 border-2 border-muted">
            <AvatarImage src={actorData.HeadshotURL} alt={actorData.ActorName} />
            <AvatarFallback>{actorData.ActorName?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <h2 className="font-bold text-base truncate w-full">{actorData.ActorName}</h2>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
             {actorData.is_p2p_enabled ? 'Pro Actor' : 'Creative'}
          </p>
        </div>
        
        {/* Nav Groups */}
        <nav className="flex-grow px-3 space-y-6">
          {NAV_GROUPS.map((group, idx) => {
             // Hide if P2P only and user is not P2P
             if (group.p2pOnly && !actorData.is_p2p_enabled) return null;

             return (
               <div key={idx}>
                  <h3 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    {group.label}
                  </h3>
                  <div className="space-y-1">
                    {group.items.map((item) => (
                        <NavLink
                          key={item.name}
                          to={item.to}
                          end={item.to === '/dashboard'} // Precise match for root
                          className={({ isActive }) =>
                            cn(
                              buttonVariants({ variant: isActive ? "secondary" : "ghost" }),
                              "w-full justify-start gap-3 h-10 px-4",
                              isActive && "bg-secondary text-primary font-medium"
                            )
                          }
                        >
                          <item.icon className={cn("h-4 w-4", item.name === 'Overview' ? 'text-blue-500' : '')} />
                          <span>{item.name}</span>
                        </NavLink>
                    ))}
                  </div>
               </div>
             );
          })}

          {/* Upsell Card */}
          {!actorData.is_p2p_enabled && (
             <div className="mx-2 mt-4 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                <h4 className="font-semibold text-sm mb-1 text-indigo-400">Actor Mode</h4>
                <p className="text-xs text-muted-foreground mb-3 leading-tight">
                    Enable casting features to find jobs.
                </p>
                <Button 
                    size="sm" 
                    className="w-full text-xs h-8 bg-indigo-600 hover:bg-indigo-500 text-white"
                    onClick={handleEnableP2P}
                >
                    Enable
                </Button>
             </div>
          )}
        </nav>
        
        <div className="px-4 mt-6">
          <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-muted-foreground hover:text-destructive">
            <LogOut className="mr-2 h-4 w-4" /> Log Out
          </Button>
        </div>
      </aside>

      {/* --- Main Content Area (Offset for fixed sidebar) --- */}
      <main className={`
        flex-1 md:ml-64 min-h-screen flex flex-col
        ${isMessagesPage ? 'pb-20 md:pb-0' : 'pb-24 md:pb-8'} 
      `}>
        <Outlet context={{ actorData, role: 'actor' }} />
      </main>

      {/* --- Mobile Bottom Nav (Simplified) --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border flex justify-around items-center h-16 px-2 z-50 pb-safe">
        {mobilePrimaryItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1",
                isActive ? 'text-primary' : 'text-muted-foreground'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{item.name}</span>
          </NavLink>
        ))}

        {/* Mobile Full Menu */}
        <Sheet>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center justify-center w-full h-full space-y-1 text-muted-foreground">
              <Menu className="h-5 w-5" />
              <span className="text-[10px] font-medium">Menu</span>
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px] overflow-y-auto">
            <SheetHeader className="text-left mb-6">
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            
            <div className="space-y-6">
                {NAV_GROUPS.map((group, idx) => {
                    if (group.p2pOnly && !actorData.is_p2p_enabled) return null;
                    return (
                        <div key={idx}>
                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                                {group.label}
                            </h4>
                            <div className="space-y-2">
                                {group.items.map((item) => (
                                    <SheetClose asChild key={item.name}>
                                        <Link 
                                            to={item.to}
                                            className="flex items-center gap-3 p-2 hover:bg-muted rounded-md transition-colors"
                                        >
                                            <div className="p-2 bg-primary/10 text-primary rounded-md">
                                                <item.icon className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-sm">{item.name}</div>
                                                <div className="text-xs text-muted-foreground">{item.description}</div>
                                            </div>
                                        </Link>
                                    </SheetClose>
                                ))}
                            </div>
                        </div>
                    )
                })}
                
                <Separator />
                
                <SheetClose asChild>
                    <Button variant="destructive" onClick={handleLogout} className="w-full">
                        <LogOut className="mr-2 h-4 w-4" /> Log Out
                    </Button>
                </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
      </SubscriptionProvider>
    </div>
  );
};

export default ActorDashboardLayout;