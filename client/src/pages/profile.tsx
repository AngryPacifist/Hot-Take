import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import type { User as UserType } from "@shared/schema";
import TopNavigation from "@/components/top-navigation";
import BottomNavigation from "@/components/bottom-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Award, TrendingUp, Target } from "lucide-react";

export default function Profile() {
  const { user, isLoading } = useAuth();
  
  const { data: userProfile } = useQuery<UserType>({
    queryKey: ["/api/users", user?.id],
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-lg">
        <TopNavigation />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-purple"></div>
        </div>
      </div>
    );
  }

  const profile = userProfile || user;
  if (!profile) return null;

  const accuracy = profile.totalPredictions > 0 
    ? Math.round((profile.correctPredictions / profile.totalPredictions) * 100)
    : 0;

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen shadow-lg relative">
      <TopNavigation />
      
      <div className="p-4 pb-20">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              {profile.profileImageUrl ? (
                <img 
                  src={profile.profileImageUrl} 
                  alt="Profile" 
                  className="w-20 h-20 rounded-full border-4 border-accent-purple"
                  data-testid="img-profile"
                />
              ) : (
                <div className="w-20 h-20 bg-accent-purple rounded-full flex items-center justify-center">
                  <User className="w-10 h-10 text-white" />
                </div>
              )}
            </div>
            <CardTitle data-testid="text-username">
              {profile.firstName && profile.lastName 
                ? `${profile.firstName} ${profile.lastName}` 
                : profile.email
              }
            </CardTitle>
            <div className="flex items-center justify-center space-x-2 mt-2">
              <Badge variant="secondary" className="bg-accent-purple text-white">
                <Award className="w-3 h-3 mr-1" />
                {accuracy}% accuracy
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-accent-purple" data-testid="text-points">
                {profile.points.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Points</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900" data-testid="text-total-predictions">
                {profile.totalPredictions}
              </div>
              <div className="text-sm text-gray-600">Predictions</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-success-green" data-testid="text-correct-predictions">
                {profile.correctPredictions}
              </div>
              <div className="text-sm text-gray-600">Correct</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary-red" data-testid="text-accuracy">
                {accuracy}%
              </div>
              <div className="text-sm text-gray-600">Accuracy</div>
            </CardContent>
          </Card>
        </div>

        {/* Achievement Badges */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Award className="w-5 h-5 mr-2" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profile.totalPredictions >= 1 && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  <Target className="w-3 h-3 mr-1" />
                  First Prediction
                </Badge>
              )}
              {profile.totalPredictions >= 10 && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  10 Predictions
                </Badge>
              )}
              {accuracy >= 70 && profile.totalPredictions >= 5 && (
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  <Award className="w-3 h-3 mr-1" />
                  High Accuracy
                </Badge>
              )}
              {profile.points >= 2000 && (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  <Award className="w-3 h-3 mr-1" />
                  Point Collector
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              data-testid="button-logout"
              onClick={() => window.location.href = '/api/logout'}
            >
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
}
