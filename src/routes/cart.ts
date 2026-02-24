import { Router } from "express";
import { protect } from "../middleware/auth";

// Le panier est géré côté client (Zustand + localStorage)
// Cette route peut servir pour synchroniser le panier avec le backend si besoin
const router = Router();

// GET /api/cart - récupérer le panier de l'utilisateur (optionnel)
router.get("/", protect, async (_req, res) => {
  res.json({ message: "Panier géré côté client.", items: [] });
});

export default router;
