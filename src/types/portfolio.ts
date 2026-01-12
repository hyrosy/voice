import { LucideIcon } from 'lucide-react';

export type SectionType = 
  | 'header' 
  | 'hero' 
  | 'about' 
  | 'stats' 
  | 'services_showcase' 
  | 'reviews' 
  | 'gallery' 
  | 'contact'
  | 'image_slider' 
  | 'video_slider' 
  | 'team'
  | 'map'
  | 'shop'    // <--- CONFIRMING THIS IS HERE
  | 'pricing'
  | 'lead_form';

export interface PortfolioSection {
  id: string;
  type: SectionType;
  isVisible: boolean;
  data: Record<string, any>; 
  settings?: Record<string, any>; // Theme Design Settings (Zone B)
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
      ctaText: "Listen to Demos", 
      ctaLink: "#demos", 
      alignment: "center", 
      overlayOpacity: 50 
    }
  },
  {
    id: 'stats-1',
    type: 'stats',
    isVisible: true,
    data: {
      showProjects: true,
      showExperience: true,
      customStats: [] 
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
      ctaLink: "#contact" 
    }
  },
  
  {
    id: 'gallery-1',
    type: 'gallery',
    isVisible: true,
    data: {
      title: "Portfolio Gallery",
      gridColumns: 3, 
      gap: "medium", 
      images: []
    }
  },
  
  {
    id: 'img-slider-1',
    type: 'image_slider',
    isVisible: true,
    data: {
      title: "Cinematic Journeys",
      height: "full", 
      autoplay: true,
      interval: 5, 
      images: [] 
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
      videos: [] 
    }
  },

  {
    id: 'contact_form',
    type: 'lead_form',
    isVisible: true,
    data: {
      title: 'Get in Touch',
      subheadline: 'Send me a message for bookings and inquiries.',
      buttonText: 'Send Message',
      variant: 'centered', // 'centered' | 'split' | 'minimal'
      destinationEmail: '', // Optional: if you want to implement email forwarding later
      fields: [
        { id: 'name', label: 'Name', type: 'text', placeholder: 'Your Name', required: true, width: 'half' },
        { id: 'email', label: 'Email', type: 'email', placeholder: 'your@email.com', required: true, width: 'half' },
        { id: 'phone', label: 'Phone', type: 'tel', placeholder: '+1 234 567 890', required: false, width: 'full' },
        { id: 'subject', label: 'Subject', type: 'text', placeholder: 'Booking Inquiry...', required: false, width: 'full' },
        { id: 'message', label: 'Message', type: 'textarea', placeholder: 'How can I help you?', required: true, width: 'full' }
      ]
    }
  },
  
  // --- NEW: SHOP SECTION DEFAULT ---
  {
    id: 'shop-1',
    type: 'shop',
    isVisible: true,
    data: {
      title: "Digital Shop",
      subheadline: "Presets, LUTS, and Guides.",
      variant: "grid", // grid | carousel | spotlight
      products: [
        {
            title: "Cinematic LUT Pack",
            price: "$29.99",
            description: "The exact color grading presets I use for my films.",
            buttonText: "Buy Now",
            link: "#"
        },
        {
            title: "Actor Resume Template",
            price: "$9.99",
            description: "Professional resume layout for casting directors.",
            buttonText: "Download",
            link: "#"
        }
      ]
    }
  },
  // --------------------------------

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
      label: "Who I Am", 
      title: "About Me",
      layout: "split-right", 
      content: "I am a dedicated professional with over 5 years of experience...",
      image: "", 
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
      showPhone: false 
    }
  },
  
  {
    id: 'team-1',
    type: 'team',
    isVisible: true,
    data: {
      title: "Meet The Team",
      members: [] 
    }
  },
  {
    id: 'map-1',
    type: 'map',
    isVisible: true,
    data: {
      title: "Find Us",
      mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2624.9916256937595!2d2.292292615509614!3d48.85837007928757!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47e66e2964e36e27%3A0x8a1c868dbaf5d4fd!2sEiffel%20Tower!5e0!3m2!1sen!2sus!4v1647551887234!5m2!1sen!2sus",
      height: "medium" 
    }
  },
  {
    id: 'pricing-1',
    type: 'pricing',
    isVisible: true,
    data: {
      title: "Pricing Plans",
      layout: "cards", 
      plans: [] 
    }
  }
];