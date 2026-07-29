import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  phone: string;
  name: string;
  email?: string;
  passwordHash?: string;
  addresses: {
    label: string;
    lat: number;
    lng: number;
    address: string;
  }[];
  vehicles: {
    make: string;
    model: string;
    transmission: 'manual' | 'automatic';
    year?: number;
  }[];
  rating: number;
  totalRatings: number;
  role: 'customer';
  otp?: string;
  otpExpiresAt?: Date;
  refreshToken?: string;
  createdAt: Date;
}

const AddressSchema = new Schema({
  label: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  address: { type: String, required: true },
}, { _id: true });

const VehicleSchema = new Schema({
  make: { type: String, required: true },
  model: { type: String, required: true },
  transmission: { type: String, enum: ['manual', 'automatic'], required: true },
  year: { type: Number },
}, { _id: true });

const UserSchema = new Schema<IUser>({
  phone: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  email: { type: String, sparse: true, index: true },
  passwordHash: { type: String, select: false },
  addresses: [AddressSchema],
  vehicles: [VehicleSchema],
  rating: { type: Number, default: 5.0 },
  totalRatings: { type: Number, default: 0 },
  role: { type: String, default: 'customer' },
  otp: { type: String, select: false },
  otpExpiresAt: { type: Date, select: false },
  refreshToken: { type: String, select: false },
}, {
  timestamps: true,
});

UserSchema.methods.compareOtp = async function (otp: string): Promise<boolean> {
  if (!this.otp) return false;
  return bcrypt.compare(otp, this.otp);
};

UserSchema.methods.setOtp = async function (otp: string): Promise<void> {
  this.otp = await bcrypt.hash(otp, 10);
  this.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry
};

export const User = mongoose.model<IUser>('User', UserSchema);
