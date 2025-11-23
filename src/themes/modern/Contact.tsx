// In src/themes/modern/Contact.tsx

import React from 'react';
import { BlockProps } from '../types';
import { Button } from "@/components/ui/button";
import { Mail, Instagram, Linkedin, Globe, Twitter, Phone, ArrowUpRight } from 'lucide-react';
import { cn } from "@/lib/utils";

const Contact: React.FC<BlockProps> = ({ data }) => {
  
  // Helper to render social links uniformly
  const SocialLink = ({ href, icon: Icon, label }: { href: string, icon: any, label: string }) => (
    <a 
      href={href} 
      target="_blank" 
      rel="noreferrer" 
      className="group flex items-center justify-center p-4 rounded-full bg-white/5 border border-white/10 hover:bg-white hover:border-white transition-all duration-300"
      aria-label={label}
    >
      <Icon className="w-5 h-5 text-white group-hover:text-black transition-colors" />
    </a>
  );

  return (
    <section className="relative py-24 px-4 bg-neutral-950 overflow-hidden flex items-center justify-center min-h-[80vh]">
        
        {/* --- Background Ambient Glow --- */}
        {/* This creates a subtle light source behind the card */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none opacity-40" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>

        {/* --- The Glass Card --- */}
        <div className="relative w-full max-w-4xl mx-auto z-10">
            <div className="rounded-[3rem] border border-white/10 bg-neutral-900/50 backdrop-blur-2xl p-8 md:p-16 text-center shadow-2xl relative overflow-hidden">
                
                {/* Decorative sheen */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

                <div className="space-y-8 relative z-10">
                    
                    {/* Typography */}
                    <div className="space-y-4">
                        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white drop-shadow-sm">
                            {data.title || "Let's Work Together"}
                        </h2>
                        <p className="text-lg md:text-xl text-neutral-400 max-w-xl mx-auto leading-relaxed">
                            {data.description || "Ready to start your project? Let's build something amazing together."}
                        </p>
                    </div>

                    {/* Main Actions */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Button 
                            size="lg" 
                            className="h-16 px-10 rounded-full bg-white text-black hover:bg-neutral-200 text-lg font-medium transition-transform active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                        >
                            <Mail className="mr-2 h-5 w-5" />
                            {data.emailText || "Email Me"}
                        </Button>

                        {data.showPhone && (
                            <Button 
                                variant="outline" 
                                size="lg" 
                                className="h-16 px-10 rounded-full border-white/20 bg-transparent text-white hover:bg-white/10 text-lg font-medium backdrop-blur-md"
                            >
                                <Phone className="mr-2 h-5 w-5" />
                                Schedule Call
                            </Button>
                        )}
                    </div>

                    {/* Socials Row */}
                    <div className="pt-12 border-t border-white/5 flex flex-wrap justify-center gap-4">
                        {data.instagram && <SocialLink href={data.instagram} icon={Instagram} label="Instagram" />}
                        {data.linkedin && <SocialLink href={data.linkedin} icon={Linkedin} label="LinkedIn" />}
                        {data.twitter && <SocialLink href={data.twitter} icon={Twitter} label="Twitter" />}
                        {data.website && <SocialLink href={data.website} icon={Globe} label="Website" />}
                    </div>

                    {/* Footer Message */}
                    {data.customMessage && (
                        <p className="text-sm text-neutral-500 font-mono mt-8">
                            {data.customMessage}
                        </p>
                    )}
                </div>
            </div>
        </div>
    </section>
  );
};

export default Contact;