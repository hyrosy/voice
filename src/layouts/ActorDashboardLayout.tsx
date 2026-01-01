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
  Clapperboard, // Added for potential future use
  ShoppingBag
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

// --- 1. Update Interface to include the Flag ---
interface Actor {
  id: string;
  ActorName: string;
  HeadshotURL?: string;
  is_p2p_enabled?: boolean; // New Flag
}

export interface ActorDashboardContextType {
  actorData: Partial<Actor>;
  role: 'actor' | 'client' | null;
}

// --- 2. Define Link Groups with Permissions ---

// Helper type for nav items
type NavItem = {
  to: string;
  name: string;
  icon: React.ElementType;
  description?: string;
  p2pOnly?: boolean; // If true, hidden for Creatives
};

const desktopNavItems: NavItem[] = [
  // --- CORE TOOLS (Everyone) ---
  { to: "/dashboard/portfolio", name: "Portfolio", icon: LayoutTemplate },
  { to: "/dashboard", name: "Orders", icon: ListOrdered }, // Needed for Shop later
  { to: "/dashboard/messages", name: "Inbox", icon: MessageSquare },
  { to: "/dashboard/profile", name: "Profile", icon: User },
  { to: "/dashboard/earnings", name: "Earnings", icon: DollarSign },
  
  // --- ACTOR NETWORK TOOLS (P2P Only) ---
  { to: "/dashboard/services", name: "Services", icon: Settings, p2pOnly: true },
  { to: "/dashboard/demos", name: "Demos", icon: Music, p2pOnly: true },
  { to: "/dashboard/library", name: "Library", icon: AudioLines, p2pOnly: true },
];

const mobilePrimaryItems = [
  { to: "/dashboard", name: "Orders", icon: ListOrdered },
  { to: "/dashboard/messages", name: "Inbox", icon: MessageSquare },
  { to: "/dashboard/profile", name: "Profile", icon: User },
];

const mobileMenuItems: NavItem[] = [
  // --- CORE ---
  { 
    to: "/dashboard/portfolio", 
    name: "Portfolio", 
    icon: LayoutTemplate,
    description: "Build your public website"
  },
  { 
    to: "/dashboard/earnings", 
    name: "Earnings", 
    icon: DollarSign,
    description: "Track your income"
  },
  // --- ACTOR ONLY ---
  { 
    to: "/dashboard/services", 
    name: "Services", 
    icon: Settings,
    description: "Manage rates & offers",
    p2pOnly: true
  },
  { 
    to: "/dashboard/demos", 
    name: "Demos", 
    icon: Music,
    description: "Upload audio/video",
    p2pOnly: true
  },
  { 
    to: "/dashboard/library", 
    name: "Library", 
    icon: AudioLines,
    description: "Your delivered files",
    p2pOnly: true
  },
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

    // --- 3. Update Fetch to get 'is_p2p_enabled' ---
    const { data: actorProfile, error: actorError } = await supabase
      .from('actors')
      .select('id, ActorName, HeadshotURL, is_p2p_enabled') // <--- ADDED
      .eq('user_id', user.id)
      .single();
    
    if (actorError || !actorProfile) {
      // Logic for create-profile redirect (unchanged)
      // Note: If you want creatives to skip the "Height/Eye Color" profile creation,
      // you might check user metadata here. But for now, we keep it safe.
      console.warn('No actor profile found.');
       // Only redirect to create-profile if they are INTENDED to be an actor?
       // For now, let's assume the signup created the row, so this shouldn't trigger often.
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
          window.location.reload(); // Refresh to update sidebar
      }
  };

  if (loading) {
    return <div className="min-h-screen bg-background text-foreground flex items-center justify-center">Loading Dashboard...</div>;
  }

  // --- 4. Filter Logic ---
  const filteredDesktopItems = desktopNavItems.filter(item => 
      !item.p2pOnly || actorData.is_p2p_enabled
  );
  
  const filteredMobileMenu = mobileMenuItems.filter(item => 
      !item.p2pOnly || actorData.is_p2p_enabled
  );

  return (
    <div className="min-h-screen bg-muted/40 text-foreground flex">
      
      {/* --- Desktop Sidebar --- */}
      <aside className="hidden md:flex flex-col w-64 border-r bg-background pt-16">
        <div className="flex flex-col items-center text-center p-4">
          <Avatar className="w-20 h-20 mb-4">
            <AvatarImage src={actorData.HeadshotURL} alt={actorData.ActorName} />
            <AvatarFallback>{actorData.ActorName?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <h2 className="font-semibold text-lg">{actorData.ActorName || 'Welcome'}</h2>
          
          {/* Only show Edit Profile if they are an actor (or we create a creative profile page later) */}
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => navigate('/dashboard/profile')}>
            Edit Profile
          </Button>
        </div>
        
        <Separator />
        
        <nav className="flex-grow space-y-2 p-4">
          {filteredDesktopItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              end={item.to === '/dashboard'}
              className={({ isActive }) =>
                cn(
                  buttonVariants({ 
                    variant: isActive ? "default" : "ghost" 
                  }),
                  "w-full justify-start gap-3"
                )
              }
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </NavLink>
          ))}

          {/* --- 5. UPSELL CARD (Hidden if already P2P) --- */}
          {!actorData.is_p2p_enabled && (
             <div className="mt-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                <h4 className="font-semibold text-sm mb-1">Are you an Actor?</h4>
                <p className="text-xs text-muted-foreground mb-3 leading-tight">
                    Join the talent network to find auditions and get scouted.
                </p>
                <Button 
                    size="sm" 
                    className="w-full text-xs h-8 bg-indigo-600 hover:bg-indigo-500 text-white"
                    onClick={handleEnableP2P}
                >
                    Enable Actor Mode
                </Button>
             </div>
          )}

        </nav>
        
        <div className="p-4 mt-auto border-t">
          <Button variant="destructive" onClick={handleLogout} className="w-full">
            <LogOut className="mr-2 h-4 w-4" /> Log Out
          </Button>
        </div>
      </aside>

      {/* --- Main Content Area --- */}
      <main className={`
        flex-1 overflow-y-auto 
        ${isMessagesPage ? 'p-0 pb-20 md:p-0' : 'p-4 md:p-8 pb-24 md:pb-8'} 
      `}>
        {/* Pass the role explicitly so child pages know */}
        <Outlet context={{ actorData, role: 'actor' }} />
      </main>

      {/* --- Mobile Bottom Nav --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border flex justify-around items-center h-16 px-2 z-50 pb-safe">
        
        {/* Primary Items (Usually Order/Inbox/Profile) */}
        {mobilePrimaryItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.to}
            end={item.to === '/dashboard'}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1",
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-primary'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{item.name}</span>
          </NavLink>
        ))}

        {/* The "Menu" Drawer Trigger */}
        <Sheet>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center justify-center w-full h-full space-y-1 text-muted-foreground hover:text-primary">
              <Menu className="h-5 w-5" />
              <span className="text-[10px] font-medium">Menu</span>
            </button>
          </SheetTrigger>
          
          <SheetContent side="bottom" className="rounded-t-xl h-[85vh] sm:h-auto overflow-y-auto bg-background">
            <SheetHeader className="text-left mb-6">
              <SheetTitle className="text-2xl font-bold">Menu</SheetTitle>
            </SheetHeader>
            
            {/* Grid of Menu Cards */}
            <div className="grid grid-cols-1 gap-4 pb-8">
              {filteredMobileMenu.map((item) => (
                <SheetClose asChild key={item.name}>
                  <Link to={item.to} className="block group">
                    <Card className="hover:border-primary transition-colors shadow-sm border-muted">
                      <CardContent className="flex items-center p-4 gap-4">
                        <div className="p-3 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors flex-shrink-0">
                          <item.icon className="h-6 w-6" />
                        </div>
                        
                        <div className="flex-grow min-w-0">
                          <h3 className="font-semibold text-foreground text-lg">{item.name}</h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {item.description}
                          </p>
                        </div>

                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                      </CardContent>
                    </Card>
                  </Link>
                </SheetClose>
              ))}

              {/* Mobile Upsell Button */}
              {!actorData.is_p2p_enabled && (
                <div className="mt-2 p-4 bg-muted rounded-lg border">
                    <p className="text-sm font-medium mb-3">Want to join the casting network?</p>
                    <Button 
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white"
                        onClick={handleEnableP2P}
                    >
                        Enable Actor Features
                    </Button>
                </div>
              )}
            </div>

            <Separator className="my-4" />

            {/* Logout Button */}
            <SheetClose asChild>
              <Button 
                variant="destructive" 
                onClick={handleLogout} 
                className="w-full justify-center gap-2 h-12 text-base font-medium mt-2 mb-8"
              >
                <LogOut className="h-5 w-5" />
                Log Out
              </Button>
            </SheetClose>

          </SheetContent>
        </Sheet>

      </nav>
    </div>
  );
};

export default ActorDashboardLayout;