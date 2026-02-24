import { Router, Response } from "express";
import Order from "../models/Order";
import Product from "../models/Product";
import { protect, AuthRequest } from "../middleware/auth";

const router = Router();

// POST /api/orders [protect]
router.post("/", protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { items, promoCode, shippingAddress, firstName, lastName, phone } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ message: "Le panier est vide." });
      return;
    }

    let total = 0;
    const orderItems: Array<{
      product: any;
      name: string;
      image: string;
      price: number;
      quantity: number;
      size: string;
    }> = [];

    for (const item of items) {
      const product = await Product.findById(item.product || item.id || item._id);
      if (product) {
        const price = product.price;
        total += price * (item.quantity || 1);
        orderItems.push({
          product: product._id,
          name: product.name,
          image: product.image || "",
          price,
          quantity: item.quantity || 1,
          size: item.size || "Unique",
        });
      }
    }

    let discount = 0;
    if (promoCode === "AURA10") {
      discount = total * 0.1;
      total = total - discount;
    }

    const shipping = total >= 10000 ? 0 : 2000;
    total += shipping;

    const order = await Order.create({
      user: req.user!.id,
      items: orderItems,
      total,
      promoCode: promoCode || "",
      discount,
      status: "pending",
      shippingAddress: {
        street: shippingAddress?.street || shippingAddress?.address || "",
        city: shippingAddress?.city || "",
        zip: shippingAddress?.zip || "00000",
        country: shippingAddress?.country || "Cameroun",
      },
    });

    res.status(201).json(order);
  } catch (error: any) {
    console.error("Erreur create order:", error);
    res.status(500).json({ message: error.message || "Erreur serveur." });
  }
});

// GET /api/orders/mine [protect]
router.get("/mine", protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orders = await Order.find({ user: req.user!.id })
      .sort({ createdAt: -1 })
      .lean();

    res.json(orders);
  } catch (error) {
    console.error("Erreur orders mine:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

export default router;
