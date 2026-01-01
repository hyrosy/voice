import React from 'react';
import { BlockProps } from '../types';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Mail, Phone, Linkedin, Instagram, Twitter, Globe, MessageCircle } from 'lucide-react';

const Contact: React.FC<BlockProps> = ({ data }) => {
  const variant = data.variant || 'minimal'; // minimal, split, card
  
  // Helper to strip non-numeric characters for WhatsApp links
  const cleanNumber = (num: string) => num.replace(/[^0-9]/g, '');

  // Social Icons Helper
  const SocialIcons = ({ className }: { className?: string }) => (
     <div className={cn("flex gap-4", className)}>
        {data.linkedin && (
           <a href={data.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white/5 hover:bg-white/20 hover:text-white hover:scale-110 transition-all text-neutral-400">
               <Linkedin className="w-5 h-5" />
           </a>
        )}
        {data.instagram && (
           <a href={data.instagram} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white/5 hover:bg-white/20 hover:text-white hover:scale-110 transition-all text-neutral-400">
               <Instagram className="w-5 h-5" />
           </a>
        )}
        {data.twitter && (
           <a href={data.twitter} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white/5 hover:bg-white/20 hover:text-white hover:scale-110 transition-all text-neutral-400">
               <Twitter className="w-5 h-5" />
           </a>
        )}
        {data.website && (
           <a href={data.website} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white/5 hover:bg-white/20 hover:text-white hover:scale-110 transition-all text-neutral-400">
               <Globe className="w-5 h-5" />
           </a>
        )}
     </div>
  );

  // Button Cluster Helper
  const ContactActions = ({ align = "center" }: { align?: "center" | "start" }) => (
      <div className={cn("flex flex-wrap gap-4 pt-4", align === "center" ? "justify-center" : "justify-start")}>
          {/* 1. Main Email Button */}
          <Button asChild size="lg" className="h-12 px-8 rounded-full text-base shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all bg-white text-black hover:bg-neutral-200">
                <a href={`mailto:${data.email}`}>
                    <Mail className="mr-2 w-4 h-4" /> {data.ctaText || "Email Me"}
                </a>
          </Button>

          {/* 2. WhatsApp Button (If exists) */}
          {data.whatsapp && (
              <Button asChild size="lg" variant="outline" className="h-12 px-6 rounded-full border-green-500/50 text-green-400 hover:bg-green-500/10 hover:text-green-300 hover:border-green-400">
                  <a href={`https://wa.me/${cleanNumber(data.whatsapp)}`} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="mr-2 w-4 h-4" /> WhatsApp
                  </a>
              </Button>
          )}

          {/* 3. Phone Link (If exists) */}
          {data.phone && (
              <Button asChild size="lg" variant="outline" className="h-12 px-6 rounded-full border-white/10 hover:bg-white/10 hover:text-white hover:border-white/30 text-neutral-400">
                  <a href={`tel:${data.phone}`}>
                      <Phone className="mr-2 w-4 h-4" /> Call
                  </a>
              </Button>
          )}
      </div>
  );

  return (
    <section className="relative py-24 md:py-32 bg-neutral-950 overflow-hidden text-white" id="contact">
       
       {/* Global Texture & Glow */}
       <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay pointer-events-none"></div>
       
       {/* VARIANT 1: MINIMAL (Centered) */}
       {variant === 'minimal' && (
           <div className="container mx-auto px-4 relative z-10 text-center">
               <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                   {/* Title */}
                   <h2 className="text-4xl md:text-6xl font-bold tracking-tight">{data.title || "Let's Work Together"}</h2>
                   <div className="h-1 w-20 bg-primary mx-auto rounded-full" />
                   
                   {/* Subtitle */}
                   {data.subheadline && (
                       <p className="text-lg md:text-xl text-neutral-400 leading-relaxed max-w-2xl mx-auto">
                           {data.subheadline}
                       </p>
                   )}
                   
                   {/* Actions */}
                   <div className="pt-2">
                       <ContactActions align="center" />
                   </div>

                   {/* Socials */}
                   <div className="pt-8 border-t border-white/10 w-full flex justify-center mt-8">
                       <SocialIcons />
                   </div>
               </div>
           </div>
       )}

       {/* VARIANT 2: SPLIT (Image Left, Info Right) */}
       {variant === 'split' && (
           <div className="container mx-auto px-4 relative z-10">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                   
                   {/* Image Side */}
                   <div className="relative aspect-[4/5] lg:aspect-square rounded-2xl overflow-hidden shadow-2xl bg-neutral-900 border border-white/10 group order-2 lg:order-1">
                       {data.image ? (
                           <img src={data.image} alt="Contact" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100" />
                       ) : (
                           <div className="w-full h-full flex items-center justify-center bg-neutral-900 text-neutral-700">
                               <Mail className="w-20 h-20 opacity-20" />
                           </div>
                       )}
                   </div>

                   {/* Info Side */}
                   <div className="space-y-8 lg:pl-10 order-1 lg:order-2">
                       <div className="space-y-4">
                           <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">{data.title || "Get In Touch"}</h2>
                           <div className="h-1 w-24 bg-primary rounded-full" />
                           {data.subheadline && (
                               <p className="text-lg text-neutral-400 leading-relaxed">
                                   {data.subheadline}
                               </p>
                           )}
                       </div>
                       
                       <ContactActions align="start" />

                       <div className="pt-8">
                           <SocialIcons />
                       </div>
                   </div>
               </div>
           </div>
       )}

       {/* VARIANT 3: CARD (Floating Glass) */}
       {variant === 'card' && (
           <>
               {/* Background Image with Blur */}
               {data.image && (
                   <div className="absolute inset-0 z-0">
                       <img src={data.image} className="w-full h-full object-cover opacity-30 blur-xl scale-110" alt="bg" />
                       <div className="absolute inset-0 bg-black/60" />
                   </div>
               )}

               <div className="container mx-auto px-4 relative z-10 flex justify-center">
                   <div className="w-full max-w-2xl bg-neutral-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-700">
                       
                       <h2 className="text-3xl md:text-5xl font-bold tracking-tight">{data.title || "Contact Me"}</h2>
                       
                       {data.subheadline && (
                           <p className="text-neutral-300 leading-relaxed">
                               {data.subheadline}
                           </p>
                       )}
                       
                       <div className="pt-2">
                           <ContactActions align="center" />
                       </div>

                       <div className="pt-6 border-t border-white/5 flex flex-col items-center gap-4 mt-4">
                           <span className="text-xs uppercase tracking-widest text-neutral-500">Connect Socially</span>
                           <SocialIcons />
                       </div>
                   </div>
               </div>
           </>
       )}

    </section>
  );
};

export default Contact;