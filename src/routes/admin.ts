import { Router, Request, Response } from "express";
import Product from "../models/Product";
import Order from "../models/Order";
import User from "../models/User";
import Category from "../models/Category";
import { protect } from "../middleware/auth";
import { adminOnly } from "../middleware/admin";
import { upload, uploadToCloudinary } from "../middleware/upload";

const router = Router();

// Toutes les routes admin sont protégées et réservées aux admins
router.use(protect);
router.use(adminOnly);

// GET /api/admin/products
router.get("/products", async (_req: Request, res: Response): Promise<void> => {
  try {
    const products = await Product.find().populate("category").sort({ createdAt: -1 }).lean();
    res.json(products);
  } catch (error) {
    console.error("Erreur admin products:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// POST /api/admin/products
router.post(
  "/products",
  upload.single("image"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, price, description, subTitle, category, badge, sizes, stock, isActive } = req.body;

      if (!name || price === undefined) {
        res.status(400).json({ message: "Nom et prix requis." });
        return;
      }

      const sizesArray = sizes
        ? typeof sizes === "string"
          ? JSON.parse(sizes)
          : sizes
        : ["S", "M", "L", "XL"];

      let imagePath = req.body.image || `https://picsum.photos/400/500?random=${Date.now()}`;
      if (req.file?.buffer) {
        imagePath = await uploadToCloudinary(req.file.buffer, "aurastyle/products");
      }

      const product = await Product.create({
        name,
        price: parseFloat(price),
        description: description || "",
        subTitle: subTitle || "",
        category: category || (await Category.findOne())?._id,
        image: imagePath,
        badge: badge || "",
        sizes: sizesArray,
        stock: stock !== undefined ? parseInt(stock) : 100,
        isActive: isActive !== undefined ? isActive === "true" || isActive === true : true,
      });

      res.status(201).json(product);
    } catch (error) {
      console.error("Erreur create product:", error);
      res.status(500).json({ message: "Erreur serveur." });
    }
  }
);

// PUT /api/admin/products/:id
router.put(
  "/products/:id",
  upload.single("image"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        res.status(404).json({ message: "Produit non trouvé." });
        return;
      }

      const { name, price, description, subTitle, category, badge, sizes, stock, isActive } = req.body;

      if (name) product.name = name;
      if (price !== undefined) product.price = parseFloat(price);
      if (description !== undefined) product.description = description;
      if (subTitle !== undefined) product.subTitle = subTitle;
      if (category) product.category = category;
      if (badge !== undefined) product.badge = badge;
      if (sizes) {
        product.sizes = typeof sizes === "string" ? JSON.parse(sizes) : sizes;
      }
      if (stock !== undefined) product.stock = parseInt(stock);
      if (isActive !== undefined) product.isActive = isActive === "true" || isActive === true;
      if (req.file?.buffer) {
        product.image = await uploadToCloudinary(req.file.buffer, "aurastyle/products");
      }

      await product.save();
      res.json(product);
    } catch (error) {
      console.error("Erreur update product:", error);
      res.status(500).json({ message: "Erreur serveur." });
    }
  }
);

// DELETE /api/admin/products/:id
router.delete("/products/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      res.status(404).json({ message: "Produit non trouvé." });
      return;
    }
    res.json({ message: "Produit supprimé." });
  } catch (error) {
    console.error("Erreur delete product:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// GET /api/admin/orders
router.get("/orders", async (_req: Request, res: Response): Promise<void> => {
  try {
    const orders = await Order.find().populate("user", "email").sort({ createdAt: -1 }).lean();
    res.json(orders);
  } catch (error) {
    console.error("Erreur admin orders:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// PUT /api/admin/orders/:id
router.put("/orders/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    const validStatuses = ["pending", "paid", "shipped", "delivered"];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({ message: "Statut invalide." });
      return;
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!order) {
      res.status(404).json({ message: "Commande non trouvée." });
      return;
    }
    res.json(order);
  } catch (error) {
    console.error("Erreur update order:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// GET /api/admin/stats
router.get("/stats", async (_req: Request, res: Response): Promise<void> => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [totalProducts, totalOrders, totalUsers, allOrders, recentOrders] = await Promise.all([
      Product.countDocuments(),
      Order.countDocuments(),
      User.countDocuments(),
      Order.find({ createdAt: { $gte: sevenDaysAgo } }).select("total createdAt").lean(),
      Order.find().populate("user", "email firstName lastName").sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    const totalRevenue = (await Order.aggregate([{ $group: { _id: null, total: { $sum: "$total" } } }]))[0]?.total || 0;

    const ordersByDayMap: Record<string, { count: number; revenue: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const key = d.toISOString().split("T")[0];
      ordersByDayMap[key] = { count: 0, revenue: 0 };
    }
    for (const o of allOrders) {
      const key = new Date(o.createdAt).toISOString().split("T")[0];
      if (ordersByDayMap[key]) {
        ordersByDayMap[key].count += 1;
        ordersByDayMap[key].revenue += o.total || 0;
      }
    }
    const ordersByDay = Object.entries(ordersByDayMap).map(([date, data]) => ({
      date,
      count: data.count,
      revenue: data.revenue,
    }));

    res.json({
      totalProducts,
      totalOrders,
      totalUsers,
      totalRevenue,
      recentOrders,
      ordersByDay,
    });
  } catch (error) {
    console.error("Erreur admin stats:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// GET /api/admin/categories
router.get("/categories", async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await Category.find().sort({ name: 1 }).lean();
    res.json(categories);
  } catch (error) {
    console.error("Erreur admin categories:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// POST /api/admin/categories
router.post(
  "/categories",
  upload.single("image"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, description } = req.body;
      if (!name) {
        res.status(400).json({ message: "Nom requis." });
        return;
      }
      let imagePath = req.body.image || "";
      if (req.file?.buffer) {
        imagePath = await uploadToCloudinary(req.file.buffer, "aurastyle/categories");
      }
      const category = await Category.create({
        name,
        description: description || "",
        image: imagePath,
      });
      res.status(201).json(category);
    } catch (error) {
      console.error("Erreur create category:", error);
      res.status(500).json({ message: "Erreur serveur." });
    }
  }
);

// PUT /api/admin/categories/:id
router.put(
  "/categories/:id",
  upload.single("image"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const category = await Category.findById(req.params.id);
      if (!category) {
        res.status(404).json({ message: "Catégorie non trouvée." });
        return;
      }
      const { name, description } = req.body;
      if (name) category.name = name;
      if (description !== undefined) category.description = description;
      if (req.file?.buffer) {
        category.image = await uploadToCloudinary(req.file.buffer, "aurastyle/categories");
      }
      await category.save();
      res.json(category);
    } catch (error) {
      console.error("Erreur update category:", error);
      res.status(500).json({ message: "Erreur serveur." });
    }
  }
);

// DELETE /api/admin/categories/:id
router.delete("/categories/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      res.status(404).json({ message: "Catégorie non trouvée." });
      return;
    }
    res.json({ message: "Catégorie supprimée." });
  } catch (error) {
    console.error("Erreur delete category:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// GET /api/admin/users
router.get("/users", async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 }).lean();
    const ordersByUser = await Order.aggregate([
      { $group: { _id: "$user", orderCount: { $sum: 1 }, totalSpent: { $sum: "$total" } } },
    ]);
    const orderMap: Record<string, { orderCount: number; totalSpent: number }> = {};
    ordersByUser.forEach((o) => {
      if (o._id) orderMap[o._id.toString()] = { orderCount: o.orderCount, totalSpent: o.totalSpent };
    });
    const result = users.map((u) => ({
      id: u._id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      phone: u.phone,
      isAdmin: u.isAdmin,
      createdAt: u.createdAt,
      address: u.address,
      orderCount: orderMap[u._id.toString()]?.orderCount ?? 0,
      totalSpent: orderMap[u._id.toString()]?.totalSpent ?? 0,
    }));
    res.json(result);
  } catch (error) {
    console.error("Erreur admin users:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// GET /api/admin/users/:id
router.get("/users/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id).select("-password").lean();
    if (!user) {
      res.status(404).json({ message: "Utilisateur non trouvé." });
      return;
    }
    const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 }).lean();
    res.json({ ...user, id: user._id, orders });
  } catch (error) {
    console.error("Erreur admin user detail:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// PUT /api/admin/users/:id
router.put("/users/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ message: "Utilisateur non trouvé." });
      return;
    }
    const { firstName, lastName, email, phone, isAdmin, address } = req.body;
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
    if (isAdmin !== undefined) user.isAdmin = isAdmin;
    if (address !== undefined) user.address = address;
    await user.save();
    res.json({ id: user._id, ...user.toObject(), password: undefined });
  } catch (error) {
    console.error("Erreur update user:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// DELETE /api/admin/users/:id
router.delete("/users/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ message: "Utilisateur non trouvé." });
      return;
    }
    if (user.isAdmin) {
      const adminCount = await User.countDocuments({ isAdmin: true });
      if (adminCount <= 1) {
        res.status(400).json({ message: "Impossible de supprimer le dernier administrateur." });
        return;
      }
      res.status(400).json({ message: "Impossible de supprimer un administrateur." });
      return;
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "Utilisateur supprimé." });
  } catch (error) {
    console.error("Erreur delete user:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// POST /api/admin/users/:id/reset-password
router.post("/users/:id/reset-password", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ message: "Utilisateur non trouvé." });
      return;
    }
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let temporaryPassword = "";
    for (let i = 0; i < 8; i++) {
      temporaryPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    user.password = temporaryPassword;
    await user.save();
    res.json({ temporaryPassword });
  } catch (error) {
    console.error("Erreur reset password:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

export default router;
