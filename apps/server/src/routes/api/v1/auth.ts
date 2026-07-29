import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User } from '../../../models/User';
import { Driver } from '../../../models/Driver';
import { Admin } from '../../../models/Admin';
import { validate } from '../../../middleware/validate';
import { requireAuth, generateAccessToken, generateRefreshToken } from '../../../middleware/auth';
import { authLimiter, otpLimiter } from '../../../middleware/rateLimiter';
import { env } from '../../../config/env';
import { logger } from '../../../config/logger';
import jwt from 'jsonwebtoken';

const router = Router();

// ─── OTP Send ────────────────────────────────────────────────────────────────

const sendOtpSchema = z.object({
  phone: z.string().min(10).max(15),
  role: z.enum(['customer', 'driver']),
});

router.post('/otp/send', otpLimiter, validate(sendOtpSchema), async (req: Request, res: Response) => {
  const { phone, role } = req.body;

  try {
    const otp = env.DEV_OTP_ENABLED ? env.DEV_OTP : Math.floor(100000 + Math.random() * 900000).toString();

    if (role === 'customer') {
      let user = await User.findOne({ phone }).select('+otp +otpExpiresAt');
      if (!user) {
        user = new User({ phone, name: 'New User', role: 'customer' });
      }
      await (user as any).setOtp(otp);
      await user.save();
    } else {
      let driver = await Driver.findOne({ phone }).select('+otp +otpExpiresAt');
      if (!driver) {
        driver = new Driver({ phone, name: 'New Driver', role: 'driver' });
      }
      await (driver as any).setOtp(otp);
      await driver.save();
    }

    logger.info({ phone, role }, 'OTP sent');

    // In production, send via SMS (Twilio). In dev, return in response.
    res.json({
      message: 'OTP sent successfully',
      ...(env.DEV_OTP_ENABLED && { devOtp: otp }), // only exposed in dev mode
    });
  } catch (error) {
    logger.error({ error }, 'Failed to send OTP');
    res.status(500).json({ error: 'otp_failed', message: 'Failed to send OTP' });
  }
});

// ─── Customer Login ───────────────────────────────────────────────────────────

const loginSchema = z.object({
  phone: z.string().min(10).max(15),
  otp: z.string().min(4).max(6),
});

router.post('/customer/login', authLimiter, validate(loginSchema), async (req: Request, res: Response) => {
  const { phone, otp } = req.body;

  try {
    const user = await User.findOne({ phone }).select('+otp +otpExpiresAt +refreshToken');

    if (!user) {
      res.status(401).json({ error: 'not_found', message: 'No account found with this phone number' });
      return;
    }

    const otpValid = await (user as any).compareOtp(otp);
    if (!otpValid) {
      res.status(401).json({ error: 'invalid_otp', message: 'Invalid or expired OTP' });
      return;
    }

    if (user.otpExpiresAt && user.otpExpiresAt < new Date()) {
      res.status(401).json({ error: 'otp_expired', message: 'OTP has expired. Please request a new one.' });
      return;
    }

    const accessToken = generateAccessToken(user._id.toString(), 'customer');
    const refreshToken = generateRefreshToken(user._id.toString(), 'customer');

    user.otp = undefined;
    user.otpExpiresAt = undefined;
    user.refreshToken = refreshToken;
    await user.save();

    const userObj = user.toObject() as any;
    delete userObj.otp;
    delete userObj.otpExpiresAt;
    delete userObj.refreshToken;

    res.json({ accessToken, refreshToken, user: userObj, role: 'customer' });
  } catch (error) {
    logger.error({ error }, 'Customer login failed');
    res.status(500).json({ error: 'login_failed', message: 'Login failed' });
  }
});

// ─── Driver Login ─────────────────────────────────────────────────────────────

router.post('/driver/login', authLimiter, validate(loginSchema), async (req: Request, res: Response) => {
  const { phone, otp } = req.body;

  try {
    const driver = await Driver.findOne({ phone }).select('+otp +otpExpiresAt +refreshToken');

    if (!driver) {
      res.status(401).json({ error: 'not_found', message: 'No account found with this phone number' });
      return;
    }

    const otpValid = await (driver as any).compareOtp(otp);
    if (!otpValid) {
      res.status(401).json({ error: 'invalid_otp', message: 'Invalid or expired OTP' });
      return;
    }

    if (driver.otpExpiresAt && driver.otpExpiresAt < new Date()) {
      res.status(401).json({ error: 'otp_expired', message: 'OTP has expired. Please request a new one.' });
      return;
    }

    const accessToken = generateAccessToken(driver._id.toString(), 'driver');
    const refreshToken = generateRefreshToken(driver._id.toString(), 'driver');

    driver.otp = undefined;
    driver.otpExpiresAt = undefined;
    driver.refreshToken = refreshToken;
    await driver.save();

    const driverObj = driver.toObject() as any;
    delete driverObj.otp;
    delete driverObj.otpExpiresAt;
    delete driverObj.refreshToken;

    res.json({ accessToken, refreshToken, driver: driverObj, role: 'driver' });
  } catch (error) {
    logger.error({ error }, 'Driver login failed');
    res.status(500).json({ error: 'login_failed', message: 'Login failed' });
  }
});

// ─── Admin Login ──────────────────────────────────────────────────────────────

const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post('/admin/login', authLimiter, validate(adminLoginSchema), async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email }).select('+passwordHash +refreshToken');

    if (!admin) {
      res.status(401).json({ error: 'invalid_credentials', message: 'Invalid email or password' });
      return;
    }

    const passwordValid = await (admin as any).comparePassword(password);
    if (!passwordValid) {
      res.status(401).json({ error: 'invalid_credentials', message: 'Invalid email or password' });
      return;
    }

    const accessToken = generateAccessToken(admin._id.toString(), 'admin');
    const refreshToken = generateRefreshToken(admin._id.toString(), 'admin');

    admin.refreshToken = refreshToken;
    await admin.save();

    const adminObj = admin.toObject() as any;
    delete adminObj.passwordHash;
    delete adminObj.refreshToken;

    res.json({ accessToken, refreshToken, admin: adminObj, role: 'admin' });
  } catch (error) {
    logger.error({ error }, 'Admin login failed');
    res.status(500).json({ error: 'login_failed', message: 'Login failed' });
  }
});

// ─── Token Refresh ────────────────────────────────────────────────────────────

const refreshSchema = z.object({
  refreshToken: z.string(),
});

router.post('/refresh', validate(refreshSchema), async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  try {
    const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as any;

    let entity;
    if (payload.role === 'customer') {
      entity = await User.findById(payload.userId).select('+refreshToken');
    } else if (payload.role === 'driver') {
      entity = await Driver.findById(payload.userId).select('+refreshToken');
    } else if (payload.role === 'admin') {
      entity = await Admin.findById(payload.userId).select('+refreshToken');
    }

    if (!entity || (entity as any).refreshToken !== refreshToken) {
      res.status(401).json({ error: 'invalid_refresh_token', message: 'Invalid refresh token' });
      return;
    }

    const newAccessToken = generateAccessToken(payload.userId, payload.role);
    const newRefreshToken = generateRefreshToken(payload.userId, payload.role);

    (entity as any).refreshToken = newRefreshToken;
    await entity.save();

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch {
    res.status(401).json({ error: 'invalid_refresh_token', message: 'Invalid or expired refresh token' });
  }
});

// ─── Logout ───────────────────────────────────────────────────────────────────

router.post('/logout', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.user!;

    let entity;
    if (role === 'customer') {
      entity = await User.findById(userId);
    } else if (role === 'driver') {
      entity = await Driver.findById(userId);
      if (entity) {
        (entity as any).isOnline = false; // Go offline on logout
      }
    } else if (role === 'admin') {
      entity = await Admin.findById(userId);
    }

    if (entity) {
      (entity as any).refreshToken = undefined;
      await entity.save();
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error({ error }, 'Logout failed');
    res.status(500).json({ error: 'logout_failed', message: 'Logout failed' });
  }
});

// ─── Get Current User ─────────────────────────────────────────────────────────

router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.user!;

    let entity;
    if (role === 'customer') {
      entity = await User.findById(userId);
    } else if (role === 'driver') {
      entity = await Driver.findById(userId);
    } else if (role === 'admin') {
      entity = await Admin.findById(userId);
    }

    if (!entity) {
      res.status(404).json({ error: 'not_found', message: 'User not found' });
      return;
    }

    res.json({ user: entity, role });
  } catch (error) {
    res.status(500).json({ error: 'fetch_failed', message: 'Failed to fetch user' });
  }
});

export { router as authRouter };
