import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import {
  ShoppingBag,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  ShoppingCart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/store/useCartStore";

const MAIN_DOMAINS = [
  "ucpmaroc.com",
  "www.ucpmaroc.com",
  "localhost",
  "127.0.0.1",
  "sy4pxh-5173.csb.app",
];

// --- HELPER COMPONENTS ---

const ProductCard = ({
  product,
  isPreview,
}: {
  product: any;
  isPreview: boolean;
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const addItem = useCartStore((state) => state.addItem);

  const hasVariants = product.options && product.options.length > 0;
  const isExternal = product.action_type === "link";
  const isDirectOrder =
    product.action_type === "whatsapp" || product.action_type === "form_order";

  // --- DYNAMIC URL GENERATOR ---
  const getProductUrl = () => {
    let basePath =
      location.pathname === "/" ? "" : location.pathname.replace(/\/$/, "");

    // If the block is placed on the homepage (/pro/alhamdulilah), ensure we append /product properly
    if (basePath.split("/").length === 3 && basePath.startsWith("/pro/")) {
      // do nothing, basePath is perfect
    } else if (basePath.includes("/shop")) {
      basePath = basePath.replace("/shop", ""); // Clean up if placed on shop page
    }
    return `${basePath}/product/${product.slug || product.id}`;
  };

  const handleCardClick = () => {
    if (isPreview) return alert("Links are disabled in preview mode.");
    navigate(getProductUrl());
  };

  const handleQuickAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPreview) return alert("Actions disabled in preview mode.");

    if (isExternal) {
      window.open(product.checkout_url, "_blank");
    } else if (hasVariants || isDirectOrder) {
      navigate(getProductUrl());
    } else {
      addItem({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.images?.[0] || product.image,
        quantity: 1,
      });
    }
  };

  return (
    <div
      className="group relative bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 hover:shadow-md transition-all duration-300 flex flex-col h-full cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {product.images?.[0] || product.image ? (
          <img
            src={product.images?.[0] || product.image}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground/50">
            <ShoppingBag size={48} />
          </div>
        )}
        <div className="absolute top-3 right-3">
          <Badge
            variant="secondary"
            className="bg-background/80 backdrop-blur-md text-foreground border-border font-bold text-sm shadow-sm"
          >
            ${product.price.toFixed(2)}
          </Badge>
        </div>

        {/* Hover Overlay with Quick Action Button */}
        <div className="absolute inset-0 bg-background/20 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <Button
            variant="default"
            className="gap-2 shadow-xl pointer-events-auto"
            onClick={handleQuickAction}
          >
            {isExternal ? (
              <>
                <Eye size={16} /> View Link
              </>
            ) : hasVariants || isDirectOrder ? (
              <>
                <Eye size={16} /> Select Options
              </>
            ) : (
              <>
                <ShoppingCart size={16} /> Add to Cart
              </>
            )}
          </Button>
        </div>
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-lg font-bold mb-1 text-foreground leading-tight line-clamp-1">
          {product.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 flex-grow">
          {product.description}
        </p>
      </div>
    </div>
  );
};

const SpotlightLayout = ({
  product,
  isPreview,
}: {
  product: any;
  isPreview: boolean;
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const addItem = useCartStore((state) => state.addItem);

  const images = product.images?.length
    ? product.images
    : product.image
    ? [product.image]
    : [];
  const [activeImg, setActiveImg] = useState(0);

  const hasVariants = product.options && product.options.length > 0;
  const isExternal = product.action_type === "link";
  const isDirectOrder =
    product.action_type === "whatsapp" || product.action_type === "form_order";

  const getProductUrl = () => {
    let basePath =
      location.pathname === "/" ? "" : location.pathname.replace(/\/$/, "");
    if (basePath.includes("/shop")) basePath = basePath.replace("/shop", "");
    return `${basePath}/product/${product.slug || product.id}`;
  };

  const handleAction = () => {
    if (isPreview) return alert("Links are disabled in preview mode.");

    if (isExternal) {
      window.open(product.checkout_url, "_blank");
    } else if (hasVariants || isDirectOrder) {
      navigate(getProductUrl());
    } else {
      addItem({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.images?.[0] || product.image,
        quantity: 1,
      });
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden md:grid md:grid-cols-2 min-h-[450px] shadow-sm">
      <div
        className="bg-muted relative flex flex-col h-[300px] md:h-auto group/gallery cursor-pointer"
        onClick={() => {
          if (!isPreview) navigate(getProductUrl());
        }}
      >
        <div className="flex-grow relative overflow-hidden">
          {images.length > 0 ? (
            <>
              <img
                src={images[activeImg]}
                alt={product.title}
                className="w-full h-full object-cover absolute inset-0 transition-all duration-500 hover:scale-105"
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImg(
                        (prev) => (prev - 1 + images.length) % images.length
                      );
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/50 hover:bg-background/80 text-foreground p-2 rounded-full opacity-0 group-hover/gallery:opacity-100 transition-opacity z-20 shadow-sm"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImg((prev) => (prev + 1) % images.length);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/50 hover:bg-background/80 text-foreground p-2 rounded-full opacity-0 group-hover/gallery:opacity-100 transition-opacity z-20 shadow-sm"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground/50">
              <ShoppingBag size={64} />
            </div>
          )}
        </div>
      </div>

      <div className="p-8 md:p-12 flex flex-col justify-center h-full">
        <Badge className="bg-primary/10 text-primary hover:bg-primary/20 w-max mb-4 shadow-none">
          Featured Product
        </Badge>
        <h3 className="text-3xl md:text-4xl font-bold text-foreground leading-tight mb-2">
          {product.title}
        </h3>
        <p className="text-2xl text-primary font-bold mb-6">
          ${product.price.toFixed(2)}
        </p>
        <p className="text-muted-foreground leading-relaxed mb-8 text-lg line-clamp-4">
          {product.description}
        </p>

        <Button
          size="lg"
          className="w-full h-14 text-lg rounded-xl shadow-md"
          onClick={handleAction}
        >
          {isExternal
            ? "View Link"
            : hasVariants || isDirectOrder
            ? "View Options & Details"
            : "Add to Cart"}
        </Button>
      </div>
    </div>
  );
};

// --- MAIN DYNAMIC STORE COMPONENT ---
export const DynamicStore = ({ data, actorId, isPreview }: any) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const variant = data.variant || "grid";
  const selectedIds = data.selectedProductIds || [];

  useEffect(() => {
    const fetchStoreData = async () => {
      let currentActorId = actorId;
      let currentPortfolioId = null;

      // 1. Get Actor ID if not explicitly provided
      if (!currentActorId || currentActorId === "preview-actor-id") {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: actorProfile } = await supabase
            .from("actors")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();
          if (actorProfile) currentActorId = actorProfile.id;
        }
      }

      if (!currentActorId || currentActorId === "preview-actor-id") {
        setLoading(false);
        return;
      }

      // 2. ENVIRONMENT-AWARE PORTFOLIO LOOKUP (For Store Separation)
      const currentHostname = window.location.hostname;
      const isCustomDomain = !MAIN_DOMAINS.some((domain) =>
        currentHostname.includes(domain)
      );

      if (isCustomDomain) {
        const { data: portData } = await supabase
          .from("portfolios")
          .select("id")
          .eq("custom_domain", currentHostname)
          .maybeSingle();
        if (portData) currentPortfolioId = portData.id;
      } else {
        // If on main domain, parse the URL to find the public_slug
        const pathParts = window.location.pathname.split("/");
        const proIndex = pathParts.indexOf("pro");

        if (proIndex !== -1 && pathParts.length > proIndex + 1) {
          const currentSlug = pathParts[proIndex + 1];
          const { data: portData } = await supabase
            .from("portfolios")
            .select("id")
            .eq("public_slug", currentSlug)
            .maybeSingle();
          if (portData) currentPortfolioId = portData.id;
        } else {
          // Fallback for previews inside the site builder (grab the first portfolio)
          const { data: portData } = await supabase
            .from("portfolios")
            .select("id")
            .eq("actor_id", currentActorId)
            .limit(1)
            .maybeSingle();
          if (portData) currentPortfolioId = portData.id;
        }
      }

      // 3. FETCH PRODUCTS (With Portfolio ID Separation)
      let query = supabase
        .from("pro_products")
        .select("*")
        .eq("actor_id", currentActorId)
        .eq("status", "active");

      // SMART FILTER: Only fetch products assigned to this portfolio OR global (null)
      if (currentPortfolioId) {
        query = query.or(
          `portfolio_id.eq.${currentPortfolioId},portfolio_id.is.null`
        );
      }

      if (selectedIds.length > 0) {
        query = query.in("id", selectedIds);
      } else {
        query = query
          .order("created_at", { ascending: false })
          .limit(data.maxProductsToShow || 6);
      }

      const { data: prods, error } = await query;
      if (!error && prods) setProducts(prods);
      setLoading(false);
    };

    fetchStoreData();
  }, [actorId, JSON.stringify(selectedIds), data.maxProductsToShow]);

  return (
    <section
      className="py-20 px-4 md:px-8 relative overflow-hidden bg-background text-foreground"
      id="store"
    >
      <div className="max-w-7xl mx-auto relative z-10">
        {variant !== "spotlight" && (
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              {data.title || "Store"}
            </h2>
            {data.subtitle && (
              <p className="text-lg text-muted-foreground">{data.subtitle}</p>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24 border border-border rounded-2xl bg-card/50 max-w-2xl mx-auto shadow-sm">
            <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">
              No products to display
            </h3>
            <p className="text-muted-foreground">
              Products will appear here once added to the inventory.
            </p>
          </div>
        ) : (
          <>
            {variant === "grid" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} isPreview={isPreview} />
                ))}
              </div>
            )}

            {variant === "spotlight" && products[0] && (
              <div>
                <div className="mb-12 text-center">
                  <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                    {data.title || "Featured Product"}
                  </h2>
                  {data.subtitle && (
                    <p className="text-lg text-muted-foreground mt-4">
                      {data.subtitle}
                    </p>
                  )}
                </div>
                <SpotlightLayout product={products[0]} isPreview={isPreview} />
              </div>
            )}

            {variant === "carousel" && (
              <div className="flex overflow-x-auto pb-8 gap-6 snap-x snap-mandatory hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="min-w-[280px] md:min-w-[350px] snap-center"
                  >
                    <ProductCard product={p} isPreview={isPreview} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};
