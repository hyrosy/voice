import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { PortfolioSection } from '../types/portfolio';
import { cn, hexToHSL } from "@/lib/utils";
import { Loader2 } from 'lucide-react';
import { THEME_REGISTRY, DEFAULT_THEME } from '../themes/registry';
import SEO from '../components/common/SEO';
import { trackEvent } from '../lib/analytics';

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
  const [actorProfile, setActorProfile] = useState<any>(null);

  // --- ANALYTICS TRACKING ---
  useEffect(() => {
    if (portfolio && !isPreview && portfolio.actor_id) {
        const sessionKey = `viewed_${portfolio.id}_${new Date().toDateString()}`;
        if (!sessionStorage.getItem(sessionKey)) {
            // Pass portfolio_id in metadata object (3rd arg)
            trackEvent(portfolio.actor_id, 'page_view', { portfolio_id: portfolio.id });
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
    // Only fetch if we are NOT in editor mode and we have a slug
    if (!editorData && slug) {
        const fetchPortfolio = async () => {
            console.log("Fetching portfolio for slug:", slug);

            // 1. NEW LOGIC: Fetch Portfolio directly by public_slug
            // We verify 'is_published' is true
            const { data: portfolioData, error: portfolioError } = await supabase
                .from('portfolios')
                .select('*')
                .eq('public_slug', slug)
                .eq('is_published', true)
                .single();

            // 2. Handle Portfolio Not Found (or unpublished)
            if (portfolioError || !portfolioData) {
                console.error("Portfolio not found or unpublished:", slug);
                
                // OPTIONAL FALLBACK: 
                // If you want old links (using actor name) to still work, you could try
                // looking up the actor here. But for clean architecture, it is better 
                // to stick to the portfolio slug.
                setError(true);
                setLoading(false);
                return;
            }

            setPortfolio(portfolioData);

            // 3. Fetch Owner (Actor) Data for SEO & Context
            // We need this because the Portfolio table might not have the headshot/bio
            const { data: actorData } = await supabase
                .from('actors')
                .select('id, ActorName, HeadshotURL, bio')
                .eq('id', portfolioData.actor_id)
                .single();

            if (actorData) {
                setActorProfile(actorData);
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
  // Use Portfolio-specific SEO if available (site_name), otherwise fallback to Actor Profile
  const seoTitle = isPreview ? "Preview Portfolio" : (portfolio.site_name || actorProfile?.ActorName || "Portfolio");
  const seoDesc = isPreview 
      ? "Live preview of your portfolio." 
      : (actorProfile?.bio || `Check out the professional portfolio of ${seoTitle}.`);
  const seoImage = isPreview ? "" : (actorProfile?.HeadshotURL || "");

  // Pass activeActorId so components like LeadForm know who to message
  const activeActorId = portfolio.actor_id;

  return (
    <>
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
                                // Dynamic Component Rendering
                                const Component = (ActiveTheme as any)[section.type === 'lead_form' ? 'LeadForm' : section.type.charAt(0).toUpperCase() + section.type.slice(1).replace(/_([a-z])/g, (g) => g[1].toUpperCase())] 
                                                || (ActiveTheme as any)[Object.keys(ActiveTheme).find(k => k.toLowerCase() === section.type.replace('_','').toLowerCase()) || ''];

                                if (!Component) return null;

                                // Special props for specific components
                                if (section.type === 'header') {
                                    return <Component data={section.data} allSections={sections} isPreview={isPreview} />;
                                }
                                if (section.type === 'services_showcase' || section.type === 'shop' || section.type === 'lead_form') {
                                    return <Component data={section.data} actorId={activeActorId} portfolioId={portfolio.id} />;
                                }

                                return <Component data={section.data} />;
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