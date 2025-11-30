import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

export interface UploadImageOptions {
  folder?: string;
  transformation?: any[];
  publicId?: string;
}

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  async uploadImage(
    file: Express.Multer.File,
    options: UploadImageOptions = {},
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadOptions: any = {
        folder: options.folder || 'sendiaba',
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        transformation: [
          {
            width: 1000,
            height: 1000,
            crop: 'limit',
            quality: 'auto',
            fetch_format: 'auto',
          },
          ...(options.transformation || []),
        ],
      };

      if (options.publicId) {
        uploadOptions.public_id = options.publicId;
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (
          error: UploadApiErrorResponse | undefined,
          result: UploadApiResponse | undefined,
        ) => {
          if (error) {
            this.logger.error("Erreur lors de l'upload Cloudinary:", error);
            reject(
              new BadRequestException(
                `Erreur lors de l'upload de l'image: ${error.message}`,
              ),
            );
            return;
          }

          if (!result) {
            reject(
              new BadRequestException('Aucun résultat retourné par Cloudinary'),
            );
            return;
          }

          this.logger.log(`Image uploadée avec succès: ${result.secure_url}`);
          resolve(result.secure_url);
        },
      );

      uploadStream.end(file.buffer);
    });
  }

  async uploadProfilePicture(
    file: Express.Multer.File,
    userId: string,
  ): Promise<string> {
    return this.uploadImage(file, {
      folder: 'sendiaba/profiles',
      publicId: `profile_${userId}`,
      transformation: [
        {
          width: 400,
          height: 400,
          crop: 'fill',
          gravity: 'face',
          quality: 'auto',
          fetch_format: 'auto',
        },
      ],
    });
  }

  async deleteImage(publicId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
          this.logger.error('Erreur lors de la suppression Cloudinary:', error);
          reject(
            new BadRequestException(
              `Erreur lors de la suppression de l'image: ${error.message}`,
            ),
          );
          return;
        }

        if (result.result === 'ok') {
          this.logger.log(`Image supprimée avec succès: ${publicId}`);
          resolve();
        } else {
          this.logger.warn(`Image non trouvée ou déjà supprimée: ${publicId}`);
          resolve(); // On considère que c'est OK si l'image n'existe pas
        }
      });
    });
  }

  async deleteProfilePicture(userId: string): Promise<void> {
    const publicId = `sendiaba/profiles/profile_${userId}`;
    return this.deleteImage(publicId);
  }

  extractPublicIdFromUrl(url: string): string | null {
    try {
      const matches = url.match(/\/v\d+\/(.+)\.(jpg|jpeg|png|webp|gif)/i);
      if (matches && matches[1]) {
        return matches[1];
      }
      return null;
    } catch (error) {
      this.logger.warn(`Impossible d'extraire le public_id de l'URL: ${url}`);
      return null;
    }
  }
}
