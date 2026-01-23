# ---------- deps ----------
FROM node:20-slim AS deps
WORKDIR /app

# Install openssl for Prisma engines
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

# ---------- build ----------
FROM node:20-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Next.js build
RUN npm run build

# ---------- runtime ----------
FROM node:20-slim AS runtime
WORKDIR /app

# IMPORTANT: Re-install openssl in the final stage
RUN apt-get update && apt-get install -y openssl ca-certificates curl && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copy Next.js standalone files
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

# Copy Prisma schema and generated client
COPY --from=build /app/prisma ./prisma
# Copy the custom generated Prisma client location
COPY --from=build /app/generated ./generated
# No need to copy Prisma CLI - will use npx at runtime

EXPOSE 3000

# Wait for database, run Prisma migrations using npx, then start the server
CMD ["sh", "-c", "sleep 5 && npx -y prisma@6 migrate deploy && node server.js"]
