import "dotenv/config";
import mongoose from "mongoose";
import Category from "../models/Category";
import Product from "../models/Product";
import User from "../models/User";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/aurastyle";

const categoriesData = [
  { name: "Vêtements", description: "Pièces intemporelles" },
  { name: "Accessoires", description: "Sublimez votre look" },
  { name: "Bijoux", description: "Élégance discrète" },
  { name: "T-shirts", description: "Basiques" },
  { name: "Chemises", description: "Élégance" },
  { name: "Pantalons", description: "Confort" },
];

const productsData = [
  {
    name: "Manteau en Laine Alpaga",
    price: 185000,
    category: "Vêtements",
    image: "https://picsum.photos/400/500?random=1",
    description: "Un manteau d'exception en laine d'alpaga.",
    subTitle: "Luxe et confort",
    sizes: ["S", "M", "L", "XL"],
  },
  {
    name: "Chemise Signature Coton",
    price: 45000,
    category: "Vêtements",
    image: "https://picsum.photos/400/500?random=2",
    badge: "NOUVEAU",
    description: "Chemise en coton peigné premium.",
    subTitle: "Basiques",
    sizes: ["S", "M", "L", "XL"],
  },
  {
    name: "Sac à Main Cuir Minimal",
    price: 65000,
    category: "Accessoires",
    image: "https://picsum.photos/400/500?random=3",
    description: "Sac à main en cuir véritable.",
    subTitle: "Accessoires",
    sizes: ["Unique"],
  },
  {
    name: "Duo Bracelets Aura",
    price: 22500,
    category: "Bijoux",
    image: "https://picsum.photos/400/500?random=4",
    description: "Deux bracelets assortis.",
    subTitle: "Bijoux",
    sizes: ["Unique"],
  },
  {
    name: "T-shirt Premium Coton",
    price: 15000,
    category: "T-shirts",
    image: "https://picsum.photos/400/500?random=5",
    description: "T-shirt en coton bio.",
    subTitle: "Vêtements",
    sizes: ["S", "M", "L", "XL"],
  },
  {
    name: "Chemise Lin Sablé",
    price: 42000,
    category: "Chemises",
    image: "https://picsum.photos/400/500?random=6",
    badge: "NOUVEAU",
    description: "Chemise en lin naturel.",
    subTitle: "Chemises",
    sizes: ["S", "M", "L", "XL"],
  },
  {
    name: "Pantalon Chino Navy",
    price: 48000,
    category: "Pantalons",
    image: "https://picsum.photos/400/500?random=7",
    description: "Pantalon chino en twill.",
    subTitle: "Pantalons",
    sizes: ["S", "M", "L", "XL"],
  },
  {
    name: "Bracelet Cuir Tressé",
    price: 19500,
    category: "Bijoux",
    image: "https://picsum.photos/400/500?random=8",
    description: "Bracelet en cuir véritable.",
    subTitle: "Bracelets",
    sizes: ["Unique"],
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connexion MongoDB établie.");

    // Nettoyer
    await Category.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({});

    // Créer les catégories
    const categories = await Category.insertMany(categoriesData);
    const categoryMap: Record<string, mongoose.Types.ObjectId> = {};
    categories.forEach((c) => {
      categoryMap[c.name] = c._id;
    });

    // Créer les produits
    const productsWithCategory = productsData.map((p) => ({
      ...p,
      category: categoryMap[p.category] || categories[0]._id,
    }));
    await Product.insertMany(productsWithCategory);

    // Créer l'admin
    await User.create({
      email: "admin@aura.com",
      password: "admin123",
      firstName: "Admin",
      lastName: "Aura",
      isAdmin: true,
    });

    console.log("Base de données peuplée avec succès.");
  } catch (error) {
    console.error("Erreur seed:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
