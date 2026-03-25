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

// --- HELPER COMPONENTS ---

const ProductCard = ({
  product,
  username,
  isPreview,
}: {
  product: any;
  username: string;
  isPreview: boolean;
}) => {
  const navigate = useNavigate();
  const location = useLocation(); // Context-aware routing
  const addItem = useCartStore((state) => state.addItem);

  // Smart logic to determine button behavior
  const hasVariants = product.options && product.options.length > 0;
  const isExternal = product.action_type === "link";
  const isDirectOrder =
    product.action_type === "whatsapp" || product.action_type === "form_order";

  // --- DYNAMIC URL GENERATOR ---
  const getProductUrl = () => {
    // If on custom domain (e.g. /), basePath is empty.
    // If on main platform (e.g. /pro/alhamdulilah), basePath is /pro/alhamdulilah
    const basePath =
      location.pathname === "/" ? "" : location.pathname.replace(/\/$/, "");
    return `${basePath}/product/${product.slug || product.id}`;
  };

  const handleCardClick = () => {
    if (isPreview) return alert("Links are disabled in preview mode.");
    navigate(getProductUrl());
  };

  const handleQuickAction = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevents the card click from firing at the same time
    if (isPreview) return alert("Actions disabled in preview mode.");

    if (isExternal) {
      window.open(product.checkout_url, "_blank");
    } else if (hasVariants || isDirectOrder) {
      // If it needs specific user input, send them to the product page
      navigate(getProductUrl());
    } else {
      // 1-Click Quick Add to Cart!
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
      className="group relative bg-neutral-900/50 border border-white/10 rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300 flex flex-col h-full cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-black/50">
        {product.images?.[0] || product.image ? (
          <img
            src={product.images?.[0] || product.image}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-neutral-700">
            <ShoppingBag size={48} />
          </div>
        )}
        <div className="absolute top-3 right-3">
          <Badge
            variant="secondary"
            className="bg-black/70 backdrop-blur-md text-white border-white/10 font-bold text-sm shadow-sm"
          >
            ${product.price.toFixed(2)}
          </Badge>
        </div>

        {/* Hover Overlay with Quick Action Button */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <Button
            variant="secondary"
            className="gap-2 shadow-xl bg-white text-black hover:bg-neutral-200 pointer-events-auto"
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
        <h3 className="text-lg font-bold mb-1 text-white leading-tight line-clamp-1">
          {product.title}
        </h3>
        <p className="text-sm text-neutral-400 line-clamp-2 flex-grow">
          {product.description}
        </p>
      </div>
    </div>
  );
};

const SpotlightLayout = ({
  product,
  username,
  isPreview,
}: {
  product: any;
  username: string;
  isPreview: boolean;
}) => {
  const navigate = useNavigate();
  const location = useLocation(); // Context-aware routing
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

  // --- DYNAMIC URL GENERATOR ---
  const getProductUrl = () => {
    const basePath =
      location.pathname === "/" ? "" : location.pathname.replace(/\/$/, "");
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
    <div className="bg-neutral-900/30 border border-white/10 rounded-2xl overflow-hidden md:grid md:grid-cols-2 min-h-[450px] shadow-sm">
      <div
        className="bg-black/50 relative flex flex-col h-[300px] md:h-auto group/gallery cursor-pointer"
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
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full opacity-0 group-hover/gallery:opacity-100 transition-opacity z-20 shadow-sm"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImg((prev) => (prev + 1) % images.length);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full opacity-0 group-hover/gallery:opacity-100 transition-opacity z-20 shadow-sm"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-neutral-700">
              <ShoppingBag size={64} />
            </div>
          )}
        </div>
      </div>

      <div className="p-8 md:p-12 flex flex-col justify-center h-full">
        <Badge className="bg-primary text-black hover:bg-primary w-max mb-4">
          Featured Product
        </Badge>
        <h3 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-2">
          {product.title}
        </h3>
        <p className="text-2xl text-primary font-bold mb-6">
          ${product.price.toFixed(2)}
        </p>
        <p className="text-neutral-400 leading-relaxed mb-8 text-lg line-clamp-4">
          {product.description}
        </p>

        <Button
          size="lg"
          className="w-full h-14 text-lg rounded-xl bg-white text-black hover:bg-neutral-200"
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
  const [username, setUsername] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const variant = data.variant || "grid";
  const selectedIds = data.selectedProductIds || [];

  useEffect(() => {
    const fetchStoreData = async () => {
      let currentActorId = actorId;

      // 1. Get Actor ID and Username
      // 1. Get Actor ID and Slug (Username)
      if (!currentActorId || currentActorId === "preview-actor-id") {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: actorProfile } = await supabase
            .from("actors")
            .select("id, slug") // <-- FIXED: Use slug instead of username
            .eq("user_id", user.id)
            .single();
          if (actorProfile) {
            currentActorId = actorProfile.id;
            setUsername(actorProfile.slug); // <-- FIXED
          }
        }
      } else {
        const { data: actorProfile } = await supabase
          .from("actors")
          .select("slug") // <-- FIXED: Use slug instead of username
          .eq("id", currentActorId)
          .single();
        if (actorProfile) setUsername(actorProfile.slug); // <-- FIXED
      }

      if (!currentActorId || currentActorId === "preview-actor-id") {
        setLoading(false);
        return;
      }

      // 2. Fetch Products (including the new slug column)
      let query = supabase
        .from("pro_products")
        .select("*")
        .eq("actor_id", currentActorId)
        .eq("status", "active");

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
    <section className="py-20 px-4 md:px-8 relative overflow-hidden" id="store">
      <div className="max-w-7xl mx-auto relative z-10">
        {variant !== "spotlight" && (
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
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
          <div className="text-center py-24 border border-white/10 rounded-2xl bg-neutral-900/30 max-w-2xl mx-auto">
            <ShoppingBag className="w-12 h-12 mx-auto text-neutral-600 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">
              No products to display
            </h3>
            <p className="text-neutral-400">
              Products will appear here once added to the inventory.
            </p>
          </div>
        ) : (
          <>
            {variant === "grid" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {products.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    username={username}
                    isPreview={isPreview}
                  />
                ))}
              </div>
            )}

            {variant === "spotlight" && products[0] && (
              <div>
                <div className="mb-12 text-center">
                  <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                    {data.title || "Featured Product"}
                  </h2>
                  {data.subtitle && (
                    <p className="text-lg text-muted-foreground mt-4">
                      {data.subtitle}
                    </p>
                  )}
                </div>
                <SpotlightLayout
                  product={products[0]}
                  username={username}
                  isPreview={isPreview}
                />
              </div>
            )}

            {variant === "carousel" && (
              <div className="flex overflow-x-auto pb-8 gap-6 snap-x snap-mandatory hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="min-w-[280px] md:min-w-[350px] snap-center"
                  >
                    <ProductCard
                      product={p}
                      username={username}
                      isPreview={isPreview}
                    />
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
