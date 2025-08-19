import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, Search, Trophy, TrendingUp, User } from "lucide-react";

export default function BottomNavigation() {
  const [location] = useLocation();

  const navigation = [
    { path: "/", icon: Home, label: "Feed", testId: "nav-feed" },
    { path: "/explore", icon: Search, label: "Explore", testId: "nav-explore" },
    { path: "/leaderboard", icon: Trophy, label: "Rankings", testId: "nav-rankings" },
    { path: "/portfolio", icon: TrendingUp, label: "Portfolio", testId: "nav-portfolio" },
    { path: "/profile", icon: User, label: "Profile", testId: "nav-profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 max-w-md w-full bg-white border-t border-light-border z-50" data-testid="nav-bottom">
      <div className="grid grid-cols-5 py-2">
        {navigation.map(({ path, icon: Icon, label, testId }) => {
          const isActive = location === path;
          return (
            <Link key={path} href={path}>
              <Button
                variant="ghost"
                size="sm"
                className={`flex flex-col items-center py-2 px-1 h-auto ${
                  isActive 
                    ? "text-accent-purple" 
                    : "text-gray-400 hover:text-gray-600"
                } transition-colors`}
                data-testid={testId}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{label}</span>
              </Button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
