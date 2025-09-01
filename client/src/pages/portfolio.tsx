import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import TopNavigation from "@/components/top-navigation";
import BottomNavigation from "@/components/bottom-navigation";
import PredictionCard from "@/components/prediction-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Target, Clock, CheckCircle, XCircle } from "lucide-react";
import type { PredictionWithDetails, Vote, User } from "@shared/schema";

export default function Portfolio() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // Mock data for user's predictions and votes since we need to implement these endpoints
  const { data: userPredictions = [], isLoading: loadingPredictions } = useQuery<PredictionWithDetails[]>({
    queryKey: ["/api/predictions", "user", user?.id],
    queryFn: async () => {
      // This would need to be implemented in the backend
      const response = await fetch(`/api/predictions?userId=${user?.id}`);
      if (!response.ok) {
        return [];
      }
      return response.json();
    },
    enabled: !!user?.id,
  });

  const { data: userVotes = [], isLoading: loadingVotes } = useQuery<Vote[]>({
    queryKey: ["/api/votes", "user", user?.id],
    queryFn: async () => {
      // This would need to be implemented in the backend
      const response = await fetch(`/api/votes?userId=${user?.id}`);
      if (!response.ok) {
        return [];
      }
      return response.json();
    },
    enabled: !!user?.id,
  });

  if (!user) return null;

  // Calculate portfolio stats
  const totalPredictions = userPredictions.length;
  const totalVotes = userVotes.length;
  const totalPointsStaked = userVotes.reduce((sum, vote) => sum + vote.pointsStaked, 0);
  const accuracyRate = user.totalPredictions > 0
    ? Math.round((user.correctPredictions / user.totalPredictions) * 100)
    : 0;

  const activePredictions = userPredictions.filter((p) => !p.resolved);
  const resolvedPredictions = userPredictions.filter((p) => p.resolved);

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      <TopNavigation />
      
      <div className="px-4 py-6 space-y-6">
        {/* Portfolio Overview */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-accent-purple" data-testid="text-total-points">
                {user.points?.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Points</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-success-green" data-testid="text-accuracy-rate">
                {accuracyRate}%
              </div>
              <div className="text-sm text-gray-600">Accuracy</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary-blue" data-testid="text-total-predictions">
                {totalPredictions}
              </div>
              <div className="text-sm text-gray-600">Predictions</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary-red" data-testid="text-points-staked">
                {totalPointsStaked.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Points Staked</div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Chart Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Performance Over Time</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded-lg h-32 flex items-center justify-center">
              <span className="text-gray-500 text-sm">Chart coming soon</span>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different views */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="predictions" data-testid="tab-my-predictions">My Predictions</TabsTrigger>
            <TabsTrigger value="votes" data-testid="tab-my-votes">My Votes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Predictions created</span>
                    <Badge variant="outline">{totalPredictions}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Votes cast</span>
                    <Badge variant="outline">{totalVotes}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Active predictions</span>
                    <Badge variant="outline">{activePredictions.length}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="predictions" className="space-y-4">
            {loadingPredictions ? (
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="bg-gray-100 rounded-lg h-32 animate-pulse" />
                ))}
              </div>
            ) : userPredictions.length > 0 ? (
              <div className="space-y-4">
                {userPredictions.map((prediction: PredictionWithDetails) => (
                  <PredictionCard
                    key={prediction.id}
                    prediction={prediction}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No predictions yet</h3>
                <p className="text-gray-500 mb-4">Start making predictions to track your performance</p>
                <Button>Create Prediction</Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="votes" className="space-y-4">
            {loadingVotes ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-gray-100 rounded-lg h-24 animate-pulse" />
                ))}
              </div>
            ) : userVotes.length > 0 ? (
              <div className="space-y-4">
                {userVotes.map((vote) => (
                  <Card key={vote.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm text-gray-800" data-testid={`text-vote-prediction-${vote.id}`}>
                            {vote.prediction?.title || "Unknown prediction"}
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge 
                              variant={vote.stance ? "default" : "secondary"}
                              className={vote.stance ? "bg-success-green" : "bg-primary-red"}
                            >
                              {vote.stance ? "YES" : "NO"}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {vote.pointsStaked} points
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          {vote.prediction?.resolved ? (
                            vote.prediction?.resolvedValue === vote.stance ? (
                              <CheckCircle className="w-5 h-5 text-success-green" />
                            ) : (
                              <XCircle className="w-5 h-5 text-primary-red" />
                            )
                          ) : (
                            <Clock className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No votes yet</h3>
                <p className="text-gray-500 mb-4">Start voting on predictions to track your portfolio</p>
                <Button>Browse Predictions</Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <BottomNavigation />
    </div>
  );
}