import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./config/db";
import authRoutes from "./routes/auth";
import productsRoutes from "./routes/products";
import categoriesRoutes from "./routes/categories";
import ordersRoutes from "./routes/orders";
import usersRoutes from "./routes/users";
import adminRoutes from "./routes/admin";
import cartRoutes from "./routes/cart";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.CLIENT_URL || '',
    /\.vercel\.app$/,   // accepte tous les sous-domaines vercel
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/cart", cartRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "Aura & Style API" });
});

// Démarrage
const start = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
  });
};

start().catch((err) => {
  console.error("Erreur démarrage:", err);
  process.exit(1);
});
