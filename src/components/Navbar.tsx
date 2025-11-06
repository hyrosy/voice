// In src/components/Navbar.tsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';
import {
  Menu, X, Home, Users, Package, Phone, Youtube, GalleryHorizontalEnd,
  BracesIcon, AudioLinesIcon, MegaphoneIcon, LogIn, UserCircle, UserCheck, Heart
} from 'lucide-react';

// --- Local Components ---
import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggle from './ThemeToggle';
import { cn } from "@/lib/utils"; // Import the cn utility

// --- shadcn/ui Component Imports ---
import { Button, buttonVariants } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

// --- Data Arrays (Unchanged) ---
const allMenuItems = [
  { icon: Home, label: 'Home', to: '/', type: 'link' },
  { icon: AudioLinesIcon, label: 'Voice Over', to: '/voiceover', type: 'link' },
  { icon: Youtube, label: 'Cinematography', to: '/cinema-portfolio', type: 'link' },
  { icon: BracesIcon, label: 'Software Development', to: '/software-development', type: 'link' },
  { icon: MegaphoneIcon, label: 'Digital Marketing', to: '/digital-marketing', type: 'link' },
  { icon: GalleryHorizontalEnd, label: 'Gallery Room', to: '/portfolio', type: 'link' },
  { icon: Package, label: 'Packages', to: '/#packages', type: 'hash' },
  { icon: Users, label: 'Team', to: '/members', type: 'link' },
  { icon: Phone, label: 'Contact Us', to: '/contact', type: 'link' },
  { icon: Heart, label: 'My Shortlist', to: '/my-shortlist', type: 'link' },
];
const serviceDropdownItems = [
  { label: 'Voice Over', to: '/voiceover' },
  { label: 'Cinematography', to: '/cinema-portfolio' },
  { label: 'Software Development', to: '/software-development' },
  { label: 'Digital Marketing', to: '/digital-marketing' },
];
const desktopNavLinks = [
  { label: 'Gallery', to: '/portfolio', type: 'link' as const },
  { label: 'Packages', to: '/#packages', type: 'hash' as const },
  { label: 'Shortlist', to: '/my-shortlist', type: 'link' as const },
  { label: 'Team', to: '/members', type: 'link' as const },
  { label: 'Contact', to: '/contact', type: 'link' as const },
];

// --- Helper Component for Dropdown Links ---
const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  )
});
ListItem.displayName = "ListItem"


const Navbar: React.FC = () => {
  // State for scroll effect (unchanged)
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Removed isOpen state, Sheet will manage itself
  
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Removed body scroll-lock useEffect, Sheet handles this automatically

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      isScrolled 
        ? "bg-background/80 backdrop-blur-xl shadow-lg border-b py-3" 
        : "bg-transparent py-4"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          
          <Link to="/" className="flex-shrink-0">
            <img 
              src="https://ucpmarocgo.s3.us-east-1.amazonaws.com/logo-ucp-maroc.png" 
              alt="UCP Maroc Logo" 
              className="w-40 md:w-48 transition-transform duration-300 hover:scale-105" 
            />
          </Link>

          {/* --- DESKTOP MENU (Unchanged) --- */}
          <div className="hidden lg:flex items-center gap-1">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <Link to="/" className={navigationMenuTriggerStyle()}>
                    Home
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger>Services</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-56 p-2">
                      {serviceDropdownItems.map((item) => (
                        <ListItem key={item.label} href={item.to} title={item.label} />
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {desktopNavLinks.map((item) => {
                  const LinkComponent = item.type === 'hash' ? HashLink : Link;
                  return (
                    <NavigationMenuItem key={item.label}>
                      <LinkComponent
                        to={item.to}
                        className={navigationMenuTriggerStyle()}
                      >
                        {item.label}
                      </LinkComponent>
                    </NavigationMenuItem>
                  );
                })}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* --- RIGHT SIDE ICONS & BUTTONS (RESTYLED) --- */}
          <div className="flex items-center gap-2">
                        {/* --- Always-Visible Control --- */}
            <ThemeToggle />

            {/* --- Desktop-Only Controls --- */}
            <div className="hidden lg:flex items-center gap-2 text-foreground">
            <LanguageSwitcher />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  {/* RESTYLED: Replaced custom gradient with standard <Button> */}
                  <Button className="rounded-full">
                    <LogIn size={16} className="mr-2" />
                    Login / Sign Up
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48" align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/client-auth" className="flex items-center gap-3 w-full cursor-pointer">
                      <UserCircle size={16} className="text-primary" />
                      Client Portal
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/actor-login" className="flex items-center gap-3 w-full cursor-pointer">
                      <UserCheck size={16} className="text-muted-foreground" />
                      Actor Portal
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>



            </div>

            
            {/* --- Mobile-Only Controls --- */}
            <div className="flex lg:hidden items-center gap-2">
              <LanguageSwitcher />
            
              {/* --- RESTYLED: Mobile Menu with Sheet --- */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Toggle menu">
                    <Menu size={24} />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 max-w-[85vw] flex flex-col p-0">
                  <SheetHeader className="p-6 pb-4 border-b">
                    <SheetTitle className="text-2xl">Menu</SheetTitle>
                  </SheetHeader>
                  
                  <ScrollArea className="flex-1">
                    <div className="p-6">
                      <ul className="space-y-1">
                        {allMenuItems.map((item) => {
                          const IconComponent = item.icon;
                          const LinkComponent = item.type === 'hash' ? HashLink : Link;
                          return (
                            <li key={item.label}>
                              <Button asChild variant="ghost" className="w-full justify-start gap-4 p-3 h-auto">
                                <LinkComponent to={item.to}>
                                  <IconComponent size={20} className="text-primary" />
                                  <span className="font-medium text-base">{item.label}</span>
                                </LinkComponent>
                              </Button>
                            </li>
                         );
                        })}
                      </ul>
                    </div>
                  </ScrollArea>
                  
                  <div className="p-6 mt-auto border-t space-y-4">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase">Portals</h4>
                    {/* RESTYLED: Replaced gradient with standard <Button> */}
                    <Button asChild className="w-full rounded-full" size="lg">
                      <Link to="/client-auth">
                       <UserCircle size={18} className="mr-2" />
                        Client Login
                      </Link>
                    </Button>
                    
                    {/* RESTYLED: Replaced bg-slate with variant="secondary" */}
                    <Button asChild variant="secondary" className="w-full rounded-full" size="lg">
                      <Link to="/actor-login">
                        <UserCheck size={18} className="mr-2" />
                        Talent Login
                      </Link>
                    </Button>
                    
                   <Separator className="my-6" />

                    {/* RESTYLED: Replaced bg-white with variant="outline" */}
                    <Button asChild variant="outline" className="w-full" size="lg">
                      <Link to="/customized-package">
                        Customized Package
                  </Link>
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
     </div>
    </nav>
  );
};

export default Navbar;