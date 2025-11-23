// In src/themes/modern/Header.tsx

import React, { useState } from 'react';
import { BlockProps } from '../types';
import { Button } from "@/components/ui/button";
import { Menu, X } from 'lucide-react';
import { cn } from "@/lib/utils";

const Header: React.FC<BlockProps> = ({ data, allSections }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const sections = allSections || [];

  // --- NEW: FILTERING LOGIC ---
  const menuItems = sections
    .filter(s => s.isVisible && s.type !== 'header')
    .map(s => {
        // 1. Get Config
        const config = data.menuConfig?.[s.id] || {};
        
        // 2. Determine Visibility
        // If autoMenu is true (or undefined), show everything that has a title.
        // If autoMenu is false, check the manual 'visible' flag (default to true).
        const isAuto = data.autoMenu !== false;
        const isVisible = isAuto 
            ? !!s.data.title 
            : config.visible !== false;

        if (!isVisible) return null;

        // 3. Determine Label
        const label = isAuto 
            ? (s.data.title || s.type) 
            : (config.label || s.data.title || s.type);

        return {
            label: label,
            id: s.id
        };
    })
    .filter(Boolean) as { label: string, id: string }[];
  // ---------------------------

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
    }
  };

  // ... (The rest of the render function remains exactly the same)
  return (
    <header className={cn("w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/40", data.isSticky ? "sticky top-0" : "relative")}>
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center gap-2 font-bold text-xl">
            {data.logoImage && <img src={data.logoImage} alt="Logo" className="h-8 w-auto" />}
            {data.logoText && <span>{data.logoText}</span>}
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
            {menuItems.map(item => (
                <button 
                    key={item.id} 
                    onClick={() => scrollToSection(item.id)}
                    className="text-sm font-medium hover:text-primary transition-colors"
                >
                    {item.label}
                </button>
            ))}
            {data.ctaText && (
                <Button size="sm" asChild>
                    <a href={data.ctaLink || "#contact"}>{data.ctaText}</a>
                </Button>
            )}
        </nav>

        {/* Mobile Menu Toggle */}
        <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-background border-b p-4 flex flex-col gap-4 shadow-lg animate-in slide-in-from-top-5">
              {menuItems.map(item => (
                <button 
                    key={item.id} 
                    onClick={() => scrollToSection(item.id)}
                    className="text-left text-sm font-medium py-2 border-b border-border/50"
                >
                    {item.label}
                </button>
              ))}
               {data.ctaText && (
                <Button size="sm" className="w-full" asChild>
                    <a href={data.ctaLink || "#contact"}>{data.ctaText}</a>
                </Button>
            )}
          </div>
      )}
    </header>
  );
};

export default Header;