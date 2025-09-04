import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CACHE_KEY, CACHE_TTL_KEY } from '../decorators/cache.decorator';

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private cache = new Map<string, CacheEntry>();

  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const cacheKey = this.reflector.get<string>(CACHE_KEY, context.getHandler());
    const cacheTTL = this.reflector.get<number>(CACHE_TTL_KEY, context.getHandler()) || 300;

    if (!cacheKey) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const fullCacheKey = this.generateCacheKey(cacheKey, request);

    // Check if cached data exists and is still valid
    const cachedEntry = this.cache.get(fullCacheKey);
    if (cachedEntry && this.isValidCache(cachedEntry)) {
      return of(cachedEntry.data);
    }

    return next.handle().pipe(
      tap((response) => {
        // Cache the response
        this.cache.set(fullCacheKey, {
          data: response,
          timestamp: Date.now(),
          ttl: cacheTTL * 1000, // Convert to milliseconds
        });

        // Clean up expired entries periodically
        this.cleanupExpiredEntries();
      }),
    );
  }

  private generateCacheKey(baseKey: string, request: any): string {
    const { user, query, params } = request;
    const keyParts = [
      baseKey,
      user?.organizationId || 'no-org',
      user?.id || 'no-user',
      JSON.stringify(query || {}),
      JSON.stringify(params || {}),
    ];
    return keyParts.join(':');
  }

  private isValidCache(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  private cleanupExpiredEntries(): void {
    // Only cleanup occasionally to avoid performance impact
    if (Math.random() > 0.1) return;

    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  clearCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}
