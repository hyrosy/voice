// In src/layouts/ActorDashboardLayout.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
// --- 1. Import useLocation ---
import { Outlet, Link, NavLink, useNavigate, useLocation } from 'react-router-dom'; 
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { 
  LayoutGrid, 
  ListOrdered, 
  User, 
  Music, 
  AudioLines, 
  Settings, 
  LogOut,
  MessageSquare,
  DollarSign,
  Menu,
  X
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

interface Actor {
  id: string;
  ActorName: string;
  HeadshotURL?: string;
}

export interface ActorDashboardContextType {
  actorData: Partial<Actor>;
  role: 'actor' | 'client' | null; // --- 2. Add role to the context type ---
}

// --- 3. Update the 'navItems' links ---
const navItems = [
  { to: "/dashboard", name: "Orders", icon: ListOrdered },
  { to: "/dashboard/messages", name: "Inbox", icon: MessageSquare }, // <-- UPDATED
  { to: "/dashboard/profile", name: "Profile", icon: User },
  { to: "/dashboard/services", name: "Services", icon: Settings },
  { to: "/dashboard/demos", name: "Demos", icon: Music },
  { to: "/dashboard/library", name: "Library", icon: AudioLines },
  { to: "/dashboard/earnings", name: "Earnings", icon: DollarSign }, // <-- ADD THIS
];

// Mobile Bottom Bar (Only show top 3 + Menu)
const mobilePrimaryItems = [
  { to: "/dashboard", name: "Orders", icon: ListOrdered },
  { to: "/dashboard/messages", name: "Inbox", icon: MessageSquare }, // <-- UPDATED
  { to: "/dashboard/profile", name: "Profile", icon: User },
  { to: "/dashboard/earnings", name: "Earnings", icon: DollarSign }, // <-- ADD THIS
];

// Menu Drawer Items (The rest)
const mobileMenuItems = [
  { to: "/dashboard/services", name: "Services", icon: Settings },
  { to: "/dashboard/demos", name: "Demos", icon: Music },
  { to: "/dashboard/library", name: "Library", icon: AudioLines },
];

const ActorDashboardLayout = () => {
  const [actorData, setActorData] = useState<Partial<Actor>>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // --- 4. Add useLocation to check the path ---
  const location = useLocation();
  const isMessagesPage = location.pathname.includes('/dashboard/messages');

  // ... (fetchActorData, useEffect, handleLogout, and loading return are all perfect)
  const fetchActorData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/actor-login');
      return;
    }

    const { data: actorProfile, error: actorError } = await supabase
      .from('actors')
      .select('id, ActorName, HeadshotURL')
      .eq('user_id', user.id)
      .single();
    
    if (actorError || !actorProfile) {
      console.warn('No actor profile found, redirecting to create one.');
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

  if (loading) {
    return <div className="min-h-screen bg-background text-foreground flex items-center justify-center">Loading Dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-muted/40 text-foreground flex">
      
      {/* --- Desktop Sidebar (hidden on mobile) --- */}
      {/* (No changes needed here, the 'navItems' update fixed the links) */}
      <aside className="hidden md:flex flex-col w-64 border-r bg-background">
        <div className="flex flex-col items-center text-center p-4">
          <Avatar className="w-20 h-20 mb-4">
            <AvatarImage src={actorData.HeadshotURL} alt={actorData.ActorName} />
            <AvatarFallback>{actorData.ActorName?.charAt(0)}</AvatarFallback>
          </Avatar>
          <h2 className="font-semibold text-lg">{actorData.ActorName}</h2>
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => navigate('/dashboard/profile')}>
            Edit Profile
          </Button>
        </div>
        
        <Separator />
        
        <nav className="flex-grow space-y-2 p-4">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              end
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
        </nav>
        
        <div className="p-4 mt-auto border-t">
         <Button variant="destructive" onClick={handleLogout} className="w-full">
            <LogOut className="mr-2 h-4 w-4" /> Log Out
          </Button>
        </div>
      </aside>

      {/* --- Main Content Area --- */}
      {/* --- 5. UPDATE THIS MAIN TAG --- */}
      <main className={`
        flex-1 overflow-y-auto 
        ${isMessagesPage ? 'p-0 pb-24 md:p-0' : 'p-4 md:p-8 pb-24 md:pb-8'}
      `}>
        <Outlet context={{ actorData, role: 'actor' }} /> {/* <-- 6. Pass the role */}
      </main>

      {/* --- Mobile Bottom Nav (Restored) --- */}
      {/* (No changes needed here, the 'navItems' update fixed the links) */}
      {/* --- Mobile Bottom Nav (Redesigned) --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border flex justify-around items-center h-16 px-2 z-50 pb-safe">
        
        {/* 1. Primary Items */}
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

        {/* 2. The "Menu" Drawer Trigger */}
        <Sheet>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center justify-center w-full h-full space-y-1 text-muted-foreground hover:text-primary">
              <Menu className="h-5 w-5" />
              <span className="text-[10px] font-medium">Menu</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[60vh] rounded-t-xl">
            <SheetHeader className="text-left mb-4">
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            
            <div className="grid gap-2">
              {mobileMenuItems.map((item) => (
                <SheetClose asChild key={item.name}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        buttonVariants({ variant: isActive ? "secondary" : "ghost" }),
                        "w-full justify-start gap-4 text-base h-12"
                      )
                    }
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </NavLink>
                </SheetClose>
              ))}

              <Separator className="my-2" />

              {/* Logout in Menu */}
              <SheetClose asChild>
                <Button 
                  variant="ghost" 
                  onClick={handleLogout} 
                  className="w-full justify-start gap-4 text-base h-12 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="h-5 w-5" />
                  Log Out
                </Button>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>

      </nav>
    </div>
  );
};

export default ActorDashboardLayout;