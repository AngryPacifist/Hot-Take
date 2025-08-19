import { Bell, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function TopNavigation() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <header className="bg-white border-b border-light-border sticky top-0 z-50 px-4 py-3" data-testid="header-navigation">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {user.profileImageUrl ? (
            <img 
              src={user.profileImageUrl} 
              alt="User avatar" 
              className="w-8 h-8 rounded-full border-2 border-accent-purple"
              data-testid="img-user-avatar"
            />
          ) : (
            <div className="w-8 h-8 bg-accent-purple rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {(user.firstName?.[0] || user.email?.[0] || 'U').toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="text-sm font-semibold text-gray-800" data-testid="text-user-name">
              {user.firstName && user.lastName 
                ? `${user.firstName} ${user.lastName}` 
                : user.firstName || user.email?.split('@')[0] || 'User'
              }
            </h2>
            <div className="flex items-center space-x-1">
              <span className="text-accent-purple text-xs">💰</span>
              <span className="text-xs text-gray-600 font-medium" data-testid="text-user-points">
                {user.points?.toLocaleString()} pts
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
        </div>
      </div>
    </header>
  );
}
