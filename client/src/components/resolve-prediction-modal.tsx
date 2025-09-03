import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Prediction } from "@shared/schema";

interface ResolvePredictionModalProps {
  prediction: Prediction;
  open: boolean;
  onClose: () => void;
}

export default function ResolvePredictionModal({ prediction, open, onClose }: ResolvePredictionModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [outcome, setOutcome] = useState<boolean | null>(null);

  const resolveMutation = useMutation({
    mutationFn: async (resolvedValue: boolean) => {
      await apiRequest("POST", `/api/predictions/${prediction.id}/resolve`, {
        resolvedValue,
      });
    },
    onSuccess: () => {
      toast({
        title: "Prediction resolved!",
        description: "The outcome has been recorded and points have been distributed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/predictions"] });
      queryClient.invalidateQueries({ queryKey: [`/api/predictions/${prediction.id}`] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to resolve prediction. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleResolve = () => {
    if (outcome === null) {
      toast({
        title: "Select an outcome",
        description: "Please select 'Yes' or 'No' before resolving.",
        variant: "destructive",
      });
      return;
    }
    resolveMutation.mutate(outcome);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resolve Prediction</DialogTitle>
          <DialogDescription>
            Select the final outcome for your prediction: "{prediction.title}"
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant={outcome === true ? "default" : "outline"}
              onClick={() => setOutcome(true)}
              className="py-6 text-lg"
            >
              Yes
            </Button>
            <Button
              variant={outcome === false ? "default" : "outline"}
              onClick={() => setOutcome(false)}
              className="py-6 text-lg"
            >
              No
            </Button>
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleResolve} disabled={resolveMutation.isPending}>
            {resolveMutation.isPending ? "Resolving..." : "Resolve"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
