import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Category } from "@shared/schema";

interface CreatePredictionModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const createPredictionSchema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters").max(200, "Title must be less than 200 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  categoryId: z.string().min(1, "Please select a category"),
  resolutionDate: z.string().min(1, "Please select a resolution date"),
});

type CreatePredictionForm = z.infer<typeof createPredictionSchema>;

export default function CreatePredictionModal({ open, onClose, onSuccess }: CreatePredictionModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    enabled: open,
  });

  const form = useForm<CreatePredictionForm>({
    resolver: zodResolver(createPredictionSchema),
    defaultValues: {
      title: "",
      description: "",
      categoryId: "",
      resolutionDate: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreatePredictionForm) => {
      const resolutionDate = new Date(data.resolutionDate);
      await apiRequest("POST", "/api/predictions", {
        ...data,
        resolutionDate: resolutionDate.toISOString(),
      });
    },
    onSuccess: () => {
      toast({
        title: "Prediction created!",
        description: "Your hot take has been added to the feed.",
      });
      form.reset();
      onSuccess();
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
      
      toast({
        title: "Error",
        description: "Failed to create prediction. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreatePredictionForm) => {
    createMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  // Set minimum date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-auto" data-testid="modal-create-prediction">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <span className="mr-2">🔥</span>
            Create Hot Take
          </DialogTitle>
          <DialogDescription>
            Share your prediction and let others stake on it
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Prediction</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Make your hot take..."
                      className="resize-none focus:ring-2 focus:ring-accent-purple focus:border-transparent"
                      rows={3}
                      data-testid="input-prediction-title"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add more context to your prediction..."
                      className="resize-none focus:ring-2 focus:ring-accent-purple focus:border-transparent"
                      rows={2}
                      data-testid="input-prediction-description"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder="Choose a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories?.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <span className="mr-2">{category.emoji}</span>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="resolutionDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resolution Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      min={minDate}
                      className="focus:ring-2 focus:ring-accent-purple focus:border-transparent"
                      data-testid="input-resolution-date"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleClose}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-accent-purple hover:bg-accent-purple/90 text-white"
                disabled={createMutation.isPending}
                data-testid="button-submit"
              >
                {createMutation.isPending ? "Creating..." : "Create Prediction"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
