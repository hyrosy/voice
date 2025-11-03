// In src/pages/dashboard/DashboardOrders.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabaseClient';
import { useOutletContext } from 'react-router-dom';
import { ActorDashboardContextType } from '@/layouts/ActorDashboardLayout';
import OrderDetailsModal from '@/components/OrderDetailsModal';
import emailjs from '@emailjs/browser';

// --- shadcn/ui Imports ---
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// ---

// --- Interface (Unchanged) ---
interface Order {
  actor_id: any;
  id: string;
  order_id_string: string;
  client_name: string;
  client_email: string;
  status: string;
  script: string;
  final_audio_url?: string;
  actors: {
    ActorName: string;
    ActorEmail?: string;
  };
  // Add new fields for the modal
  service_type: 'voice_over' | 'scriptwriting' | 'video_editing';
  offer_price: number | null;
  deliveries: { id: string; created_at: string; file_url: string; version_number: number }[];
}

const DashboardOrders: React.FC = () => {
  const { actorData } = useOutletContext<ActorDashboardContextType>();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // --- 1. SET DEFAULT TAB TO "quotes" ---
  const [activeOrderTab, setActiveOrderTab] = useState<'quotes' | 'active' | 'completed'>('quotes');

  const fetchOrders = useCallback(async () => {
    if (!actorData.id) return;
    setLoading(true);

    const { data: orderData } = await supabase
      .from('orders')
      // Select all order fields, actor info, AND all deliveries
      .select('*, actors(ActorName, ActorEmail), deliveries(*)')
      .eq('actor_id', actorData.id)
      .order('created_at', { ascending: false });

    if (orderData) {
      // Sort deliveries for each order (newest first)
      const sortedOrderData = orderData.map(order => ({
        ...order,
        deliveries: order.deliveries.sort((a: { created_at: string | number | Date; }, b: { created_at: string | number | Date; }) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),
      }));
      setOrders(sortedOrderData as Order[]);
    }
    setLoading(false);
  }, [actorData.id]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // --- handleActorConfirmPayment (Unchanged) ---
  const handleActorConfirmPayment = async (orderId: string, clientEmail: string, clientName: string, orderIdString: string) => {
    // ... (existing logic) ...
  };

  // --- 3. UPDATE FILTER LOGIC ---
  const filteredOrders = orders.filter(order => {
    if (activeOrderTab === 'quotes') {
      return order.status === 'awaiting_offer';
    }
    if (activeOrderTab === 'active') {
      // 'offer_made' is now an active status!
      return !['Completed', 'Cancelled', 'awaiting_offer'].includes(order.status);
    }
    return order.status === 'Completed';
  });

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Your Orders</h1>
      {message && <div className="mb-4 p-3 bg-card border rounded-lg text-center text-sm">{message}</div>}
      
      <Card>
        <CardContent className="p-6">
          {/* --- 4. UPDATE TABS --- */}
          <Tabs value={activeOrderTab} onValueChange={(value) => setActiveOrderTab(value as 'quotes' | 'active' | 'completed')}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="quotes">
                Quotes
                {/* Add a badge for new quotes */}
                {orders.filter(o => o.status === 'awaiting_offer').length > 0 && (
                  <span className="ml-2 bg-primary text-primary-foreground text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {orders.filter(o => o.status === 'awaiting_offer').length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="space-y-4 mt-6">
            {loading ? (
              <p className="text-muted-foreground text-center py-4">Loading orders...</p>
            ) : filteredOrders.length > 0 ? (
              filteredOrders.map(order => (
                <Card key={order.id} className="p-0 overflow-hidden">
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedOrder(order)}
                    className={`w-full justify-between h-auto py-4 px-6 text-left ${
                      order.status === 'awaiting_offer' ? 'border-l-4 border-yellow-500' :
                      order.status === 'Awaiting Actor Confirmation' ? 'border-l-4 border-green-500' : ''
                    }`}
                  >
                    <div>
                      <p className="font-bold text-base text-foreground">
                        {order.service_type === 'voice_over' ? `Order #${order.order_id_string}` : `Quote #${order.order_id_string}`}
                      </p>
                      <p className="text-sm text-muted-foreground">Client: {order.client_name}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      order.status === 'Completed' ? 'bg-green-500/20 text-green-300' :
                      order.status === 'Awaiting Actor Confirmation' ? 'bg-green-500/20 text-green-300 animate-pulse' :
                      order.status === 'awaiting_offer' ? 'bg-yellow-500/20 text-yellow-300' : // New status
                      order.status === 'offer_made' ? 'bg-blue-500/20 text-blue-300' : // New status
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {order.status === 'awaiting_offer' ? 'Awaiting Offer' : order.status}
                    </span>
                  </Button>
                </Card>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">You have no {activeOrderTab} orders.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdate={fetchOrders}
          onActorConfirmPayment={handleActorConfirmPayment}
        />
      )}
    </div>
  );
};

export default DashboardOrders;