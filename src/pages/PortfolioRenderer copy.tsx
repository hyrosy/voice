import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { PortfolioSection } from '../types/portfolio';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Loader2, Mail, Instagram, Linkedin, Globe, Twitter } from 'lucide-react';
import ReactPlayer from 'react-player';

// --- THEME APPLIER ---
// This helper applies the theme config to the container
const ThemeWrapper = ({ children, theme }: { children: React.ReactNode, theme: any }) => {
  // Map font IDs to Tailwind classes
  const fontClass = theme?.font === 'serif' ? 'font-serif' : theme?.font === 'mono' ? 'font-mono' : 'font-sans';
  
  // Map color IDs to Tailwind text/bg classes (simplified)
  // In a real app, you might set CSS variables here.
  // For now, we will pass the 'primaryColor' down or use a data-attribute.
  
  return (
    <div 
      className={cn("min-h-screen bg-background text-foreground", fontClass)}
      data-theme={theme?.templateId} 
      // You could use this data-attribute to toggle different layouts in CSS if you wanted
    >
      {children}
    </div>
  );
};


// --- BLOCK COMPONENTS ---

const HeroBlock = ({ data }: { data: any }) => (
  <section className="relative h-[500px] flex items-center justify-center text-center text-white overflow-hidden">
     {data.backgroundImage ? (
        <div className="absolute inset-0">
           <img src={data.backgroundImage} alt="Hero" className="w-full h-full object-cover" />
           <div className="absolute inset-0 bg-black/50" />
        </div>
     ) : (
        <div className="absolute inset-0 bg-slate-900" />
     )}
     
     <div className="relative z-10 px-4 max-w-3xl">
        <h1 className="text-5xl md:text-7xl font-bold mb-4">{data.headline}</h1>
        <p className="text-xl md:text-2xl text-white/80">{data.subheadline}</p>
     </div>
  </section>
);

const AboutBlock = ({ data }: { data: any }) => (
  <section className="py-20 px-4 container max-w-5xl mx-auto">
     <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {data.image && (
           <div className="order-last md:order-first">
              <img src={data.image} alt="About" className="rounded-xl shadow-2xl w-full object-cover aspect-[3/4]" />
           </div>
        )}
        <div>
           <h2 className="text-3xl font-bold mb-6">{data.title}</h2>
           <p className="text-lg text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {data.content}
           </p>
        </div>
     </div>
  </section>
);

const GalleryBlock = ({ data }: { data: any }) => {
    if (!data.images || data.images.length === 0) return null;

    return (
        <section className="py-20 px-4 bg-muted/30">
            <div className="container max-w-6xl mx-auto">
                <h2 className="text-3xl font-bold text-center mb-12">{data.title}</h2>
                {/* Masonry-style grid using CSS columns */}
                <div className="columns-1 sm:columns-2 md:columns-3 gap-4 space-y-4">
                    {data.images.map((img: any, i: number) => (
                        <div key={i} className="break-inside-avoid rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow">
                            <img src={img.url} alt="" className="w-full h-auto" />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const ServicesBlock = ({ data, actorId }: { data: any, actorId: string }) => {
    // In a real implementation, you might want to fetch the live rates from the 'actors' table here
    // For now, we will just render a placeholder or static text if added.
    return (
        <section className="py-20 px-4 container max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-12">{data.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {/* Placeholder cards - you'd ideally fetch these */}
                 <Card>
                    <CardContent className="p-6 pt-8">
                        <h3 className="font-bold text-xl mb-2">Voice Over</h3>
                        {data.showRates && <p className="text-primary font-semibold">Ask for Quote</p>}
                    </CardContent>
                 </Card>
                 {/* You can expand this to fetch real service data later */}
            </div>
        </section>
    );
}

const ContactBlock = ({ data }: { data: any }) => (
    <section className="py-24 px-4 bg-slate-900 text-white text-center">
        <div className="container max-w-2xl mx-auto">
            <h2 className="text-4xl font-bold mb-8">{data.title}</h2>
            <p className="text-xl text-slate-300 mb-10">Ready to start your project? Let's talk.</p>
            
            <Button size="lg" className="text-lg px-8 py-6 rounded-full bg-white text-black hover:bg-slate-200">
                <Mail className="mr-2 h-5 w-5" />
                {data.emailText || "Contact Me"}
            </Button>

            <div className="flex justify-center gap-6 mt-12">
                {data.instagram && <a href={data.instagram} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors"><Instagram size={24} /></a>}
                {data.linkedin && <a href={data.linkedin} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors"><Linkedin size={24} /></a>}
                {data.twitter && <a href={data.twitter} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors"><Twitter size={24} /></a>}
                {data.website && <a href={data.website} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors"><Globe size={24} /></a>}
            </div>
        </div>
    </section>
);


// --- MAIN RENDERER ---

const PortfolioRenderer = () => {
  const { slug } = useParams<{ slug: string }>();
  const [portfolio, setPortfolio] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPortfolio = async () => {
        // 1. First, find the actor by their name/slug
        // Note: We are querying the 'actors' table to find the ID, 
        // then the 'portfolios' table.
        // Ideally, 'public_slug' should be on the 'portfolios' table directly to save a join.
        // BUT, your builder saves 'is_published' and 'sections'.
        // Does it save 'public_slug'? Check your 'handleSave' in PortfolioBuilderPage.
        // It doesn't seem to save 'public_slug' explicitly in the code I gave you.
        // Let's assume we look up by the Actor's Name (slug) from the 'actors' table first.

        const { data: actorData, error: actorError } = await supabase
            .from('actors')
            .select('id')
            .eq('ActorName', slug) // Using ActorName as the slug for now based on your URL
            .single();

        if (actorError || !actorData) {
            setError(true);
            setLoading(false);
            return;
        }

        // 2. Fetch the portfolio
        const { data: portfolioData, error: portfolioError } = await supabase
            .from('portfolios')
            .select('*')
            .eq('actor_id', actorData.id)
            .eq('is_published', true) // Only show if published
            .single();
        
        if (portfolioError || !portfolioData) {
            setError(true);
        } else {
            setPortfolio(portfolioData);
        }
        setLoading(false);
    };

    if (slug) fetchPortfolio();
  }, [slug]);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  
  if (error || !portfolio) {
      return (
          <div className="h-screen flex flex-col items-center justify-center text-center p-4">
              <h1 className="text-2xl font-bold mb-2">Portfolio Not Found</h1>
              <p className="text-muted-foreground">This page does not exist or has not been published yet.</p>
          </div>
      );
  }

  const sections = portfolio.sections as PortfolioSection[];
  const theme = portfolio.theme_config || {};

  return (
    <ThemeWrapper theme={theme}>
        {sections
            .filter(section => section.isVisible)
            .map(section => {
                switch (section.type) {
                    case 'hero': return <HeroBlock key={section.id} data={section.data} />;
                    case 'about': return <AboutBlock key={section.id} data={section.data} />;
                    case 'gallery': return <GalleryBlock key={section.id} data={section.data} />;
                    case 'services': return <ServicesBlock key={section.id} data={section.data} actorId={portfolio.actor_id} />;
                    case 'contact': return <ContactBlock key={section.id} data={section.data} />;
                    // Add other blocks (stats, demos, reviews) here...
                    default: return null;
                }
            })
        }
    </ThemeWrapper>
  );
};

export default PortfolioRenderer;