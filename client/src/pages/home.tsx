import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
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
  const [predictions, setPredictions] = useState<PredictionWithDetails[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { subscribe } = useWebSocket();

  const { data: initialPredictions, isLoading, refetch } = useQuery({
    queryKey: ["/api/predictions", { categoryId: selectedCategory || undefined, limit: 20, offset: 0 }],
    enabled: true,
  });

  const { data: moreData, isLoading: loadingMore } = useQuery({
    queryKey: ["/api/predictions", { categoryId: selectedCategory || undefined, limit: 20, offset }],
    enabled: offset > 0,
  });

  useEffect(() => {
    if (initialPredictions) {
      setPredictions(initialPredictions);
      setOffset(20);
      setHasMore(initialPredictions.length === 20);
    }
  }, [initialPredictions]);

  useEffect(() => {
    if (moreData && offset > 0) {
      setPredictions(prev => [...prev, ...moreData]);
      setHasMore(moreData.length === 20);
    }
  }, [moreData, offset]);

  useEffect(() => {
    const unsubscribe = subscribe('vote_update', (data: any) => {
      // Refresh predictions when votes are updated
      refetch();
    });
    return unsubscribe;
  }, [subscribe, refetch]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      setOffset(prev => prev + 20);
    }
  }, [loadingMore, hasMore]);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setOffset(0);
    setPredictions([]);
  };

  const handleScroll = useCallback(() => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000) {
      loadMore();
    }
  }, [loadMore]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

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
        {predictions.map((prediction, index) => (
          <PredictionCard 
            key={`${prediction.id}-${index}`} 
            prediction={prediction} 
            data-testid={`card-prediction-${prediction.id}`}
          />
        ))}
        
        {loadingMore && (
          <div className="flex justify-center py-8" data-testid="loading-indicator">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-purple"></div>
          </div>
        )}
        
        {!hasMore && predictions.length > 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No more predictions to load</p>
          </div>
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
