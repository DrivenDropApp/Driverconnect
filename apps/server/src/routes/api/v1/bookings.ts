import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Booking } from '../../../models/Booking';
import { Driver } from '../../../models/Driver';
import { requireAuth, requireRole } from '../../../middleware/auth';
import { validate } from '../../../middleware/validate';
import { logger } from '../../../config/logger';
import { isValidTransition } from '@driverconnect/shared-types';
import type { BookingStatus } from '../../../models/Booking';

const router = Router();

// ─── Fare Estimate ────────────────────────────────────────────────────────────

const fareEstimateSchema = z.object({
  pickup: z.object({ lat: z.number(), lng: z.number() }),
  drop: z.object({ lat: z.number(), lng: z.number() }),
  type: z.enum(['local', 'roundtrip', 'hourly', 'outstation']),
});

router.post('/fare-estimate', requireAuth, validate(fareEstimateSchema), async (req: Request, res: Response) => {
  const { pickup, drop, type } = req.body;

  // Calculate distance using Haversine formula
  const distance = haversineKm(pickup.lat, pickup.lng, drop.lat, drop.lng);
  const duration = Math.ceil(distance * 3); // rough estimate: 3 min/km

  const fare = calculateFare(distance, duration, type);

  res.json({ fare, distance: Math.round(distance * 10) / 10, duration });
});

// ─── Create Booking ───────────────────────────────────────────────────────────

const createBookingSchema = z.object({
  type: z.enum(['local', 'roundtrip', 'hourly', 'outstation']),
  pickup: z.object({ lat: z.number(), lng: z.number(), address: z.string() }),
  drop: z.object({ lat: z.number(), lng: z.number(), address: z.string() }),
});

router.post(
  '/',
  requireAuth,
  requireRole('customer'),
  validate(createBookingSchema),
  async (req: Request, res: Response) => {
    const { type, pickup, drop } = req.body;
    const customerId = req.user!.userId;

    // Idempotency key from header (client generates UUID per booking attempt)
    const idempotencyKey = (req.headers['idempotency-key'] as string) || uuidv4();

    try {
      // Check for existing booking with same idempotency key
      const existing = await Booking.findOne({ idempotencyKey });
      if (existing) {
        res.status(200).json(existing);
        return;
      }

      const distance = haversineKm(pickup.lat, pickup.lng, drop.lat, drop.lng);
      const duration = Math.ceil(distance * 3);
      const fare = calculateFare(distance, duration, type);

      const booking = await Booking.create({
        idempotencyKey,
        customerId,
        type,
        pickup,
        drop,
        status: 'created',
        fare,
        distance: Math.round(distance * 10) / 10,
        duration,
        timestamps: { createdAt: new Date() },
      });

      logger.info({ bookingId: booking._id, customerId }, 'Booking created');
      res.status(201).json(booking);
    } catch (error: any) {
      if (error.code === 11000) {
        // Race condition: key was just created
        const existing = await Booking.findOne({ idempotencyKey });
        if (existing) {
          res.status(200).json(existing);
          return;
        }
      }
      logger.error({ error }, 'Failed to create booking');
      res.status(500).json({ error: 'create_failed', message: 'Failed to create booking' });
    }
  },
);

// ─── Get Bookings (Customer: own history) ─────────────────────────────────────

router.get('/my', requireAuth, requireRole('customer'), async (req: Request, res: Response) => {
  const customerId = req.user!.userId;
  const { cursor, status, limit = '20' } = req.query;

  try {
    const query: any = { customerId };
    if (status) query.status = status;
    if (cursor) query._id = { $lt: cursor };

    const bookings = await Booking.find(query)
      .sort({ _id: -1 })
      .limit(parseInt(limit as string) + 1)
      .populate('driverId', 'name phone rating totalTrips kyc.photoUrl kyc.status');

    const hasMore = bookings.length > parseInt(limit as string);
    const items = hasMore ? bookings.slice(0, -1) : bookings;

    res.json({
      items,
      nextCursor: hasMore ? items[items.length - 1]._id : null,
      hasMore,
    });
  } catch (error) {
    res.status(500).json({ error: 'fetch_failed', message: 'Failed to fetch bookings' });
  }
});

// ─── Get Active Booking (Customer) ────────────────────────────────────────────

router.get('/active', requireAuth, requireRole('customer'), async (req: Request, res: Response) => {
  const customerId = req.user!.userId;

  try {
    const booking = await Booking.findOne({
      customerId,
      status: { $in: ['searching', 'assigned', 'driver_arrived', 'otp_verified', 'started'] },
    })
      .populate('driverId', 'name phone rating totalTrips kyc.photoUrl kyc.status location')
      .select('+otp');

    res.json({ booking: booking || null });
  } catch (error) {
    res.status(500).json({ error: 'fetch_failed', message: 'Failed to fetch active booking' });
  }
});

// ─── Get Driver's Bookings ────────────────────────────────────────────────────

router.get('/driver', requireAuth, requireRole('driver'), async (req: Request, res: Response) => {
  const driverId = req.user!.userId;
  const { cursor, status, limit = '20' } = req.query;

  try {
    const query: any = { driverId };
    if (status) query.status = status;
    if (cursor) query._id = { $lt: cursor };

    const bookings = await Booking.find(query)
      .sort({ _id: -1 })
      .limit(parseInt(limit as string) + 1)
      .populate('customerId', 'name phone rating');

    const hasMore = bookings.length > parseInt(limit as string);
    const items = hasMore ? bookings.slice(0, -1) : bookings;

    res.json({
      items,
      nextCursor: hasMore ? items[items.length - 1]._id : null,
      hasMore,
    });
  } catch (error) {
    res.status(500).json({ error: 'fetch_failed', message: 'Failed to fetch driver bookings' });
  }
});

// ─── Get Booking by ID ────────────────────────────────────────────────────────

router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customerId', 'name phone rating')
      .populate('driverId', 'name phone rating totalTrips kyc.photoUrl kyc.status');

    if (!booking) {
      res.status(404).json({ error: 'not_found', message: 'Booking not found' });
      return;
    }

    // Customers can only see their own bookings; drivers can see assigned ones OR ones searching; admins see all
    const { userId, role } = req.user!;
    if (role === 'customer' && booking.customerId.toString() !== userId) {
      res.status(403).json({ error: 'forbidden', message: 'Access denied' });
      return;
    }
    if (role === 'driver') {
      const isAssigned = booking.driverId?.toString() === userId;
      const isSearching = booking.status === 'searching';
      if (!isAssigned && !isSearching) {
        res.status(403).json({ error: 'forbidden', message: 'Access denied' });
        return;
      }
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: 'fetch_failed', message: 'Failed to fetch booking' });
  }
});

// ─── Start Searching (Customer → Searching) ────────────────────────────────────

router.post('/:id/search', requireAuth, requireRole('customer'), async (req: Request, res: Response) => {
  const { id } = req.params;
  const customerId = req.user!.userId;

  try {
    const booking = await Booking.findOne({ _id: id, customerId });
    if (!booking) {
      res.status(404).json({ error: 'not_found', message: 'Booking not found' });
      return;
    }

    if (!isValidTransition(booking.status as any, 'searching' as any)) {
      res.status(409).json({ error: 'invalid_transition', message: `Cannot move to searching from ${booking.status}` });
      return;
    }

    booking.status = 'searching';
    await booking.save();

    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: 'update_failed', message: 'Failed to update booking' });
  }
});

// ─── Driver Accept (atomic - concurrency-safe) ────────────────────────────────

router.post('/:id/accept', requireAuth, requireRole('driver'), async (req: Request, res: Response) => {
  const { id } = req.params;
  const driverId = req.user!.userId;

  try {
    // Atomic findOneAndUpdate: only succeeds if status is still 'searching'
    // This is the MongoDB equivalent of the Postgres conditional UPDATE
    const booking = await Booking.findOneAndUpdate(
      { _id: id, status: 'searching' }, // filter MUST include status check
      {
        $set: {
          status: 'assigned',
          driverId,
          'timestamps.assignedAt': new Date(),
        },
      },
      { new: true },
    ).populate('customerId', 'name phone');

    if (!booking) {
      // Another driver already accepted it
      res.status(409).json({ error: 'booking_already_assigned', message: 'This booking is no longer available' });
      return;
    }

    logger.info({ bookingId: id, driverId }, 'Booking accepted by driver');
    res.json(booking);
  } catch (error) {
    logger.error({ error }, 'Failed to accept booking');
    res.status(500).json({ error: 'accept_failed', message: 'Failed to accept booking' });
  }
});

// ─── Driver Arrive ────────────────────────────────────────────────────────────

router.post('/:id/arrive', requireAuth, requireRole('driver'), async (req: Request, res: Response) => {
  const { id } = req.params;
  const driverId = req.user!.userId;

  try {
    const booking = await Booking.findOneAndUpdate(
      { _id: id, driverId, status: 'assigned' },
      { $set: { status: 'driver_arrived' } },
      { new: true },
    );

    if (!booking) {
      res.status(409).json({ error: 'invalid_state', message: 'Cannot update booking state' });
      return;
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: 'update_failed', message: 'Failed to update booking' });
  }
});

// ─── Verify OTP (start trip) ──────────────────────────────────────────────────

const verifyOtpSchema = z.object({ otp: z.string().min(4).max(6) });

router.post('/:id/verify-otp', requireAuth, requireRole('driver'), validate(verifyOtpSchema), async (req: Request, res: Response) => {
  const { id } = req.params;
  const { otp } = req.body;
  const driverId = req.user!.userId;

  try {
    const booking = await Booking.findOne({ _id: id, driverId, status: 'driver_arrived' }).select('+otp');

    if (!booking) {
      res.status(404).json({ error: 'not_found', message: 'Booking not found or wrong state' });
      return;
    }

    // Compare OTP
    const isValid = otp === booking.otp; // stored as plain text OTP for demo; use bcrypt in production
    if (!isValid) {
      res.status(401).json({ error: 'invalid_otp', message: 'Invalid OTP' });
      return;
    }

    booking.status = 'otp_verified';
    await booking.save();

    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: 'verify_failed', message: 'OTP verification failed' });
  }
});

// ─── Start Trip ───────────────────────────────────────────────────────────────

router.post('/:id/start', requireAuth, requireRole('driver'), async (req: Request, res: Response) => {
  const { id } = req.params;
  const driverId = req.user!.userId;

  try {
    const booking = await Booking.findOneAndUpdate(
      { _id: id, driverId, status: 'otp_verified' },
      { $set: { status: 'started', 'timestamps.startedAt': new Date() } },
      { new: true },
    );

    if (!booking) {
      res.status(409).json({ error: 'invalid_state', message: 'Cannot start trip' });
      return;
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: 'update_failed', message: 'Failed to start trip' });
  }
});

// ─── Complete Trip ────────────────────────────────────────────────────────────

router.post('/:id/complete', requireAuth, requireRole('driver'), async (req: Request, res: Response) => {
  const { id } = req.params;
  const driverId = req.user!.userId;

  try {
    const booking = await Booking.findOneAndUpdate(
      { _id: id, driverId, status: 'started' },
      {
        $set: {
          status: 'completed',
          'timestamps.completedAt': new Date(),
          'fare.final': (booking: any) => booking?.fare?.total,
        },
      },
      { new: true },
    );

    if (!booking) {
      res.status(409).json({ error: 'invalid_state', message: 'Cannot complete trip' });
      return;
    }

    // Increment driver trip count
    await Driver.findByIdAndUpdate(driverId, { $inc: { totalTrips: 1 } });

    logger.info({ bookingId: id, driverId }, 'Trip completed');
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: 'update_failed', message: 'Failed to complete trip' });
  }
});

// ─── Cancel Booking ───────────────────────────────────────────────────────────

router.post('/:id/cancel', requireAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId, role } = req.user!;

  try {
    const booking = await Booking.findById(id);

    if (!booking) {
      res.status(404).json({ error: 'not_found', message: 'Booking not found' });
      return;
    }

    // Auth check
    if (role === 'customer' && booking.customerId.toString() !== userId) {
      res.status(403).json({ error: 'forbidden', message: 'Access denied' });
      return;
    }

    const cancellableStatuses: BookingStatus[] = ['created', 'searching', 'assigned'];
    if (!cancellableStatuses.includes(booking.status)) {
      res.status(409).json({ error: 'cannot_cancel', message: 'Trip cannot be cancelled at this stage' });
      return;
    }

    booking.status = 'cancelled';
    await booking.save();

    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: 'cancel_failed', message: 'Failed to cancel booking' });
  }
});

// ─── Rate Booking ─────────────────────────────────────────────────────────────

const rateSchema = z.object({
  stars: z.number().min(1).max(5),
  tags: z.array(z.string()).optional(),
  comment: z.string().max(500).optional(),
});

router.post('/:id/rate', requireAuth, requireRole('customer'), validate(rateSchema), async (req: Request, res: Response) => {
  const { id } = req.params;
  const { stars, tags = [], comment } = req.body;
  const raterId = req.user!.userId;

  try {
    const { Rating } = await import('../../../models/Rating');
    const booking = await Booking.findById(id).populate('driverId', '_id');

    if (!booking || booking.status !== 'completed') {
      res.status(400).json({ error: 'invalid_state', message: 'Can only rate completed trips' });
      return;
    }

    if (booking.customerId.toString() !== raterId) {
      res.status(403).json({ error: 'forbidden', message: 'Access denied' });
      return;
    }

    const rating = await Rating.create({
      bookingId: id,
      raterId,
      rateeId: booking.driverId,
      stars,
      tags,
      comment,
    });

    // Update driver average rating
    const ratings = await Rating.find({ rateeId: booking.driverId });
    const avg = ratings.reduce((sum: number, r: any) => sum + r.stars, 0) / ratings.length;
    await Driver.findByIdAndUpdate(booking.driverId, { rating: Math.round(avg * 10) / 10, totalRatings: ratings.length });

    res.status(201).json(rating);
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).json({ error: 'already_rated', message: 'You have already rated this trip' });
      return;
    }
    res.status(500).json({ error: 'rate_failed', message: 'Failed to submit rating' });
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateFare(
  distanceKm: number,
  durationMin: number,
  type: string,
): { base: number; distance: number; time: number; tolls: number; total: number; currency: string } {
  const rates: Record<string, { base: number; perKm: number; perMin: number }> = {
    local: { base: 50, perKm: 14, perMin: 1.5 },
    roundtrip: { base: 80, perKm: 12, perMin: 1.2 },
    hourly: { base: 150, perKm: 10, perMin: 2 },
    outstation: { base: 200, perKm: 18, perMin: 2 },
  };

  const rate = rates[type] || rates.local;
  const base = rate.base;
  const distance = Math.round(distanceKm * rate.perKm);
  const time = Math.round(durationMin * rate.perMin);
  const tolls = 0;
  const total = base + distance + time + tolls;

  return { base, distance, time, tolls, total, currency: 'INR' };
}

export { router as bookingsRouter };
