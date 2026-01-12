import React, { useState, useEffect } from 'react';
import { HeaderSectionProps } from '@/types/sections';
import { cn } from "@/lib/utils";
import { Menu, X } from 'lucide-react';

// 1. SCHEMA: Minimal settings, forcing the "Apple" look
export const schema = [
  { id: 'glassStrength', type: 'slider', min: 0, max: 20, label: 'Blur Strength', defaultValue: 10 },
  { id: 'hideOnScroll', type: 'toggle', label: 'Hide on Scroll Down', defaultValue: true }
];

export const Header = ({ data, settings = {} }: HeaderSectionProps) => {  
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 20);
      
      // Smart Hide Logic (Apple style)
      if (settings.hideOnScroll && currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsHidden(true);
      } else {
        setIsHidden(false);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, settings.hideOnScroll]);

  return (
    <>
      {/* THE FLOATING ISLAND NAV */}
      <header 
        className={cn(
          "fixed top-6 left-0 right-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]", // Apple-like spring curve
          isHidden ? "-translate-y-[150%]" : "translate-y-0"
        )}
      >
        <div 
          className={cn(
            "mx-auto flex items-center justify-between px-6 transition-all duration-500",
            // If scrolled: Compact Pill. If top: Wide Bar.
            isScrolled ? "max-w-4xl bg-white/70 backdrop-blur-xl shadow-lg rounded-full py-3 border border-white/20" : "max-w-7xl py-6 bg-transparent"
          )}
        >
          {/* Logo */}
          <div className="font-semibold tracking-tight text-lg text-black">
            {data.logoUrl ? (
              <img src={data.logoUrl} alt="Logo" className="h-8 w-auto" />
            ) : (
              <span>{data.title}</span>
            )}
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 bg-gray-100/50 p-1 rounded-full">
            {data.navLinks?.map((link, idx) => (
              <a 
                key={idx} 
                href={link.url}
                className="px-5 py-2 text-sm font-medium text-gray-600 rounded-full hover:bg-white hover:shadow-sm transition-all duration-300 hover:text-black"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* CTA Button (Apple Style: Blue or Black Pill) */}
          <div className="flex items-center gap-2">
             <button className="hidden md:block bg-black text-white px-5 py-2.5 rounded-full text-sm font-medium hover:scale-105 transition-transform active:scale-95">
                Book Now
             </button>
             <button className="md:hidden p-2" onClick={() => setIsMobileMenuOpen(true)}>
                <Menu className="w-6 h-6 text-black"/>
             </button>
          </div>
        </div>
      </header>

      {/* Full Screen Mobile Menu (Blur) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-white/90 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-300">
           <button className="absolute top-8 right-8 p-2" onClick={() => setIsMobileMenuOpen(false)}>
              <X className="w-8 h-8 text-black" />
           </button>
           <nav className="flex flex-col gap-6 text-center">
              {data.navLinks?.map((link, idx) => (
                 <a key={idx} href={link.url} className="text-3xl font-bold tracking-tight text-black hover:text-blue-600 transition-colors">
                    {link.label}
                 </a>
              ))}
           </nav>
        </div>
      )}
    </>
  );
};

(Header as any).schema = schema;