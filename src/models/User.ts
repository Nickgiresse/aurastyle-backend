import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUserAddress {
  street: string;
  city: string;
  zip: string;
  country: string;
}

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isAdmin: boolean;
  wishlist: mongoose.Types.ObjectId[];
  address?: IUserAddress;
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserAddressSchema = new Schema<IUserAddress>(
  {
    street: { type: String, required: true },
    city: { type: String, required: true },
    zip: { type: String, required: true },
    country: { type: String, required: true },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true, default: "" },
    lastName: { type: String, required: true, default: "" },
    phone: { type: String },
    isAdmin: { type: Boolean, default: false },
    wishlist: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    address: UserAddressSchema,
  },
  { timestamps: true }
);

UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
