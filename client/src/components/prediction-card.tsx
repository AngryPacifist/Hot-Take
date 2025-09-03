import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import ResolvePredictionModal from "./resolve-prediction-modal";
import { ThumbsUp, ThumbsDown, Share, Bookmark, MoreHorizontal, User, CheckCircle } from "lucide-react";
import type { PredictionWithDetails } from "@shared/schema";

interface PredictionCardProps {
  prediction: PredictionWithDetails;
}

export default function PredictionCard({ prediction }: PredictionCardProps) {
  const [stakeAmount, setStakeAmount] = useState(10);
  const [isResolveModalOpen, setResolveModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const voteMutation = useMutation({
    mutationFn: async ({ stance, pointsStaked }: { stance: boolean; pointsStaked: number }) => {
      await apiRequest("POST", "/api/votes", {
        predictionId: prediction.id,
        stance,
        pointsStaked,
      });
    },
    onSuccess: () => {
      toast({
        title: "Vote submitted!",
        description: `You staked ${stakeAmount} points on this prediction.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/predictions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      const errorMessage = error.message.includes("already voted") 
        ? "You have already voted on this prediction"
        : error.message.includes("Insufficient points")
        ? "You don't have enough points for this stake"
        : "Failed to submit vote. Please try again.";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleVote = (stance: boolean) => {
    voteMutation.mutate({ stance, pointsStaked: stakeAmount });
  };

  const hasVoted = !!(prediction as any).userVote;
  const userStance = (prediction as any).userVote?.stance;

  return (
    <Card className="prediction-card bg-white border border-light-border shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3 mb-3">
          {prediction.user.profileImageUrl ? (
            <img 
              src={prediction.user.profileImageUrl} 
              alt="Predictor avatar" 
              className="w-10 h-10 rounded-full"
              data-testid={`img-predictor-${prediction.id}`}
            />
          ) : (
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-gray-500" />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-gray-800 text-sm" data-testid={`text-predictor-name-${prediction.id}`}>
                {prediction.user.firstName || prediction.user.username || prediction.user.email?.split('@')[0] || 'User'}
              </span>
              <Badge className="bg-success-green hover:bg-success-green text-white text-xs">
                {prediction.user.totalPredictions > 0 
                  ? Math.round((prediction.user.correctPredictions / prediction.user.totalPredictions) * 100)
                  : 0
                }% accuracy
              </Badge>
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
              <span data-testid={`text-time-ago-${prediction.id}`}>
                {prediction.createdAt ? new Date(prediction.createdAt).toLocaleDateString() : 'Recently'}
              </span>
              <span>•</span>
              <Badge 
                variant="outline" 
                className={`text-xs ${prediction.category.color || 'bg-gray-100 text-gray-800'}`}
              >
                <span className="mr-1">{prediction.category.emoji}</span>
                {prediction.category.name}
              </Badge>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="p-1 text-gray-400 hover:text-gray-600">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>

        <div className="mb-4">
          <h3 className="text-gray-900 font-semibold mb-2 leading-relaxed" data-testid={`text-title-${prediction.id}`}>
            {prediction.title}
          </h3>
          {prediction.description && (
            <p className="text-gray-600 text-sm leading-relaxed" data-testid={`text-description-${prediction.id}`}>
              {prediction.description}
            </p>
          )}
        </div>

        {/* Prediction Stats */}
        <div className="flex items-center justify-between mb-4 bg-gray-50 rounded-lg p-3">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-800" data-testid={`text-total-votes-${prediction.id}`}>
              {prediction.totalStakes}
            </div>
            <div className="text-xs text-gray-500">Total Votes</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-accent-purple" data-testid={`text-total-points-${prediction.id}`}>
              {prediction.totalPoints.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">Points Staked</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-800" data-testid={`text-time-remaining-${prediction.id}`}>
              {prediction.timeRemaining}
            </div>
            <div className="text-xs text-gray-500">Time Left</div>
          </div>
        </div>

        {/* Stake Amount Selector */}
        {!hasVoted && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Stake Amount:</span>
              <div className="flex space-x-1">
                {[10, 25, 50, 100].map((amount) => (
                  <Button
                    key={amount}
                    variant={stakeAmount === amount ? "default" : "outline"}
                    size="sm"
                    className={`px-2 py-1 text-xs ${
                      stakeAmount === amount 
                        ? "bg-accent-purple hover:bg-accent-purple/90" 
                        : ""
                    }`}
                    onClick={() => setStakeAmount(amount)}
                    data-testid={`button-stake-${amount}-${prediction.id}`}
                  >
                    {amount}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Voting Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Button
            className={`vote-button font-semibold py-4 px-6 rounded-xl transition-all ${
              hasVoted && userStance === true
                ? "bg-primary-blue/20 border-2 border-primary-blue text-primary-blue"
                : "bg-primary-blue hover:bg-blue-600 text-white"
            }`}
            onClick={() => handleVote(true)}
            disabled={hasVoted || voteMutation.isPending}
            data-testid={`button-vote-yes-${prediction.id}`}
          >
            <div className="flex items-center justify-center space-x-2">
              <ThumbsUp className="w-4 h-4" />
              <span>YES</span>
            </div>
            <div className="text-xs opacity-90 mt-1">
              {prediction.yesPercentage}% voted yes
            </div>
          </Button>
          <Button
            className={`vote-button font-semibold py-4 px-6 rounded-xl transition-all ${
              hasVoted && userStance === false
                ? "bg-primary-red/20 border-2 border-primary-red text-primary-red"
                : "bg-primary-red hover:bg-red-600 text-white"
            }`}
            onClick={() => handleVote(false)}
            disabled={hasVoted || voteMutation.isPending}
            data-testid={`button-vote-no-${prediction.id}`}
          >
            <div className="flex items-center justify-center space-x-2">
              <ThumbsDown className="w-4 h-4" />
              <span>NO</span>
            </div>
            <div className="text-xs opacity-90 mt-1">
              {prediction.noPercentage}% voted no
            </div>
          </Button>
        </div>

        {hasVoted && (
          <div className="text-center py-2 mb-3">
            <Badge className="bg-gray-100 text-gray-800">
              You voted {userStance ? 'YES' : 'NO'} with {(prediction as any).userVote.pointsStaked} points
            </Badge>
          </div>
        )}

        {/* Action Bar */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center space-x-1 text-gray-500 hover:text-gray-700"
              data-testid={`button-share-${prediction.id}`}
            >
              <Share className="w-4 h-4" />
              <span className="text-sm">Share</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center space-x-1 text-gray-500 hover:text-gray-700"
              data-testid={`button-bookmark-${prediction.id}`}
            >
              <Bookmark className="w-4 h-4" />
              <span className="text-sm">Save</span>
            </Button>
          </div>

          {prediction.resolved ? (
            <Badge className="bg-success-green text-white">
              <CheckCircle className="w-4 h-4 mr-2" />
              Resolved: {prediction.resolvedValue ? 'YES' : 'NO'}
            </Badge>
          ) : currentUser?.id === prediction.userId && new Date(prediction.resolutionDate) < new Date() ? (
            <Button
              size="sm"
              className="bg-accent-purple hover:bg-accent-purple/90 text-white px-4 py-2 text-sm"
              onClick={() => setResolveModalOpen(true)}
              data-testid={`button-resolve-${prediction.id}`}
            >
              Resolve
            </Button>
          ) : (
            <Button
              size="sm"
              className="bg-gray-400 text-white px-4 py-2 text-sm cursor-not-allowed"
              data-testid={`button-details-${prediction.id}`}
              disabled
            >
              Awaiting Resolution
            </Button>
          )}
        </div>
      </CardContent>
      {isResolveModalOpen && (
        <ResolvePredictionModal
          prediction={prediction}
          open={isResolveModalOpen}
          onClose={() => setResolveModalOpen(false)}
        />
      )}
    </Card>
  );
}
