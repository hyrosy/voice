import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { PortfolioSection } from '../types/portfolio';
import { cn } from "@/lib/utils";
import { Loader2 } from 'lucide-react';
import BuilderFooter from '@/components/builderfooter';
// // Import the registry
import { THEME_REGISTRY, DEFAULT_THEME } from '../themes/registry';


// --- 1. DEFINE THE THEME WRAPPER HERE ---
const ThemeWrapper = ({ children, theme }: { children: React.ReactNode, theme: any }) => {
  // Map font IDs to Tailwind classes
  const fontClass = theme?.font === 'serif' ? 'font-serif' : theme?.font === 'mono' ? 'font-mono' : 'font-sans';
  
  // We can also apply the primary color as a CSS variable if needed
  // For now, we rely on Tailwind classes, but this wrapper is the place to inject dynamic styles.
  const style = theme?.primaryColor ? { '--primary-color': theme.primaryColor } as React.CSSProperties : {};

  return (
    <div 
      className={cn("min-h-screen bg-background text-foreground", fontClass)}
      data-theme={theme?.templateId} 
      style={style}
    >
      {children}
    </div>
  );
};

// --- MAIN RENDERER ---
const PortfolioRenderer = () => {
  const { slug } = useParams<{ slug: string }>();
  const [portfolio, setPortfolio] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPortfolio = async () => {
        // 1. Find actor by SLUG (case-insensitive)
        // We check BOTH the 'slug' column AND 'ActorName' just in case
        const { data: actorData, error: actorError } = await supabase
            .from('actors')
            .select('id')
            .or(`slug.ilike.${slug},ActorName.ilike.${slug}`) // Checks both columns!
            .single();

        if (actorError || !actorData) {
             console.error("Actor not found for slug:", slug, actorError); // Debug log
             setError(true);
             setLoading(false);
             return;
        }

        // 2. Fetch portfolio
        const { data: portfolioData, error: portfolioError } = await supabase
            .from('portfolios')
            .select('*')
            .eq('actor_id', actorData.id)
            .eq('is_published', true)
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
  
  // Determine Active Theme
  const themeId = portfolio.theme_config?.templateId || 'modern';
  const ActiveTheme = THEME_REGISTRY[themeId] || DEFAULT_THEME;

  return (
    <ThemeWrapper theme={portfolio.theme_config}>
        {sections
            .filter(section => section.isVisible)
            .map(section => {
                // --- THIS WRAPPER IS CRITICAL ---
                return (
                    <div id={section.id} key={section.id} className="scroll-mt-20"> 
                    {/* scroll-mt-20 adds a margin-top on scroll so the sticky header doesn't cover the content */}
                        {(() => {
                             switch (section.type) {
                    case 'hero': return <ActiveTheme.Hero key={section.id} data={section.data} />;
                    case 'about': return <ActiveTheme.About key={section.id} data={section.data} />;
                    case 'gallery': return <ActiveTheme.Gallery key={section.id} data={section.data} />;
                    case 'services_showcase': return <ActiveTheme.ServicesShowcase key={section.id} data={section.data} actorId={portfolio.actor_id} />;
                    case 'contact': return <ActiveTheme.Contact key={section.id} data={section.data} />;
                    case 'stats': return <ActiveTheme.Stats key={section.id} data={section.data} />;
                    case 'reviews': return <ActiveTheme.Reviews key={section.id} data={section.data} />;
                    case 'image_slider': return <ActiveTheme.ImageSlider key={section.id} data={section.data} />;
                    case 'video_slider': return <ActiveTheme.VideoSlider key={section.id} data={section.data} />;
                    case 'header': return <ActiveTheme.Header data={section.data} allSections={sections} />; // <-- Pass allSections!
                    case 'team': return <ActiveTheme.Team key={section.id} data={section.data} />;
                    case 'map': return <ActiveTheme.Map key={section.id} data={section.data} />;
                    case 'pricing': return <ActiveTheme.Pricing key={section.id} data={section.data} />;
                    default: return null;
                }
                        })()}
                    </div>
                );
                // --------------------------------
            })
        }

    <BuilderFooter />
    </ThemeWrapper>
    
    
    
  );
};

export default PortfolioRenderer;