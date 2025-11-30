import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

export const CloudinaryProvider = {
  provide: 'CLOUDINARY',
  useFactory: (configService: ConfigService) => {
    const cloudinaryUrl = configService.get<string>('CLOUDINARY_URL');

    if (!cloudinaryUrl) {
      throw new Error('CLOUDINARY_URL is not defined in environment variables');
    }

    // Parse CLOUDINARY_URL format: cloudinary://api_key:api_secret@cloud_name
    const url = new URL(cloudinaryUrl.replace('cloudinary://', 'https://'));
    const apiKey = url.username;
    const apiSecret = url.password;
    const cloudName = url.hostname;

    return cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
  },
  inject: [ConfigService],
};
