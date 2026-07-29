FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build args
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build for production
RUN npm run build

# Expose port
EXPOSE 5173

# Serve with preview mode
CMD ["npm", "run", "preview", "--", "--host", "--port", "5173"]
