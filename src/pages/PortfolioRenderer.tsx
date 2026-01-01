import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { PortfolioSection } from '../types/portfolio';
import { cn, hexToHSL } from "@/lib/utils";
import { Loader2 } from 'lucide-react';
import { THEME_REGISTRY, DEFAULT_THEME } from '../themes/registry';

const COLOR_PALETTES = [
  { id: 'violet', value: '#8b5cf6' },
  { id: 'blue', value: '#3b82f6' },
  { id: 'emerald', value: '#10b981' },
  { id: 'rose', value: '#f43f5e' },
  { id: 'amber', value: '#f59e0b' },
  { id: 'slate', value: '#64748b' },
];

const ThemeWrapper = ({ children, theme }: { children: React.ReactNode, theme: any }) => {
  const fontClass = theme?.font === 'serif' ? 'font-serif' : theme?.font === 'mono' ? 'font-mono' : 'font-sans';
  const activeColorObj = COLOR_PALETTES.find(c => c.id === theme?.primaryColor) || COLOR_PALETTES[0];
  const primaryHSL = hexToHSL(activeColorObj.value);

  const style = {
    '--primary': primaryHSL,
    '--ring': primaryHSL,
  } as React.CSSProperties;

  return (
    <div 
      className={cn(
          "min-h-screen bg-background text-foreground", 
          fontClass,
          "subpixel-antialiased" // <--- REMOVED "transform-gpu" FROM HERE
      )}
      data-theme={theme?.templateId} 
      style={style}
    >
      {children}
    </div>
  );
};

// --- UPDATE INTERFACE ---
// We allow passing "editorData" directly so the Editor doesn't need to fetch from Supabase
interface PortfolioRendererProps {
    editorData?: any; // Optional: If passed, we use this instead of fetching
    isPreview?: boolean; // Optional: Tells components we are in builder mode
}

const PortfolioRenderer: React.FC<PortfolioRendererProps> = ({ editorData, isPreview = false }) => {
  const { slug } = useParams<{ slug: string }>();
  const [portfolio, setPortfolio] = useState<any>(editorData || null);
  const [loading, setLoading] = useState(!editorData);
  const [error, setError] = useState(false);

  // Sync editorData if it changes (for live preview in builder)
  useEffect(() => {
      if (editorData) {
          setPortfolio(editorData);
          setLoading(false);
      }
  }, [editorData]);

  useEffect(() => {
    // Only fetch if we DON'T have editorData and DO have a slug
    if (!editorData && slug) {
        const fetchPortfolio = async () => {
            const { data: actorData, error: actorError } = await supabase
                .from('actors')
                .select('id')
                .or(`slug.ilike.${slug},ActorName.ilike.${slug}`)
                .single();

            if (actorError || !actorData) {
                console.error("Actor not found:", slug);
                setError(true);
                setLoading(false);
                return;
            }

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
        fetchPortfolio();
    }
  }, [slug, editorData]);

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
  const themeId = portfolio.theme_config?.templateId || 'modern';
  const ActiveTheme = THEME_REGISTRY[themeId] || DEFAULT_THEME;

  return (
    <ThemeWrapper theme={portfolio.theme_config}>
        {sections
            .filter(section => section.isVisible)
            .map(section => {
                // --- CRITICAL: Z-INDEX MANAGEMENT ---
                // Headers must be z-50 to float above everything else
                // Content sections get z-0 so they create a new stacking context
                const zIndexClass = section.type === 'header' ? 'relative z-50' : 'relative z-0';

                return (
                    <div id={section.id} key={section.id} className={`scroll-mt-20 ${zIndexClass}`}> 
                        {(() => {
                            switch (section.type) {
                                case 'hero': return <ActiveTheme.Hero data={section.data} />;
                                case 'about': return <ActiveTheme.About data={section.data} />;
                                case 'gallery': return <ActiveTheme.Gallery data={section.data} />;
                                case 'services_showcase': return <ActiveTheme.ServicesShowcase data={section.data} actorId={portfolio.actor_id} />;
                                case 'contact': return <ActiveTheme.Contact data={section.data} />;
                                case 'stats': return <ActiveTheme.Stats data={section.data} />;
                                case 'reviews': return <ActiveTheme.Reviews data={section.data} />;
                                case 'image_slider': return <ActiveTheme.ImageSlider data={section.data} />;
                                case 'video_slider': return <ActiveTheme.VideoSlider data={section.data} />;
                                case 'shop': return <ActiveTheme.Shop data={section.data} />;
                                // --- UPDATED HEADER ---
                                // We pass 'allSections' for the menu and 'isPreview' for sticky logic
                                case 'header': return (
                                    <ActiveTheme.Header 
                                        data={section.data} 
                                        allSections={sections} 
                                        isPreview={isPreview} 
                                    />
                                );

                                case 'team': return <ActiveTheme.Team data={section.data} />;
                                case 'map': return <ActiveTheme.Map data={section.data} />;
                                case 'pricing': return <ActiveTheme.Pricing data={section.data} />;
                                default: return null;
                            }
                        })()}
                    </div>
                );
            })
        }
    </ThemeWrapper>
  );
};

export default PortfolioRenderer; 