import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Driver } from '../../../models/Driver';
import { Booking } from '../../../models/Booking';
import { requireAuth, requireRole } from '../../../middleware/auth';
import { validate } from '../../../middleware/validate';
import { logger } from '../../../config/logger';

const router = Router();

// ─── Get Driver Profile ───────────────────────────────────────────────────────

router.get('/profile', requireAuth, requireRole('driver'), async (req: Request, res: Response) => {
  try {
    const driver = await Driver.findById(req.user!.userId);
    if (!driver) {
      res.status(404).json({ error: 'not_found', message: 'Driver not found' });
      return;
    }
    res.json(driver);
  } catch (error) {
    res.status(500).json({ error: 'fetch_failed', message: 'Failed to fetch profile' });
  }
});

// ─── Update Driver Profile ────────────────────────────────────────────────────

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  vehicleSkills: z.array(z.string()).optional(),
});

router.put('/profile', requireAuth, requireRole('driver'), validate(updateProfileSchema), async (req: Request, res: Response) => {
  try {
    const driver = await Driver.findByIdAndUpdate(
      req.user!.userId,
      { $set: req.body },
      { new: true, runValidators: true },
    );
    res.json(driver);
  } catch (error) {
    res.status(500).json({ error: 'update_failed', message: 'Failed to update profile' });
  }
});

// ─── Toggle Online Status ─────────────────────────────────────────────────────

const toggleOnlineSchema = z.object({
  isOnline: z.boolean(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
});

router.post('/toggle-online', requireAuth, requireRole('driver'), validate(toggleOnlineSchema), async (req: Request, res: Response) => {
  const { isOnline, location } = req.body;
  const driverId = req.user!.userId;

  try {
    const driver = await Driver.findById(driverId);

    if (!driver) {
      res.status(404).json({ error: 'not_found', message: 'Driver not found' });
      return;
    }

    // Can only go online if KYC is verified
    if (isOnline && driver.kyc.status !== 'verified') {
      res.status(403).json({
        error: 'kyc_not_verified',
        message: 'Your KYC verification is pending. You cannot go online until verified.',
      });
      return;
    }

    const update: any = { isOnline };
    if (location) {
      update.location = { type: 'Point', coordinates: [location.lng, location.lat] };
    }

    const updated = await Driver.findByIdAndUpdate(driverId, update, { new: true });

    logger.info({ driverId, isOnline }, 'Driver online status toggled');
    res.json({ isOnline: updated!.isOnline, location: updated!.location });
  } catch (error) {
    res.status(500).json({ error: 'update_failed', message: 'Failed to update online status' });
  }
});

// ─── Update Driver Location ───────────────────────────────────────────────────

const locationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

router.post('/location', requireAuth, requireRole('driver'), validate(locationSchema), async (req: Request, res: Response) => {
  const { lat, lng } = req.body;
  const driverId = req.user!.userId;

  try {
    await Driver.findByIdAndUpdate(driverId, {
      location: { type: 'Point', coordinates: [lng, lat] },
    });
    res.json({ updated: true });
  } catch (error) {
    res.status(500).json({ error: 'update_failed', message: 'Failed to update location' });
  }
});

// ─── Update KYC Documents ─────────────────────────────────────────────────────

const kycSchema = z.object({
  licenseUrl: z.string().url().optional(),
  aadhaarUrl: z.string().url().optional(),
  photoUrl: z.string().url().optional(),
});

router.put('/kyc', requireAuth, requireRole('driver'), validate(kycSchema), async (req: Request, res: Response) => {
  const driverId = req.user!.userId;

  try {
    const driver = await Driver.findById(driverId);
    if (!driver) {
      res.status(404).json({ error: 'not_found', message: 'Driver not found' });
      return;
    }

    // Cannot resubmit if already verified
    if (driver.kyc.status === 'verified') {
      res.status(409).json({ error: 'already_verified', message: 'KYC is already verified' });
      return;
    }

    Object.assign(driver.kyc, req.body, { status: 'pending' });
    await driver.save();

    res.json({ message: 'KYC documents submitted successfully', kyc: driver.kyc });
  } catch (error) {
    res.status(500).json({ error: 'kyc_failed', message: 'Failed to update KYC' });
  }
});

// ─── Update Bank Details ──────────────────────────────────────────────────────

const bankDetailsSchema = z.object({
  accountNo: z.string().min(9).max(18),
  ifsc: z.string().length(11).regex(/^[A-Z]{4}0[A-Z0-9]{6}$/),
});

router.put('/bank-details', requireAuth, requireRole('driver'), validate(bankDetailsSchema), async (req: Request, res: Response) => {
  const driverId = req.user!.userId;

  try {
    await Driver.findByIdAndUpdate(driverId, {
      'bankDetails.accountNo': req.body.accountNo,
      'bankDetails.ifsc': req.body.ifsc,
    });
    res.json({ message: 'Bank details updated' });
  } catch (error) {
    res.status(500).json({ error: 'update_failed', message: 'Failed to update bank details' });
  }
});

// ─── Driver Earnings ──────────────────────────────────────────────────────────

router.get('/earnings', requireAuth, requireRole('driver'), async (req: Request, res: Response) => {
  const driverId = req.user!.userId;
  const { period = 'today' } = req.query;

  try {
    let startDate = new Date();
    if (period === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
    }

    const completedTrips = await Booking.find({
      driverId,
      status: { $in: ['completed', 'paid', 'closed'] },
      createdAt: { $gte: startDate },
    });

    const totalEarnings = completedTrips.reduce((sum, b) => sum + (b.fare?.total || 0), 0);
    const tripCount = completedTrips.length;

    res.json({ totalEarnings, tripCount, period, trips: completedTrips });
  } catch (error) {
    res.status(500).json({ error: 'fetch_failed', message: 'Failed to fetch earnings' });
  }
});

// ─── Get Active Trip ──────────────────────────────────────────────────────────

router.get('/active-trip', requireAuth, requireRole('driver'), async (req: Request, res: Response) => {
  const driverId = req.user!.userId;

  try {
    const booking = await Booking.findOne({
      driverId,
      status: { $in: ['assigned', 'driver_arrived', 'otp_verified', 'started'] },
    }).populate('customerId', 'name phone rating');

    res.json({ booking: booking || null });
  } catch (error) {
    res.status(500).json({ error: 'fetch_failed', message: 'Failed to fetch active trip' });
  }
});

export { router as driversRouter };
