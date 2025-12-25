// In src/themes/modern/Header.tsx

import React, { useState, useEffect } from 'react';
import { BlockProps } from '../types';
import { Button } from "@/components/ui/button";
import { Menu, X, ArrowRight } from 'lucide-react';
import { cn } from "@/lib/utils";

const Header: React.FC<BlockProps> = ({ data, allSections, isPreview }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const sections = allSections || [];

    // --- FILTERING LOGIC (Preserved) ---
    const menuItems = sections
        .filter(s => s.isVisible && s.type !== 'header')
        .map(s => {
            const config = data.menuConfig?.[s.id] || {};
            const isAuto = data.autoMenu !== false;
            const isVisible = isAuto 
                ? !!s.data.title 
                : config.visible !== false;

            if (!isVisible) return null;

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

    // --- SCROLL DETECTION ---
    useEffect(() => {
        const handleScroll = () => {
            // Use a small threshold to avoid flickering at the very top
            setIsScrolled(window.scrollY > 20);
        };
        // Passive listener improves scroll performance
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            // Offset for the sticky header height
            const y = element.getBoundingClientRect().top + window.pageYOffset - 80;
            window.scrollTo({ top: y, behavior: 'smooth' });
            setIsMenuOpen(false);
        }
    };

    // Prevent scrolling when mobile menu is open
    useEffect(() => {
         if (isMenuOpen) {
             document.body.style.overflow = 'hidden';
         } else {
             document.body.style.overflow = 'unset';
         }
    }, [isMenuOpen]);

    return (
        <>
        <header 
            className={cn(
                isPreview ? "absolute top-0 left-0 w-full z-50" : "fixed top-0 left-0 w-full z-50 transition-all duration-500 ease-in-out border-b border-transparent",
                // Glass effect logic
                data.isSticky && isScrolled 
                    ? "bg-neutral-950/80 backdrop-blur-md border-white/10 py-3 shadow-lg" 
                    : "bg-transparent py-6"
            )}
        >
            <div className="container mx-auto px-6 h-full flex items-center justify-between">
                
                {/* --- LOGO --- */}
                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    {data.logoImage ? (
                        <img src={data.logoImage} alt="Logo" className="h-10 w-auto transition-transform group-hover:scale-105" />
                    ) : (
                        <span className="text-2xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
                            {data.logoText || "BRAND."}
                        </span>
                    )}
                </div>

                {/* --- DESKTOP NAV --- */}
                <nav className="hidden md:flex items-center gap-1">
                    {menuItems.map(item => (
                        <button 
                            key={item.id} 
                            onClick={() => scrollToSection(item.id)}
                            className="relative px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors group overflow-hidden rounded-full hover:bg-white/5"
                        >
                            <span className="relative z-10">{item.label}</span>
                        </button>
                    ))}
                    
                    {data.ctaText && (
                        <div className="ml-4 pl-4 border-l border-white/10">
                            <Button 
                                size="sm" 
                                asChild
                                className="rounded-full bg-white text-black hover:bg-neutral-200 px-6 font-semibold"
                            >
                                <a href={data.ctaLink || "#contact"}>
                                    {data.ctaText}
                                </a>
                            </Button>
                        </div>
                    )}
                </nav>

                {/* --- MOBILE TOGGLE --- */}
                <button 
                    className="md:hidden p-2 text-white hover:bg-white/10 rounded-full transition-colors z-[60]" 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label="Toggle Menu"
                >
                    {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
            </div>
        </header>

        {/* --- MOBILE FULLSCREEN MENU --- */}
        <div className={cn(
            "fixed inset-0 z-[55] bg-neutral-950 md:hidden flex flex-col items-center justify-center space-y-8 transition-all duration-500 ease-in-out will-change-[opacity,transform]",
            isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}>
            {/* Background Ambience - Reduced blur for mobile performance */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-500/20 blur-[50px] md:blur-[100px] rounded-full pointer-events-none" />

            <div className="flex flex-col items-center gap-6 relative z-10 w-full px-8">
                {menuItems.map((item, idx) => (
                    <button 
                        key={item.id} 
                        onClick={() => scrollToSection(item.id)}
                        className={cn(
                            "text-3xl font-bold text-white/90 hover:text-white transition-all duration-300 transform translate-y-0",
                            isMenuOpen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                        )}
                        style={{ transitionDelay: `${idx * 50}ms` }} 
                    >
                        {item.label}
                    </button>
                ))}

                {data.ctaText && (
                    <div 
                        className={cn(
                            "mt-8 w-full max-w-xs transition-all duration-500",
                            isMenuOpen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                        )}
                        style={{ transitionDelay: `${menuItems.length * 50 + 100}ms` }}
                    >
                        <Button size="lg" className="w-full rounded-full bg-white text-black hover:bg-neutral-200 text-lg h-14" asChild>
                            <a href={data.ctaLink || "#contact"}>
                                {data.ctaText} <ArrowRight className="ml-2 w-5 h-5" />
                            </a>
                        </Button>
                    </div>
                )}
            </div>
        </div>
        </>
    );
};

export default Header;