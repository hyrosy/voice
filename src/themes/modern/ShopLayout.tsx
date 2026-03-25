import React from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingBag, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ShopLayoutProps } from "../../pages/product-layouts/types";

export default function ModernShopLayout({
  username,
  collections,
  activeCollection,
  setActiveCollection,
  searchQuery,
  setSearchQuery,
  filteredProducts,
}: ShopLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground">
      {/* SHOP HEADER */}
      <header className="bg-muted/30 border-b border-border pt-20 pb-12 px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Shop
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Browse our latest products, digital downloads, and exclusive services.
        </p>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-12 flex flex-col md:flex-row gap-8 items-start">
        {/* LEFT SIDEBAR: FILTERS */}
        <aside className="w-full md:w-64 flex-shrink-0 md:sticky md:top-24 space-y-8">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="pl-9 bg-background border-border"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="hidden md:block">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">
              Collections
            </h3>
            <div className="flex flex-col space-y-2">
              <button
                onClick={() => setActiveCollection(null)}
                className={cn(
                  "text-left px-3 py-2 rounded-lg text-sm transition-colors",
                  activeCollection === null
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                All Products
              </button>
              {collections.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCollection(c.id)}
                  className={cn(
                    "text-left px-3 py-2 rounded-lg text-sm transition-colors",
                    activeCollection === c.id
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {c.title}
                </button>
              ))}
            </div>
          </div>

          {/* MOBILE COLLECTION PILLS */}
          <div className="md:hidden flex overflow-x-auto gap-2 pb-2 hide-scrollbar">
            <Badge
              variant={activeCollection === null ? "default" : "outline"}
              className={cn(
                "cursor-pointer px-4 py-2 text-sm whitespace-nowrap",
                activeCollection === null
                  ? ""
                  : "text-muted-foreground border-border"
              )}
              onClick={() => setActiveCollection(null)}
            >
              All
            </Badge>
            {collections.map((c) => (
              <Badge
                key={c.id}
                variant={activeCollection === c.id ? "default" : "outline"}
                className={cn(
                  "cursor-pointer px-4 py-2 text-sm whitespace-nowrap",
                  activeCollection === c.id
                    ? ""
                    : "text-muted-foreground border-border"
                )}
                onClick={() => setActiveCollection(c.id)}
              >
                {c.title}
              </Badge>
            ))}
          </div>
        </aside>

        {/* RIGHT CONTENT: PRODUCT GRID */}
        <div className="flex-1 w-full">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-24 border border-dashed border-border rounded-2xl bg-muted/10">
              <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-xl font-bold mb-2">No products found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or selecting a different collection.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <Link
                  key={product.id}
                  to={`/${username}/product/${product.slug || product.id}`}
                  className="group flex flex-col bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/50 hover:shadow-lg transition-all duration-300"
                >
                  <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <ShoppingBag size={40} opacity={0.5} />
                      </div>
                    )}
                    <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                      <Badge className="bg-background/80 backdrop-blur-md text-foreground border-border font-bold">
                        ${product.price.toFixed(2)}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    {product.pro_collections?.title && (
                      <span className="text-[10px] uppercase tracking-widest text-primary font-bold mb-2">
                        {product.pro_collections.title}
                      </span>
                    )}
                    <h3 className="font-bold text-lg leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {product.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-auto">
                      {product.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
