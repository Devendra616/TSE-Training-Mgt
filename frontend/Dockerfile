FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build for production
RUN npm run build

# Expose port
EXPOSE 5173

# Serve with preview mode
CMD ["npm", "run", "preview", "--", "--host"]
