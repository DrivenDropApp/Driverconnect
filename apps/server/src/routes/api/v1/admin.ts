import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Driver } from '../../../models/Driver';
import { User } from '../../../models/User';
import { Booking } from '../../../models/Booking';
import { requireAuth, requireRole } from '../../../middleware/auth';
import { validate } from '../../../middleware/validate';
import { logger } from '../../../config/logger';

const router = Router();

// All admin routes require auth + admin role
router.use(requireAuth, requireRole('admin'));

// ─── Dashboard KPIs ───────────────────────────────────────────────────────────

router.get('/dashboard', async (_req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalDrivers,
      verifiedDrivers,
      onlineDrivers,
      pendingKyc,
      totalCustomers,
      activeBookings,
      todayBookings,
    ] = await Promise.all([
      Driver.countDocuments(),
      Driver.countDocuments({ 'kyc.status': 'verified' }),
      Driver.countDocuments({ isOnline: true }),
      Driver.countDocuments({ 'kyc.status': 'pending' }),
      User.countDocuments(),
      Booking.countDocuments({ status: { $in: ['searching', 'assigned', 'driver_arrived', 'otp_verified', 'started'] } }),
      Booking.countDocuments({ createdAt: { $gte: today } }),
    ]);

    const todayRevenue = await Booking.aggregate([
      { $match: { status: { $in: ['completed', 'paid', 'closed'] }, createdAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$fare.total' } } },
    ]);
    const cancelledToday = await Booking.countDocuments({ status: 'cancelled', createdAt: { $gte: today } });

    // Return flat shape that the frontend DashboardPage reads directly
    res.json({
      totalDrivers,
      verifiedDrivers,
      onlineDrivers,
      pendingKyc,
      totalCustomers,
      activeBookings,
      todayBookings,
      todayRevenue: todayRevenue[0]?.total || 0,
      cancelledToday,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to fetch dashboard');
    res.status(500).json({ error: 'fetch_failed', message: 'Failed to fetch dashboard stats' });
  }
});

// ─── KYC Queue ────────────────────────────────────────────────────────────────

router.get('/kyc', async (req: Request, res: Response) => {
  const { status = 'pending', cursor, limit = '20' } = req.query;

  try {
    const query: any = { 'kyc.status': status };
    if (cursor) query._id = { $lt: cursor };

    const drivers = await Driver.find(query)
      .sort({ _id: -1 })
      .limit(parseInt(limit as string) + 1)
      .select('name phone kyc createdAt');

    const hasMore = drivers.length > parseInt(limit as string);
    const items = hasMore ? drivers.slice(0, -1) : drivers;

    res.json({ items, nextCursor: hasMore ? items[items.length - 1]._id : null, hasMore });
  } catch (error) {
    res.status(500).json({ error: 'fetch_failed', message: 'Failed to fetch KYC queue' });
  }
});

// ─── Approve/Reject KYC ───────────────────────────────────────────────────────

const kycDecisionSchema = z.object({
  status: z.enum(['verified', 'rejected']),
  rejectionReason: z.string().optional(),
});

router.post('/kyc/:driverId/decision', validate(kycDecisionSchema), async (req: Request, res: Response) => {
  const { driverId } = req.params;
  const { status, rejectionReason } = req.body;

  try {
    const driver = await Driver.findByIdAndUpdate(
      driverId,
      {
        $set: {
          'kyc.status': status,
          ...(rejectionReason && { 'kyc.rejectionReason': rejectionReason }),
        },
      },
      { new: true },
    );

    if (!driver) {
      res.status(404).json({ error: 'not_found', message: 'Driver not found' });
      return;
    }

    logger.info({ driverId, status, adminId: req.user!.userId }, 'KYC decision made');
    res.json({ message: `KYC ${status} successfully`, driver });
  } catch (error) {
    res.status(500).json({ error: 'update_failed', message: 'Failed to update KYC status' });
  }
});

// ─── All Bookings (with filters + pagination) ─────────────────────────────────

router.get('/bookings', async (req: Request, res: Response) => {
  const { status, cursor, limit = '50', search } = req.query;

  try {
    const query: any = {};
    if (status) query.status = status;
    if (cursor) query._id = { $lt: cursor };

    let bookingsQuery = Booking.find(query)
      .sort({ _id: -1 })
      .limit(parseInt(limit as string) + 1)
      .populate('customerId', 'name phone')
      .populate('driverId', 'name phone');

    const bookings = await bookingsQuery;
    const hasMore = bookings.length > parseInt(limit as string);
    const items = hasMore ? bookings.slice(0, -1) : bookings;

    res.json({ items, nextCursor: hasMore ? items[items.length - 1]._id : null, hasMore });
  } catch (error) {
    res.status(500).json({ error: 'fetch_failed', message: 'Failed to fetch bookings' });
  }
});

// ─── Manage Drivers ───────────────────────────────────────────────────────────

router.get('/drivers', async (req: Request, res: Response) => {
  const { cursor, limit = '20', kycStatus, isOnline } = req.query;

  try {
    const query: any = {};
    if (kycStatus) query['kyc.status'] = kycStatus;
    if (isOnline !== undefined) query.isOnline = isOnline === 'true';
    if (cursor) query._id = { $lt: cursor };

    const drivers = await Driver.find(query)
      .sort({ _id: -1 })
      .limit(parseInt(limit as string) + 1)
      .select('-bankDetails');

    const hasMore = drivers.length > parseInt(limit as string);
    const items = hasMore ? drivers.slice(0, -1) : drivers;

    res.json({ items, nextCursor: hasMore ? items[items.length - 1]._id : null, hasMore });
  } catch (error) {
    res.status(500).json({ error: 'fetch_failed', message: 'Failed to fetch drivers' });
  }
});

// ─── Suspend/Unsuspend Driver ─────────────────────────────────────────────────

router.post('/drivers/:driverId/suspend', async (req: Request, res: Response) => {
  const { driverId } = req.params;

  try {
    const driver = await Driver.findByIdAndUpdate(
      driverId,
      { isOnline: false, 'kyc.status': 'rejected', 'kyc.rejectionReason': 'Account suspended by admin' },
      { new: true },
    );

    if (!driver) {
      res.status(404).json({ error: 'not_found', message: 'Driver not found' });
      return;
    }

    logger.info({ driverId, adminId: req.user!.userId }, 'Driver suspended');
    res.json({ message: 'Driver suspended', driver });
  } catch (error) {
    res.status(500).json({ error: 'update_failed', message: 'Failed to suspend driver' });
  }
});

// ─── All Customers ────────────────────────────────────────────────────────────

router.get('/customers', async (req: Request, res: Response) => {
  const { cursor, limit = '20' } = req.query;

  try {
    const query: any = {};
    if (cursor) query._id = { $lt: cursor };

    const customers = await User.find(query)
      .sort({ _id: -1 })
      .limit(parseInt(limit as string) + 1)
      .select('-otp -otpExpiresAt -refreshToken -passwordHash');

    const hasMore = customers.length > parseInt(limit as string);
    const items = hasMore ? customers.slice(0, -1) : customers;

    res.json({ items, nextCursor: hasMore ? items[items.length - 1]._id : null, hasMore });
  } catch (error) {
    res.status(500).json({ error: 'fetch_failed', message: 'Failed to fetch customers' });
  }
});

export { router as adminRouter };
