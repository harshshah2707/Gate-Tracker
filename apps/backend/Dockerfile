FROM node:20-alpine AS builder

RUN apk add --no-cache openssl libc6-compat

WORKDIR /usr/src/app

# Copy workspace manifests
COPY package*.json ./
COPY apps/shared/package*.json ./apps/shared/
COPY apps/backend/package*.json ./apps/backend/

# Install deps
RUN npm ci

# Copy source
COPY apps/shared ./apps/shared
COPY apps/backend ./apps/backend

# Build shared lib
RUN npm run build --workspace=apps/shared

# Generate Prisma client and build backend
WORKDIR /usr/src/app/apps/backend
RUN npx prisma generate
RUN npx nest build

# --- Production image ---
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl libc6-compat

WORKDIR /usr/src/app

ENV NODE_ENV=production

# Copy workspace structure
COPY package*.json ./
COPY apps/shared/package*.json ./apps/shared/
COPY apps/backend/package*.json ./apps/backend/

RUN npm ci --omit=dev

# Copy built artifacts
COPY --from=builder /usr/src/app/apps/shared/dist ./apps/shared/dist
COPY --from=builder /usr/src/app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY apps/backend/prisma ./apps/backend/prisma

EXPOSE 5000

# Run migrations then start
WORKDIR /usr/src/app/apps/backend
CMD npx prisma migrate deploy && node dist/main.js
