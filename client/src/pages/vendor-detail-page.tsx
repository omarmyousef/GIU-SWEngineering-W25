import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { TimeSelectorSlider } from "@/components/ui/timeSelectorSlider";
import { ShoppingCart, Plus, Minus, Clock, ArrowLeft } from "lucide-react";
import type { Vendor, MenuItem } from "@shared/schema";

export default function VendorDetailPage() {
    const [, params] = useRoute("/vendors/:id");
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const vendorId = params?.id;

    const [cart, setCart] = useState<Map<string, { item: MenuItem; quantity: number }>>(new Map());
    const [scheduledTime, setScheduledTime] = useState<Date | null>(null);

    const { data: vendor, isLoading: vendorLoading } = useQuery<Vendor>({
        queryKey: ["/api/vendors", vendorId],
        enabled: !!vendorId,
    });

    const { data: menuItems, isLoading: menuLoading } = useQuery<MenuItem[]>({
        queryKey: ["/api/menu", vendorId],
        enabled: !!vendorId,
    });

    const placeOrderMutation = useMutation({
        mutationFn: async (orderData: any) => {
            const res = await apiRequest("POST", "/api/orders", orderData);
            return await res.json();
        },
        onSuccess: () => {
            toast({
                title: "Order placed successfully!",
                description: "You can track your order in My Orders",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
            setCart(new Map());
            setLocation("/my-orders");
        },
        onError: (error: Error) => {
            toast({
                title: "Failed to place order",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const addToCart = (item: MenuItem) => {
        const newCart = new Map(cart);
        const existing = newCart.get(item.id);
        if (existing) {
            newCart.set(item.id, { item, quantity: existing.quantity + 1 });
        } else {
            newCart.set(item.id, { item, quantity: 1 });
        }
        setCart(newCart);
    };

    const removeFromCart = (itemId: string) => {
        const newCart = new Map(cart);
        const existing = newCart.get(itemId);
        if (existing && existing.quantity > 1) {
            newCart.set(itemId, { ...existing, quantity: existing.quantity - 1 });
        } else {
            newCart.delete(itemId);
        }
        setCart(newCart);
    };

    const calculateTotal = () => {
        let total = 0;
        cart.forEach(({ item, quantity }) => {
            total += parseFloat(item.price) * quantity;
        });
        return total.toFixed(2);
    };

    const handlePlaceOrder = () => {
        console.log("🛒 VendorDetail: handlePlaceOrder called", {
            scheduledTime,
            type: typeof scheduledTime,
            isDate: scheduledTime instanceof Date,
            isValid: scheduledTime && !isNaN(scheduledTime.getTime()),
        });

        if (cart.size === 0) {
            toast({
                title: "Cart is empty",
                description: "Please add items to your cart",
                variant: "destructive",
            });
            return;
        }

        if (!scheduledTime) {
            toast({
                title: "Pickup time required",
                description: "Please select a pickup time",
                variant: "destructive",
            });
            return;
        }

        const orderItems = Array.from(cart.values()).map(({ item, quantity }) => ({
            menuItemId: item.id,
            quantity,
            price: item.price,
            itemName: item.name,
        }));

        try {
            let isoString: string;
            if (scheduledTime instanceof Date && !isNaN(scheduledTime.getTime())) {
                isoString = scheduledTime.toISOString();
            } else {
                console.error("❌ scheduledTime is not a valid Date object", scheduledTime);
                toast({
                    title: "Invalid time format",
                    description: "Please select a valid pickup time",
                    variant: "destructive",
                });
                return;
            }

            console.log("✅ Placing order with ISO string:", isoString);

            placeOrderMutation.mutate({
                vendorId,
                scheduledPickupTime: isoString,
                totalPrice: calculateTotal(),
                orderItems,
            });
        } catch (error) {
            console.error("❌ Error preparing order:", error);
            toast({
                title: "Error",
                description: "Failed to prepare order",
                variant: "destructive",
            });
        }
    };

    const groupedItems = menuItems?.reduce((acc, item) => {
        const category = item.category || "other";
        if (!acc[category]) acc[category] = [];
        acc[category].push(item);
        return acc;
    }, {} as Record<string, MenuItem[]>);

    if (vendorLoading || menuLoading) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Skeleton className="h-64 w-full mb-8" />
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-4">
                            {[...Array(4)].map((_, i) => (
                                <Skeleton key={i} className="h-32 w-full" />
                            ))}
                        </div>
                        <Skeleton className="h-96 w-full" />
                    </div>
                </main>
            </div>
        );
    }

    if (!vendor) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Card className="p-12 text-center">
                        <h3 className="font-display text-xl font-semibold mb-2">Vendor not found</h3>
                        <Button onClick={() => setLocation("/")} className="mt-4">
                            Back to vendors
                        </Button>
                    </Card>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Button
                    variant="ghost"
                    onClick={() => setLocation("/")}
                    className="mb-4 gap-2"
                    data-testid="button-back"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to vendors
                </Button>

                <div className="mb-8">
                    <div className="aspect-video md:aspect-[21/9] overflow-hidden rounded-lg bg-muted mb-6">
                        {vendor.imageUrl ? (
                            <img
                                src={vendor.imageUrl}
                                alt={vendor.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <ShoppingCart className="h-24 w-24 text-muted-foreground" />
                            </div>
                        )}
                    </div>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="font-display text-4xl font-bold mb-2" data-testid="text-vendor-name">
                                {vendor.name}
                            </h1>
                            {vendor.description && (
                                <p className="text-muted-foreground text-lg">{vendor.description}</p>
                            )}
                        </div>
                        <Badge
                            className={
                                vendor.status === "not busy"
                                    ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                                    : vendor.status === "very busy"
                                        ? "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
                                        : "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20"
                            }
                            data-testid="badge-vendor-status"
                        >
                            {vendor.status === "not busy" ? "Not Busy" : vendor.status === "very busy" ? "Very Busy" : "Neutral"}
                        </Badge>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <Tabs defaultValue="mains" className="w-full">
                            <TabsList className="w-full justify-start flex-wrap h-auto" data-testid="tabs-menu-categories">
                                {groupedItems && Object.keys(groupedItems).map((category) => (
                                    <TabsTrigger key={category} value={category} className="capitalize" data-testid={`tab-category-${category}`}>
                                        {category}
                                    </TabsTrigger>
                                ))}
                            </TabsList>

                            {groupedItems && Object.entries(groupedItems).map(([category, items]) => (
                                <TabsContent key={category} value={category} className="space-y-4 mt-6">
                                    {items.map((item) => (
                                        <Card key={item.id} className="overflow-hidden" data-testid={`card-menu-item-${item.id}`}>
                                            <div className="flex flex-col sm:flex-row gap-4 p-4">
                                                <div className="w-full sm:w-32 h-32 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                                                    {item.imageUrl ? (
                                                        <img
                                                            src={item.imageUrl}
                                                            alt={item.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <ShoppingCart className="h-12 w-12 text-muted-foreground" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-4 mb-2">
                                                        <div className="flex-1">
                                                            <h3 className="font-semibold text-lg" data-testid={`text-item-name-${item.id}`}>
                                                                {item.name}
                                                            </h3>
                                                            {item.description && (
                                                                <p className="text-sm text-muted-foreground line-clamp-2">
                                                                    {item.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="text-right flex-shrink-0">
                                                            <div className="text-xl font-bold" data-testid={`text-item-price-${item.id}`}>
                                                                ${parseFloat(item.price).toFixed(2)}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                {item.prepTime} min
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {item.available ? (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => addToCart(item)}
                                                            className="gap-2"
                                                            data-testid={`button-add-to-cart-${item.id}`}
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                            Add to order
                                                        </Button>
                                                    ) : (
                                                        <Badge variant="secondary">Out of stock</Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </TabsContent>
                            ))}
                        </Tabs>
                    </div>

                    <div className="lg:sticky lg:top-24 h-fit">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ShoppingCart className="h-5 w-5" />
                                    Your Order
                                </CardTitle>
                                <CardDescription>
                                    {cart.size} item{cart.size !== 1 ? "s" : ""} in cart
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {cart.size === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-8">
                                        Your cart is empty
                                    </p>
                                ) : (
                                    <>
                                        <div className="space-y-3">
                                            {Array.from(cart.values()).map(({ item, quantity }) => (
                                                <div key={item.id} className="flex items-center justify-between gap-2 pb-3 border-b last:border-0" data-testid={`cart-item-${item.id}`}>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium truncate text-sm">{item.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            ${parseFloat(item.price).toFixed(2)} each
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            size="icon"
                                                            variant="outline"
                                                            className="h-7 w-7"
                                                            onClick={() => removeFromCart(item.id)}
                                                            data-testid={`button-decrease-${item.id}`}
                                                        >
                                                            <Minus className="h-3 w-3" />
                                                        </Button>
                                                        <span className="w-8 text-center text-sm font-medium" data-testid={`text-quantity-${item.id}`}>
                                                            {quantity}
                                                        </span>
                                                        <Button
                                                            size="icon"
                                                            variant="outline"
                                                            className="h-7 w-7"
                                                            onClick={() => addToCart(item)}
                                                            data-testid={`button-increase-${item.id}`}
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="pt-3 border-t">
                                            <div className="flex justify-between text-lg font-bold mb-4">
                                                <span>Total</span>
                                                <span data-testid="text-cart-total">${calculateTotal()}</span>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Schedule Pickup Time</Label>
                                                <TimeSelectorSlider
                                                    value={scheduledTime}
                                                    onChange={(date) => {
                                                        console.log("📅 VendorDetail: setScheduledTime called with:", {
                                                            date,
                                                            type: typeof date,
                                                            isDate: date instanceof Date,
                                                            isValid: !isNaN(date.getTime()),
                                                            isoString: date.toISOString(),
                                                        });
                                                        setScheduledTime(date);
                                                    }}
                                                    minMinutes={vendor.averagePrepTime || 15}
                                                    maxMinutesFromMin={180}
                                                    orderCutoffHour={23}
                                                    label="Pickup Time"
                                                    description="Choose when you'll pick up your order"
                                                />
                                            </div>

                                            <Button
                                                className="w-full mt-4"
                                                onClick={handlePlaceOrder}
                                                disabled={placeOrderMutation.isPending || cart.size === 0 || !scheduledTime}
                                                data-testid="button-place-order"
                                            >
                                                {placeOrderMutation.isPending ? "Placing order..." : "Place Order"}
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}