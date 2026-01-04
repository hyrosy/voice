import React, { useState } from 'react';
import { BlockProps } from '../types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Send, CheckCircle2, User, Mail, Phone, MessageSquare, Calendar } from 'lucide-react';
import { supabase } from '@/supabaseClient';
import { cn } from "@/lib/utils";

// Helper to get icon for field type
const getFieldIcon = (type: string) => {
    switch (type) {
        case 'email': return <Mail size={14} />;
        case 'tel': return <Phone size={14} />;
        case 'textarea': return <MessageSquare size={14} />;
        case 'date': return <Calendar size={14} />;
        default: return <User size={14} />; // Default generic icon
    }
};

const LeadForm: React.FC<BlockProps & { actorId?: string }> = ({ data, actorId }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    
    // Dynamic Form State
    const [formState, setFormState] = useState<Record<string, string>>({});

    const fields = data.fields || [
        { id: 'name', label: 'Name', type: 'text', required: true, width: 'half' },
        { id: 'email', label: 'Email', type: 'email', required: true, width: 'half' },
        { id: 'message', label: 'Message', type: 'textarea', required: true, width: 'full' }
    ];

    const variant = data.variant || 'centered'; // 'centered' | 'split' | 'minimal'

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!actorId) {
            alert("Configuration Error: Owner ID missing.");
            return;
        }

        setIsLoading(true);

        // 1. Separate Standard DB Fields from Custom Metadata
        // We look for specific IDs: 'name', 'email', 'phone', 'subject', 'message'
        const dbPayload: any = {
            actor_id: actorId,
            source: 'portfolio_form',
            name: formState['name'] || 'Anonymous',
            email: formState['email'] || 'no-email@provided.com',
            phone: formState['phone'] || null,
            subject: formState['subject'] || 'New Portfolio Inquiry',
            message: formState['message'] || '',
            metadata: {} // Everything else goes here
        };

        // 2. Populate Metadata with custom fields
        fields.forEach((f: any) => {
            if (!['name', 'email', 'phone', 'subject', 'message'].includes(f.id)) {
                dbPayload.metadata[f.label] = formState[f.id];
            }
        });

        // 3. Send to Supabase
        const { error } = await supabase.from('leads').insert(dbPayload);

        setIsLoading(false);

        if (error) {
            console.error("Lead Error:", error);
            alert("Failed to send message. Please try again.");
        } else {
            setIsSent(true);
        }
    };

    // --- RENDER SUCCESS STATE ---
    if (isSent) {
        return (
            <section className="py-24 px-6 bg-neutral-900/50 border-y border-white/5">
                <div className="max-w-md mx-auto text-center space-y-4 animate-in zoom-in duration-300">
                    <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 size={32} />
                    </div>
                    <h3 className="text-2xl font-bold text-white">Message Sent!</h3>
                    <p className="text-neutral-400">
                        Thank you! We have received your message and will get back to you shortly.
                    </p>
                    <Button variant="outline" onClick={() => { setIsSent(false); setFormState({}); }}>
                        Send Another
                    </Button>
                </div>
            </section>
        );
    }

    // --- RENDER FORM COMPONENT ---
    const FormContent = () => (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-wrap gap-4">
                {fields.map((field: any, idx: number) => {
                    const isHalf = field.width === 'half';
                    return (
                        <div 
                            key={idx} 
                            className={cn(
                                "space-y-2 flex-grow", 
                                isHalf ? "basis-[calc(50%-1rem)] min-w-[250px]" : "basis-full w-full"
                            )}
                        >
                            <Label className="text-neutral-400 flex items-center gap-2 text-xs uppercase tracking-wide">
                                {getFieldIcon(field.type)} {field.label} {field.required && <span className="text-red-500">*</span>}
                            </Label>
                            
                            {field.type === 'textarea' ? (
                                <Textarea 
                                    required={field.required}
                                    placeholder={field.placeholder}
                                    className="bg-black/50 border-white/10 min-h-[120px] resize-none p-4 leading-relaxed focus:border-primary/50 transition-all"
                                    value={formState[field.id] || ''}
                                    onChange={e => setFormState({...formState, [field.id]: e.target.value})}
                                />
                            ) : (
                                <Input 
                                    required={field.required}
                                    type={field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : field.type === 'date' ? 'date' : 'text'}
                                    placeholder={field.placeholder}
                                    className="bg-black/50 border-white/10 h-12 focus:border-primary/50 transition-all"
                                    value={formState[field.id] || ''}
                                    onChange={e => setFormState({...formState, [field.id]: e.target.value})}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="pt-4">
                <Button type="submit" disabled={isLoading} size="lg" className="w-full h-14 text-base font-semibold rounded-xl bg-primary text-black hover:bg-primary/90 transition-all">
                    {isLoading ? <Loader2 className="animate-spin mr-2"/> : <Send className="mr-2 w-5 h-5"/>}
                    {data.buttonText || "Send Message"}
                </Button>
            </div>
        </form>
    );

    // --- VARIANT 1: CENTERED (Standard) ---
    if (variant === 'centered') {
        return (
            <section className="py-20 px-6 md:px-12 bg-neutral-950 relative overflow-hidden" id="contact-form">
                <div className="absolute top-0 left-0 w-1/3 h-1/3 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
                <div className="max-w-3xl mx-auto relative z-10">
                    <div className="text-center mb-10 space-y-3">
                        <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">{data.title}</h2>
                        <p className="text-lg text-neutral-400">{data.subheadline}</p>
                    </div>
                    <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6 md:p-10 backdrop-blur-sm shadow-xl">
                        <FormContent />
                    </div>
                </div>
            </section>
        );
    }

    // --- VARIANT 2: SPLIT SCREEN ---
    if (variant === 'split') {
        return (
            <section className="bg-neutral-950 relative overflow-hidden flex flex-col md:flex-row min-h-[600px]" id="contact-form">
                {/* Left: Image / Content */}
                <div className="w-full md:w-1/2 relative min-h-[300px]">
                    {data.image ? (
                        <img src={data.image} alt="Contact" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                        <div className="absolute inset-0 bg-neutral-900 flex items-center justify-center text-neutral-700">
                            <span className="text-sm">No Image Selected</span>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent flex flex-col justify-end p-10">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">{data.title}</h2>
                        <p className="text-neutral-300">{data.subheadline}</p>
                    </div>
                </div>
                {/* Right: Form */}
                <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center bg-neutral-950">
                    <FormContent />
                </div>
            </section>
        );
    }

    // --- VARIANT 3: MINIMAL (No Box) ---
    return (
        <section className="py-24 px-6 bg-neutral-950" id="contact-form">
            <div className="max-w-2xl mx-auto space-y-12">
                <div className="space-y-4">
                    <h2 className="text-3xl font-bold text-white">{data.title}</h2>
                    <p className="text-neutral-400 border-l-2 border-primary pl-4">{data.subheadline}</p>
                </div>
                <FormContent />
            </div>
        </section>
    );
};

export default LeadForm;