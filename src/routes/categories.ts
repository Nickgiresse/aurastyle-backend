import { Router, Request, Response } from "express";
import Category from "../models/Category";

const router = Router();

// GET /api/categories
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await Category.find().select("_id name").lean();
    res.json(categories);
  } catch (error) {
    console.error("Erreur categories:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

export default router;
