import { Router, Request, Response } from 'express';
import { requireAuth } from '../../../middleware/auth';
import { cloudinary } from '../../../config/cloudinary';
import { env } from '../../../config/env';

const router = Router();

// ─── Get Cloudinary Signature ────────────────────────────────────────────────
router.get('/signature', requireAuth, (req: Request, res: Response) => {
  if (!env.CLOUDINARY_API_SECRET || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_CLOUD_NAME) {
    res.status(500).json({ error: 'server_error', message: 'Cloudinary not configured on server' });
    return;
  }

  const timestamp = Math.round(new Date().getTime() / 1000);
  
  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp: timestamp,
    },
    env.CLOUDINARY_API_SECRET
  );

  res.json({
    signature,
    timestamp,
    apiKey: env.CLOUDINARY_API_KEY,
    cloudName: env.CLOUDINARY_CLOUD_NAME,
  });
});

export { router as uploadRouter };
