import { v2 as cloudinary } from 'cloudinary';
import { env } from './env';
import { logger } from './logger';

if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
  logger.info('☁️ Cloudinary configured successfully');
} else {
  logger.warn('⚠️ Cloudinary credentials missing. Image uploads will fail.');
}

export { cloudinary };
