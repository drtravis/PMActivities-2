# Multi-stage build for production optimization
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production

# Install frontend dependencies
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy backend source
COPY backend ./backend
COPY --from=deps /app/backend/node_modules ./backend/node_modules

# Copy frontend source
COPY frontend ./frontend
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules

# Build backend
RUN cd backend && npm run build

# Build frontend
ENV NEXT_TELEMETRY_DISABLED 1
RUN cd frontend && npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy backend built application
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/backend/package.json ./backend/

# Copy frontend built application
COPY --from=builder /app/frontend/public ./frontend/public
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/standalone ./frontend/
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/static ./frontend/.next/static

# Create startup script
COPY <<EOF /app/start.sh
#!/bin/sh
# Start backend in background
cd /app/backend && node dist/main.js &
# Start frontend
cd /app/frontend && node server.js
EOF

RUN chmod +x /app/start.sh

USER nextjs

EXPOSE 3000 3001

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["/app/start.sh"]
