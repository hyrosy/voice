import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';
import {
  Menu, X, Home, Users, Package, Phone, Youtube, GalleryHorizontalEnd,
  BracesIcon, AudioLinesIcon, MegaphoneIcon, LogIn, UserCircle, UserCheck, Heart
} from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggle from './ThemeToggle';

// --- ENHANCEMENT 1: ADD SHADCN/UI COMPONENT IMPORTS ---
// (Make sure you have these components in your project)
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"; // Adjust path if needed
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Adjust path if needed

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // --- ENHANCEMENT 1: REMOVED UNNECESSARY STATE ---
  // const [isLoginOpen, setIsLoginOpen] = useState(false); // No longer needed
  // const [isServicesOpen, setIsServicesOpen] = useState(false); // No longer needed

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  // --- (Data for Mobile Menu) ---
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

  // --- (Data for Desktop "Services" Dropdown) ---
  const serviceDropdownItems = [
    { label: 'Voice Over', to: '/voiceover' },
    { label: 'Cinematography', to: '/cinema-portfolio' },
    { label: 'Software Development', to: '/software-development' },
    { label: 'Digital Marketing', to: '/digital-marketing' },
  ];

  // --- ENHANCEMENT 2: DATA ARRAY FOR DESKTOP LINKS ---
  const desktopNavLinks = [
    { label: 'Gallery', to: '/portfolio', type: 'link' as const },
    { label: 'Packages', to: '/#packages', type: 'hash' as const },
    { label: 'Shortlist', to: '/my-shortlist', type: 'link' as const },
    { label: 'Team', to: '/members', type: 'link' as const },
    { label: 'Contact', to: '/contact', type: 'link' as const },
  ];

  const closeMenu = () => setIsOpen(false);

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-background/80 backdrop-blur-xl shadow-lg border-b py-3' : 'bg-transparent py-4'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            
            <Link to="/" className="flex-shrink-0">
              <img 
                src="https://ucpmarocgo.s3.us-east-1.amazonaws.com/logo-ucp-maroc.png" 
                alt="UCP Maroc Logo" 
                className="w-40 md:w-48 transition-transform duration-300 hover:scale-105" 
              />
            </Link>

            {/* --- DESKTOP MENU (ENHANCEMENTS 1 & 2) --- */}
            <div className="hidden lg:flex items-center gap-1">
              <NavigationMenu>
                <NavigationMenuList>
                  {/* Home Link */}
                  <NavigationMenuItem>
                    <Link to="/" className={navigationMenuTriggerStyle()}>
                      Home
                    </Link>
                  </NavigationMenuItem>

                  {/* Services Dropdown */}
                  <NavigationMenuItem>
                    <NavigationMenuTrigger>Services</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-56 p-2">
                        {serviceDropdownItems.map((item) => (
                          <li key={item.label}>
                            <NavigationMenuLink asChild>
                              <Link
                                to={item.to}
                                className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                              >
                                {item.label}
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>

                  {/* Mapped Desktop Links */}
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

            {/* --- RIGHT SIDE ICONS & BUTTONS --- */}
            <div className="flex items-center gap-4">
              <div className="hidden lg:block text-white">
                <LanguageSwitcher />
              </div>

              <div>
                <ThemeToggle />
              </div>
              
              {/* --- LOGIN DROPDOWN (ENHANCEMENT 1) --- */}
              <div className="hidden lg:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-primary-foreground font-semibold rounded-full hover:scale-105 transition-transform"
                    >
                      <LogIn size={16} />
                      Login / Sign Up
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48" align="end">
                    <DropdownMenuItem asChild>
                      <Link to="/client-auth" className="flex items-center gap-3 w-full">
                        <UserCircle size={16} className="text-purple-400" />
                        Client Portal
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/actor-login" className="flex items-center gap-3 w-full">
                        <UserCheck size={16} className="text-blue-400" />
                        Actor Portal
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* --- MOBILE CONTROLS --- */}
              <div className="lg:hidden">
                <LanguageSwitcher />
              </div>
              
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden p-2 rounded-lg text-foreground hover:bg-white/10 transition-colors"
                aria-label="Toggle menu"
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* --- MOBILE SLIDE-OUT MENU (ENHANCEMENT 3) --- */}
      <div className={`fixed top-0 right-0 w-80 max-w-[85vw] bg-background/90 backdrop-blur-xl shadow-2xl transform transition-all duration-300 ease-out z-50 border-l
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        h-screen flex flex-col` /* <-- ENHANCEMENT 3: Added h-screen & flex */
      }>
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="font-bold text-foreground">Menu</h3>
          <button onClick={closeMenu} className="p-2 rounded-lg text-foreground hover:bg-white/10">
            <X size={24} />
          </button>
        </div>

        {/* --- ENHANCEMENT 3: Changed h-calc to flex-1 --- */}
        <div className="p-6 overflow-y-auto flex-1">
          <ul className="space-y-2 mb-8">
            {allMenuItems.map((item) => {
              const IconComponent = item.icon;
              const LinkComponent = item.type === 'hash' ? HashLink : Link;
              return (
                <li key={item.label}>
                  <LinkComponent
                    to={item.to}
                    onClick={closeMenu}
                    className="flex items-center gap-4 text-foreground p-3 rounded-lg hover:bg-popover transition-colors"
                  >
                    <IconComponent size={20} className="text-purple-400" />
                    <span className="font-medium">{item.label}</span>
                  </LinkComponent>
                </li>
              );
            })}
          </ul>
          
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase">Portals</h4>
            <Link to="/client-auth" onClick={closeMenu} className="flex items-center justify-center gap-3 w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-foreground font-semibold rounded-full hover:scale-105 transition-transform">
              <UserCircle size={18} />
              Client Login
            </Link>
            <Link to="/actor-login" onClick={closeMenu} className="flex items-center justify-center gap-3 w-full px-6 py-3 bg-slate-700 text-foreground font-semibold rounded-full hover:bg-slate-600 transition-colors">
              <UserCheck size={18} />
              Talent Login
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t">
            <Link
              to="/customized-package"
              onClick={closeMenu}
              className="w-full bg-white text-black font-semibold px-6 py-4 rounded-xl text-center block transition-all duration-300 hover:scale-105"
            >
              Customized Package
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={closeMenu} />
      )}
    </>
  );
};

export default Navbar;