# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN corepack enable && pnpm install --frozen-lockfile 2>/dev/null || pnpm install

COPY . .
RUN pnpm build

# Production stage
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE ${PORT:-3001}

CMD ["node", "dist/main.js"]
