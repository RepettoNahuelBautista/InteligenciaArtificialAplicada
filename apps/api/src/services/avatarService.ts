import { v2 as cloudinary } from 'cloudinary';
import { prisma } from '../db/client';
import { logger } from '../utils/logger';

const hasCloudinary =
  !!process.env.CLOUDINARY_CLOUD_NAME &&
  !!process.env.CLOUDINARY_API_KEY &&
  !!process.env.CLOUDINARY_API_SECRET;

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export async function uploadAvatar(userId: string, fileBuffer: Buffer, mimeType = 'image/jpeg'): Promise<string> {
  let url: string;

  if (hasCloudinary) {
    url = await new Promise<string>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'avatars',
          public_id: `user_${userId}`,
          overwrite: true,
          transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
          format: 'webp',
        },
        (error, result) => {
          if (error || !result) reject(error ?? new Error('Upload failed'));
          else resolve(result.secure_url);
        }
      ).end(fileBuffer);
    });
  } else {
    // No Cloudinary configured — store as base64 data URL
    url = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
    logger.warn('Cloudinary not configured, storing avatar as base64 in DB');
  }

  await prisma.userProfile.update({
    where: { userId },
    data: { avatarUrl: url },
  });

  logger.info('Avatar uploaded', { userId, method: hasCloudinary ? 'cloudinary' : 'base64' });
  return url;
}
