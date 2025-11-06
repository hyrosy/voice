// In src/layouts/ActorDashboardLayout.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { 
  LayoutGrid, 
  ListOrdered, 
  User, 
  Music, 
  AudioLines, 
  Settings, 
  LogOut 
} from 'lucide-react';
import { cn } from "@/lib/utils"; // Make sure you have this utility file
import { Separator } from '@/components/ui/separator';

// Define the shape of the actor data
interface Actor {
  id: string;
  ActorName: string;
  HeadshotURL?: string;
}

// Define the shape of the context we will pass to child routes
export interface ActorDashboardContextType {
  actorData: Partial<Actor>;
}

const navItems = [
  { to: "/dashboard", name: "Orders", icon: ListOrdered },
  { to: "/dashboard/profile", name: "Profile", icon: User },
  { to: "/dashboard/services", name: "Services", icon: Settings },
  { to: "/dashboard/demos", name: "Demos", icon: Music },
  { to: "/dashboard/library", name: "Library", icon: AudioLines },
];

const ActorDashboardLayout = () => {
  const [actorData, setActorData] = useState<Partial<Actor>>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
              // RESTYLED: Use shadcn variants
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
      {/* RESTYLED: Add padding-bottom for the mobile nav */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
        <Outlet context={{ actorData }} />
      </main>

      {/* --- Mobile Bottom Nav (Restored) --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border flex justify-around p-1 z-50">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.to}
            end
            // RESTYLED: Use shadcn variants & colors
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center p-2 rounded-lg w-1/6",
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-primary'
             )
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs mt-1">{item.name}</span>
          </NavLink>
        ))}
         {/* RESTYLED: Logout button */}
         <button 
            onClick={handleLogout} 
            className="flex flex-col items-center p-2 rounded-lg text-muted-foreground w-1/6 hover:text-destructive"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-xs mt-1">Log Out</span>
          </button>
      </nav>
    </div>
  );
};

export default ActorDashboardLayout;