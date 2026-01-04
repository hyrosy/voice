import React, { useState } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, ShoppingBag, ArrowRight, MessageCircle, X, ChevronLeft, ExternalLink, User, Phone, MapPin, Loader2, FileText, CheckCircle2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { trackEvent } from '../../../lib/analytics'; 
import { supabase } from '@/supabaseClient'; // NEW IMPORT

interface ProductVariant {
    name: string; 
    options: string;
}

export interface Product {
    actor_id: string;
    title: string;
    price: string;
    description: string;
    image?: string;
    images?: string[]; 
    variants?: ProductVariant[];
    actionType?: 'whatsapp' | 'link' | 'form_order'; // UPDATED
    checkoutUrl?: string;
    whatsappNumber?: string;
    buttonText?: string;
    stock?: string;
}

interface ProductDetailModalProps {
    product: Product | null;
    actorId?: string; // NEW PROP
    isOpen: boolean;
    onClose: () => void;
}

export const ProductDetailModal = ({ product, actorId, isOpen, onClose }: ProductDetailModalProps) => {
    // UPDATED STATE TYPE
    const [step, setStep] = useState<'details' | 'form' | 'success'>('details');
    const [quantity, setQuantity] = useState(1);
    const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
    const [clientInfo, setClientInfo] = useState({ name: '', address: '', phone: '' });
    const [activeImgIndex, setActiveImgIndex] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false); // NEW STATE

    if (!product) return null;

    const images = product.images && product.images.length > 0 
        ? product.images 
        : (product.image ? [product.image] : []);

    const variants = product.variants || [];
    const actionType = product.actionType || 'whatsapp';

    const handleMainAction = () => {
        if (actionType === 'link') {
            const url = product.checkoutUrl || '#';
            trackEvent(product.actor_id, 'shop_click', { product_name: product.title, url: product.checkoutUrl });
            window.open(url, '_blank');
            onClose();
            return;
        }

        if (variants.length > 0) {
             const missing = variants.find(v => !selectedVariants[v.name]);
             if (missing) {
                 alert(`Please select a ${missing.name}`);
                 return;
             }
        }
        setStep('form');
    };

    // RENAMED & UPDATED FUNCTION
    const handleConfirmOrder = async () => {
        if (!clientInfo.name || !clientInfo.phone) {
            alert("Please provide your name and phone number.");
            return;
        }

        // 1. WhatsApp Flow (Existing)
        if (actionType === 'whatsapp') {
            const variantText = Object.entries(selectedVariants).map(([key, val]) => `${key}: ${val}`).join(', ');
            
            const message = `
*NEW ORDER REQUEST* 🛍️
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
Please confirm this order!`.trim();

            const number = product.whatsappNumber ? product.whatsappNumber.replace(/[^0-9]/g, '') : '1234567890'; 
            
            trackEvent(product.actor_id, 'whatsapp_click', { product_name: product.title });
            window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, '_blank');
            onClose();
            return;
        }

        // 2. Direct Database Order Flow (NEW)
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
                alert("There was an issue saving your order. Please try again.");
            } else {
                trackEvent(product.actor_id, 'shop_click', { product_name: product.title, type: 'direct_order' });
                setStep('success'); // Move to success view
            }
        }
    };

    const handleClose = () => {
        setStep('details');
        setActiveImgIndex(0);
        setQuantity(1);
        setSelectedVariants({});
        setClientInfo({ name: '', address: '', phone: '' });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden bg-neutral-900 text-white border-white/10 md:h-[600px] flex flex-col md:flex-row">
                
                {/* LEFT: IMAGE GALLERY */}
                <div className="w-full md:w-1/2 bg-black flex flex-col relative h-[300px] md:h-full">
                     {images.length > 0 ? (
                        <div className="w-full h-full flex items-center justify-center bg-neutral-950">
                            <img src={images[activeImgIndex]} alt={product?.title} className="w-full h-full object-contain"/>
                        </div>
                     ) : (
                        <div className="flex items-center justify-center h-full text-neutral-700"><ShoppingBag size={64} /></div>
                     )}
                     
                     {images.length > 1 && (
                         <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 px-4 overflow-x-auto">
                             {images.map((img, idx) => (
                                 <button
                                    key={idx}
                                    onClick={() => setActiveImgIndex(idx)}
                                    className={cn("relative w-12 h-12 rounded-md overflow-hidden border-2 transition-all flex-shrink-0", activeImgIndex === idx ? "border-primary shadow-lg scale-110" : "border-white/20 opacity-70 hover:opacity-100")}
                                 >
                                     <img src={img} className="w-full h-full object-cover" alt="thumb" />
                                 </button>
                             ))}
                         </div>
                     )}
                </div>

                {/* RIGHT: DETAILS & FORM */}
                <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col h-full overflow-y-auto relative">
                    <button onClick={handleClose} className="absolute top-4 right-4 text-neutral-500 hover:text-white hidden md:block"><X size={24} /></button>

                    {/* --- STEP 3: SUCCESS VIEW (NEW) --- */}
                    {step === 'success' && (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-in fade-in zoom-in duration-300">
                             <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center">
                                <CheckCircle2 size={40} />
                             </div>
                             <div>
                                <h2 className="text-2xl font-bold text-white">Order Received!</h2>
                                <p className="text-neutral-400 text-sm mt-2 max-w-xs mx-auto">
                                    Thank you, {clientInfo.name}. We have received your order for <strong>{product.title}</strong> and will contact you at {clientInfo.phone} shortly.
                                </p>
                             </div>
                             <Button onClick={handleClose} variant="outline" className="mt-4 border-white/10 text-white hover:bg-white/5">Close</Button>
                        </div>
                    )}

                    {/* --- STEP 1: SELECTION --- */}
                    {step === 'details' && (
                        <div className="space-y-6 flex-grow flex flex-col animate-in slide-in-from-right-4 duration-300">
                            <div>
                                <h2 className="text-3xl font-bold">{product.title}</h2>
                                <p className="text-xl text-primary font-medium mt-1">{product.price}</p>
                            </div>
                            <div className="text-neutral-400 text-sm leading-relaxed line-clamp-4 hover:line-clamp-none transition-all">
                                {product.description}
                            </div>
                            {variants.map((variant) => (
                                <div key={variant.name} className="space-y-2">
                                    <Label className="text-xs uppercase tracking-wider text-neutral-500">{variant.name}</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {variant.options.split(',').map((opt) => {
                                            const val = opt.trim();
                                            return (
                                                <Badge 
                                                    key={val}
                                                    variant="outline"
                                                    className={cn("cursor-pointer px-3 py-1.5 border-white/10 hover:border-primary transition-colors text-sm", selectedVariants[variant.name] === val ? "bg-white text-black border-white" : "text-neutral-300")}
                                                    onClick={() => setSelectedVariants(prev => ({...prev, [variant.name]: val}))}
                                                >
                                                    {val}
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}

                            {/* Quantity Selector - Show for both Form types */}
                            {actionType !== 'link' && (
                                <div className="space-y-2 pt-2">
                                    <Label className="text-xs uppercase tracking-wider text-neutral-500">Quantity</Label>
                                    <div className="flex items-center gap-4">
                                        <Button size="icon" variant="outline" className="h-8 w-8 rounded-full" onClick={() => setQuantity(q => Math.max(1, q - 1))}><Minus size={14}/></Button>
                                        <span className="font-mono text-lg w-8 text-center">{quantity}</span>
                                        <Button size="icon" variant="outline" className="h-8 w-8 rounded-full" onClick={() => setQuantity(q => q + 1)}><Plus size={14}/></Button>
                                    </div>
                                </div>
                            )}

                            <div className="mt-auto pt-4">
                                <Button className="w-full h-12 text-base rounded-lg" onClick={handleMainAction}>
                                    {product.buttonText || (actionType === 'link' ? 'Buy Now' : 'Order Now')} 
                                    {actionType === 'link' ? <ExternalLink className="ml-2 w-4 h-4" /> : <ArrowRight className="ml-2 w-4 h-4" />}
                                </Button>
                                {product.stock && <p className="text-xs text-center text-neutral-500 mt-2">Stock: {product.stock}</p>}
                            </div>
                        </div>
                    )}

                    {/* --- STEP 2: FORM (WhatsApp & Direct Order) --- */}
                    {step === 'form' && (
                        <div className="space-y-6 flex-grow flex flex-col animate-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center gap-2 mb-2">
                                <Button variant="ghost" size="icon" onClick={() => setStep('details')} className="-ml-2 h-8 w-8 text-neutral-400 hover:text-white"><ChevronLeft /></Button>
                                <h3 className="text-lg font-bold">Shipping Details</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-neutral-400">Full Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                                        <Input value={clientInfo.name} onChange={e => setClientInfo({...clientInfo, name: e.target.value})} placeholder="Your Name" className="bg-neutral-800 border-white/10 pl-10"/>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-neutral-400">Phone Number</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                                        <Input value={clientInfo.phone} onChange={e => setClientInfo({...clientInfo, phone: e.target.value})} placeholder="+1 234 567 890" className="bg-neutral-800 border-white/10 pl-10"/>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-neutral-400">Delivery Address</Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                                        <Input value={clientInfo.address} onChange={e => setClientInfo({...clientInfo, address: e.target.value})} placeholder="Street, City" className="bg-neutral-800 border-white/10 pl-10"/>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto space-y-3">
                                <div className="bg-neutral-800/50 p-3 rounded text-xs text-neutral-400 flex justify-between">
                                    <span>Total Estimate:</span>
                                    <span className="text-primary font-bold text-sm">
                                        {(parseFloat(product.price.replace(/[^0-9.]/g, '') || '0') * quantity).toFixed(2)}
                                    </span>
                                </div>
                                <Button 
                                    disabled={isSubmitting}
                                    className={cn(
                                        "w-full h-12 text-base text-white rounded-lg",
                                        actionType === 'whatsapp' ? "bg-green-600 hover:bg-green-500" : "bg-primary hover:bg-primary/90 text-black"
                                    )} 
                                    onClick={handleConfirmOrder}
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    ) : (
                                        actionType === 'whatsapp' ? <MessageCircle className="mr-2 w-5 h-5" /> : <FileText className="mr-2 w-5 h-5" />
                                    )}
                                    {isSubmitting ? 'Processing...' : (actionType === 'whatsapp' ? 'Send via WhatsApp' : 'Confirm Order')}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};