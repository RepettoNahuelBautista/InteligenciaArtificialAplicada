import { v2 as cloudinary } from 'cloudinary';
import { prisma } from '../db/client';
import { logger } from '../utils/logger';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadAvatar(userId: string, fileBuffer: Buffer): Promise<string> {
  const url = await new Promise<string>((resolve, reject) => {
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

  await prisma.userProfile.update({
    where: { userId },
    data: { avatarUrl: url },
  });

  logger.info('Avatar uploaded', { userId });
  return url;
}
