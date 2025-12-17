import { useQuery, useMutation } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Clock, Package, CheckCircle, DollarSign, TrendingUp } from "lucide-react";
import type { Order, Vendor, OrderItem } from "@shared/schema";

type OrderWithDetails = Order & {
  student: { username: string };
  orderItems: OrderItem[];
};

export default function VendorDashboardPage() {
  const { toast } = useToast();

  const { data: vendor } = useQuery({
  queryKey: ["/api/vendor/me"],
  queryFn: async () => {
    const res = await apiRequest("GET", "/api/vendor/me");
    return res.json();
  },
});


  const { data: orders, isLoading } = useQuery<OrderWithDetails[]>({
    queryKey: ["/api/vendor/orders"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/vendor/orders");
      return res.json();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/orders/${orderId}/status`, { status });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Order updated",
        description: "Order status has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/orders"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update order",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateVendorStatusMutation = useMutation({
    mutationFn: async (data: { status?: string; nextAvailableSlot?: string }) => {
      const res = await apiRequest("PATCH", "/api/vendor/status", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Status updated",
        description: "Your truck status has been updated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/me"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const pendingOrders = orders?.filter((o) => o.status === "pending") || [];
  const inPrepOrders = orders?.filter((o) => o.status === "in preparation") || [];
  const readyOrders = orders?.filter((o) => o.status === "ready") || [];

  const todayOrders = orders?.filter((o) => {
    const orderDate = new Date(o.createdAt);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  }) || [];

  const todayRevenue = todayOrders.reduce((sum, o) => sum + parseFloat(o.totalPrice), 0);

  if (isLoading || !vendor) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-32 w-full mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  const OrderCard = ({ order }: { order: OrderWithDetails }) => (
    <Card className="overflow-hidden" data-testid={`card-order-${order.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">
              Order #{order.id.slice(0, 8)}
            </CardTitle>
            <CardDescription className="text-sm">
              {order.student.username}
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-xs">
            ${parseFloat(order.totalPrice).toFixed(2)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          {order.orderItems.map((item) => (
            <div key={item.id} className="text-sm text-muted-foreground">
              {item.quantity}x {item.itemName}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
          <Clock className="h-3 w-3" />
          Pickup: {new Date(order.scheduledPickupTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
        <Select
          value={order.status}
          onValueChange={(status) => updateStatusMutation.mutate({ orderId: order.id, status })}
        >
          <SelectTrigger className="w-full" data-testid={`select-status-${order.id}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in preparation">In Preparation</SelectItem>
            <SelectItem value="ready">Ready</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold text-foreground mb-6" data-testid="text-page-title">
            Vendor Dashboard
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Today's Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  <span className="text-3xl font-bold" data-testid="text-orders-today">{todayOrders.length}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Today's Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <span className="text-3xl font-bold" data-testid="text-revenue-today">${todayRevenue.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg Prep Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                  <span className="text-3xl font-bold">{vendor.averagePrepTime || 15} min</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Truck Status</CardTitle>
              <CardDescription>Manage your availability and wait times</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Current Status</Label>
                  <Select
                    value={vendor.status}
                    onValueChange={(status) => updateVendorStatusMutation.mutate({ status })}
                  >
                    <SelectTrigger data-testid="select-vendor-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not busy">Not Busy</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                      <SelectItem value="very busy">Very Busy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="next-slot">Next Available Slot</Label>
                  <Input
                    id="next-slot"
                    type="datetime-local"
                    defaultValue={vendor.nextAvailableSlot ? new Date(vendor.nextAvailableSlot).toISOString().slice(0, 16) : ""}
                    onChange={(e) => {
                      if (e.target.value) {
                        updateVendorStatusMutation.mutate({ nextAvailableSlot: new Date(e.target.value).toISOString() });
                      }
                    }}
                    data-testid="input-next-slot"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3" data-testid="tabs-orders">
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              Pending ({pendingOrders.length})
            </TabsTrigger>
            <TabsTrigger value="preparation" className="gap-2">
              <Package className="h-4 w-4" />
              In Prep ({inPrepOrders.length})
            </TabsTrigger>
            <TabsTrigger value="ready" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Ready ({readyOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            {pendingOrders.length === 0 ? (
              <Card className="p-12 text-center">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No pending orders</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="preparation" className="mt-6">
            {inPrepOrders.length === 0 ? (
              <Card className="p-12 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No orders in preparation</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inPrepOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="ready" className="mt-6">
            {readyOrders.length === 0 ? (
              <Card className="p-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No ready orders</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {readyOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
