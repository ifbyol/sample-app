# Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev && npm cache clean --force

# Copy source code
COPY src/ ./src/

# Final stage
FROM node:20-alpine

# Create app directory and user
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy from builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/package*.json ./

# Change ownership to nodejs user
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); \
    const options = { hostname: 'localhost', port: 3000, path: '/health', method: 'GET' }; \
    const req = http.request(options, (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }); \
    req.on('error', () => process.exit(1)); \
    req.end();"

# Start the application
CMD ["node", "src/index.js"]