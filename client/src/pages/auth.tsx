import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(20, "Username must be less than 20 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

const requestResetSchema = z.object({
  username: z.string().min(1, "Username is required"),
});

const performResetSchema = z.object({
  token: z.string().min(1, "Token is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;
type RequestResetForm = z.infer<typeof requestResetSchema>;
type PerformResetForm = z.infer<typeof performResetSchema>;

export default function Auth() {
  const [activeTab, setActiveTab] = useState("login");
  const [showReset, setShowReset] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      firstName: "",
      lastName: "",
    },
  });

  const requestResetForm = useForm<RequestResetForm>({
    resolver: zodResolver(requestResetSchema),
    defaultValues: { username: "" },
  });

  const performResetForm = useForm<PerformResetForm>({
    resolver: zodResolver(performResetSchema),
    defaultValues: { token: "", newPassword: "" },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      await apiRequest("POST", "/api/auth/login", data);
    },
    onSuccess: () => {
      toast({
        title: "Welcome back!",
        description: "You have been logged in successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      await apiRequest("POST", "/api/auth/register", data);
    },
    onSuccess: () => {
      toast({
        title: "Account created!",
        description: "Welcome to Hot Take! You start with 1,000 free points.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error) => {
      toast({
        title: "Registration failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

const CopyableToken = ({ token }: { token: string }) => {
  const { toast } = useToast();
  const handleCopy = () => {
    navigator.clipboard.writeText(token);
    toast({
      title: "Copied!",
      description: "The token has been copied to your clipboard.",
    });
  };

  return (
    <div className="flex items-center justify-between">
      <span className="truncate w-full max-w-xs">Token: {token}</span>
      <Button variant="outline" size="sm" onClick={handleCopy} className="ml-2">
        Copy
      </Button>
    </div>
  );
};

// ... inside the Auth component ...
  const requestResetMutation = useMutation({
    mutationFn: async (data: RequestResetForm) => {
      const res = await apiRequest("POST", "/api/auth/request-password-reset", data);
      return res.json();
    },
    onSuccess: (data) => {
      // For development, we show the token in the toast response
      if (typeof data?.token === "string") {
        toast({
          title: "Password reset link created",
          description: <CopyableToken token={data.token} />,
        });
      } else {
        toast({
          title: "Password reset link created",
          description: "If that account exists, you'll receive a reset link.",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Request failed",
        description: error.message || "Could not create reset request",
        variant: "destructive",
      });
    },
  });

  const performResetMutation = useMutation({
    mutationFn: async (data: PerformResetForm) => {
      await apiRequest("POST", "/api/auth/reset-password", data);
    },
    onSuccess: () => {
      toast({ title: "Password updated", description: "You can now log in with your new password." });
      setShowReset(false);
      performResetForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Reset failed",
        description: error.message || "Could not reset password",
        variant: "destructive",
      });
    },
  });

  const onLogin = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  const onRegister = (data: RegisterForm) => {
    // Remove empty email field if not provided
    const cleanData = { ...data };
    if (!cleanData.email) {
      delete cleanData.email;
    }
    registerMutation.mutate(cleanData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-purple/10 via-primary-blue/10 to-success-green/10">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-lg relative">
        <div className="px-6 py-12">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-accent-purple rounded-2xl mx-auto mb-6 flex items-center justify-center">
              <span className="text-2xl">🔥</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Hot Take</h1>
            <p className="text-gray-600">Social predictions platform</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" data-testid="tab-login">Login</TabsTrigger>
              <TabsTrigger value="register" data-testid="tab-register">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Welcome back</CardTitle>
                  <CardDescription>
                    Sign in to your account to continue making predictions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your username"
                                data-testid="input-login-username"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password"
                                placeholder="Enter your password"
                                data-testid="input-login-password"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full bg-accent-purple hover:bg-accent-purple/90"
                        disabled={loginMutation.isPending}
                        data-testid="button-login-submit"
                      >
                        {loginMutation.isPending ? "Signing in..." : "Sign In"}
                      </Button>
                      <div className="text-sm text-center">
                        <button
                          type="button"
                          className="text-accent-purple hover:underline"
                          onClick={() => setShowReset((v) => !v)}
                        >
                          {showReset ? "Hide password reset" : "Forgot password?"}
                        </button>
                      </div>
                    </form>
                  </Form>

                  {showReset && (
                    <div className="mt-6 space-y-6">
                      <div>
                        <h3 className="text-sm font-semibold mb-2">Request reset link</h3>
                        <Form {...requestResetForm}>
                          <form onSubmit={requestResetForm.handleSubmit((data) => requestResetMutation.mutate(data))} className="space-y-3">
                            <FormField
                              control={requestResetForm.control}
                              name="username"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Username</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Your username" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button type="submit" className="w-full" disabled={requestResetMutation.isPending}>
                              {requestResetMutation.isPending ? "Sending..." : "Send reset link"}
                            </Button>
                          </form>
                        </Form>
                        <p className="text-xs text-gray-500 mt-2">During development, the token is shown in a toast.</p>
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold mb-2">Reset password</h3>
                        <Form {...performResetForm}>
                          <form onSubmit={performResetForm.handleSubmit((data) => performResetMutation.mutate(data))} className="space-y-3">
                            <FormField
                              control={performResetForm.control}
                              name="token"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Token</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Paste token" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={performResetForm.control}
                              name="newPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>New password</FormLabel>
                                  <FormControl>
                                    <Input type="password" placeholder="New password" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button type="submit" className="w-full" disabled={performResetMutation.isPending}>
                              {performResetMutation.isPending ? "Updating..." : "Update password"}
                            </Button>
                          </form>
                        </Form>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Create account</CardTitle>
                  <CardDescription>
                    Join Hot Take and start making predictions with 1,000 free points
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Choose a username"
                                data-testid="input-register-username"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password"
                                placeholder="Create a password"
                                data-testid="input-register-password"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={registerForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name (Optional)</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="First name"
                                  data-testid="input-register-firstname"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name (Optional)</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Last name"
                                  data-testid="input-register-lastname"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                type="email"
                                placeholder="your@email.com"
                                data-testid="input-register-email"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full bg-accent-purple hover:bg-accent-purple/90"
                        disabled={registerMutation.isPending}
                        data-testid="button-register-submit"
                      >
                        {registerMutation.isPending ? "Creating account..." : "Create Account"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}