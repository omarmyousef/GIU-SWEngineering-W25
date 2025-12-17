import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Edit, Trash2, UtensilsCrossed } from "lucide-react";
import type { MenuItem } from "@shared/schema";

export default function VendorMenuPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    prepTime: "10",
    category: "mains",
    imageUrl: "",
    available: true,
  });

  const { data: menuItems, isLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/vendor/menu"],
  });

  const createItemMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/menu", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Menu item created",
        description: "Your menu item has been added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/menu"] });
      resetForm();
      setDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/menu/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Menu item updated",
        description: "Your changes have been saved",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/menu"] });
      resetForm();
      setDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/menu/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Menu item deleted",
        description: "The item has been removed from your menu",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/menu"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      prepTime: "10",
      category: "mains",
      imageUrl: "",
      available: true,
    });
    setEditingItem(null);
  };

  const handleOpenDialog = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description || "",
        price: item.price,
        prepTime: item.prepTime.toString(),
        category: item.category || "mains",
        imageUrl: item.imageUrl || "",
        available: item.available,
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      prepTime: parseInt(formData.prepTime),
    };

    if (editingItem) {
      updateItemMutation.mutate({ id: editingItem.id, data });
    } else {
      createItemMutation.mutate(data);
    }
  };

  const groupedItems = menuItems?.reduce((acc, item) => {
    const category = item.category || "other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-4xl font-bold text-foreground mb-2" data-testid="text-page-title">
              Menu Management
            </h1>
            <p className="text-muted-foreground">
              Add and manage your menu items
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="gap-2" data-testid="button-add-item">
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingItem ? "Edit Menu Item" : "Add New Menu Item"}</DialogTitle>
                <DialogDescription>
                  {editingItem ? "Update the details of your menu item" : "Add a new item to your menu"}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Item Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    data-testid="input-item-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    data-testid="input-item-description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (EGP) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                      data-testid="input-item-price"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prepTime">Prep Time (minutes) *</Label>
                    <Input
                      id="prepTime"
                      type="number"
                      min="1"
                      value={formData.prepTime}
                      onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })}
                      required
                      data-testid="input-item-prep-time"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger id="category" data-testid="select-item-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mains">Mains</SelectItem>
                      <SelectItem value="sides">Sides</SelectItem>
                      <SelectItem value="drinks">Drinks</SelectItem>
                      <SelectItem value="desserts">Desserts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <Input
                    id="imageUrl"
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    data-testid="input-item-image-url"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="available"
                    checked={formData.available}
                    onCheckedChange={(checked) => setFormData({ ...formData, available: checked })}
                    data-testid="switch-item-available"
                  />
                  <Label htmlFor="available">Available for order</Label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      resetForm();
                      setDialogOpen(false);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createItemMutation.isPending || updateItemMutation.isPending}
                    className="flex-1"
                    data-testid="button-submit-item"
                  >
                    {createItemMutation.isPending || updateItemMutation.isPending
                      ? "Saving..."
                      : editingItem
                      ? "Update Item"
                      : "Add Item"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {!menuItems || menuItems.length === 0 ? (
          <Card className="p-12 text-center">
            <UtensilsCrossed className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-display text-xl font-semibold mb-2">No menu items yet</h3>
            <p className="text-muted-foreground mb-6">
              Start by adding your first menu item
            </p>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </Card>
        ) : (
          <div className="space-y-8">
            {groupedItems && Object.entries(groupedItems).map(([category, items]) => (
              <div key={category}>
                <h2 className="font-display text-2xl font-semibold capitalize mb-4">
                  {category}
                </h2>
                <div className="space-y-4">
                  {items.map((item) => (
                    <Card key={item.id} className="overflow-hidden" data-testid={`card-menu-item-${item.id}`}>
                      <div className="flex flex-col sm:flex-row gap-4 p-4">
                        <div className="w-full sm:w-24 h-24 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <UtensilsCrossed className="h-8 w-8 text-muted-foreground" />
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
                              <div className="text-xl font-bold">${parseFloat(item.price).toFixed(2)}</div>
                              <div className="text-xs text-muted-foreground">{item.prepTime} min prep</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {item.available ? (
                              <span className="text-xs text-green-600 dark:text-green-400 font-medium">In Stock</span>
                            ) : (
                              <span className="text-xs text-red-600 dark:text-red-400 font-medium">Out of Stock</span>
                            )}
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground capitalize">{item.category}</span>
                          </div>
                        </div>

                        <div className="flex sm:flex-col gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(item)}
                            className="gap-2"
                            data-testid={`button-edit-${item.id}`}
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this item?")) {
                                deleteItemMutation.mutate(item.id);
                              }
                            }}
                            disabled={deleteItemMutation.isPending}
                            className="gap-2"
                            data-testid={`button-delete-${item.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
