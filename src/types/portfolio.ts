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
          image:
            "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800",
          linkedin: "https://linkedin.com",
          instagram: "https://instagram.com",
        },
        {
          id: "member-2",
          name: "Sarah Chen",
          role: "Lead Developer",
          bio: "Full-stack engineer passionate about building scalable, elegant architecture.",
          image:
            "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800",
          linkedin: "https://linkedin.com",
          instagram: "https://instagram.com",
        },
        {
          id: "member-3",
          name: "Marcus Johnson",
          role: "Product Designer",
          bio: "Obsessed with user-centric design and pixel-perfect micro-interactions.",
          image:
            "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=800",
          linkedin: "https://linkedin.com",
          instagram: "https://instagram.com",
        },
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
      address: "123 Creative Ave\nCupertino, CA 95014",
      // 🚀 A real, working Google Maps embed link for the starter template
      mapUrl:
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3168.6392906210703!2d-122.0838511!3d37.3346061!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x808fba02425def45%3A0x86395f7d498aa2b9!2sApple%20Park!5e0!3m2!1sen!2sus!4v1680000000000!5m2!1sen!2sus",
      directionUrl: "",
    },
  },
  {
    id: "pricing-1",
    type: "pricing",
    isVisible: true,
    data: {
      variant: "cards",
      title: "Simple, Transparent Pricing",
      subheadline: "No hidden fees. Cancel anytime.", // 🚀 ADDED THIS
      ctaText: "Contact for Custom Rates", // 🚀 ADDED THIS
      ctaLink: "#contact", // 🚀 ADDED THIS
      plans: [
        {
          id: "plan-1",
          name: "Basic",
          price: "$49",
          unit: "mo",
          features: "1 Project, Basic Support, 5GB Storage",
          cta: "Get Started",
          buttonUrl: "#contact",
          isPopular: false,
        },
        {
          id: "plan-2",
          name: "Pro",
          price: "$99",
          unit: "mo",
          features:
            "Unlimited Projects, Priority Support, 50GB Storage, Custom Domain",
          cta: "Start Free Trial",
          buttonUrl: "#contact",
          isPopular: true, // This will automatically trigger that gorgeous glow!
        },
        {
          id: "plan-3",
          name: "Enterprise",
          price: "$249",
          unit: "mo",
          features:
            "Everything in Pro, Dedicated Account Manager, Custom Integrations, SLA",
          cta: "Contact Sales",
          buttonUrl: "#contact",
          isPopular: false,
        },
      ],
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
