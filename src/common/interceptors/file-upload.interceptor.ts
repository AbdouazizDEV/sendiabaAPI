import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class FileUploadInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // Si c'est une requête multipart/form-data, on garde le fichier dans request.file
    // Le fichier sera accessible via @UploadedFile() dans le controller
    return next.handle();
  }
}
