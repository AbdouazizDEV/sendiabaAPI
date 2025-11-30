import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  Response<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => {
        // Si la réponse est déjà formatée, la retourner telle quelle
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }
        // Sinon, formater la réponse
        return {
          success: true,
          message: 'Opération réussie',
          data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
