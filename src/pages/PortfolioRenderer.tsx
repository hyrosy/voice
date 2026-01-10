import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PortfolioSection } from '../types/portfolio';
import { cn, hexToHSL } from "@/lib/utils";
import { Loader2 } from 'lucide-react';
import { THEME_REGISTRY, DEFAULT_THEME } from '../themes/registry';
import SEO from '../components/common/SEO';
import { trackEvent } from '../lib/analytics';
import { usePortfolio } from '../hooks/usePortfolio'; // <--- Importing the hook

const COLOR_PALETTES = [
  { id: 'violet', value: '#8b5cf6' },
  { id: 'blue', value: '#3b82f6' },
  { id: 'emerald', value: '#10b981' },
  { id: 'rose', value: '#f43f5e' },
  { id: 'amber', value: '#f59e0b' },
  { id: 'slate', value: '#64748b' },
  { id: 'black', value: '#000000' },
];

const ThemeWrapper = ({ children, theme }: { children: React.ReactNode, theme: any }) => {
  const fontClass = theme?.font === 'serif' ? 'font-serif' : theme?.font === 'mono' ? 'font-mono' : 'font-sans';
  const activeColorObj = COLOR_PALETTES.find(c => c.id === theme?.primaryColor) || COLOR_PALETTES[0];
  const primaryHSL = hexToHSL(activeColorObj.value);
  const radiusVal = theme?.radius !== undefined ? theme.radius : 0.5;
  const radiusCSS = `${radiusVal * 2}rem`; 

  const style = {
    '--primary': primaryHSL,
    '--ring': primaryHSL,
    '--radius': radiusCSS, 
  } as React.CSSProperties;

  return (
    <div 
      className={cn(
          "min-h-screen bg-background text-foreground", 
          fontClass,
          "subpixel-antialiased" 
      )}
      data-theme={theme?.templateId} 
      data-btn-style={theme?.buttonStyle || 'solid'} 
      style={style}
    >
      {children}
    </div>
  );
};

interface PortfolioRendererProps {
    editorData?: any; 
    isPreview?: boolean; 
    customDomain?: string;
}

const PortfolioRenderer: React.FC<PortfolioRendererProps> = ({ 
    editorData, 
    isPreview = false, 
    customDomain 
}) => {
  const { slug } = useParams<{ slug: string }>();

  // --- REPLACED OLD LOGIC WITH THE NEW HOOK ---
  const { data, isLoading, isError } = usePortfolio({ 
    slug, 
    customDomain, 
    enabled: !editorData // Don't fetch if we are in editor mode
  });

  // Determine which data to use (Editor Data or Real Data)
  const portfolio = editorData || data?.portfolio;
  const actorProfile = data?.actorProfile;

  // --- ANALYTICS TRACKING ---
  useEffect(() => {
    if (portfolio && !isPreview && portfolio.actor_id) {
        const sessionKey = `viewed_${portfolio.id}_${new Date().toDateString()}`;
        if (!sessionStorage.getItem(sessionKey)) {
            trackEvent(portfolio.actor_id, 'page_view', { portfolio_id: portfolio.id });
            sessionStorage.setItem(sessionKey, 'true');
        }
    }
  }, [portfolio, isPreview]);

  // --- LOADING STATE ---
  if (isLoading && !editorData) {
      return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }
  
  // --- ERROR STATE ---
  if ((isError || !portfolio) && !editorData) {
      return (
          <div className="h-screen flex flex-col items-center justify-center text-center p-4">
              <h1 className="text-2xl font-bold mb-2">Portfolio Not Found</h1>
              <p className="text-muted-foreground">This page does not exist or has not been published yet.</p>
          </div>
      );
  }

  // --- RENDER CONTENT ---
  const sections = portfolio.sections as PortfolioSection[];
  const themeId = portfolio.theme_config?.templateId || 'modern';
  const ActiveTheme = THEME_REGISTRY[themeId] || DEFAULT_THEME;

  const seoTitle = isPreview ? "Preview Portfolio" : (portfolio.site_name || actorProfile?.ActorName || "Portfolio");
  const seoDesc = isPreview 
      ? "Live preview of your portfolio." 
      : (actorProfile?.bio || `Check out the professional portfolio of ${seoTitle}.`);
  const seoImage = isPreview ? "" : (actorProfile?.HeadshotURL || "");

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
                .filter((section: PortfolioSection) => section.isVisible)
                .map((section: PortfolioSection) => {
                    const zIndexClass = section.type === 'header' ? 'relative z-50' : 'relative z-0';

                    return (
                        <div id={section.id} key={section.id} className={`scroll-mt-20 ${zIndexClass}`}> 
                            {(() => {
                                const Component = (ActiveTheme as any)[section.type === 'lead_form' ? 'LeadForm' : section.type.charAt(0).toUpperCase() + section.type.slice(1).replace(/_([a-z])/g, (g: string) => g[1].toUpperCase())] 
                                                                || (ActiveTheme as any)[Object.keys(ActiveTheme).find(k => k.toLowerCase() === section.type.replace('_','').toLowerCase()) || ''];

                                if (!Component) return null;

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