# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
RUN npx prisma generate 2>/dev/null || true
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE ${PORT:-3005}

CMD ["node", "dist/main.js"]
