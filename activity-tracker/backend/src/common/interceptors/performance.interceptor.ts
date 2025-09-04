import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PerformanceInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        // Log slow requests (> 1 second)
        if (duration > 1000) {
          this.logger.warn(
            `Slow request detected: ${method} ${url} took ${duration}ms`,
          );
        }

        // Log all requests in development
        if (process.env.NODE_ENV === 'development') {
          this.logger.log(`${method} ${url} - ${duration}ms`);
        }
      }),
    );
  }
}
