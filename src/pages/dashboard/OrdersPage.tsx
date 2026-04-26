import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "../../supabaseClient";
import { useOutletContext } from "react-router-dom";
import { ActorDashboardContextType } from "../../layouts/ActorDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Package,
  Phone,
  ShoppingBag,
  User,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  DollarSign,
  TrendingUp,
  Tag,
  Mail,
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
import SiteFilter from "../../components/dashboard/SiteFilter";
import { cn } from "@/lib/utils";

interface ProOrder {
  id: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  product_name: string;
  product_price: string;
  quantity: number;
  variants: Record<string, any>;
  status: "pending" | "completed" | "cancelled";
  notes: string | null;
  portfolio_id?: string;
}

const OrdersPage = () => {
  const { actorData } = useOutletContext<ActorDashboardContextType>();
  const [allOrders, setAllOrders] = useState<ProOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<ProOrder[]>([]);
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
      setFilteredOrders(data);
    }
    setLoading(false);
  };

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
    }
    setIsSaving(false);
  };

  const getSiteName = (id?: string) => {
    if (!id) return "Unknown Site";
    return sites.find((s) => s.id === id)?.site_name || "Portfolio";
  };

  // --- HELPERS FOR AAA+ DISPLAY ---
  const formatOrderId = (id: string) =>
    `#ORD-${id.substring(0, 6).toUpperCase()}`;

  const parseVariants = (variants: Record<string, any>) => {
    if (!variants || Object.keys(variants).length === 0) return null;
    return Object.entries(variants)
      .map(([key, val]) => `${key}: ${val?.label || val}`)
      .join(" • ");
  };

  const parseFormNotes = (notes: string | null) => {
    if (!notes) return [];
    return notes
      .split("\n")
      .filter((line) => line.includes(":"))
      .map((line) => {
        const [key, ...rest] = line.split(":");
        return { key: key.trim(), value: rest.join(":").trim() };
      });
  };

  // --- METRICS CALCULATION ---
  const metrics = useMemo(() => {
    let revenue = 0;
    let pending = 0;
    filteredOrders.forEach((order) => {
      if (order.status === "pending") pending++;
      if (order.status !== "cancelled") {
        const amount = parseFloat(
          order.product_price?.replace(/[^0-9.]/g, "") || "0"
        );
        revenue += isNaN(amount) ? 0 : amount;
      }
    });
    return { revenue, total: filteredOrders.length, pending };
  }, [filteredOrders]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="animate-spin text-blue-600 w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 w-full max-w-7xl mx-auto bg-slate-50/50 min-h-screen rounded-3xl">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Direct Orders
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            Manage and fulfill your shop sales.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <SiteFilter
            sites={sites}
            selectedSiteId={selectedSiteId}
            onChange={setSelectedSiteId}
          />
          <Button
            variant="outline"
            onClick={fetchData}
            className="h-10 rounded-xl bg-white shadow-sm border-gray-200 text-slate-700 hover:bg-gray-50"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* 🚀 METRICS DASHBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-2xl border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white overflow-hidden relative">
          <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 opacity-50" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest">
              Gross Volume
            </CardTitle>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900">
              $
              {metrics.revenue.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Excluding cancelled orders
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white overflow-hidden relative">
          <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 opacity-50" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest">
              Total Orders
            </CardTitle>
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900">
              {metrics.total}
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              All time orders
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white overflow-hidden relative">
          <div className="absolute right-0 top-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-4 -mt-4 opacity-50" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest">
              Action Needed
            </CardTitle>
            <Clock className="w-4 h-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900">
              {metrics.pending}
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Pending fulfillment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* MAIN TABLE */}
      <Card className="rounded-2xl border-gray-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white overflow-hidden">
        <CardContent className="p-0">
          {filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400 bg-gray-50/50">
              <div className="bg-white p-6 rounded-full mb-4 shadow-sm border border-gray-100">
                <Package className="w-10 h-10 text-slate-300" />
              </div>
              <p className="font-semibold text-lg text-slate-600">
                No orders found.
              </p>
              <p className="text-sm mt-1">
                When customers purchase from your shop, they'll appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50/80 border-b border-gray-100">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">
                      Order
                    </TableHead>
                    <TableHead className="py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">
                      Customer
                    </TableHead>
                    <TableHead className="py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">
                      Product
                    </TableHead>
                    <TableHead className="py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">
                      Total
                    </TableHead>
                    <TableHead className="py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const variantsStr = parseVariants(order.variants);
                    return (
                      <TableRow
                        key={order.id}
                        className="cursor-pointer hover:bg-slate-50/80 transition-colors border-b border-gray-100 group"
                        onClick={() => handleViewDetails(order)}
                      >
                        <TableCell className="py-4 align-top">
                          <div className="font-mono font-bold text-slate-900">
                            {formatOrderId(order.id)}
                          </div>
                          <div className="text-xs text-slate-500 font-medium mt-1">
                            {new Date(order.created_at).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                          </div>
                          {selectedSiteId === "all" && (
                            <Badge
                              variant="secondary"
                              className="mt-2 text-[10px] bg-gray-100 text-gray-600 border-none font-semibold"
                            >
                              {getSiteName(order.portfolio_id)}
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="py-4 align-top">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                              {(order.customer_name || "G")[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                {order.customer_name || "Guest Checkout"}
                              </div>
                              <div className="text-sm text-slate-500 font-medium">
                                {order.customer_phone || "No phone"}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="py-4 align-top">
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            <span className="text-slate-400">
                              {order.quantity}x
                            </span>{" "}
                            {order.product_name}
                          </div>
                          {variantsStr && (
                            <div className="text-xs text-slate-500 mt-1 font-medium bg-gray-50 inline-block px-2 py-0.5 rounded-md">
                              {variantsStr}
                            </div>
                          )}
                        </TableCell>

                        <TableCell className="py-4 align-top">
                          <div className="font-bold text-slate-900 font-mono bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md inline-block">
                            {order.product_price}
                          </div>
                        </TableCell>

                        <TableCell className="py-4 align-top">
                          {order.status === "pending" && (
                            <Badge
                              variant="outline"
                              className="bg-amber-50 text-amber-700 border-amber-200 font-bold px-3 py-1"
                            >
                              <Clock className="w-3 h-3 mr-1" /> Pending
                            </Badge>
                          )}
                          {order.status === "completed" && (
                            <Badge
                              variant="outline"
                              className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold px-3 py-1"
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" />{" "}
                              Completed
                            </Badge>
                          )}
                          {order.status === "cancelled" && (
                            <Badge
                              variant="outline"
                              className="bg-rose-50 text-rose-700 border-rose-200 font-bold px-3 py-1"
                            >
                              <XCircle className="w-3 h-3 mr-1" /> Cancelled
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 🚀 THE AAA+ ORDER SHEET */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto p-0 border-l-0 bg-slate-50 sm:rounded-l-[2rem] shadow-2xl">
          {selectedOrder && (
            <div className="flex flex-col h-full">
              {/* Sheet Header */}
              <div className="p-6 md:p-8 bg-white border-b border-gray-100 space-y-4 shrink-0">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge
                      variant="secondary"
                      className="bg-gray-100 text-slate-600 border-none font-bold mb-2"
                    >
                      {getSiteName(selectedOrder.portfolio_id)}
                    </Badge>
                    <SheetTitle className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                      {formatOrderId(selectedOrder.id)}
                    </SheetTitle>
                    <div className="text-sm text-slate-500 font-medium mt-1">
                      {new Date(selectedOrder.created_at).toLocaleString(
                        "en-US",
                        { dateStyle: "long", timeStyle: "short" }
                      )}
                    </div>
                  </div>
                  <div>
                    {selectedOrder.status === "pending" && (
                      <Badge className="bg-amber-100 hover:bg-amber-100 text-amber-700 border-none font-bold px-3 py-1 text-sm shadow-none">
                        <Clock className="w-3 h-3 mr-1" /> Pending
                      </Badge>
                    )}
                    {selectedOrder.status === "completed" && (
                      <Badge className="bg-emerald-100 hover:bg-emerald-100 text-emerald-700 border-none font-bold px-3 py-1 text-sm shadow-none">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Completed
                      </Badge>
                    )}
                    {selectedOrder.status === "cancelled" && (
                      <Badge className="bg-rose-100 hover:bg-rose-100 text-rose-700 border-none font-bold px-3 py-1 text-sm shadow-none">
                        <XCircle className="w-3 h-3 mr-1" /> Cancelled
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Sheet Body (Scrollable) */}
              <div className="p-6 md:p-8 space-y-6 flex-grow overflow-y-auto">
                {/* 1. Order Summary */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-3">
                    <ShoppingBag size={14} /> Order Summary
                  </h4>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-bold text-slate-900 text-lg">
                        {selectedOrder.product_name}
                      </div>
                      <div className="text-slate-500 font-medium mt-1 text-sm">
                        Qty: {selectedOrder.quantity}
                      </div>
                      {parseVariants(selectedOrder.variants) && (
                        <div className="text-slate-500 font-medium mt-2 text-sm flex items-center gap-1.5 bg-gray-50 w-max px-2 py-1 rounded-md">
                          <Tag size={12} />{" "}
                          {parseVariants(selectedOrder.variants)}
                        </div>
                      )}
                    </div>
                    <div className="text-xl font-black font-mono text-slate-900 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                      {selectedOrder.product_price}
                    </div>
                  </div>
                </div>

                {/* 2. Customer Information */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-3">
                    <User size={14} /> Customer
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-lg">
                        {(selectedOrder.customer_name || "G")[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-base">
                          {selectedOrder.customer_name || "Guest Checkout"}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 pt-4 border-t border-gray-50">
                      <div className="flex items-start gap-3">
                        <Phone size={16} className="text-slate-400 mt-0.5" />
                        <div>
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Phone
                          </div>
                          <div className="font-medium text-slate-900 mt-0.5">
                            {selectedOrder.customer_phone || "Not provided"}
                          </div>
                        </div>
                      </div>
                      {selectedOrder.customer_address &&
                        selectedOrder.customer_address !==
                          "No Address Provided" && (
                          <div className="flex items-start gap-3">
                            <MapPin
                              size={16}
                              className="text-slate-400 mt-0.5"
                            />
                            <div>
                              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Address / Shipping
                              </div>
                              <div className="font-medium text-slate-900 mt-0.5 leading-relaxed">
                                {selectedOrder.customer_address}
                              </div>
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                </div>

                {/* 3. Form Responses (Parsed from Notes) */}
                {parseFormNotes(selectedOrder.notes).length > 0 && (
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-4">
                      <FileText size={14} /> Form Responses
                    </h4>
                    <div className="space-y-4">
                      {parseFormNotes(selectedOrder.notes).map((item, idx) => (
                        <div
                          key={idx}
                          className="bg-gray-50 p-3 rounded-xl border border-gray-100/50"
                        >
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                            {item.key}
                          </div>
                          <div className="font-medium text-slate-900 whitespace-pre-wrap">
                            {item.value || "—"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Internal Actions (Status & Notes) */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <TrendingUp size={14} /> Fulfillment
                  </h4>

                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">
                      Update Status
                    </Label>
                    <Select
                      value={selectedOrder.status}
                      onValueChange={(val) =>
                        updateStatus(selectedOrder.id, val)
                      }
                    >
                      <SelectTrigger className="h-12 bg-white border-gray-200 rounded-xl font-medium focus:ring-blue-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl shadow-xl">
                        <SelectItem
                          value="pending"
                          className="font-medium cursor-pointer"
                        >
                          <span className="text-amber-600 mr-2">●</span> Pending
                        </SelectItem>
                        <SelectItem
                          value="completed"
                          className="font-medium cursor-pointer"
                        >
                          <span className="text-emerald-600 mr-2">●</span>{" "}
                          Completed
                        </SelectItem>
                        <SelectItem
                          value="cancelled"
                          className="font-medium cursor-pointer"
                        >
                          <span className="text-rose-600 mr-2">●</span>{" "}
                          Cancelled
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 pt-2">
                    <Label className="font-bold text-slate-700">
                      Private Internal Notes
                    </Label>
                    <Textarea
                      value={internalNotes}
                      onChange={(e) => setInternalNotes(e.target.value)}
                      placeholder="Add private tracking info or notes here..."
                      className="min-h-[100px] bg-white border-gray-200 rounded-xl resize-none focus:ring-blue-600"
                    />
                    <Button
                      onClick={saveNotes}
                      disabled={
                        isSaving || internalNotes === selectedOrder.notes
                      }
                      className="w-full h-12 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold mt-2"
                    >
                      {isSaving ? (
                        <Loader2 className="animate-spin h-5 w-5" />
                      ) : (
                        "Save Notes"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default OrdersPage;
