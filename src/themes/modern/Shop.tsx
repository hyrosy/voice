import React from 'react';
import { BlockProps } from '../types';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, ArrowRight, ExternalLink } from 'lucide-react';
import { cn } from "@/lib/utils";

// --- SUB-COMPONENT: PRODUCT CARD ---
const ProductCard = ({ product, variant }: { product: any, variant: string }) => (
    <div className="group relative bg-neutral-900/50 border border-white/10 rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300 flex flex-col h-full">
        {/* Image Area */}
        <div className={cn(
            "relative overflow-hidden bg-black/50",
            variant === 'compact' ? "aspect-square" : "aspect-[4/3]"
        )}>
            {product.image ? (
                <img 
                    src={product.image} 
                    alt={product.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
            ) : (
                <div className="flex items-center justify-center h-full text-neutral-700">
                    <ShoppingBag size={40} />
                </div>
            )}
            
            {/* Price Tag Overlay */}
            {product.price && (
                <div className="absolute top-3 right-3">
                    <Badge variant="secondary" className="bg-black/70 backdrop-blur-md text-white border-white/10 font-bold text-sm">
                        {product.price}
                    </Badge>
                </div>
            )}
        </div>

        {/* Content Area */}
        <div className="p-5 flex flex-col flex-grow">
            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-primary transition-colors">
                {product.title || "Product Name"}
            </h3>
            <p className="text-sm text-neutral-400 line-clamp-2 mb-4 flex-grow">
                {product.description || "Short description of the product goes here."}
            </p>
            
            <Button asChild className="w-full gap-2 mt-auto">
                <a href={product.link || "#"} target="_blank" rel="noopener noreferrer">
                    {product.buttonText || "Buy Now"} 
                    <ExternalLink size={14} />
                </a>
            </Button>
        </div>
    </div>
);

const Shop: React.FC<BlockProps> = ({ data }) => {
    const products = data.products || [];
    const variant = data.variant || 'grid'; // grid, carousel, spotlight

    if (products.length === 0 && !data.title) return null;

    return (
        <section className="py-20 px-6 md:px-12 bg-neutral-950 relative overflow-hidden" id="shop">
            
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                    {data.label && (
                        <span className="text-primary text-sm font-bold tracking-wider uppercase">
                            {data.label}
                        </span>
                    )}
                    <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                        {data.title || "Shop & Merch"}
                    </h2>
                    {data.subheadline && (
                        <p className="text-lg text-neutral-400 leading-relaxed">
                            {data.subheadline}
                        </p>
                    )}
                </div>

                {/* --- LAYOUT VARIANTS --- */}

                {/* 1. GRID LAYOUT */}
                {variant === 'grid' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {products.map((product: any, idx: number) => (
                            <ProductCard key={idx} product={product} variant="standard" />
                        ))}
                    </div>
                )}

                {/* 2. SPOTLIGHT (Featured Single Item) */}
                {variant === 'spotlight' && products[0] && (
                    <div className="bg-neutral-900/30 border border-white/10 rounded-2xl overflow-hidden md:grid md:grid-cols-2 items-center">
                        <div className="aspect-square md:aspect-auto md:h-full relative bg-black/50">
                             <img 
                                src={products[0].image} 
                                alt={products[0].title} 
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="p-8 md:p-12 space-y-6">
                            <Badge className="bg-primary text-black hover:bg-primary">Featured Drop</Badge>
                            <h3 className="text-3xl md:text-4xl font-bold text-white">{products[0].title}</h3>
                            <p className="text-lg text-neutral-300">{products[0].description}</p>
                            <div className="flex items-center gap-4 pt-4">
                                <span className="text-2xl font-bold text-white">{products[0].price}</span>
                                <Button size="lg" asChild className="px-8 rounded-full">
                                    <a href={products[0].link} target="_blank">{products[0].buttonText || "Get It Now"}</a>
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. CAROUSEL (Simple Horizontal Scroll) */}
                {variant === 'carousel' && (
                    <div className="flex overflow-x-auto pb-8 gap-6 snap-x snap-mandatory hide-scrollbar">
                        {products.map((product: any, idx: number) => (
                            <div key={idx} className="min-w-[280px] md:min-w-[350px] snap-center">
                                <ProductCard product={product} variant="standard" />
                            </div>
                        ))}
                    </div>
                )}

            </div>
        </section>
    );
};

export default Shop;