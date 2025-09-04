import { Bell, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

export default function TopNavigation() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to logout",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (!user) return null;

  const typedUser = user as User;

  return (
    <header className="bg-white border-b border-light-border sticky top-0 z-50 px-4 py-3" data-testid="header-navigation">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {typedUser.profileImageUrl ? (
            <img 
              src={typedUser.profileImageUrl} 
              alt="User avatar" 
              className="w-8 h-8 rounded-full border-2 border-accent-purple"
              data-testid="img-user-avatar"
            />
          ) : (
            <div className="w-8 h-8 bg-accent-purple rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {(typedUser.firstName?.[0] || typedUser.username?.[0] || 'U').toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="text-sm font-semibold text-gray-800" data-testid="text-user-name">
              {typedUser.firstName && typedUser.lastName 
                ? `${typedUser.firstName} ${typedUser.lastName}` 
                : typedUser.firstName || typedUser.username || 'User'
              }
            </h2>
            <div className="flex items-center space-x-1">
              <span className="text-accent-purple text-xs">💰</span>
              <span className="text-xs text-gray-600 font-medium" data-testid="text-user-points">
                {typedUser.points?.toLocaleString()} pts
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="sm" 
            className="relative p-2 hover:bg-gray-100 rounded-full"
            data-testid="button-notifications"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute -top-1 -right-1 bg-primary-red text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              3
            </span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-2 hover:bg-gray-100 rounded-full"
            data-testid="button-settings"
          >
            <Settings className="w-5 h-5 text-gray-600" />
          </Button>

          <Button 
            variant="ghost" 
            size="sm" 
            className="p-2 hover:bg-red-100 rounded-full text-red-600"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            data-testid="button-logout"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
