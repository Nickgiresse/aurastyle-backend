import { Router, Response } from "express";
import User from "../models/User";
import Product from "../models/Product";
import { protect, AuthRequest } from "../middleware/auth";

const router = Router();

// Toutes les routes users sont protégées
router.use(protect);

// GET /api/users/profile
router.get("/profile", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!.id).select("-password").lean();
    if (!user) {
      res.status(404).json({ message: "Utilisateur non trouvé." });
      return;
    }
    res.json({
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      address: user.address,
      wishlist: user.wishlist,
    });
  } catch (error) {
    console.error("Erreur profile:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// PUT /api/users/profile
router.put("/profile", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, phone } = req.body;
    const user = await User.findById(req.user!.id);
    if (!user) {
      res.status(404).json({ message: "Utilisateur non trouvé." });
      return;
    }
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (email !== undefined) {
      const existing = await User.findOne({ email, _id: { $ne: user._id } });
      if (existing) {
        res.status(400).json({ message: "Cet email est déjà utilisé." });
        return;
      }
      user.email = email;
    }
    if (phone !== undefined) user.phone = phone;
    await user.save();
    res.json({
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
    });
  } catch (error) {
    console.error("Erreur update profile:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// PUT /api/users/password
router.put("/password", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ message: "Ancien et nouveau mot de passe requis." });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ message: "Le nouveau mot de passe doit contenir au moins 6 caractères." });
      return;
    }
    const user = await User.findById(req.user!.id);
    if (!user) {
      res.status(404).json({ message: "Utilisateur non trouvé." });
      return;
    }
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      res.status(400).json({ message: "Ancien mot de passe incorrect." });
      return;
    }
    user.password = newPassword;
    await user.save();
    res.json({ message: "Mot de passe modifié." });
  } catch (error) {
    console.error("Erreur password:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// PUT /api/users/address
router.put("/address", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { street, city, zip, country } = req.body;
    if (!street || !city || !zip || !country) {
      res.status(400).json({ message: "Tous les champs d'adresse sont requis." });
      return;
    }
    const user = await User.findByIdAndUpdate(
      req.user!.id,
      { address: { street, city, zip, country } },
      { new: true }
    ).select("-password");
    if (!user) {
      res.status(404).json({ message: "Utilisateur non trouvé." });
      return;
    }
    res.json({ address: user.address });
  } catch (error) {
    console.error("Erreur address:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// GET /api/users/wishlist
router.get("/wishlist", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!.id)
      .populate({ path: "wishlist", populate: { path: "category", select: "name" } })
      .lean();
    if (!user) {
      res.status(404).json({ message: "Utilisateur non trouvé." });
      return;
    }
    res.json(user.wishlist || []);
  } catch (error) {
    console.error("Erreur wishlist:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// POST /api/users/wishlist/:id
router.post("/wishlist/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);
    if (!product) {
      res.status(404).json({ message: "Produit non trouvé." });
      return;
    }
    const user = await User.findById(req.user!.id);
    if (!user) {
      res.status(404).json({ message: "Utilisateur non trouvé." });
      return;
    }
    if (!user.wishlist) user.wishlist = [];
    if (user.wishlist.some((id) => id.toString() === productId)) {
      res.json({ message: "Déjà en wishlist.", wishlist: user.wishlist });
      return;
    }
    user.wishlist.push(product._id);
    await user.save();
    res.json({ message: "Ajouté à la wishlist.", wishlist: user.wishlist });
  } catch (error) {
    console.error("Erreur add wishlist:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// DELETE /api/users/wishlist/:id
router.delete("/wishlist/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) {
      res.status(404).json({ message: "Utilisateur non trouvé." });
      return;
    }
    user.wishlist = user.wishlist.filter((id) => id.toString() !== req.params.id);
    await user.save();
    res.json({ message: "Retiré de la wishlist.", wishlist: user.wishlist });
  } catch (error) {
    console.error("Erreur remove wishlist:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

export default router;
