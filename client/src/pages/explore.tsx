import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import TopNavigation from "@/components/top-navigation";
import CategoryFilters from "@/components/category-filters";
import PredictionCard from "@/components/prediction-card";
import BottomNavigation from "@/components/bottom-navigation";
import { Input } from "@/components/ui/input";
import { Search, TrendingUp, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PredictionWithDetails } from "@shared/schema";

export default function Explore() {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "trending" | "ending_soon">("trending");

  const { data: predictions = [], isLoading } = useQuery({
    queryKey: ["/api/predictions", selectedCategory, sortBy],
    queryFn: () => {
      const params = new URLSearchParams({
        limit: "50",
        ...(selectedCategory && { categoryId: selectedCategory })
      });
      return fetch(`/api/predictions?${params}`).then(res => res.json());
    },
  });

  const filteredPredictions = predictions.filter((prediction: PredictionWithDetails) =>
    prediction.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prediction.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedPredictions = [...filteredPredictions].sort((a, b) => {
    if (sortBy === "recent") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === "trending") {
      return (b.totalStakes + b.yesVotes + b.noVotes) - (a.totalStakes + a.yesVotes + a.noVotes);
    }
    if (sortBy === "ending_soon") {
      return new Date(a.resolutionDate).getTime() - new Date(b.resolutionDate).getTime();
    }
    return 0;
  });

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      <TopNavigation />
      
      <div className="px-4 py-4 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search predictions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-50 border-gray-200"
            data-testid="input-search-predictions"
          />
        </div>

        {/* Sort Options */}
        <div className="flex space-x-2">
          <Button
            variant={sortBy === "trending" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("trending")}
            className="flex items-center space-x-1"
            data-testid="button-sort-trending"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Trending</span>
          </Button>
          <Button
            variant={sortBy === "recent" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("recent")}
            className="flex items-center space-x-1"
            data-testid="button-sort-recent"
          >
            <Clock className="w-4 h-4" />
            <span>Recent</span>
          </Button>
          <Button
            variant={sortBy === "ending_soon" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("ending_soon")}
            className="flex items-center space-x-1"
            data-testid="button-sort-ending"
          >
            <Users className="w-4 h-4" />
            <span>Ending Soon</span>
          </Button>
        </div>

        {/* Category Filters */}
        <CategoryFilters
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600" data-testid="text-results-count">
            {sortedPredictions.length} predictions found
          </span>
          {searchQuery && (
            <Badge variant="outline" className="text-xs">
              "{searchQuery}"
            </Badge>
          )}
        </div>
      </div>

      {/* Predictions List */}
      <div className="px-4 pb-20">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-lg h-48 animate-pulse" />
            ))}
          </div>
        ) : sortedPredictions.length > 0 ? (
          <div className="space-y-4">
            {sortedPredictions.map((prediction: PredictionWithDetails) => (
              <PredictionCard
                key={prediction.id}
                prediction={prediction}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No predictions found</h3>
            <p className="text-gray-500">
              {searchQuery 
                ? `No predictions match "${searchQuery}"`
                : "Try adjusting your filters or search terms"
              }
            </p>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}