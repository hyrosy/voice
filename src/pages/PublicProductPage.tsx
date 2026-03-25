import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useCartStore } from "../store/useCartStore";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Import Theme Layouts
import ModernProductLayout from "../themes/modern/ProductLayout";
import MinimalProductLayout from "../themes/cupertino/ProductLayout"; // Note: ensure path is correct!
import CartDrawerContainer from "@/components/CartDrawerContainer";

// Ensure this matches App.tsx
const MAIN_DOMAINS = [
  "ucpmaroc.com",
  "www.ucpmaroc.com",
  "localhost",
  "127.0.0.1",
  "sy4pxh-5173.csb.app",
];

export default function PublicProductPage() {
  // App.tsx uses :slug for the pro route
  const { slug, productSlug } = useParams<{
    slug?: string;
    productSlug: string;
  }>();

  const navigate = useNavigate();
  const location = useLocation();
  const addItem = useCartStore((state) => state.addItem);

  const [product, setProduct] = useState<any>(null);
  const [theme, setTheme] = useState<string>("modern");
  const [resolvedUsername, setResolvedUsername] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Interaction State
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, any>>(
    {}
  );

  // Checkout State
  const [step, setStep] = useState<"details" | "form" | "success">("details");
  const [clientInfo, setClientInfo] = useState({
    name: "",
    phone: "",
    address: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchProductAndTheme = async () => {
      if (!productSlug) return;
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
        // Fetch by custom domain from portfolios table
        const { data: portData } = await supabase
          .from("portfolios")
          .select("actor_id, theme_config")
          .eq("custom_domain", currentHostname)
          .single();

        if (portData) {
          currentActorId = portData.actor_id;
          currentTheme = portData.theme_config?.templateId || "modern";

          // Get the slug from the actors table for cart/checkout routing
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

      // 2. FETCH EXACT PRODUCT
      const { data: productData, error: productError } = await supabase
        .from("pro_products")
        .select(`*, pro_collections(title, slug)`)
        .eq("actor_id", currentActorId)
        .eq("slug", productSlug)
        .eq("status", "active")
        .single();

      if (productError || !productData) {
        setError("Product not found.");
      } else {
        setProduct(productData);

        // Auto-select the first available variant option
        const initialVariants: Record<string, any> = {};
        if (productData.options?.length > 0) {
          productData.options.forEach((opt: any) => {
            if (opt.values.length > 0)
              initialVariants[opt.name] = opt.values[0];
          });
        }
        setSelectedVariants(initialVariants);
      }
      setLoading(false);
    };

    fetchProductAndTheme();
  }, [slug, productSlug]);

  // Calculate dynamic price based on base price + selected variant modifiers
  const currentPrice = product
    ? product.price +
      Object.values(selectedVariants).reduce(
        (sum, val: any) => sum + (Number(val.price) || 0),
        0
      )
    : 0;

  const handleMainAction = () => {
    const actionType = product.action_type || "cart";

    if (actionType === "link") {
      window.open(product.checkout_url || "#", "_blank");
      return;
    }

    if (actionType === "cart") {
      const variantString = Object.entries(selectedVariants)
        .map(([k, v]) => `${k}: ${v.label}`)
        .join(", ");
      addItem({
        id: product.id,
        title: product.title,
        price: currentPrice,
        image: product.images?.[0],
        quantity,
        variant: variantString || undefined,
      });
      return;
    }

    // For WhatsApp or Form Order
    setStep("form");
  };

  const handleConfirmOrder = async () => {
    if (!clientInfo.name || !clientInfo.phone) {
      alert("Please provide your name and phone number.");
      return;
    }

    setIsSubmitting(true);
    const actionType = product.action_type;
    const variantText = Object.entries(selectedVariants)
      .map(([key, val]) => `${key}: ${val.label}`)
      .join(", ");

    if (actionType === "whatsapp") {
      const message = `*NEW ORDER REQUEST* 🛍️\n------------------\n*Product:* ${
        product.title
      }\n*Price:* $${currentPrice.toFixed(2)}\n*Qty:* ${quantity}\n${
        variantText ? `*Options:* ${variantText}` : ""
      }\n\n*CUSTOMER DETAILS* 👤\n*Name:* ${clientInfo.name}\n*Phone:* ${
        clientInfo.phone
      }\n*Address:* ${
        clientInfo.address
      }\n------------------\nPlease confirm this order!`;

      const number = product.whatsapp_number
        ? product.whatsapp_number.replace(/[^0-9]/g, "")
        : "";
      window.open(
        `https://wa.me/${number}?text=${encodeURIComponent(message)}`,
        "_blank"
      );

      setStep("success");
      setIsSubmitting(false);
      return;
    }

    if (actionType === "form_order") {
      const { error: orderError } = await supabase.from("pro_orders").insert({
        actor_id: product.actor_id,
        customer_name: clientInfo.name,
        customer_phone: clientInfo.phone,
        customer_address: clientInfo.address,
        product_name: product.title,
        product_price: currentPrice,
        quantity: quantity,
        variants: selectedVariants,
        status: "pending",
      });

      if (orderError) {
        alert("There was an issue placing your order. Please try again.");
      } else {
        setStep("success");
      }
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <h2 className="text-2xl font-bold mb-4">{error}</h2>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  // Helper to check environment
  function isCustomDomain() {
    return !MAIN_DOMAINS.some((domain) =>
      window.location.hostname.includes(domain)
    );
  }

  // Package all the state and handlers into a single object to pass to the Presenter
  const layoutProps = {
    product,
    username: isCustomDomain() ? "" : `pro/${resolvedUsername}`,
    currentPrice,
    quantity,
    setQuantity,
    selectedVariants,
    setSelectedVariants,
    activeImgIndex,
    setActiveImgIndex,
    step,
    setStep,
    clientInfo,
    setClientInfo,
    isSubmitting,
    handleMainAction,
    handleConfirmOrder,
  };

  // ROUTER: Inject the exact layout based on the actor's active theme
  return (
    <>
      <CartDrawerContainer theme={theme} username={layoutProps.username} />

      {theme === "minimal" ? (
        <MinimalProductLayout {...layoutProps} />
      ) : (
        <ModernProductLayout {...layoutProps} />
      )}
    </>
  );
}
