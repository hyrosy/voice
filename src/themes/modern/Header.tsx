import React, { useState, useEffect } from 'react';
import { BlockProps } from '../types';
import { Button } from "@/components/ui/button";
import { Menu, X, ArrowRight } from 'lucide-react';
import { cn } from "@/lib/utils";

const Header: React.FC<BlockProps> = ({ data, allSections, isPreview }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const sections = allSections || [];
    const variant = data.variant || 'transparent'; 
    const isSticky = data.isSticky !== false;

    // --- MENU GENERATION ---
    const menuItems = sections
        .filter(s => s.isVisible && s.type !== 'header')
        .map(s => {
            const config = data.menuConfig?.[s.id] || {};
            const isAuto = data.autoMenu !== false;
            const isVisible = isAuto ? !!s.data.title : config.visible !== false;
            if (!isVisible) return null;
            return {
                label: isAuto ? (s.data.title || s.type) : (config.label || s.data.title || s.type),
                id: s.id
            };
        })
        .filter(Boolean) as { label: string, id: string }[];

    // --- SCROLL LISTENER ---
    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY || document.documentElement.scrollTop;
            setIsScrolled(scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            const y = element.getBoundingClientRect().top + window.pageYOffset - 80;
            window.scrollTo({ top: y, behavior: 'smooth' });
            setIsMenuOpen(false);
        }
    };

    // --- THE FIXED CLASS LOGIC ---
    const headerClasses = cn(
        "z-50 transition-all duration-500 ease-in-out w-full left-0",
        
        // POSITIONAL LOGIC:
        isPreview 
            ? "sticky top-0 mb-[-80px]" 
            : (isSticky ? "fixed top-0" : "absolute top-0"),

        // === FLOATING ISLAND ===
        variant === 'floating' 
            ? cn(
                "right-0 mx-auto max-w-5xl rounded-full border border-white/10 bg-neutral-900/60 backdrop-blur-md px-6 py-3 shadow-2xl w-[95%]",
                "top-4" // Floating always sits slightly down
              )
            : cn(
                "border-b border-transparent py-4",
                "top-0"
            ),
        
        // === BACKGROUND STATE ===
        (variant !== 'floating' && isSticky && isScrolled) 
            ? "bg-neutral-950/80 backdrop-blur-md border-white/10 py-3 shadow-lg"
            : "",
            
        // Transparent state when at top
        (!isScrolled && variant !== 'floating') && "bg-transparent"
    );

    // --- SUB-COMPONENTS ---
    const Logo = () => (
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            {data.logoImage ? (
                <img 
                    src={data.logoImage} 
                    alt="Logo" 
                    // Mobile: h-10 (40px) fixed. Desktop: var(--logo-h) from slider.
                    className="w-auto object-contain transition-transform group-hover:scale-105 h-10 md:h-[var(--logo-h)]" 
                    style={{ 
                        '--logo-h': `${data.logoHeight || 40}px` 
                    } as React.CSSProperties}
                />
            ) : (
                <span className="text-xl md:text-2xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
                    {data.logoText || "BRAND."}
                </span>
            )}
        </div>
    );

    const DesktopNav = () => (
        <nav className="hidden md:flex items-center gap-1">
            {menuItems.map(item => (
                <button 
                    key={item.id} 
                    onClick={() => scrollToSection(item.id)}
                    className="relative px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors group rounded-full hover:bg-white/5"
                >
                    {item.label}
                </button>
            ))}
        </nav>
    );

    const CTA = () => data.ctaText && (
        <Button size="sm" asChild className="rounded-full bg-white text-black hover:bg-neutral-200 px-6 font-semibold h-10 hidden md:flex">
            <a href={data.ctaLink || "#contact"}>{data.ctaText}</a>
        </Button>
    );

    return (
        <>
            <header className={headerClasses}>
                <div className={cn("container mx-auto h-full flex items-center", variant === 'floating' ? "px-0" : "px-6")}>
                    
                    {/* TRANSPARENT */}
                    {variant === 'transparent' && (
                        <div className="w-full flex items-center justify-between">
                            <Logo />
                            <div className="flex items-center gap-4">
                                <DesktopNav />
                                <div className="pl-4 ml-2 border-l border-white/10 hidden md:block"><CTA /></div>
                                <button className="md:hidden p-2 text-white" onClick={() => setIsMenuOpen(true)}><Menu /></button>
                            </div>
                        </div>
                    )}

                    {/* CENTERED */}
                    {variant === 'centered' && (
                        <div className="w-full grid grid-cols-3 items-center">
                            <div className="justify-self-start">
                                 <div className="hidden md:block"><DesktopNav /></div>
                                 <button className="md:hidden p-2 text-white" onClick={() => setIsMenuOpen(true)}><Menu /></button>
                            </div>
                            <div className="justify-self-center"><Logo /></div>
                            <div className="justify-self-end"><CTA /></div>
                        </div>
                    )}

                    {/* FLOATING */}
                    {variant === 'floating' && (
                        <div className="w-full flex items-center justify-between">
                            <Logo />
                            <div className="hidden md:block absolute left-1/2 -translate-x-1/2"><DesktopNav /></div>
                            <div className="flex items-center gap-2">
                                <CTA />
                                <button className="md:hidden p-2 text-white" onClick={() => setIsMenuOpen(true)}><Menu /></button>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* MOBILE MENU */}
            <div className={cn(
                "fixed inset-0 z-[60] bg-neutral-950 md:hidden flex flex-col items-center justify-center space-y-8 transition-all duration-500 ease-in-out",
                isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            )}>
                <button className="absolute top-6 right-6 p-2 text-white/50 hover:text-white" onClick={() => setIsMenuOpen(false)}><X size={32} /></button>
                <div className="flex flex-col items-center gap-6 relative z-10 w-full px-8 pt-10 h-full overflow-y-auto justify-center">
                    {menuItems.map((item, idx) => (
                        <button 
                            key={item.id} 
                            onClick={() => scrollToSection(item.id)}
                            className={cn("text-3xl font-bold text-white/90 hover:text-white transition-all duration-300 transform", isMenuOpen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0")}
                            style={{ transitionDelay: `${idx * 50}ms` }} 
                        >
                            {item.label}
                        </button>
                    ))}
                    {data.ctaText && (
                        <div className={cn("mt-8 w-full max-w-xs transition-all duration-500", isMenuOpen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0")} style={{ transitionDelay: `${menuItems.length * 50 + 100}ms` }}>
                            <Button size="lg" className="w-full rounded-full bg-white text-black hover:bg-neutral-200 text-lg h-14" asChild>
                                <a href={data.ctaLink || "#contact"}>{data.ctaText} <ArrowRight className="ml-2 w-5 h-5" /></a>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Header;