import { useQuery } from "@tanstack/react-query";
import TopNavigation from "@/components/top-navigation";
import BottomNavigation from "@/components/bottom-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, User } from "lucide-react";
import type { User as UserType } from "@shared/schema";

export default function Leaderboard() {
  const { data: leaderboard, isLoading } = useQuery<UserType[]>({
    queryKey: ["/api/leaderboard"],
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

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-600">#{rank}</span>;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case 2:
        return "bg-gray-100 text-gray-800 border-gray-200";
      case 3:
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen shadow-lg relative">
      <TopNavigation />
      
      <div className="p-4 pb-20">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader className="text-center">
            <CardTitle className="text-xl flex items-center justify-center">
              <Trophy className="w-6 h-6 mr-2 text-accent-purple" />
              Leaderboard
            </CardTitle>
            <p className="text-gray-600">Top predictors by points and accuracy</p>
          </CardHeader>
        </Card>

        {/* Top 3 Podium */}
        {leaderboard && leaderboard.length >= 3 && (
          <div className="mb-6">
            <div className="flex items-end justify-center space-x-2 mb-4">
              {/* 2nd Place */}
              <div className="text-center">
                <div className="w-16 h-20 bg-gray-100 rounded-t-lg flex flex-col items-center justify-end pb-2 border-2 border-gray-200">
                  <Medal className="w-6 h-6 text-gray-400 mb-1" />
                  <span className="text-xs font-semibold">#2</span>
                </div>
                <div className="mt-2">
                  {leaderboard[1].profileImageUrl ? (
                    <img 
                      src={leaderboard[1].profileImageUrl} 
                      alt="Profile" 
                      className="w-10 h-10 rounded-full mx-auto border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-300 rounded-full mx-auto flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                  )}
                  <p className="text-xs font-medium text-gray-900 mt-1 truncate">
                    {leaderboard[1].firstName || leaderboard[1].email?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-xs text-gray-600">{leaderboard[1].points.toLocaleString()}</p>
                </div>
              </div>

              {/* 1st Place */}
              <div className="text-center">
                <div className="w-16 h-24 bg-yellow-100 rounded-t-lg flex flex-col items-center justify-end pb-2 border-2 border-yellow-200">
                  <Trophy className="w-6 h-6 text-yellow-500 mb-1" />
                  <span className="text-xs font-semibold">#1</span>
                </div>
                <div className="mt-2">
                  {leaderboard[0].profileImageUrl ? (
                    <img 
                      src={leaderboard[0].profileImageUrl} 
                      alt="Profile" 
                      className="w-12 h-12 rounded-full mx-auto border-2 border-yellow-400"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-yellow-300 rounded-full mx-auto flex items-center justify-center">
                      <User className="w-6 h-6 text-yellow-700" />
                    </div>
                  )}
                  <p className="text-sm font-semibold text-gray-900 mt-1 truncate">
                    {leaderboard[0].firstName || leaderboard[0].email?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-xs text-gray-600">{leaderboard[0].points.toLocaleString()}</p>
                </div>
              </div>

              {/* 3rd Place */}
              <div className="text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-t-lg flex flex-col items-center justify-end pb-2 border-2 border-amber-200">
                  <Award className="w-6 h-6 text-amber-600 mb-1" />
                  <span className="text-xs font-semibold">#3</span>
                </div>
                <div className="mt-2">
                  {leaderboard[2].profileImageUrl ? (
                    <img 
                      src={leaderboard[2].profileImageUrl} 
                      alt="Profile" 
                      className="w-10 h-10 rounded-full mx-auto border-2 border-amber-200"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-amber-300 rounded-full mx-auto flex items-center justify-center">
                      <User className="w-5 h-5 text-amber-700" />
                    </div>
                  )}
                  <p className="text-xs font-medium text-gray-900 mt-1 truncate">
                    {leaderboard[2].firstName || leaderboard[2].email?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-xs text-gray-600">{leaderboard[2].points.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Full Rankings */}
        <div className="space-y-3">
          {leaderboard?.map((user, index) => {
            const rank = index + 1;
            const accuracy = user.totalPredictions > 0 
              ? Math.round((user.correctPredictions / user.totalPredictions) * 100)
              : 0;

            return (
              <Card key={user.id} className="transition-colors hover:bg-gray-50" data-testid={`row-user-${index}`}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {getRankIcon(rank)}
                    </div>
                    
                    <div className="flex-shrink-0">
                      {user.profileImageUrl ? (
                        <img 
                          src={user.profileImageUrl} 
                          alt="Profile" 
                          className="w-10 h-10 rounded-full border-2 border-gray-200"
                          data-testid={`img-avatar-${user.id}`}
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-500" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate" data-testid={`text-username-${user.id}`}>
                        {user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName}` 
                          : user.firstName || user.email?.split('@')[0] || 'User'
                        }
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className={`text-xs ${getRankBadgeColor(rank)}`}>
                          {user.points.toLocaleString()} pts
                        </Badge>
                        {user.totalPredictions > 0 && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            {accuracy}% accuracy
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right text-sm text-gray-600">
                      <div className="font-semibold" data-testid={`text-predictions-${user.id}`}>
                        {user.totalPredictions}
                      </div>
                      <div className="text-xs">predictions</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {leaderboard?.length === 0 && (
          <div className="text-center py-20">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No rankings yet</h3>
            <p className="text-gray-600">Start making predictions to see the leaderboard!</p>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}
