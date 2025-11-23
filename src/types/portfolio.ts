import { LucideIcon } from 'lucide-react';

export type SectionType = 
  | 'header' // <-- NEW
  | 'hero' 
  | 'about' 
  | 'stats' 
  | 'demos' 
  | 'services' 
  | 'services_showcase' // <-- NEW
  | 'reviews' 
  | 'gallery' 
  | 'contact'
  | 'image_slider'  // <-- NEW
  | 'video_slider'; // <-- NEW

export interface PortfolioSection {
  id: string;
  type: SectionType;
  isVisible: boolean;
  data: Record<string, any>; 
}

export interface PortfolioConfig {
  id: string;
  is_published: boolean;
  public_slug: string;
  theme_config: {
    templateId: string;
    primaryColor: string;
    font: string;
  };
  sections: PortfolioSection[];
}

// --- THE RICH DEFAULT TEMPLATE ---
export const DEFAULT_PORTFOLIO_SECTIONS: PortfolioSection[] = [
  {
    id: 'header-1',
    type: 'header',
    isVisible: true,
    data: {
      logoText: "My Portfolio",
      logoImage: "", 
      showLinks: true,
      ctaText: "Contact",
      ctaLink: "#contact",
      isSticky: true
    }
  },

  {
    id: 'hero-1',
    type: 'hero',
    isVisible: true,
    data: {
      headline: "Your Vision, My Voice",
      subheadline: "Professional Creative & Voice Actor",
      backgroundImage: "", 
      ctaText: "Listen to Demos", // <-- NEW
      ctaLink: "#demos",        // <-- NEW
      alignment: "center",      // <-- NEW
      overlayOpacity: 50        // <-- NEW
    }
  },
  {
    id: 'stats-1',
    type: 'stats',
    isVisible: true,
    data: {
      showProjects: true,
      showExperience: true,
      customStats: [] // <-- NEW: Array for manual stats
    }
  },
  {
    id: 'demos-1',
    type: 'demos',
    isVisible: true,
    data: {
      title: "Featured Work",
      layout: "grid",
      showAudio: true, // <-- NEW
      showVideo: true  // <-- NEW
    }
  },
  {
    id: 'showcase-1',
    type: 'services_showcase',
    isVisible: true,
    data: {
      title: "My Services & Work",
      showRates: true,
      showDemos: true,
      ctaText: "Request a Quote",
      ctaLink: "#contact" // or open modal
    }
  },
  {
    id: 'services-1',
    type: 'services',
    isVisible: true,
    data: {
      title: "Services & Rates",
      showRates: true,
      displayMode: "cards" // <-- NEW
    }
  },
  {
    id: 'gallery-1',
    type: 'gallery',
    isVisible: true,
    data: {
      title: "Portfolio Gallery",
      gridColumns: 3, // <-- NEW
      gap: "medium",  // <-- NEW
      images: []
    }
  },
  // 2. ADD EXAMPLES OF THE NEW SECTIONS (Optional, but good for testing)
  {
    id: 'img-slider-1',
    type: 'image_slider',
    isVisible: true,
    data: {
      title: "Cinematic Journeys",
      height: "full", // 'full', 'large', 'medium'
      autoplay: true,
      interval: 5, // seconds
      images: [] // Array of { url, caption }
    }
  },
  {
    id: 'vid-slider-1',
    type: 'video_slider',
    isVisible: true,
    data: {
      title: "Showreel Highlights",
      height: "large",
      autoplay: false,
      videos: [] // Array of { url, title, poster }
    }
  },
  {
    id: 'reviews-1',
    type: 'reviews',
    isVisible: true,
    data: {
      title: "Client Testimonials",
      autoScroll: true
    }
  },
  {
    id: 'about-1',
    type: 'about',
    isVisible: true,
    data: {
      label: "Who I Am", // <-- NEW
      title: "About Me",
      layout: "split-right", 
      content: "I am a dedicated professional with over 5 years of experience...",
      image: "", 
      // --- NEW RICH DATA ---
      showStats: true,
      stats: [
        { label: 'Years Exp.', value: '5+' },
        { label: 'Projects', value: '100+' },
        { label: 'Happy Clients', value: '50+' }
      ],
      features: [
         "Professional Home Studio",
         "24 Hour Turnaround"
      ]
    }
  },
  {
    id: 'contact-1',
    type: 'contact',
    isVisible: true,
    data: {
      title: "Let's Work Together",
      emailText: "Request a Quote",
      showSocials: true,
      showPhone: false // <-- NEW
    }
  }
];