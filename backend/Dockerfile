FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Create upload directories
RUN mkdir -p uploads/photos uploads/signatures uploads/certificates logs

# Set environment
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "dist/app.js"]
