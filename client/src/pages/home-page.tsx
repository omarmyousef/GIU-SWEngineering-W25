import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, TrendingUp, Users } from "lucide-react";
import type { Vendor } from "@shared/schema";

export default function HomePage() {
  const { data: vendors, isLoading } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      "not busy": { variant: "default" as const, color: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20", label: "Not Busy" },
      "neutral": { variant: "secondary" as const, color: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20", label: "Neutral" },
      "very busy": { variant: "destructive" as const, color: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20", label: "Very Busy" },
    };
    return variants[status as keyof typeof variants] || variants.neutral;
  };

  const groupedVendors = {
    "not busy": vendors?.filter((v) => v.status === "not busy") || [],
    "neutral": vendors?.filter((v) => v.status === "neutral") || [],
    "very busy": vendors?.filter((v) => v.status === "very busy") || [],
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold text-foreground mb-2" data-testid="text-page-title">
            Browse Food Vendors
          </h1>
          <p className="text-muted-foreground">
            Choose from our campus food trucks and schedule your pickup
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <Skeleton className="h-48 w-full rounded-t-md" />
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : vendors && vendors.length > 0 ? (
          <div className="space-y-12">
            {Object.entries(groupedVendors).map(([status, vendorList]) => {
              if (vendorList.length === 0) return null;
              const statusInfo = getStatusBadge(status);
              
              return (
                <div key={status}>
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="font-display text-2xl font-semibold text-foreground">
                      {statusInfo.label}
                    </h2>
                    <Badge className={statusInfo.color}>
                      {vendorList.length} vendor{vendorList.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {vendorList.map((vendor) => (
                      <Link key={vendor.id} href={`/vendors/${vendor.id}`}>
                        <a data-testid={`card-vendor-${vendor.id}`}>
                          <Card className="overflow-hidden hover-elevate transition-all h-full">
                            <div className="aspect-video overflow-hidden bg-muted">
                              {vendor.imageUrl ? (
                                <img
                                  src={vendor.imageUrl}
                                  alt={vendor.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Users className="h-16 w-16 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <CardHeader>
                              <div className="flex items-start justify-between gap-2">
                                <CardTitle className="font-display text-xl" data-testid={`text-vendor-name-${vendor.id}`}>
                                  {vendor.name}
                                </CardTitle>
                                <Badge className={statusInfo.color} data-testid={`badge-status-${vendor.id}`}>
                                  {statusInfo.label}
                                </Badge>
                              </div>
                              {vendor.description && (
                                <CardDescription className="line-clamp-2">
                                  {vendor.description}
                                </CardDescription>
                              )}
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>Avg prep: {vendor.averagePrepTime || 15} min</span>
                              </div>
                              {vendor.nextAvailableSlot && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <TrendingUp className="h-4 w-4" />
                                  <span>
                                    Next slot:{" "}
                                    {new Date(vendor.nextAvailableSlot).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </a>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-display text-xl font-semibold mb-2">No vendors available</h3>
            <p className="text-muted-foreground">
              Check back later when food trucks are open on campus
            </p>
          </Card>
        )}
      </main>
    </div>
  );
}
