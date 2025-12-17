import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UtensilsCrossed, Home, ShoppingCart, Clock, User, LogOut, Store, Menu as MenuIcon, LayoutDashboard } from "lucide-react";

export function Navbar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (!user) return null;

  const isVendor = user.role === "vendor";

  const studentLinks = [
    { path: "/", label: "Browse Vendors", icon: Home },
    { path: "/immediate-pickup", label: "Immediate Pickup", icon: Clock },
    { path: "/my-orders", label: "My Orders", icon: ShoppingCart },
  ];

  const vendorLinks = [
    { path: "/vendor/dashboard", label: "Orders", icon: LayoutDashboard },
    { path: "/vendor/menu", label: "Menu", icon: Store },
  ];

  const links = isVendor ? vendorLinks : studentLinks;

  return (
    <nav className="border-b bg-background sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link href={isVendor ? "/vendor/dashboard" : "/"}>
              <Button variant="ghost" className="flex items-center gap-2 font-display text-xl font-bold text-foreground px-2 py-1" asChild data-testid="link-logo">
                <a>
                  <UtensilsCrossed className="h-6 w-6 text-primary" />
                  <span>GIU<span className="text-primary">Eats</span></span>
                </a>
              </Button>
            </Link>

            <div className="hidden md:flex items-center gap-2">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = location === link.path;
                return (
                  <Link key={link.path} href={link.path}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      size="sm"
                      className="gap-2"
                      asChild
                      data-testid={`link-nav-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <a>
                        <Icon className="h-4 w-4" />
                        {link.label}
                      </a>
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" data-testid="button-mobile-menu">
                  <MenuIcon className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {links.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link key={link.path} href={link.path}>
                      <DropdownMenuItem asChild className="gap-2">
                        <a>
                          <Icon className="h-4 w-4" />
                          {link.label}
                        </a>
                      </DropdownMenuItem>
                    </Link>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="button-user-menu">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium" data-testid="text-username">{user.username}</p>
                  <p className="text-xs text-muted-foreground capitalize" data-testid="text-role">{user.role}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="gap-2 text-destructive" data-testid="button-logout">
                  <LogOut className="h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
