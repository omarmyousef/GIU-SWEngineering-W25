import { useQuery, useMutation } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Clock, Zap, Package } from "lucide-react";
import type { Order, Vendor, OrderItem } from "@shared/schema";

type ImmediatePickupOrder = Order & {
  vendor: Vendor;
  orderItems: OrderItem[];
};

export default function ImmediatePickupPage() {
  const { toast } = useToast();

  const { data: orders, isLoading } = useQuery<ImmediatePickupOrder[]>({
    queryKey: ["/api/orders/immediate-pickup"],
  });

  const claimOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await apiRequest("POST", `/api/orders/${orderId}/claim`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Order claimed!",
        description: "Your order is ready for immediate pickup",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders/immediate-pickup"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to claim order",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getTimeAvailable = (scheduledTime: string | Date) => {
    const scheduled = typeof scheduledTime === 'string' ? new Date(scheduledTime) : scheduledTime;
    const fifteenMinutesLater = new Date(scheduled.getTime() + 15 * 60000);
    const now = new Date();
    const minutesRemaining = Math.floor((fifteenMinutesLater.getTime() - now.getTime()) / 60000);
    return Math.max(0, minutesRemaining);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="h-8 w-8 text-primary" />
            <h1 className="font-display text-4xl font-bold text-foreground" data-testid="text-page-title">
              Immediate Pickup
            </h1>
          </div>
          <p className="text-muted-foreground">
            Grab ready-to-go orders from cancelled or unclaimed meals
          </p>
        </div>

        {!orders || orders.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-display text-xl font-semibold mb-2">No immediate pickup orders</h3>
            <p className="text-muted-foreground">
              Check back later for ready-to-go meals
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => {
              const minutesLeft = getTimeAvailable(order.scheduledPickupTime);
              
              return (
                <Card key={order.id} className="overflow-hidden hover-elevate" data-testid={`card-order-${order.id}`}>
                  <CardHeader className="bg-primary/5 border-b">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">
                        {order.vendor.name}
                      </CardTitle>
                      <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                        Ready Now
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Items</h4>
                      {order.orderItems.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {item.quantity}x {item.itemName}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between pt-2 border-t font-bold text-lg">
                      <span>Total</span>
                      <span className="text-primary" data-testid={`text-price-${order.id}`}>
                        ${parseFloat(order.totalPrice).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm p-2 bg-muted rounded-md">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Available for {minutesLeft} more min
                      </span>
                    </div>

                    <Button
                      className="w-full gap-2"
                      onClick={() => claimOrderMutation.mutate(order.id)}
                      disabled={claimOrderMutation.isPending}
                      data-testid={`button-claim-${order.id}`}
                    >
                      <Zap className="h-4 w-4" />
                      Grab Now
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
