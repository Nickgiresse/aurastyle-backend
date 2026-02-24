import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { protect, AuthRequest } from "../middleware/auth";

const router = Router();

const generateToken = (id: string, email: string, isAdmin: boolean): string => {
  const secret = process.env.JWT_SECRET || "aurastyle_secret_key_2024";
  return jwt.sign(
    { id, email, isAdmin },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" } as jwt.SignOptions
  );
};

// POST /api/auth/register
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      res.status(400).json({ message: "Prénom, nom, email et mot de passe requis." });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ message: "Format d'email invalide." });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ message: "Le mot de passe doit contenir au moins 6 caractères." });
      return;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: "Cet email est déjà utilisé." });
      return;
    }

    const user = await User.create({ firstName, lastName, email, phone: phone || undefined, password });
    const token = generateToken(user._id.toString(), user.email, user.isAdmin);

    res.status(201).json({
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.error("Erreur register:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Email et mot de passe requis." });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ message: "Email ou mot de passe incorrect." });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ message: "Email ou mot de passe incorrect." });
      return;
    }

    const token = generateToken(user._id.toString(), user.email, user.isAdmin);

    res.json({
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.error("Erreur login:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// GET /api/auth/me [protect]
router.get("/me", protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!.id).select("-password");
    if (!user) {
      res.status(404).json({ message: "Utilisateur non trouvé." });
      return;
    }
    res.json({
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isAdmin: user.isAdmin,
      wishlist: user.wishlist,
      address: user.address,
      phone: user.phone,
    });
  } catch (error) {
    console.error("Erreur me:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

export default router;
