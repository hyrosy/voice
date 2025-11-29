import React from 'react';
import { Mail, Phone, MapPin, Facebook, Instagram, Twitter, Linkedin, ArrowUpRight, Globe, RefreshCw, Copyright, Heart, ArrowUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// --- DATA ---
const socialLinks = [
  { icon: Linkedin, href: "https://www.linkedin.com/in/hamza-ea/", label: "LinkedIn", username: "@hamza-ea" },
  { icon: Instagram, href: "https://instagram.com/ucpmaroc", label: "Instagram", username: "@ucpmaroc" },
  { icon: Facebook, href: "https://facebook.com/ucpmaroc", label: "Facebook", username: "@ucpmaroc" },
  { icon: Twitter, href: "https://twitter.com/ucpmaroc", label: "Twitter", username: "@ucpmaroc" },
];

const services = [
  { text: "Digital Marketing", href: "/digital-marketing" },
  { text: "Web Development", href: "/software-development" },
  { text: "Videography", href: "/cinema-portfolio" },
  { text: "Voice Over", href: "/voiceover" },
];

const legalLinks = [
  { text: "Privacy Policy", href: "/privacy-policy" },
  { text: "Terms of Service", href: "/terms-of-service" },
];

// --- SUB-COMPONENTS ---

const BigLink = ({ href, text, count }: { href: string, text: string, count: string }) => (
  <Link 
    to={href} 
    className="group flex items-center justify-between py-5 border-b border-white/5 hover:border-white/20 hover:pl-6 transition-all duration-500"
  >
    <div className="flex items-center gap-4">
        <span className="text-xs font-mono text-white/30 group-hover:text-yellow-500 transition-colors">/{count}</span>
        <span className="text-2xl md:text-3xl font-bold tracking-tight text-white/80 group-hover:text-white transition-colors">
          {text}
        </span>
    </div>
    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:rotate-45">
        <ArrowUpRight className="w-5 h-5 text-yellow-500" />
    </div>
  </Link>
);

const Footer = () => {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const handleResetTranslation = () => {
    document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.' + window.location.hostname;
    window.location.reload();
  };

  return (
    <footer className="relative bg-[#050505] text-white pt-24 overflow-hidden border-t border-white/5">
      
      {/* --- BACKGROUND TEXTURES (Consistent with Hero) --- */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
          
          {/* 1. TOP SECTION: MASSIVE CTA */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-12 mb-24">
              <div className="relative">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold uppercase tracking-widest mb-6">
                      <Heart className="w-3 h-3 animate-pulse" /> Partner With Us
                  </div>
                  <h2 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.9] text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/50">
                      LET'S <br/>
                      SCALE.
                  </h2>
              </div>
              
              <div className="flex flex-col items-start lg:items-end gap-8">
                  <p className="max-w-md text-lg text-neutral-400 font-light leading-relaxed lg:text-right">
                      We combine creative talent with AI-powered strategies to build ecosystems, not just websites.
                  </p>
                  <Button 
                    onClick={scrollToTop} 
                    size="lg" 
                    className="h-20 px-12 text-xl rounded-full bg-white text-black hover:bg-neutral-200 transition-all hover:scale-105 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
                  >
                      Start a Project <ArrowUp className="ml-3 w-6 h-6" />
                  </Button>
              </div>
          </div>

          {/* 2. MIDDLE SECTION: THE GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 border-t border-white/10 pt-16 pb-16">
              
              {/* Column 1: Navigation (Span 5) */}
              <div className="lg:col-span-5">
                  <h3 className="text-xs font-mono uppercase tracking-widest mb-8 text-neutral-500">Menu</h3>
                  <div className="flex flex-col">
                      {services.map((s, i) => (
                          <BigLink key={s.text} href={s.href} text={s.text} count={`0${i+1}`} />
                      ))}
                  </div>
              </div>

              {/* Column 2: Contact Info (Span 3) */}
              <div className="lg:col-span-3">
                  <h3 className="text-xs font-mono uppercase tracking-widest mb-8 text-neutral-500">Contact</h3>
                  
                  <div className="space-y-10">
                      <div className="group cursor-pointer">
                          <p className="text-xs text-neutral-500 mb-2 group-hover:text-yellow-400 transition-colors">Drop us a line</p>
                          <a href="mailto:Support@ucpmaroc.com" className="text-xl font-bold text-white hover:text-neutral-300 transition-colors">Support@ucpmaroc.com</a>
                      </div>

                      <div className="group cursor-pointer">
                          <p className="text-xs text-neutral-500 mb-2 group-hover:text-yellow-400 transition-colors">Call anytime</p>
                          <a href="tel:+12094426729" className="text-xl font-bold text-white hover:text-neutral-300 transition-colors">+1 (209) 442-6729</a>
                      </div>

                      <div>
                          <p className="text-xs text-neutral-500 mb-3">Headquarters</p>
                          <address className="not-italic text-base text-neutral-300 leading-relaxed p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
                              30 N Gould St Ste R <br/> Sheridan, WY 82801, US
                          </address>
                      </div>
                  </div>
              </div>

              {/* Column 3: Socials & Tools (Span 4) */}
              <div className="lg:col-span-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-mono uppercase tracking-widest mb-8 text-neutral-500">Connect</h3>
                    <div className="grid grid-cols-1 gap-3">
                        {socialLinks.map((social) => (
                            <a 
                               key={social.label} 
                               href={social.href} 
                               target="_blank" 
                               rel="noopener noreferrer"
                               className="group flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white hover:text-black transition-all duration-300"
                            >
                                <div className="p-2 bg-black/20 rounded-full group-hover:bg-neutral-200 group-hover:text-black transition-colors">
                                    <social.icon size={18} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-sm tracking-wide">{social.label}</span>
                                    <span className="text-xs text-neutral-500 group-hover:text-neutral-600 font-mono">{social.username}</span>
                                </div>
                                <ArrowUpRight className="ml-auto w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                            </a>
                        ))}
                    </div>
                  </div>

                  {/* Google Translate - Styled Pill */}
                  <div className="mt-12">
                      <div className="p-1 pl-4 rounded-full bg-white/5 border border-white/10 flex items-center justify-between backdrop-blur-md">
                          <div className="flex items-center gap-2">
                             <Globe size={14} className="text-neutral-400"/>
                             <span className="text-xs font-medium text-neutral-300">Language</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button onClick={handleResetTranslation} className="p-2 hover:bg-white/10 rounded-full text-neutral-400 hover:text-white transition-colors">
                                <RefreshCw size={14} />
                            </button>
                            {/* Google Widget Container - Scaled down to fit pill */}
                            <div className="relative overflow-hidden w-32 h-8">
                                <div id="google_translate_element" className="absolute -top-3 -left-2 scale-75 origin-top-left" />
                            </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* 3. BOTTOM SECTION: THE MASSIVE ANCHOR */}
      <div className="relative w-full overflow-hidden pt-12">
           <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
           
           {/* Huge Text */}
           <h1 className="text-[15vw] leading-[0.75] font-black tracking-tighter text-center select-none text-white/[0.03] pointer-events-none">
               UCPMAROC
           </h1>

           {/* Copyright Bar Overlay */}
           <div className="absolute bottom-6 w-full px-6">
                <div className="container mx-auto flex flex-col md:flex-row justify-between items-center text-[10px] md:text-xs uppercase font-bold tracking-widest text-neutral-500">
                    <div className="flex items-center gap-4 mb-2 md:mb-0">
                        <span className="flex items-center gap-1"><Copyright size={12} /> {new Date().getFullYear()} HYROSY LLC</span>
                        <span className="hidden md:inline">•</span>
                        <div className="flex gap-4">
                            {legalLinks.map(link => (
                                <Link key={link.text} to={link.href} className="hover:text-white transition-colors">{link.text}</Link>
                            ))}
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span>All Systems Operational</span>
                    </div>
                </div>
           </div>
      </div>

    </footer>
  );
};

export default Footer;