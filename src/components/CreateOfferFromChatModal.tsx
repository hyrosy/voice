// In src/components/CreateOfferFromChatModal.tsx
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";

interface OfferDetails {
    title: string;
    services: string; // <-- This is now a text field
    agreement: string;
    price: number;
}

interface CreateOfferModalProps {
    onClose: () => void;
    onSend: (details: OfferDetails) => void;
}

const CreateOfferFromChatModal: React.FC<CreateOfferModalProps> = ({ onClose, onSend }) => {
    const [title, setTitle] = useState('');
    const [services, setServices] = useState(''); // <-- ADD THIS STATE
    const [agreement, setAgreement] = useState('');
    const [price, setPrice] = useState<number | string>('');

    const handleSubmit = () => {
        const numPrice = parseFloat(String(price));
        if (!title || !services || isNaN(numPrice) || numPrice <= 0) {
            // Add some error handling here
            return;
        }
        onSend({
            title,
            services, // <-- Pass the new text field
            agreement,
            price: numPrice
        });
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create an Offer</DialogTitle>
                    <DialogDescription>
                        The client will see this in the chat and can accept it.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Offer Title *</Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., 1-Minute Voice Over" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="services">Services Included *</Label>
                        <Input id="services" value={services} onChange={(e) => setServices(e.target.value)} placeholder="e.g., Voice Over, Scriptwriting" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="price">Price (MAD) *</Label>
                        <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g., 500" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="agreement">Offer Agreement (Optional)</Label>
                        <Textarea id="agreement" value={agreement} onChange={(e) => setAgreement(e.target.value)} placeholder="e.g., Includes 2 revisions..." />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit}>Send Offer to Chat</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CreateOfferFromChatModal;