import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { PortfolioSection } from '../types/portfolio';
import { cn, hexToHSL } from "@/lib/utils";
import { Loader2 } from 'lucide-react';
import { THEME_REGISTRY, DEFAULT_THEME } from '../themes/registry';
import SEO from '../components/common/SEO'; // <-- IMPORTED
import { trackEvent } from '../lib/analytics'; // <-- Import the helper

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
          "subpixel-antialiased" 
      )}
      data-theme={theme?.templateId} 
      style={style}
    >
      {children}
    </div>
  );
};

interface PortfolioRendererProps {
    editorData?: any; 
    isPreview?: boolean; 
}

const PortfolioRenderer: React.FC<PortfolioRendererProps> = ({ editorData, isPreview = false }) => {
  const { slug } = useParams<{ slug: string }>();
  const [portfolio, setPortfolio] = useState<any>(editorData || null);
  const [loading, setLoading] = useState(!editorData);
  const [error, setError] = useState(false);
  const [actorProfile, setActorProfile] = useState<any>(null); // Store actor data for SEO

  // --- ANALYTICS TRACKING ---
  useEffect(() => {
    // Only track if:
    // 1. We have loaded the portfolio
    // 2. We are NOT in preview/editor mode (don't track yourself)
    if (portfolio && !isPreview && portfolio.actor_id) {
        
        // Check session storage to prevent duplicate counts on refresh (optional "Unique View" logic)
        const sessionKey = `viewed_${portfolio.actor_id}_${new Date().toDateString()}`;
        if (!sessionStorage.getItem(sessionKey)) {
            trackEvent(portfolio.actor_id, 'page_view');
            sessionStorage.setItem(sessionKey, 'true');
        }
    }
  }, [portfolio, isPreview]);

  // Sync editorData if it changes
  useEffect(() => {
      if (editorData) {
          setPortfolio(editorData);
          setLoading(false);
      }
  }, [editorData]);

  useEffect(() => {
    if (!editorData && slug) {
        const fetchPortfolio = async () => {
            // 1. Fetch Actor first to get ID and SEO details (Name/Headshot)
            const { data: actorData, error: actorError } = await supabase
                .from('actors')
                .select('id, ActorName, HeadshotURL, bio') // Fetch fields needed for SEO
                .or(`slug.ilike.${slug},ActorName.ilike.${slug}`)
                .single();

            if (actorError || !actorData) {
                console.error("Actor not found:", slug);
                setError(true);
                setLoading(false);
                return;
            }

            setActorProfile(actorData); // Save for SEO usage

            // 2. Fetch Portfolio
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

  // --- SEO DATA PREPARATION ---
  // If in editor/preview mode, use placeholder data or data from props
  // If live, use the fetched actor profile
  const seoTitle = isPreview ? "Preview Portfolio" : (actorProfile?.ActorName || "Portfolio");
  const seoDesc = isPreview 
      ? "Live preview of your portfolio." 
      : (actorProfile?.bio || `Check out the professional portfolio of ${seoTitle}.`);
  const seoImage = isPreview ? "" : (actorProfile?.HeadshotURL || "");

  return (
    <>
        {/* --- INJECT DYNAMIC SEO --- */}
        {!isPreview && (
            <SEO 
                title={seoTitle} 
                description={seoDesc} 
                image={seoImage}
                type="profile"
            />
        )}

        <ThemeWrapper theme={portfolio.theme_config}>
            {sections
                .filter(section => section.isVisible)
                .map(section => {
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
                                    case 'shop': return <ActiveTheme.Shop data={section.data} actorId={portfolio.actor_id} />;                                    case 'header': return (
                                        <ActiveTheme.Header 
                                            data={section.data} 
                                            allSections={sections} 
                                            isPreview={isPreview} 
                                        />
                                    );
                                    case 'team': return <ActiveTheme.Team data={section.data} />;
                                    case 'map': return <ActiveTheme.Map data={section.data} />;
                                    case 'pricing': return <ActiveTheme.Pricing data={section.data} />;
                                    case 'lead_form': return <ActiveTheme.LeadForm data={section.data} actorId={portfolio.actor_id} />;
                                    default: return null;
                                }
                            })()}
                        </div>
                    );
                })
            }
        </ThemeWrapper>
    </>
  );
};

export default PortfolioRenderer;