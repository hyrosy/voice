import React, { useState, useRef } from 'react';
import { BlockProps } from '../types';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; 
import { ShoppingBag, Eye, Minus, Plus, MessageCircle, ArrowRight, ChevronLeft, MapPin, Phone, User, ExternalLink, ChevronRight, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { ProductDetailModal, Product } from './components/ProductDetailModal';
import { supabase } from '@/supabaseClient'; 

// --- HELPER: Parse Variants String ---
const parseVariants = (raw: string) => {
    if (!raw) return [];
    return raw.split('|').map(group => {
        const [name, opts] = group.split(':');
        if (!name || !opts) return null;
        return {
            name: name.trim(),
            options: opts.trim() // Keep as string to match Editor format
        };
    }).filter(Boolean);
};

// --- COMPONENT: EMBEDDED SPOTLIGHT CHECKOUT ---
const SpotlightCheckout = ({ product, actorId }: { product: any, actorId?: string }) => {
    // STATE
    const [step, setStep] = useState<'details' | 'form' | 'success'>('details');
    const [quantity, setQuantity] = useState(1);
    const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
    const [clientInfo, setClientInfo] = useState({ name: '', address: '', phone: '' });
    const [activeImgIndex, setActiveImgIndex] = useState(0); 
    const [isSubmitting, setIsSubmitting] = useState(false);

    const images = product.images?.length ? product.images : (product.image ? [product.image] : []);
    
    // LOGIC: Use 'whatsapp' as default if not set
    const actionType = product.actionType || 'whatsapp';
    const variants = product.variants || parseVariants(product.variantsRaw);

    // --- GALLERY NAVIGATION ---
    const nextImage = () => setActiveImgIndex(prev => (prev + 1) % images.length);
    const prevImage = () => setActiveImgIndex(prev => (prev - 1 + images.length) % images.length);

    const handleMainAction = () => {
        // A. IF DIRECT LINK
        if (actionType === 'link') {
            const url = product.checkoutUrl || '#';
            window.open(url, '_blank');
            return;
        }

        // B. IF WHATSAPP OR FORM
        if (variants.length > 0) {
            const missing = variants.find((v: any) => !selectedVariants[v.name]);
            if (missing) {
                alert(`Please select a ${missing.name}`);
                return;
            }
        }
        setStep('form');
    };

    const handleConfirmOrder = async () => {
        if (!clientInfo.name || !clientInfo.phone) {
            alert("Please provide your name and phone.");
            return;
        }

        // A. WhatsApp Logic
        if (actionType === 'whatsapp') {
            const variantText = Object.entries(selectedVariants)
                .map(([key, val]) => `${key}: ${val}`)
                .join(', ');

            const message = `
*NEW ORDER* 🛍️
------------------
*Product:* ${product.title}
*Price:* ${product.price}
*Qty:* ${quantity}
${variantText ? `*Options:* ${variantText}` : ''}

*CUSTOMER DETAILS* 👤
*Name:* ${clientInfo.name}
*Phone:* ${clientInfo.phone}
*Address:* ${clientInfo.address}
------------------
Please confirm my order!`.trim();

            const number = product.whatsappNumber ? product.whatsappNumber.replace(/[^0-9]/g, '') : '1234567890';
            window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, '_blank');
            return;
        }

        // B. Direct Order (Database) Logic
        if (actionType === 'form_order') {
            if (!actorId) {
                alert("Configuration Error: Missing Merchant ID");
                return;
            }
            setIsSubmitting(true);
            
            const { error } = await supabase.from('pro_orders').insert({
                actor_id: actorId,
                customer_name: clientInfo.name,
                customer_phone: clientInfo.phone,
                customer_address: clientInfo.address,
                product_name: product.title,
                product_price: product.price,
                quantity: quantity,
                variants: selectedVariants,
                status: 'pending'
            });

            setIsSubmitting(false);

            if (error) {
                console.error("Order Error:", error);
                alert("Could not place order. Please try again.");
            } else {
                setStep('success');
            }
        }
    };

    if (step === 'success') {
        return (
            <div className="bg-neutral-900/30 border border-white/10 rounded-2xl overflow-hidden min-h-[500px] flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300">
                <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 size={40} />
                </div>
                <h3 className="text-3xl font-bold text-white mb-2">Order Received!</h3>
                <p className="text-neutral-400 max-w-md mx-auto mb-8">
                    Thank you, {clientInfo.name}. We have received your order for <strong>{product.title}</strong> and will contact you shortly at {clientInfo.phone}.
                </p>
                <Button onClick={() => setStep('details')} variant="outline" className="border-white/10 hover:bg-white/5">Back to Shop</Button>
            </div>
        )
    }

    return (
        <div className="bg-neutral-900/30 border border-white/10 rounded-2xl overflow-hidden md:grid md:grid-cols-2 min-h-[500px]">
            
            {/* LEFT: IMAGE & GALLERY */}
            <div className="bg-black/50 relative flex flex-col h-[400px] md:h-auto group/gallery">
                 <div className="flex-grow relative overflow-hidden">
                     {images.length > 0 ? (
                        <>
                            <img src={images[activeImgIndex]} alt={product.title} className="w-full h-full object-cover absolute inset-0 transition-all duration-500"/>
                            {images.length > 1 && (
                                <>
                                    <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full opacity-0 group-hover/gallery:opacity-100 transition-opacity z-20"><ChevronLeft size={20} /></button>
                                    <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full opacity-0 group-hover/gallery:opacity-100 transition-opacity z-20"><ChevronRight size={20} /></button>
                                </>
                            )}
                        </>
                     ) : (
                        <div className="flex items-center justify-center h-full text-neutral-600"><ShoppingBag size={64}/></div>
                     )}
                 </div>
                 {images.length > 1 && (
                     <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10 px-4">
                         {images.map((img: string, idx: number) => (
                             <button key={idx} onClick={() => setActiveImgIndex(idx)} className={cn("w-10 h-10 rounded border-2 overflow-hidden transition-all shadow-sm flex-shrink-0", activeImgIndex === idx ? "border-primary scale-110" : "border-white/30 opacity-60 hover:opacity-100")}><img src={img} className="w-full h-full object-cover" /></button>
                         ))}
                     </div>
                 )}
            </div>
            
            {/* RIGHT: INTERACTIVE AREA */}
            <div className="p-8 md:p-12 flex flex-col justify-center h-full relative">
                
                {step === 'details' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div>
                            <Badge className="bg-primary text-black hover:bg-primary mb-3">Featured</Badge>
                            <h3 className="text-3xl md:text-4xl font-bold text-white leading-tight">{product.title}</h3>
                            <p className="text-2xl text-primary font-medium mt-2">{product.price}</p>
                        </div>
                        <p className="text-lg text-neutral-300 leading-relaxed line-clamp-3 md:line-clamp-none">{product.description}</p>
                        
                        {/* Variant Selectors - SAFE STRING HANDLING ADDED HERE */}
                        {actionType !== 'link' && variants.map((v: any) => (
                            <div key={v.name} className="space-y-2">
                                <span className="text-xs uppercase text-neutral-500 tracking-wider font-bold">{v.name}</span>
                                <div className="flex flex-wrap gap-2">
                                    {/* FIX: Ensure we handle both Array and String options */}
                                    {(Array.isArray(v.options) ? v.options : (v.options || '').split(',')).map((opt: string) => {
                                        const val = opt.trim();
                                        if(!val) return null;
                                        return (
                                            <button
                                                key={val}
                                                onClick={() => setSelectedVariants(prev => ({...prev, [v.name]: val}))}
                                                className={cn("px-4 py-2 rounded-lg border text-sm transition-all", selectedVariants[v.name] === val ? "bg-white text-black border-white font-bold" : "border-white/10 text-neutral-400 hover:border-white/30")}
                                            >
                                                {val}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        <div className="pt-4 flex flex-col sm:flex-row gap-4">
                             {actionType !== 'link' && (
                                 <div className="flex items-center bg-neutral-800 rounded-lg p-1 border border-white/10 w-max">
                                    <Button size="icon" variant="ghost" onClick={() => setQuantity(q => Math.max(1, q - 1))} className="h-10 w-10"><Minus size={16}/></Button>
                                    <span className="w-12 text-center font-mono text-lg">{quantity}</span>
                                    <Button size="icon" variant="ghost" onClick={() => setQuantity(q => q + 1)} className="h-10 w-10"><Plus size={16}/></Button>
                                 </div>
                             )}
                             <Button size="lg" className="flex-grow h-12 text-base rounded-lg" onClick={handleMainAction}>
                                {product.buttonText || (actionType === 'link' ? 'Buy Now' : 'Order Now')} 
                                {actionType === 'link' ? <ExternalLink className="ml-2 w-4 h-4" /> : <ArrowRight className="ml-2 w-4 h-4" />}
                             </Button>
                        </div>
                    </div>
                )}

                {step === 'form' && (
                    <div className="space-y-6 h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center gap-2 -ml-2 mb-2">
                            <Button variant="ghost" size="sm" onClick={() => setStep('details')} className="text-neutral-400 hover:text-white"><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
                            <h3 className="text-xl font-bold">Shipping Details</h3>
                        </div>
                        <div className="space-y-4 flex-grow">
                            <div className="space-y-2"><Label className="text-neutral-400">Full Name</Label><div className="relative"><User className="absolute left-3 top-3 h-4 w-4 text-neutral-500" /><Input value={clientInfo.name} onChange={e => setClientInfo({...clientInfo, name: e.target.value})} className="bg-neutral-800 border-white/10 pl-10 h-11" placeholder="Name" /></div></div>
                            <div className="space-y-2"><Label className="text-neutral-400">Phone</Label><div className="relative"><Phone className="absolute left-3 top-3 h-4 w-4 text-neutral-500" /><Input value={clientInfo.phone} onChange={e => setClientInfo({...clientInfo, phone: e.target.value})} className="bg-neutral-800 border-white/10 pl-10 h-11" placeholder="Phone" /></div></div>
                            <div className="space-y-2"><Label className="text-neutral-400">Address</Label><div className="relative"><MapPin className="absolute left-3 top-3 h-4 w-4 text-neutral-500" /><Input value={clientInfo.address} onChange={e => setClientInfo({...clientInfo, address: e.target.value})} className="bg-neutral-800 border-white/10 pl-10 h-11" placeholder="Address" /></div></div>
                        </div>
                        <div className="mt-auto pt-6 border-t border-white/10">
                            <Button size="lg" disabled={isSubmitting} className={cn("w-full h-12 text-base text-white rounded-lg", actionType === 'whatsapp' ? "bg-green-600 hover:bg-green-500" : "bg-primary hover:bg-primary/90 text-black")} onClick={handleConfirmOrder}>
                                {isSubmitting ? <Loader2 className="mr-2 w-5 h-5 animate-spin" /> : (actionType === 'whatsapp' ? <MessageCircle className="mr-2 w-5 h-5" /> : <FileText className="mr-2 w-5 h-5" />)}
                                {isSubmitting ? 'Processing...' : (actionType === 'whatsapp' ? 'Confirm via WhatsApp' : 'Confirm Order')}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- MAIN SHOP COMPONENT ---
const Shop: React.FC<BlockProps & { actorId?: string }> = ({ data, actorId }) => {
    const products = data.products || [];
    const variant = data.variant || 'grid';
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scrollLeft = () => scrollContainerRef.current?.scrollBy({ left: -320, behavior: 'smooth' });
    const scrollRight = () => scrollContainerRef.current?.scrollBy({ left: 320, behavior: 'smooth' });

    if (products.length === 0 && !data.title) return null;

    return (
        <section className="py-20 bg-neutral-950 relative overflow-hidden" id="shop">
             <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                {variant !== 'spotlight' && (
                    <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                        <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">{data.title}</h2>
                        <p className="text-lg text-neutral-400">{data.subheadline}</p>
                    </div>
                )}

                {/* 1. GRID */}
                {variant === 'grid' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {products.map((p: any, idx: number) => (
                             <ProductCard key={idx} product={p} onClick={() => setSelectedProduct(p)} />
                        ))}
                    </div>
                )}
                
                {/* 2. SPOTLIGHT (Embedded) */}
                {variant === 'spotlight' && products[0] && (
                    <div>
                         <div className="mb-12 text-center"><h2 className="text-3xl font-bold text-white">{data.title}</h2></div>
                         <SpotlightCheckout product={products[0]} actorId={actorId} />
                    </div>
                )}

                 {/* 3. CAROUSEL */}
                 {variant === 'carousel' && (
                    <div className="flex overflow-x-auto pb-8 gap-6 snap-x snap-mandatory hide-scrollbar">
                        {products.map((p: any, idx: number) => (
                            <div key={idx} className="min-w-[280px] md:min-w-[350px] snap-center">
                                <ProductCard product={p} onClick={() => setSelectedProduct(p)} />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <ProductDetailModal 
                product={selectedProduct} 
                actorId={actorId}
                isOpen={!!selectedProduct} 
                onClose={() => setSelectedProduct(null)} 
            />
        </section>
    );
};

// Helper Card
const ProductCard = ({ product, onClick }: { product: any, onClick: () => void }) => (
    <div className="group relative bg-neutral-900/50 border border-white/10 rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300 flex flex-col h-full cursor-pointer" onClick={onClick}>
        <div className="relative aspect-[4/3] overflow-hidden bg-black/50">
            {product.image ? (
                <img src={product.image} alt={product.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            ) : (
                <div className="flex items-center justify-center h-full text-neutral-700"><ShoppingBag size={40} /></div>
            )}
             {product.price && (
                <div className="absolute top-3 right-3"><Badge variant="secondary" className="bg-black/70 backdrop-blur-md text-white border-white/10 font-bold text-sm">{product.price}</Badge></div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button variant="secondary" size="sm" className="gap-2"><Eye size={16} /> Quick View</Button>
            </div>
        </div>
        <div className="p-5">
            <h3 className="text-lg font-bold text-white mb-1">{product.title}</h3>
            <p className="text-sm text-neutral-400 line-clamp-2">{product.description}</p>
        </div>
    </div>
);

export default Shop;