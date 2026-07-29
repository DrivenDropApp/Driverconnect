import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { User } from '../../../models/User';
import { requireAuth, requireRole } from '../../../middleware/auth';
import { validate } from '../../../middleware/validate';

const router = Router();

// ─── Get Customer Profile ─────────────────────────────────────────────────────

router.get('/profile', requireAuth, requireRole('customer'), async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user!.userId);
    if (!user) {
      res.status(404).json({ error: 'not_found', message: 'User not found' });
      return;
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'fetch_failed', message: 'Failed to fetch profile' });
  }
});

// ─── Update Customer Profile ──────────────────────────────────────────────────

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
});

router.put('/profile', requireAuth, requireRole('customer'), validate(updateProfileSchema), async (req: Request, res: Response) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user!.userId,
      { $set: req.body },
      { new: true, runValidators: true },
    );
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'update_failed', message: 'Failed to update profile' });
  }
});

// ─── Add Address ──────────────────────────────────────────────────────────────

const addressSchema = z.object({
  label: z.string().min(1).max(50),
  lat: z.number(),
  lng: z.number(),
  address: z.string().min(5).max(200),
});

router.post('/addresses', requireAuth, requireRole('customer'), validate(addressSchema), async (req: Request, res: Response) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user!.userId,
      { $push: { addresses: req.body } },
      { new: true },
    );
    res.json(user!.addresses);
  } catch (error) {
    res.status(500).json({ error: 'update_failed', message: 'Failed to add address' });
  }
});

router.delete('/addresses/:addressId', requireAuth, requireRole('customer'), async (req: Request, res: Response) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user!.userId,
      { $pull: { addresses: { _id: req.params.addressId } } },
      { new: true },
    );
    res.json(user!.addresses);
  } catch (error) {
    res.status(500).json({ error: 'delete_failed', message: 'Failed to delete address' });
  }
});

// ─── Add Vehicle ──────────────────────────────────────────────────────────────

const vehicleSchema = z.object({
  make: z.string().min(2).max(50),
  model: z.string().min(1).max(50),
  transmission: z.enum(['manual', 'automatic']),
  year: z.number().min(1990).max(new Date().getFullYear() + 1).optional(),
});

router.post('/vehicles', requireAuth, requireRole('customer'), validate(vehicleSchema), async (req: Request, res: Response) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user!.userId,
      { $push: { vehicles: req.body } },
      { new: true },
    );
    res.json(user!.vehicles);
  } catch (error) {
    res.status(500).json({ error: 'update_failed', message: 'Failed to add vehicle' });
  }
});

export { router as customersRouter };
