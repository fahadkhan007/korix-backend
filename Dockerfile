# ─────────────────────────────────────────────
# Stage 1: Build
# ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json ./

# Copy Prisma schema & config so generate can find them
COPY prisma ./prisma
COPY prisma.config.ts ./

# Install ALL deps with --ignore-scripts to skip the postinstall
# 'prisma generate' hook (we run it manually below with a dummy DB URL)
RUN npm ci --ignore-scripts

# Run prisma generate with a dummy DATABASE_URL.
# 'prisma generate' only reads the schema — it never connects to the DB.
# The dummy URL satisfies prisma.config.ts's env() call at parse time.
RUN DATABASE_URL=postgresql://build:build@localhost/build npx prisma generate

# Copy remaining source files
COPY tsconfig.json ./
COPY index.ts ./
COPY app ./app

# Copy RSA keys
COPY private.pem public.pem ./

# Compile TypeScript → dist/
# Call tsc directly to skip the 'prebuild' hook (which re-runs prisma generate)
# generate already ran in the step above
RUN npx tsc

# ─────────────────────────────────────────────
# Stage 2: Production
# ─────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Copy dependency manifests
COPY package.json package-lock.json ./

# Install production deps only.
# --ignore-scripts skips postinstall/prisma generate —
# the pre-built generated client is copied from builder below.
RUN npm ci --omit=dev --ignore-scripts

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# Copy Prisma schema & pre-generated client
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/app/generated ./app/generated

# Copy RSA keys
COPY --from=builder /app/private.pem /app/public.pem ./

EXPOSE 8000

# Run Prisma migrations (needs real DATABASE_URL at runtime), then start
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
