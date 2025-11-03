// In src/layouts/ActorDashboardLayout.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  LayoutGrid, 
  ListOrdered, 
  User, 
  Music, 
  AudioLines, 
  Settings, 
  LogOut 
} from 'lucide-react';

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

  // This layout component fetches the core actor data
  // so we can display it in the header and pass it to child pages.
  const fetchActorData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/actor-login');
      return;
    }

    const { data: actorProfile, error: actorError } = await supabase
      .from('actors')
      .select('id, ActorName, HeadshotURL') // Only fetch what we need for the layout
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
    <div className="min-h-screen bg-background text-foreground flex">
      
      {/* --- Desktop Sidebar (hidden on mobile) --- */}
      <nav className="hidden md:flex flex-col w-64 border-r border-border p-4 space-y-4">
        <div className="flex flex-col items-center text-center p-4 border-b border-border">
          <Avatar className="w-20 h-20 mb-4">
            <AvatarImage src={actorData.HeadshotURL} alt={actorData.ActorName} />
            <AvatarFallback>{actorData.ActorName?.charAt(0)}</AvatarFallback>
          </Avatar>
          <h2 className="font-semibold text-lg">{actorData.ActorName}</h2>
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => navigate('/dashboard/profile')}>
            Edit Profile
          </Button>
        </div>
        
        <div className="flex-grow space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              end // Use 'end' for the "Orders" link to not match child routes
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </div>
        
        <Button variant="destructive" onClick={handleLogout} className="w-full">
          <LogOut className="mr-2 h-4 w-4" /> Log Out
        </Button>
      </nav>

      {/* --- Main Content Area --- */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {/* We pass the actorData to all child pages via the Outlet context */}
        <Outlet context={{ actorData }} />
      </main>

      {/* --- Mobile Bottom Nav (hidden on desktop) --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex justify-around p-2 z-50">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.to}
            end
            className={({ isActive }) =>
              `flex flex-col items-center p-2 rounded-lg ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`
            }
          >
            <item.icon className="h-6 w-6" />
            <span className="text-xs">{item.name}</span>
          </NavLink>
        ))}
         <button onClick={handleLogout} className="flex flex-col items-center p-2 rounded-lg text-muted-foreground">
            <LogOut className="h-6 w-6" />
            <span className="text-xs">Log Out</span>
          </button>
      </nav>
    </div>
  );
};

export default ActorDashboardLayout;