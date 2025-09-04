import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../audit.service';
import { AuditAction, EntityType } from '../../entities/audit-log.entity';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { user, method, url, body, params, query } = request;
    const ipAddress = request.ip || request.connection.remoteAddress;
    const userAgent = request.get('User-Agent');

    return next.handle().pipe(
      tap((response) => {
        if (user && this.shouldAudit(method, url)) {
          const auditData = this.extractAuditData(method, url, body, params, query, response);
          
          if (auditData) {
            this.auditService.log({
              ...auditData,
              userId: user.id,
              ipAddress,
              userAgent,
            });
          }
        }
      }),
    );
  }

  private shouldAudit(method: string, url: string): boolean {
    // Skip audit for GET requests on certain endpoints
    if (method === 'GET' && (url.includes('/reports') || url.includes('/export'))) {
      return true;
    }
    
    // Audit all non-GET requests
    if (method !== 'GET') {
      return true;
    }

    // Skip audit for health checks and other non-sensitive GET requests
    return false;
  }

  private extractAuditData(
    method: string,
    url: string,
    body: any,
    params: any,
    query: any,
    response: any,
  ): any {
    // Activities
    if (url.includes('/activities')) {
      const entityType = EntityType.ACTIVITY;
      const entityId = params?.id;

      switch (method) {
        case 'POST':
          return {
            action: AuditAction.CREATE,
            entityType,
            newValues: body,
          };
        case 'PATCH':
        case 'PUT':
          if (url.includes('/submit')) {
            return { action: AuditAction.SUBMIT, entityType, entityId };
          }
          if (url.includes('/approve')) {
            return { action: AuditAction.APPROVE, entityType, entityId };
          }
          if (url.includes('/reject')) {
            return { action: AuditAction.REJECT, entityType, entityId };
          }
          return {
            action: AuditAction.UPDATE,
            entityType,
            entityId,
            newValues: body,
          };
        case 'DELETE':
          return { action: AuditAction.DELETE, entityType, entityId };
      }
    }

    // Comments
    if (url.includes('/comments')) {
      const entityType = EntityType.COMMENT;
      const entityId = params?.id;

      switch (method) {
        case 'POST':
          return {
            action: AuditAction.CREATE,
            entityType,
            newValues: body,
          };
        case 'PATCH':
        case 'PUT':
          return {
            action: AuditAction.UPDATE,
            entityType,
            entityId,
            newValues: body,
          };
        case 'DELETE':
          return { action: AuditAction.DELETE, entityType, entityId };
      }
    }

    // Reports and exports
    if (url.includes('/reports') || url.includes('/export')) {
      return {
        action: AuditAction.EXPORT,
        entityType: EntityType.ACTIVITY,
        details: { endpoint: url, filters: query },
      };
    }

    // Auth actions
    if (url.includes('/auth')) {
      if (url.includes('/login')) {
        return {
          action: AuditAction.LOGIN,
          entityType: EntityType.USER,
          details: { email: body?.email },
        };
      }
      if (url.includes('/invite')) {
        return {
          action: AuditAction.INVITE_USER,
          entityType: EntityType.USER,
          details: { invitedEmail: body?.email, role: body?.role },
        };
      }
      if (url.includes('/accept-invitation')) {
        return {
          action: AuditAction.ACCEPT_INVITATION,
          entityType: EntityType.USER,
          details: { token: body?.token },
        };
      }
    }

    return null;
  }
}
