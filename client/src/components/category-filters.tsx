import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { Category } from "@shared/schema";

interface CategoryFiltersProps {
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

export default function CategoryFilters({ selectedCategory, onCategoryChange }: CategoryFiltersProps) {
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  if (!categories) return null;

  return (
    <div className="bg-white border-b border-light-border px-4 py-3" data-testid="section-category-filters">
      <ScrollArea className="w-full">
        <div className="flex space-x-2">
          <Button
            variant={selectedCategory === "" ? "default" : "outline"}
            size="sm"
            className={`category-chip whitespace-nowrap ${
              selectedCategory === "" 
                ? "bg-accent-purple hover:bg-accent-purple/90 text-white" 
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
            onClick={() => onCategoryChange("")}
            data-testid="button-category-all"
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              className={`category-chip whitespace-nowrap ${
                selectedCategory === category.id 
                  ? "bg-accent-purple hover:bg-accent-purple/90 text-white" 
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
              onClick={() => onCategoryChange(category.id)}
              data-testid={`button-category-${category.name.toLowerCase()}`}
            >
              <span className="mr-1">{category.emoji}</span>
              {category.name}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
