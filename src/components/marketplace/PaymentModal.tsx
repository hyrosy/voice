import React, { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripeCheckoutForm from '../StripeCheckoutForm'; // Your existing component
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from '../../supabaseClient';

// Initialize Stripe (Replace with your actual Public Key from .env)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  orderId: string; // We attach the payment to this order
  onSuccess: (paymentIntentId: string) => void;
}

const PaymentModal = ({ isOpen, onClose, amount, orderId, onSuccess }: PaymentModalProps) => {
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    if (isOpen && amount > 0) {
      // Call your Supabase Edge Function to get the secret
      const fetchSecret = async () => {
        const { data, error } = await supabase.functions.invoke('create-payment-intent', {
          body: { amount: amount * 100, currency: 'mad', orderId } // Amount in cents
        });
        if (data?.clientSecret) setClientSecret(data.clientSecret);
        if (error) console.error('Stripe Error:', error);
      };
      fetchSecret();
    }
  }, [isOpen, amount, orderId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Secure Payment ({amount} MAD)</DialogTitle>
        </DialogHeader>
        {clientSecret && (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <StripeCheckoutForm onSuccessfulPayment={onSuccess} />
          </Elements>
        )}
        {!clientSecret && <div className="p-4 text-center">Loading secure gateway...</div>}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;