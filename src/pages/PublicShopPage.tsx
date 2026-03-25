import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Import Layouts
import ModernShopLayout from "../themes/modern/ShopLayout";
import CartDrawerContainer from "@/components/CartDrawerContainer";

// Ensure this matches App.tsx
const MAIN_DOMAINS = [
  "ucpmaroc.com",
  "www.ucpmaroc.com",
  "localhost",
  "127.0.0.1",
  "sy4pxh-5173.csb.app",
];

export default function PublicShopPage() {
  // App.tsx uses :slug for the pro route!
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();

  const [theme, setTheme] = useState<string>("modern");
  const [resolvedUsername, setResolvedUsername] = useState<string>("");
  const [products, setProducts] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter State
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchShopData = async () => {
      setLoading(true);

      const currentHostname = window.location.hostname;
      const isCustomDomain = !MAIN_DOMAINS.some((domain) =>
        currentHostname.includes(domain)
      );

      let currentActorId = null;
      let currentTheme = "modern";
      let currentUsername = slug || "";

      // 1. ENVIRONMENT-AWARE ACTOR LOOKUP (FIXED SCHEMA)
      if (isCustomDomain) {
        // Fetch by custom domain from portfolios
        const { data: portData } = await supabase
          .from("portfolios")
          .select("actor_id, theme_config")
          .eq("custom_domain", currentHostname)
          .single();

        if (portData) {
          currentActorId = portData.actor_id;
          currentTheme = portData.theme_config?.templateId || "modern";

          // Get the slug for cart/checkout routing
          const { data: actor } = await supabase
            .from("actors")
            .select("slug")
            .eq("id", currentActorId)
            .single();
          if (actor) currentUsername = actor.slug;
        }
      } else if (slug) {
        // Fetch actor by slug from the URL
        const { data: actorData } = await supabase
          .from("actors")
          .select("id, slug")
          .eq("slug", slug)
          .single();

        if (actorData) {
          currentActorId = actorData.id;
          currentUsername = actorData.slug;

          // Now fetch their theme from the portfolios table
          const { data: portData } = await supabase
            .from("portfolios")
            .select("theme_config")
            .eq("actor_id", currentActorId)
            .single();

          if (portData && portData.theme_config) {
            currentTheme = portData.theme_config.templateId || "modern";
          }
        }
      }

      if (!currentActorId) {
        setError("Store not found.");
        setLoading(false);
        return;
      }

      setTheme(currentTheme);
      setResolvedUsername(currentUsername);

      // 2. Fetch Products and Collections in parallel using the correct Actor ID
      const [productsRes, collectionsRes] = await Promise.all([
        supabase
          .from("pro_products")
          .select(`*, pro_collections(title, slug)`)
          .eq("actor_id", currentActorId)
          .eq("status", "active")
          .order("created_at", { ascending: false }),
        supabase
          .from("pro_collections")
          .select("*")
          .eq("actor_id", currentActorId)
          .eq("status", "active")
          .order("created_at", { ascending: false }),
      ]);

      if (productsRes.data) setProducts(productsRes.data);
      if (collectionsRes.data) setCollections(collectionsRes.data);

      setLoading(false);
    };

    fetchShopData();
  }, [slug]);

  // Derived state: Filter products based on search query AND active collection
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCollection = activeCollection
        ? product.collection_id === activeCollection
        : true;
      const matchesSearch =
        product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCollection && matchesSearch;
    });
  }, [products, activeCollection, searchQuery]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <h2 className="text-2xl font-bold mb-4">{error}</h2>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );

  // Helper for the layout props to keep URLs clean based on environment
  function isCustomDomain() {
    return !MAIN_DOMAINS.some((domain) =>
      window.location.hostname.includes(domain)
    );
  }

  const layoutProps = {
    username: isCustomDomain() ? "" : `pro/${resolvedUsername}`,
    products,
    collections,
    activeCollection,
    setActiveCollection,
    searchQuery,
    setSearchQuery,
    filteredProducts,
  };

  // ROUTER: Inject the exact layout based on the actor's active theme
  return (
    <>
      <CartDrawerContainer theme={theme} username={layoutProps.username} />

      {/* Default to Modern layout */}
      <ModernShopLayout {...layoutProps} />
    </>
  );
}
