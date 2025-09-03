import { useState, useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/useWebSocket";
import TopNavigation from "@/components/top-navigation";
import CategoryFilters from "@/components/category-filters";
import PredictionCard from "@/components/prediction-card";
import BottomNavigation from "@/components/bottom-navigation";
import CreatePredictionModal from "@/components/create-prediction-modal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { PredictionWithDetails } from "@shared/schema";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { subscribe } = useWebSocket();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["/api/predictions", selectedCategory],
    queryFn: ({ pageParam = 0 }: { pageParam: number }) => {
      const params = new URLSearchParams({
        limit: "10",
        offset: (pageParam * 10).toString(),
        ...(selectedCategory && { categoryId: selectedCategory }),
      });
      return fetch(`/api/predictions?${params}`).then((res) => res.json());
    },
    getNextPageParam: (lastPage: PredictionWithDetails[], allPages: PredictionWithDetails[][]) => {
      return lastPage.length === 10 ? allPages.length : undefined;
    },
    initialPageParam: 0,
  });

  const predictions = data?.pages.flat() || [];

  useEffect(() => {
    const unsubscribe = subscribe('vote_update', (data: any) => {
      // Refresh predictions when votes are updated
      refetch();
    });
    return unsubscribe;
  }, [subscribe, refetch]);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

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

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen shadow-lg relative">
      <TopNavigation />
      <CategoryFilters 
        selectedCategory={selectedCategory} 
        onCategoryChange={handleCategoryChange} 
      />
      
      <div className="pb-20 space-y-4 p-4">
        {predictions.map((prediction: PredictionWithDetails, index: number) => (
          <PredictionCard 
            key={`${prediction.id}-${index}`} 
            prediction={prediction} 
            data-testid={`card-prediction-${prediction.id}`}
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
        
        {predictions.length === 0 && !isLoading && (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">🤔</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No predictions yet</h3>
            <p className="text-gray-600 mb-6">Be the first to create a hot take!</p>
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-accent-purple hover:bg-accent-purple/90"
              data-testid="button-create-first"
            >
              Create Prediction
            </Button>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <Button
        size="lg"
        className="fixed bottom-24 right-6 bg-accent-purple hover:bg-accent-purple/90 text-white w-14 h-14 rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 z-40 p-0"
        onClick={() => setShowCreateModal(true)}
        data-testid="button-create-prediction"
      >
        <Plus className="w-6 h-6" />
      </Button>

      <BottomNavigation />
      
      <CreatePredictionModal 
        open={showCreateModal} 
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          refetch();
        }}
      />
    </div>
  );
}
