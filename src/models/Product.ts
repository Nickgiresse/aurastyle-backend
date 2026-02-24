import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProduct extends Document {
  name: string;
  price: number;
  description?: string;
  subTitle?: string;
  category: mongoose.Types.ObjectId;
  image?: string;
  badge?: string;
  sizes: string[];
  stock: number;
  isActive: boolean;
  createdAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String },
    subTitle: { type: String },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    image: { type: String },
    badge: { type: String, default: "" },
    sizes: { type: [String], default: ["S", "M", "L", "XL"] },
    stock: { type: Number, default: 100 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);

export default Product;
