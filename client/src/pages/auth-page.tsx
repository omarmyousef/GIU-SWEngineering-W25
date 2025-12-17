import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UtensilsCrossed, Store } from "lucide-react";
import heroImage from "@assets/generated_images/campus_food_court_hero_image.png";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [registerData, setRegisterData] = useState({ username: "", password: "", role: "student" });

  useEffect(() => {
    if (user) {
      setLocation(user.role === "vendor" ? "/vendor/dashboard" : "/");
    }
  }, [user, setLocation]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginData);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(registerData);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="font-display text-4xl font-bold text-foreground mb-2">
              GIU Food Ordering
            </h1>
            <p className="text-muted-foreground">
              Order food between classes, skip the wait
            </p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2" data-testid="tabs-auth">
              <TabsTrigger value="login" data-testid="tab-login">Login</TabsTrigger>
              <TabsTrigger value="register" data-testid="tab-register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Welcome back</CardTitle>
                  <CardDescription>Enter your credentials to continue</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-username">Username</Label>
                      <Input
                        id="login-username"
                        data-testid="input-login-username"
                        type="text"
                        value={loginData.username}
                        onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        data-testid="input-login-password"
                        type="password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      data-testid="button-login-submit"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Logging in..." : "Login"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Create an account</CardTitle>
                  <CardDescription>Join the GIU food ordering community</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-username">Username</Label>
                      <Input
                        id="register-username"
                        data-testid="input-register-username"
                        type="text"
                        value={registerData.username}
                        onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Password</Label>
                      <Input
                        id="register-password"
                        data-testid="input-register-password"
                        type="password"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>I am a...</Label>
                      <RadioGroup
                        value={registerData.role}
                        onValueChange={(value) => setRegisterData({ ...registerData, role: value })}
                        data-testid="radio-role"
                      >
                        <div className="flex items-center space-x-2 p-3 rounded-md border hover-elevate active-elevate-2">
                          <RadioGroupItem value="student" id="student" data-testid="radio-role-student" />
                          <Label htmlFor="student" className="flex items-center gap-2 cursor-pointer flex-1">
                            <UtensilsCrossed className="h-4 w-4" />
                            <div>
                              <div className="font-medium">Student</div>
                              <div className="text-sm text-muted-foreground">Order food from vendors</div>
                            </div>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 p-3 rounded-md border hover-elevate active-elevate-2">
                          <RadioGroupItem value="vendor" id="vendor" data-testid="radio-role-vendor" />
                          <Label htmlFor="vendor" className="flex items-center gap-2 cursor-pointer flex-1">
                            <Store className="h-4 w-4" />
                            <div>
                              <div className="font-medium">Vendor</div>
                              <div className="text-sm text-muted-foreground">Manage your food truck</div>
                            </div>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      data-testid="button-register-submit"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Creating account..." : "Register"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Join 500+ GIU students ordering daily
          </p>
        </div>
      </div>

      <div className="hidden lg:block relative">
        <img
          src={heroImage}
          alt="GIU Campus Food Scene"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30 flex items-center justify-center p-12">
          <div className="text-white max-w-lg">
            <h2 className="font-display text-5xl font-bold mb-4">
              Order. Schedule. Pickup.
            </h2>
            <p className="text-xl text-white/90 mb-6">
              No more waiting in lines between classes. Order your meal in advance and pick it up when you're ready.
            </p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold">5+</div>
                <div className="text-sm text-white/80">Food Trucks</div>
              </div>
              <div>
                <div className="text-3xl font-bold">500+</div>
                <div className="text-sm text-white/80">Students</div>
              </div>
              <div>
                <div className="text-3xl font-bold">15min</div>
                <div className="text-sm text-white/80">Avg Wait</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
