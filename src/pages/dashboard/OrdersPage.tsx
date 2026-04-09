import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { useOutletContext } from "react-router-dom";
import { ActorDashboardContextType } from "../../layouts/ActorDashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Package,
  Phone,
  ShoppingBag,
  Eye,
  User,
  Copy,
  Globe,
  Filter,
} from "lucide-react";
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
// Import the new Filter
import SiteFilter from "../../components/dashboard/SiteFilter";

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
  status: "pending" | "completed" | "cancelled";
  notes: string | null;
  portfolio_id?: string; // New field
}

const OrdersPage = () => {
  const { actorData } = useOutletContext<ActorDashboardContextType>();
  const [allOrders, setAllOrders] = useState<ProOrder[]>([]); // Store ALL
  const [filteredOrders, setFilteredOrders] = useState<ProOrder[]>([]); // Store Displayed
  const [loading, setLoading] = useState(true);

  // Site Filter State
  const [sites, setSites] = useState<any[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>("all");

  // Sheet State
  const [selectedOrder, setSelectedOrder] = useState<ProOrder | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [internalNotes, setInternalNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    if (!actorData.id) return;
    setLoading(true);

    // 1. Fetch Sites (for filter)
    const { data: mySites } = await supabase
      .from("portfolios")
      .select("id, site_name")
      .eq("actor_id", actorData.id);
    if (mySites) setSites(mySites);

    // 2. Fetch Orders
    const { data, error } = await supabase
      .from("pro_orders")
      .select("*")
      .eq("actor_id", actorData.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setAllOrders(data);
      setFilteredOrders(data); // Default show all
    }
    setLoading(false);
  };

  // Handle Filter Change
  useEffect(() => {
    if (selectedSiteId === "all") {
      setFilteredOrders(allOrders);
    } else {
      setFilteredOrders(
        allOrders.filter((o) => o.portfolio_id === selectedSiteId)
      );
    }
  }, [selectedSiteId, allOrders]);

  useEffect(() => {
    fetchData();
  }, [actorData.id]);

  const handleViewDetails = (order: ProOrder) => {
    setSelectedOrder(order);
    setInternalNotes(order.notes || "");
    setIsSheetOpen(true);
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    // Optimistic Update
    const updater = (prev: ProOrder[]) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, status: newStatus as any } : o
      );
    setAllOrders(updater);
    setFilteredOrders(updater);

    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus as any });
    }

    await supabase
      .from("pro_orders")
      .update({ status: newStatus })
      .eq("id", orderId);
  };

  const saveNotes = async () => {
    if (!selectedOrder) return;
    setIsSaving(true);
    const { error } = await supabase
      .from("pro_orders")
      .update({ notes: internalNotes })
      .eq("id", selectedOrder.id);
    if (!error) {
      const updater = (prev: ProOrder[]) =>
        prev.map((o) =>
          o.id === selectedOrder.id ? { ...o, notes: internalNotes } : o
        );
      setAllOrders(updater);
      setFilteredOrders(updater);
      alert("Notes saved successfully");
    }
    setIsSaving(false);
  };

  const getSiteName = (id?: string) => {
    if (!id) return "Unknown Site";
    return sites.find((s) => s.id === id)?.site_name || "Portfolio";
  };

  if (loading)
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );

  return (
    <div className="p-4 md:p-8 space-y-6 w-full max-w-8xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Direct Orders</h1>
          <p className="text-muted-foreground mt-1">
            Manage sales from your portfolio shop.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <SiteFilter
            sites={sites}
            selectedSiteId={selectedSiteId}
            onChange={setSelectedSiteId}
          />
          <Button variant="outline" onClick={fetchData} size="sm">
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <div className="bg-muted p-4 rounded-full mb-3">
                <Package className="w-8 h-8 opacity-50" />
              </div>
              <p>
                No orders found {selectedSiteId !== "all" && "for this website"}
                .
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Date</TableHead>
                    <TableHead>Source</TableHead> {/* NEW COLUMN */}
                    <TableHead>Customer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow
                      key={order.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleViewDetails(order)}
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(order.created_at).toLocaleDateString()}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="text-[10px] font-normal"
                        >
                          {getSiteName(order.portfolio_id)}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="font-medium">
                          {order.customer_name || "Guest"}
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="font-medium text-sm">
                          {order.quantity}x {order.product_name}
                        </span>
                      </TableCell>

                      <TableCell className="font-medium">
                        {order.product_price}
                      </TableCell>

                      <TableCell>
                        {order.status === "pending" && (
                          <Badge
                            variant="outline"
                            className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                          >
                            Pending
                          </Badge>
                        )}
                        {order.status === "completed" && (
                          <Badge
                            variant="outline"
                            className="bg-green-500/10 text-green-500 border-green-500/20"
                          >
                            Completed
                          </Badge>
                        )}
                        {order.status === "cancelled" && (
                          <Badge
                            variant="outline"
                            className="bg-red-500/10 text-red-500 border-red-500/20"
                          >
                            Cancelled
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" className="h-8 gap-1">
                          <Eye size={14} />
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

      {/* Sheet logic remains mostly the same, just keeping the updated structure */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:w-[540px] overflow-y-auto">
          {selectedOrder && (
            <>
              <SheetHeader className="mb-6">
                <SheetTitle className="flex items-center gap-2">
                  Order Details
                  <Badge variant="secondary">
                    {getSiteName(selectedOrder.portfolio_id)}
                  </Badge>
                </SheetTitle>
                <SheetDescription>
                  Placed on{" "}
                  {new Date(selectedOrder.created_at).toLocaleString()}
                </SheetDescription>
              </SheetHeader>
              {/* ... (Existing Detail Logic) ... */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <User size={14} /> Customer
                  </h3>
                  <div className="bg-muted/30 p-4 rounded-lg space-y-3 border">
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Name
                      </Label>
                      <div className="font-medium">
                        {selectedOrder.customer_name}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Phone
                        </Label>
                        <div className="font-medium">
                          {selectedOrder.customer_phone}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Address
                        </Label>
                        <div className="font-medium text-sm">
                          {selectedOrder.customer_address}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Status Management */}
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
                  <Label>Notes</Label>
                  <Textarea
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    className="bg-background"
                  />
                  <Button size="sm" onClick={saveNotes} disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="animate-spin h-4 w-4" />
                    ) : (
                      "Save"
                    )}
                  </Button>
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
