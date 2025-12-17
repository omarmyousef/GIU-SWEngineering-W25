import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Clock, Package, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import type { Order, Vendor, OrderItem } from "@shared/schema";

type OrderWithDetails = Order & {
  vendor: Vendor;
  orderItems: OrderItem[];
};

export default function MyOrdersPage() {
  const { toast } = useToast();

  const { data: orders, isLoading } = useQuery<OrderWithDetails[]>({
    queryKey: ["/api/orders"],
  });

  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      await apiRequest("DELETE", `/api/orders/${orderId}`);
    },
    onSuccess: () => {
      toast({
        title: "Order cancelled",
        description: "Your order has been cancelled successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to cancel order",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const delayOrderMutation = useMutation({
    mutationFn: async ({ orderId, newTime }: { orderId: string; newTime: string }) => {
      const res = await apiRequest("PATCH", `/api/orders/${orderId}/delay`, { scheduledPickupTime: newTime });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Order delayed",
        description: "Your pickup time has been updated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delay order",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-5 w-5" />;
      case "in preparation":
        return <Package className="h-5 w-5" />;
      case "ready":
        return <CheckCircle className="h-5 w-5" />;
      case "cancelled":
        return <XCircle className="h-5 w-5" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
      case "in preparation":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20";
      case "ready":
        return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
      case "cancelled":
        return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20";
    }
  };

  const canModifyOrder = (order: Order) => {
    return order.status === "pending";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold text-foreground mb-2" data-testid="text-page-title">
            My Orders
          </h1>
          <p className="text-muted-foreground">
            Track and manage your food orders
          </p>
        </div>

        {!orders || orders.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-display text-xl font-semibold mb-2">No orders yet</h3>
            <p className="text-muted-foreground mb-6">
              Start by browsing vendors and placing your first order
            </p>
            <Link href="/">
              <a>
                <Button>Browse Vendors</Button>
              </a>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="overflow-hidden" data-testid={`card-order-${order.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2 mb-1">
                        {getStatusIcon(order.status)}
                        Order from {order.vendor.name}
                      </CardTitle>
                      <CardDescription>
                        Placed {new Date(order.createdAt).toLocaleString()}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(order.status)} data-testid={`badge-status-${order.id}`}>
                      {order.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Order Items</h4>
                    <div className="space-y-1">
                      {order.orderItems.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm" data-testid={`order-item-${item.id}`}>
                          <span className="text-muted-foreground">
                            {item.quantity}x {item.itemName}
                          </span>
                          <span className="font-medium">
                            ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between pt-2 border-t font-semibold">
                      <span>Total</span>
                      <span data-testid={`text-total-${order.id}`}>${parseFloat(order.totalPrice).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="space-y-2 p-3 bg-muted rounded-md">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Scheduled Pickup:</span>
                      <span data-testid={`text-pickup-time-${order.id}`}>
                        {new Date(order.scheduledPickupTime).toLocaleString()}
                      </span>
                    </div>
                    {order.isImmediatePickup && (
                      <Badge variant="secondary" className="text-xs">
                        Immediate Pickup Available
                      </Badge>
                    )}
                  </div>

                  {canModifyOrder(order) && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newTime = prompt("Enter new pickup time (YYYY-MM-DD HH:MM):");
                          if (newTime) {
                            delayOrderMutation.mutate({ orderId: order.id, newTime });
                          }
                        }}
                        disabled={delayOrderMutation.isPending}
                        data-testid={`button-delay-${order.id}`}
                      >
                        Delay Pickup
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (confirm("Are you sure you want to cancel this order?")) {
                            cancelOrderMutation.mutate(order.id);
                          }
                        }}
                        disabled={cancelOrderMutation.isPending}
                        data-testid={`button-cancel-${order.id}`}
                      >
                        Cancel Order
                      </Button>
                    </div>
                  )}

                  {order.status === "ready" && (
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md">
                      <p className="text-sm font-medium text-green-700 dark:text-green-400">
                        Your order is ready for pickup! Please collect within 15 minutes.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
