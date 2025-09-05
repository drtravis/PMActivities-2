FROM node:18-alpine

WORKDIR /app

# Install specific versions to avoid conflicts
RUN npm install express@4.18.2 mysql2@3.6.5 bcrypt@5.1.1 jsonwebtoken@9.0.2 cors@2.8.5

# Copy application code
COPY production-server.js ./

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Change ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http=require('http');const options={hostname:'localhost',port:3001,path:'/health',timeout:2000};const req=http.request(options,res=>{process.exit(res.statusCode===200?0:1)});req.on('error',()=>process.exit(1));req.end();"

# Start application
CMD ["node", "production-server.js"]
