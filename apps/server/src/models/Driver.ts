import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IDriver extends Document {
  phone: string;
  name: string;
  gender?: 'male' | 'female' | 'other';
  email?: string;
  dateOfBirth?: Date;
  alternatePhone?: string;
  languages?: string[];
  kyc: {
    licenseUrl?: string;
    aadhaarUrl?: string;
    photoUrl?: string;
    status: 'pending' | 'verified' | 'rejected';
    rejectionReason?: string;
  };
  vehicleSkills: string[];
  isOnline: boolean;
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  rating: number;
  totalRatings: number;
  totalTrips: number;
  bankDetails?: {
    accountNo?: string;
    ifsc?: string;
  };
  role: 'driver';
  otp?: string;
  otpExpiresAt?: Date;
  refreshToken?: string;
  createdAt: Date;
}

const DriverSchema = new Schema<IDriver>({
  phone: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  email: { type: String },
  dateOfBirth: { type: Date },
  alternatePhone: { type: String },
  languages: [{ type: String }],
  kyc: {
    licenseUrl: { type: String },
    aadhaarUrl: { type: String },
    photoUrl: { type: String },
    status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    rejectionReason: { type: String },
  },
  vehicleSkills: [{ type: String }],
  isOnline: { type: Boolean, default: false },
  location: {
    type: { type: String, enum: ['Point'] },
    coordinates: [Number],
  },
  rating: { type: Number, default: 5.0 },
  totalRatings: { type: Number, default: 0 },
  totalTrips: { type: Number, default: 0 },
  bankDetails: {
    accountNo: { type: String },
    ifsc: { type: String },
  },
  role: { type: String, default: 'driver' },
  otp: { type: String, select: false },
  otpExpiresAt: { type: Date, select: false },
  refreshToken: { type: String, select: false },
}, {
  timestamps: true,
});

// 2dsphere index for geospatial queries (enables $near, $geoWithin)
DriverSchema.index({ location: '2dsphere' });
// Compound index for matching queries: online + verified drivers
DriverSchema.index({ isOnline: 1, 'kyc.status': 1 });

DriverSchema.methods.compareOtp = async function (otp: string): Promise<boolean> {
  if (!this.otp) return false;
  return bcrypt.compare(otp, this.otp);
};

DriverSchema.methods.setOtp = async function (otp: string): Promise<void> {
  this.otp = await bcrypt.hash(otp, 10);
  this.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
};

export const Driver = mongoose.model<IDriver>('Driver', DriverSchema);
