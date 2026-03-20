# Stage 1: Build the frontend (Vite React app)
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
# Build the Vite app into 'dist' folder
RUN npm run build


# Stage 2: Setup the production Express server
FROM node:20-alpine

WORKDIR /app

# Only install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the built frontend from Stage 1
COPY --from=builder /app/dist ./dist

# Copy the backend server files
COPY server ./server

# Expose the API and Web port
EXPOSE 3000

# Start the Express server
CMD ["node", "server/server.js"]
