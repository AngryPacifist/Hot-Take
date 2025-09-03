import { storage } from "./storage";

export async function seedDatabase() {
  // Initialize default categories
  const defaultCategories = [
    { name: "Tech", emoji: "🚀", color: "bg-blue-100 text-blue-800" },
    { name: "Sports", emoji: "⚽", color: "bg-green-100 text-green-800" },
    { name: "Crypto", emoji: "💰", color: "bg-yellow-100 text-yellow-800" },
    { name: "Memes", emoji: "😂", color: "bg-pink-100 text-pink-800" },
    { name: "Food", emoji: "🍕", color: "bg-orange-100 text-orange-800" },
  ];

  console.log("Seeding categories...");
  for (const category of defaultCategories) {
    try {
      await storage.createCategory(category);
      console.log(`- Created category: ${category.name}`);
    } catch (error) {
      // Category might already exist, ignore error
      console.log(`- Category ${category.name} already exists, skipping.`);
    }
  }
  console.log("Category seeding complete.");
}
