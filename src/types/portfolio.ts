import { LucideIcon } from "lucide-react";

export type SectionType =
  | "header"
  | "hero"
  | "about"
  | "stats"
  | "services_showcase"
  | "reviews"
  | "gallery"
  | "contact"
  | "image_slider"
  | "video_slider"
  | "team"
  | "map"
  | "shop" // <--- CONFIRMING THIS IS HERE
  | "pricing"
  | "lead_form"
  | "dynamic_store"; // <-- ADD THIS

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
    id: "header-1",
    type: "header",
    isVisible: true,
    data: {
      logoText: "My Portfolio",
      logoImage: "",
      menuType: "simple",
      autoMenu: true,
      variant: "transparent",
      ctaText: "Contact",
      ctaLink: "#contact",
      isSticky: true,
    },
  },
  {
    id: "hero-1",
    type: "hero",
    isVisible: true,
    data: {
      variant: "static",
      layout: "center",
      alignment: "center",
      headline: "Your Vision, My Voice",
      subheadline: "Professional Creative & Voice Actor",
      backgroundImage: "",
      ctaText: "Listen to Demos",
      ctaLink: "#demos",
      overlayOpacity: 50,
    },
  },
  {
    id: "about-1",
    type: "about",
    isVisible: true,
    data: {
      variant: "split",
      layout: "right",
      label: "Who I Am",
      title: "About Me",
      content:
        "I am a dedicated professional with over 5 years of experience...",
      image: "",
      stats: [
        { label: "Years Exp.", value: "5+" },
        { label: "Projects", value: "100+" },
        { label: "Happy Clients", value: "50+" },
      ],
      features: ["Professional Home Studio", "24 Hour Turnaround"],
    },
  },
  {
    id: "showcase-1",
    type: "services_showcase",
    isVisible: true,
    data: {
      title: "My Services & Work",
      showRates: true,
      showDemos: true,
      ctaText: "Request a Quote",
      ctaLink: "#contact",
    },
  },
  {
    id: "dynamic_store-1",
    type: "dynamic_store",
    isVisible: true,
    data: {
      title: "Store",
      subtitle: "Browse and purchase my services directly.",
      variant: "grid",
      maxProductsToShow: 6,
    },
  },
  {
    id: "gallery-1",
    type: "gallery",
    isVisible: true,
    data: {
      title: "Portfolio Gallery",
      variant: "masonry",
      gridColumns: 3,
      aspectRatio: "square",
      images: [],
    },
  },
  {
    id: "img-slider-1",
    type: "image_slider",
    isVisible: true,
    data: {
      title: "Cinematic Journeys",
      variant: "standard",
      height: "large",
      interval: 5,
      images: [],
    },
  },
  {
    id: "vid-slider-1",
    type: "video_slider",
    isVisible: true,
    data: {
      title: "Showreel Highlights",
      variant: "cinema",
      height: "large",
      gridColumns: 3,
      videos: [],
    },
  },
  {
    id: "stats-1",
    type: "stats",
    isVisible: true,
    data: {
      showProjects: true,
      showExperience: true,
      customStats: [],
    },
  },
  {
    id: "reviews-1",
    type: "reviews",
    isVisible: true,
    data: {
      title: "Client Testimonials",
      autoScroll: true,
    },
  },
  {
    id: "team-1",
    type: "team",
    isVisible: true,
    data: {
      variant: "grid",
      label: "The Team", 
      title: "Meet Our Team",
      subheadline: "The creative minds behind the magic.", 
      members: [
        {
          id: "member-1",
          name: "Alex Rivera",
          role: "Creative Director",
          bio: "10+ years of experience designing award-winning digital experiences.",
          image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800",
          linkedin: "https://linkedin.com",
          instagram: "https://instagram.com",
        },
        {
          id: "member-2",
          name: "Sarah Chen",
          role: "Lead Developer",
          bio: "Full-stack engineer passionate about building scalable, elegant architecture.",
          image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800",
          linkedin: "https://linkedin.com",
          instagram: "https://instagram.com",
        },
        {
          id: "member-3",
          name: "Marcus Johnson",
          role: "Product Designer",
          bio: "Obsessed with user-centric design and pixel-perfect micro-interactions.",
          image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=800",
          linkedin: "https://linkedin.com",
          instagram: "https://instagram.com",
        }
      ],
    },
  },
  {
    id: "map-1",
    type: "map",
    isVisible: true,
    data: {
      title: "Find Us",
      variant: "standard",
      height: "medium",
      mapUrl: "https://www.google.com/maps/embed?pb=...",
    },
  },
  {
    id: "pricing-1",
    type: "pricing",
    isVisible: true,
    data: {
      title: "Pricing Plans",
      variant: "cards",
      plans: [],
    },
  },
  {
    id: "contact_form",
    type: "lead_form",
    isVisible: true,
    data: {
      title: "Get in Touch",
      subheadline: "Send me a message for bookings and inquiries.",
      buttonText: "Send Message",
      variant: "centered",
      fields: [
        {
          id: "name",
          label: "Name",
          type: "text",
          placeholder: "Your Name",
          required: true,
          width: "half",
        },
        {
          id: "email",
          label: "Email",
          type: "email",
          placeholder: "your@email.com",
          required: true,
          width: "half",
        },
        {
          id: "message",
          label: "Message",
          type: "textarea",
          placeholder: "How can I help you?",
          required: true,
          width: "full",
        },
      ],
    },
  },
  {
    id: "contact-1",
    type: "contact",
    isVisible: true,
    data: {
      variant: "minimal",
      title: "Let's Work Together",
      subheadline: "Available for projects worldwide.",
      email: "hello@example.com", // 🚀 ADDED THIS
      ctaText: "Send Email",
      ctaLink: "mailto:hello@example.com",
    },
  },
];
