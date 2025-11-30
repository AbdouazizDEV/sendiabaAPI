import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class FileValidationPipe implements PipeTransform {
  private readonly maxSize = 5 * 1024 * 1024; // 5MB
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ];

  transform(file: Express.Multer.File): Express.Multer.File {
    if (!file) {
      return file; // Fichier optionnel
    }

    // Vérifier le type MIME
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Type de fichier non autorisé. Types acceptés: ${this.allowedMimeTypes.join(', ')}`,
      );
    }

    // Vérifier la taille
    if (file.size > this.maxSize) {
      throw new BadRequestException(
        `Fichier trop volumineux. Taille maximale: ${this.maxSize / 1024 / 1024}MB`,
      );
    }

    return file;
  }
}
