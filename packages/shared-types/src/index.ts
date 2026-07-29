import { z } from 'zod';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const BookingStatus = z.enum([
  'created',
  'searching',
  'assigned',
  'driver_arrived',
  'otp_verified',
  'started',
  'completed',
  'paid',
  'closed',
  'cancelled',
]);
export type BookingStatus = z.infer<typeof BookingStatus>;

export const TripType = z.enum(['local', 'roundtrip', 'hourly', 'outstation']);
export type TripType = z.infer<typeof TripType>;

export const KycStatus = z.enum(['pending', 'verified', 'rejected']);
export type KycStatus = z.infer<typeof KycStatus>;

export const UserRole = z.enum(['customer', 'driver', 'admin']);
export type UserRole = z.infer<typeof UserRole>;

// ─── Location ────────────────────────────────────────────────────────────────

export const LocationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  address: z.string().optional(),
});
export type Location = z.infer<typeof LocationSchema>;

// ─── User (Customer) ──────────────────────────────────────────────────────────

export const AddressSchema = z.object({
  _id: z.string().optional(),
  label: z.string(),
  lat: z.number(),
  lng: z.number(),
  address: z.string(),
});
export type Address = z.infer<typeof AddressSchema>;

export const VehicleSchema = z.object({
  _id: z.string().optional(),
  make: z.string(),
  model: z.string(),
  transmission: z.enum(['manual', 'automatic']),
  year: z.number().optional(),
});
export type Vehicle = z.infer<typeof VehicleSchema>;

export const UserSchema = z.object({
  _id: z.string(),
  phone: z.string(),
  name: z.string(),
  email: z.string().optional(),
  addresses: z.array(AddressSchema),
  vehicles: z.array(VehicleSchema),
  rating: z.number(),
  createdAt: z.string(),
});
export type User = z.infer<typeof UserSchema>;

// ─── Driver ───────────────────────────────────────────────────────────────────

export const KycSchema = z.object({
  licenseUrl: z.string().optional(),
  aadhaarUrl: z.string().optional(),
  photoUrl: z.string().optional(),
  status: KycStatus,
  rejectionReason: z.string().optional(),
});
export type Kyc = z.infer<typeof KycSchema>;

export const DriverSchema = z.object({
  _id: z.string(),
  phone: z.string(),
  name: z.string(),
  kyc: KycSchema,
  vehicleSkills: z.array(z.string()),
  isOnline: z.boolean(),
  location: z.object({
    type: z.literal('Point'),
    coordinates: z.tuple([z.number(), z.number()]),
  }).optional(),
  rating: z.number(),
  totalTrips: z.number(),
  bankDetails: z.object({
    accountNo: z.string().optional(),
    ifsc: z.string().optional(),
  }).optional(),
  createdAt: z.string(),
});
export type Driver = z.infer<typeof DriverSchema>;

// ─── Fare ────────────────────────────────────────────────────────────────────

export const FareSchema = z.object({
  base: z.number(),
  distance: z.number(),
  time: z.number(),
  tolls: z.number().optional(),
  total: z.number(),
  currency: z.string().default('INR'),
});
export type Fare = z.infer<typeof FareSchema>;

// ─── Booking ──────────────────────────────────────────────────────────────────

export const BookingSchema = z.object({
  _id: z.string(),
  idempotencyKey: z.string().optional(),
  customerId: z.string(),
  driverId: z.string().optional(),
  type: TripType,
  pickup: LocationSchema,
  drop: LocationSchema,
  status: BookingStatus,
  otp: z.string().optional(),
  fare: FareSchema.optional(),
  customer: UserSchema.partial().optional(),
  driver: DriverSchema.partial().optional(),
  timestamps: z.object({
    createdAt: z.string().optional(),
    assignedAt: z.string().optional(),
    startedAt: z.string().optional(),
    completedAt: z.string().optional(),
  }),
  paymentId: z.string().optional(),
  distance: z.number().optional(),
  duration: z.number().optional(),
});
export type Booking = z.infer<typeof BookingSchema>;

// ─── Rating ───────────────────────────────────────────────────────────────────

export const RatingSchema = z.object({
  _id: z.string(),
  bookingId: z.string(),
  raterId: z.string(),
  rateeId: z.string(),
  stars: z.number().min(1).max(5),
  tags: z.array(z.string()),
  comment: z.string().optional(),
  createdAt: z.string(),
});
export type Rating = z.infer<typeof RatingSchema>;

// ─── API Request/Response Types ───────────────────────────────────────────────

export const LoginRequestSchema = z.object({
  phone: z.string().min(10).max(15),
  otp: z.string().min(4).max(6),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const AdminLoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
export type AdminLoginRequest = z.infer<typeof AdminLoginRequestSchema>;

export const AuthResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: z.union([UserSchema, DriverSchema]).optional(),
  role: UserRole,
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export const CreateBookingRequestSchema = z.object({
  type: TripType,
  pickup: LocationSchema,
  drop: LocationSchema,
  vehicleId: z.string().optional(),
});
export type CreateBookingRequest = z.infer<typeof CreateBookingRequestSchema>;

export const FareEstimateRequestSchema = z.object({
  pickup: LocationSchema,
  drop: LocationSchema,
  type: TripType,
});
export type FareEstimateRequest = z.infer<typeof FareEstimateRequestSchema>;

export const RateDriverRequestSchema = z.object({
  stars: z.number().min(1).max(5),
  tags: z.array(z.string()).optional(),
  comment: z.string().optional(),
});
export type RateDriverRequest = z.infer<typeof RateDriverRequestSchema>;

// ─── Socket Event Types ───────────────────────────────────────────────────────

export interface SocketLocationUpdate {
  bookingId: string;
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

export interface SocketBookingRequest {
  booking: Booking;
  distanceKm: number;
  estimatedMinutes: number;
}

export interface SocketStatusUpdate {
  bookingId: string;
  status: BookingStatus;
  timestamp: string;
}

export interface SocketTripSync {
  booking: Booking;
  driverLocation?: { lat: number; lng: number };
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export const PaginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
  });

export type PaginatedResponse<T> = {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
};

// ─── API Error ────────────────────────────────────────────────────────────────

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  requestId?: string;
}

// ─── Valid status transitions ─────────────────────────────────────────────────

export const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  created: ['searching', 'cancelled'],
  searching: ['assigned', 'cancelled'],
  assigned: ['driver_arrived', 'cancelled'],
  driver_arrived: ['otp_verified', 'cancelled'],
  otp_verified: ['started'],
  started: ['completed'],
  completed: ['paid'],
  paid: ['closed'],
  closed: [],
  cancelled: [],
};

export function isValidTransition(from: BookingStatus, to: BookingStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}
