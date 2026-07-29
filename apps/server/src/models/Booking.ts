import mongoose, { Document, Schema } from 'mongoose';

export type BookingStatus =
  | 'created'
  | 'searching'
  | 'assigned'
  | 'driver_arrived'
  | 'otp_verified'
  | 'started'
  | 'completed'
  | 'paid'
  | 'closed'
  | 'cancelled';

export type TripType = 'local' | 'roundtrip' | 'hourly' | 'outstation';

export interface IBooking extends Document {
  idempotencyKey?: string;
  customerId: mongoose.Types.ObjectId;
  driverId?: mongoose.Types.ObjectId;
  type: TripType;
  pickup: { lat: number; lng: number; address: string };
  drop: { lat: number; lng: number; address: string };
  status: BookingStatus;
  otp?: string; // hashed
  fare?: {
    base: number;
    distance: number;
    time: number;
    tolls?: number;
    total: number;
    currency: string;
    final?: number;
  };
  distance?: number;   // km
  duration?: number;   // minutes
  timestamps: {
    createdAt?: Date;
    assignedAt?: Date;
    startedAt?: Date;
    completedAt?: Date;
  };
  paymentId?: string;
  paymentStatus?: 'pending' | 'paid' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

const LocationSubSchema = new Schema({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  address: { type: String, default: '' },
}, { _id: false });

const BookingSchema = new Schema<IBooking>({
  idempotencyKey: { type: String, sparse: true, unique: true, index: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  driverId: { type: Schema.Types.ObjectId, ref: 'Driver', index: true },
  type: { type: String, enum: ['local', 'roundtrip', 'hourly', 'outstation'], required: true },
  pickup: { type: LocationSubSchema, required: true },
  drop: { type: LocationSubSchema, required: true },
  status: {
    type: String,
    enum: ['created', 'searching', 'assigned', 'driver_arrived', 'otp_verified', 'started', 'completed', 'paid', 'closed', 'cancelled'],
    default: 'created',
    index: true,
  },
  otp: { type: String, select: false },
  fare: {
    base: Number,
    distance: Number,
    time: Number,
    tolls: Number,
    total: Number,
    final: Number,
    currency: { type: String, default: 'INR' },
  },
  distance: Number,
  duration: Number,
  timestamps: {
    createdAt: Date,
    assignedAt: Date,
    startedAt: Date,
    completedAt: Date,
  },
  paymentId: String,
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
}, {
  timestamps: true,
});

// Compound indexes for common query patterns
BookingSchema.index({ customerId: 1, status: 1 });
BookingSchema.index({ driverId: 1, status: 1 });
BookingSchema.index({ status: 1, createdAt: 1 });
BookingSchema.index({ customerId: 1, _id: -1 }); // for cursor pagination

export const Booking = mongoose.model<IBooking>('Booking', BookingSchema);
