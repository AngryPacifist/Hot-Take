import { useState, useEffect } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import TopNavigation from "@/components/top-navigation";
import { useWebSocket } from "@/hooks/useWebSocket";
import CategoryFilters from "@/components/category-filters";
import PredictionCard from "@/components/prediction-card";
import BottomNavigation from "@/components/bottom-navigation";
import { Input } from "@/components/ui/input";
import { Search, TrendingUp, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PredictionWithDetails } from "@shared/schema";

const PREDICTIONS_PER_PAGE = 10;

export default function Explore() {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "trending" | "ending_soon">("trending");

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["/api/predictions", selectedCategory, sortBy, searchQuery],
    queryFn: ({ pageParam = 0 }) => {
      const params = new URLSearchParams({
        limit: String(PREDICTIONS_PER_PAGE),
        offset: String(pageParam * PREDICTIONS_PER_PAGE),
        sortBy,
        ...(selectedCategory && { categoryId: selectedCategory }),
        ...(searchQuery && { searchQuery }),
      });
      return fetch(`/api/predictions?${params}`).then(res => res.json());
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === PREDICTIONS_PER_PAGE ? allPages.length : undefined;
    },
    initialPageParam: 0,
  });

  const allPredictions = data?.pages.flat() || [];

  const queryClient = useQueryClient();
  const { subscribe } = useWebSocket();

  useEffect(() => {
    const unsubscribe = subscribe("vote_update", (data: { prediction: PredictionWithDetails }) => {
      queryClient.setQueryData(["/api/predictions", selectedCategory, sortBy, searchQuery], (oldData: any) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page: PredictionWithDetails[]) =>
            page.map((p) => (p.id === data.prediction.id ? data.prediction : p))
          ),
        };
      });
    });

    return () => unsubscribe();
  }, [queryClient, selectedCategory, sortBy, searchQuery, subscribe]);

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
            {allPredictions.length} predictions found
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
        ) : allPredictions.length > 0 ? (
          <div className="space-y-4">
            {allPredictions.map((prediction: PredictionWithDetails) => (
              <PredictionCard
                key={prediction.id}
                prediction={prediction}
              />
            ))}
            {hasNextPage && (
              <Button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                variant="outline"
                className="w-full"
              >
                {isFetchingNextPage ? "Loading more..." : "Load More"}
              </Button>
            )}
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