FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
COPY apps/shared/package*.json ./apps/shared/
COPY apps/frontend/package*.json ./apps/frontend/

RUN npm ci

COPY apps/shared ./apps/shared
COPY apps/frontend ./apps/frontend

# Build shared lib
RUN npm run build --workspace=apps/shared

# Build Next.js app
ARG NEXT_PUBLIC_API_URL=http://localhost:5000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /usr/src/app/apps/frontend
RUN npm run build

# --- Production image ---
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY package*.json ./
COPY apps/shared/package*.json ./apps/shared/
COPY apps/frontend/package*.json ./apps/frontend/

RUN npm ci --omit=dev

COPY --from=builder /usr/src/app/apps/frontend/.next ./apps/frontend/.next
COPY --from=builder /usr/src/app/apps/frontend/public ./apps/frontend/public
COPY --from=builder /usr/src/app/apps/shared/dist ./apps/shared/dist

EXPOSE 3000

WORKDIR /usr/src/app/apps/frontend
CMD ["node_modules/.bin/next", "start", "-H", "0.0.0.0"]
