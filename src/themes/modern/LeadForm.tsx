import React, { useState } from 'react';
import { BlockProps } from '../types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Send, CheckCircle2, User, Mail, Phone, MessageSquare } from 'lucide-react';
import { supabase } from '@/supabaseClient';

const LeadForm: React.FC<BlockProps & { actorId?: string }> = ({ data, actorId }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!actorId) {
            alert("Configuration Error: Owner ID missing.");
            return;
        }

        setIsLoading(true);

        const { error } = await supabase.from('leads').insert({
            actor_id: actorId,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            subject: formData.subject || 'New Portfolio Inquiry',
            message: formData.message,
            source: 'portfolio_form'
        });

        setIsLoading(false);

        if (error) {
            console.error("Lead Error:", error);
            alert("Failed to send message. Please try again.");
        } else {
            setIsSent(true);
        }
    };

    if (isSent) {
        return (
            <section className="py-24 px-6 bg-neutral-900/50 border-y border-white/5">
                <div className="max-w-md mx-auto text-center space-y-4 animate-in zoom-in duration-300">
                    <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 size={32} />
                    </div>
                    <h3 className="text-2xl font-bold text-white">Message Sent!</h3>
                    <p className="text-neutral-400">
                        Thank you, {formData.name}. We have received your message and will get back to you shortly.
                    </p>
                    <Button variant="outline" onClick={() => { setIsSent(false); setFormData({name:'', email:'', phone:'', subject:'', message:''}) }}>
                        Send Another
                    </Button>
                </div>
            </section>
        );
    }

    return (
        <section className="py-20 px-6 md:px-12 bg-neutral-950 relative overflow-hidden" id="contact-form">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-1/3 h-1/3 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="max-w-4xl mx-auto relative z-10">
                <div className="text-center mb-12 space-y-4">
                    <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                        {data.title || "Get in Touch"}
                    </h2>
                    <p className="text-lg text-neutral-400">
                        {data.subheadline || "Send me a message for bookings and inquiries."}
                    </p>
                </div>

                <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6 md:p-10 backdrop-blur-sm">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-neutral-400 flex items-center gap-2"><User size={14}/> Name <span className="text-red-500">*</span></Label>
                                <Input 
                                    required 
                                    placeholder="Your Name" 
                                    className="bg-black/50 border-white/10 h-12"
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-neutral-400 flex items-center gap-2"><Mail size={14}/> Email <span className="text-red-500">*</span></Label>
                                <Input 
                                    required 
                                    type="email" 
                                    placeholder="your@email.com" 
                                    className="bg-black/50 border-white/10 h-12"
                                    value={formData.email}
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-neutral-400 flex items-center gap-2"><Phone size={14}/> Phone (Optional)</Label>
                                <Input 
                                    type="tel" 
                                    placeholder="+1 234 567 890" 
                                    className="bg-black/50 border-white/10 h-12"
                                    value={formData.phone}
                                    onChange={e => setFormData({...formData, phone: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-neutral-400 flex items-center gap-2"><MessageSquare size={14}/> Subject</Label>
                                <Input 
                                    placeholder="Booking Inquiry..." 
                                    className="bg-black/50 border-white/10 h-12"
                                    value={formData.subject}
                                    onChange={e => setFormData({...formData, subject: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-neutral-400">Message <span className="text-red-500">*</span></Label>
                            <Textarea 
                                required 
                                placeholder="How can I help you?" 
                                className="bg-black/50 border-white/10 min-h-[150px] resize-none p-4 leading-relaxed"
                                value={formData.message}
                                onChange={e => setFormData({...formData, message: e.target.value})}
                            />
                        </div>

                        <div className="pt-4">
                            <Button type="submit" disabled={isLoading} size="lg" className="w-full h-14 text-base font-semibold rounded-xl bg-primary text-black hover:bg-primary/90 transition-all">
                                {isLoading ? <Loader2 className="animate-spin mr-2"/> : <Send className="mr-2 w-5 h-5"/>}
                                {data.buttonText || "Send Message"}
                            </Button>
                        </div>

                    </form>
                </div>
            </div>
        </section>
    );
};

export default LeadForm;