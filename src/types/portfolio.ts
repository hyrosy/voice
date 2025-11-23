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
  | 'video_slider' // <-- NEW
  | 'team'
  | 'map'
  | 'pricing';

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
  },
  
  {
    id: 'team-1',
    type: 'team',
    isVisible: true,
    data: {
      title: "Meet The Team",
      members: [] // { name, role, image, bio }
    }
  },
  {
    id: 'map-1',
    type: 'map',
    isVisible: true,
    data: {
      title: "Find Us",
      // Default placeholder embed (Eiffel Tower)
      mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2624.9916256937595!2d2.292292615509614!3d48.85837007928757!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47e66e2964e36e27%3A0x8a1c868dbaf5d4fd!2sEiffel%20Tower!5e0!3m2!1sen!2sus!4v1647551887234!5m2!1sen!2sus",
      height: "medium" // medium | large
    }
  },
  {
    id: 'pricing-1',
    type: 'pricing',
    isVisible: true,
    data: {
      title: "Pricing Plans",
      layout: "cards", // cards | slider
      plans: [] // { name, price, features, cta }
    }
  }
];