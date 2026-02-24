import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import Product from "../models/Product";
import Category from "../models/Category";

const router = Router();

// GET /api/products
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, sort, page = "1", limit = "8" } = req.query;
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    const query: Record<string, unknown> = { isActive: true };

    if (category && typeof category === "string") {
      if (mongoose.Types.ObjectId.isValid(category)) {
        query.category = category;
      } else {
        const cat = await Category.findOne({ name: category });
        if (cat) query.category = cat._id;
      }
    }

    let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
    if (sort === "price_asc") sortOption = { price: 1 };
    else if (sort === "price_desc") sortOption = { price: -1 };

    const [products, total] = await Promise.all([
      Product.find(query).populate("category").sort(sortOption).skip(skip).limit(limitNum).lean(),
      Product.countDocuments(query),
    ]);

    const pages = Math.ceil(total / limitNum);

    res.json({
      products,
      total,
      pages,
      currentPage: pageNum,
    });
  } catch (error) {
    console.error("Erreur products:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// GET /api/products/search?q=
router.get("/search", async (req: Request, res: Response): Promise<void> => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== "string") {
      res.json({ products: [] });
      return;
    }

    const products = await Product.find({
      isActive: true,
      $or: [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ],
    })
      .populate("category")
      .limit(20)
      .lean();

    res.json({ products });
  } catch (error) {
    console.error("Erreur search:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// GET /api/products/:id
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id).populate("category");
    if (!product) {
      res.status(404).json({ message: "Produit non trouvé." });
      return;
    }
    res.json(product);
  } catch (error) {
    console.error("Erreur product:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

export default router;
