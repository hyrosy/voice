import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useOutletContext } from 'react-router-dom';
import { ActorDashboardContextType } from '../../layouts/ActorDashboardLayout';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Loader2, Package, Phone, MapPin, CheckCircle2, XCircle, Clock, 
  ShoppingBag, Eye, User, Calendar, Save, Copy
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner"; // Optional: if you use a toast library, otherwise we use alert

interface ProOrder {
  id: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  product_name: string;
  product_price: string;
  quantity: number;
  variants: Record<string, string>;
  status: 'pending' | 'completed' | 'cancelled';
  notes: string | null;
}

const OrdersPage = () => {
  const { actorData } = useOutletContext<ActorDashboardContextType>();
  const [orders, setOrders] = useState<ProOrder[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Sheet State
  const [selectedOrder, setSelectedOrder] = useState<ProOrder | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [internalNotes, setInternalNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchOrders = async () => {
    if (!actorData.id) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from('pro_orders') 
      .select('*')
      .eq('actor_id', actorData.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOrders(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [actorData.id]);

  // Handle Opening the Sheet
  const handleViewDetails = (order: ProOrder) => {
    setSelectedOrder(order);
    setInternalNotes(order.notes || "");
    setIsSheetOpen(true);
  };

  // Handle Status Update (Optimistic)
  const updateStatus = async (orderId: string, newStatus: string) => {
    // 1. Update Local State
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus as any } : o));
    if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus as any });
    }
    
    // 2. Update Database
    await supabase
      .from('pro_orders')
      .update({ status: newStatus })
      .eq('id', orderId);
  };

  // Handle Saving Notes
  const saveNotes = async () => {
    if (!selectedOrder) return;
    setIsSaving(true);

    const { error } = await supabase
        .from('pro_orders')
        .update({ notes: internalNotes })
        .eq('id', selectedOrder.id);
    
    if (!error) {
        // Update local list
        setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, notes: internalNotes } : o));
        // Simple notification
        alert("Notes saved successfully"); // Or use toast.success("Saved")
    } else {
        alert("Failed to save notes");
    }
    setIsSaving(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // toast.success("Copied to clipboard");
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="p-4 md:p-8 space-y-6 w-full max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 pt-20">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Direct Orders</h1>
            <p className="text-muted-foreground mt-1">Manage sales from your portfolio shop.</p>
        </div>
        <Button variant="outline" onClick={fetchOrders} size="sm">Refresh</Button>
      </div>

      <Card>
        <CardContent className="p-0">
            {orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <div className="bg-muted p-4 rounded-full mb-3">
                        <Package className="w-8 h-8 opacity-50" />
                    </div>
                    <p>No direct orders yet.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">Date</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Product</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.map((order) => (
                                <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewDetails(order)}>
                                    <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                                        {new Date(order.created_at).toLocaleDateString()}
                                    </TableCell>
                                    
                                    <TableCell>
                                        <div className="font-medium">{order.customer_name || 'Guest'}</div>
                                        {order.customer_phone && (
                                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                <Phone size={10} /> {order.customer_phone}
                                            </div>
                                        )}
                                    </TableCell>
                                    
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <ShoppingBag size={14} className="text-primary" />
                                            <span className="font-medium">
                                                {order.quantity}x {order.product_name}
                                            </span>
                                        </div>
                                        {order.variants && Object.keys(order.variants).length > 0 && (
                                            <div className="flex gap-1 mt-1 flex-wrap">
                                                {Object.entries(order.variants).map(([k, v]) => (
                                                    <Badge key={k} variant="secondary" className="text-[10px] px-1 py-0 h-5 border-white/10">
                                                        {k}: {v}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </TableCell>
                                    
                                    <TableCell className="font-medium">
                                        {order.product_price}
                                    </TableCell>
                                    
                                    <TableCell>
                                        {order.status === 'pending' && <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Pending</Badge>}
                                        {order.status === 'completed' && <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Completed</Badge>}
                                        {order.status === 'cancelled' && <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Cancelled</Badge>}
                                    </TableCell>
                                    
                                    <TableCell className="text-right">
                                        <Button size="sm" variant="ghost" className="h-8 gap-1">
                                            <Eye size={14} /> Details
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </CardContent>
      </Card>

      {/* --- ORDER DETAILS SLIDE-OVER --- */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:w-[540px] overflow-y-auto">
            {selectedOrder && (
                <>
                    <SheetHeader className="mb-6">
                        <SheetTitle className="flex items-center gap-2">
                            Order #{selectedOrder.id.slice(0, 8)}
                            {selectedOrder.status === 'pending' && <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Pending</Badge>}
                            {selectedOrder.status === 'completed' && <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Completed</Badge>}
                            {selectedOrder.status === 'cancelled' && <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Cancelled</Badge>}
                        </SheetTitle>
                        <SheetDescription>
                            Placed on {new Date(selectedOrder.created_at).toLocaleString()}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="space-y-8">
                        
                        {/* 1. CUSTOMER INFO */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <User size={14} /> Customer
                            </h3>
                            <div className="bg-muted/30 p-4 rounded-lg space-y-3 border">
                                <div>
                                    <Label className="text-xs text-muted-foreground">Name</Label>
                                    <div className="font-medium">{selectedOrder.customer_name}</div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Phone</Label>
                                        <div className="font-medium flex items-center gap-2">
                                            {selectedOrder.customer_phone}
                                            <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => copyToClipboard(selectedOrder.customer_phone)}>
                                                <Copy size={10} />
                                            </Button>
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Address</Label>
                                        <div className="font-medium text-sm">{selectedOrder.customer_address}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. ORDER ITEMS */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <ShoppingBag size={14} /> Order Items
                            </h3>
                            <div className="flex items-start justify-between bg-muted/30 p-4 rounded-lg border">
                                <div>
                                    <div className="font-bold text-lg">{selectedOrder.product_name}</div>
                                    <div className="text-muted-foreground text-sm mb-2">Quantity: {selectedOrder.quantity}</div>
                                    
                                    {selectedOrder.variants && Object.keys(selectedOrder.variants).length > 0 && (
                                        <div className="flex gap-1 flex-wrap">
                                            {Object.entries(selectedOrder.variants).map(([k, v]) => (
                                                <Badge key={k} variant="secondary" className="border-white/10">
                                                    {k}: {v}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="text-xl font-bold text-primary">
                                    {selectedOrder.product_price}
                                </div>
                            </div>
                        </div>

                        {/* 3. MANAGEMENT (Status & Notes) */}
                        <div className="space-y-4">
                             <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <CheckCircle2 size={14} /> Management
                            </h3>
                            
                            <div className="grid gap-4 bg-muted/30 p-4 rounded-lg border">
                                <div className="space-y-2">
                                    <Label>Order Status</Label>
                                    <Select 
                                        value={selectedOrder.status} 
                                        onValueChange={(val) => updateStatus(selectedOrder.id, val)}
                                    >
                                        <SelectTrigger className="bg-background">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pending">🟡 Pending</SelectItem>
                                            <SelectItem value="completed">🟢 Completed</SelectItem>
                                            <SelectItem value="cancelled">🔴 Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Internal Notes / Tracking</Label>
                                    <Textarea 
                                        placeholder="Add tracking number or private notes..." 
                                        className="bg-background resize-none h-24"
                                        value={internalNotes}
                                        onChange={(e) => setInternalNotes(e.target.value)}
                                    />
                                    <Button size="sm" onClick={saveNotes} disabled={isSaving}>
                                        {isSaving && <Loader2 className="mr-2 h-3 w-3 animate-spin"/>}
                                        <Save className="mr-2 h-3 w-3" /> Save Notes
                                    </Button>
                                </div>
                            </div>
                        </div>

                    </div>
                </>
            )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default OrdersPage;