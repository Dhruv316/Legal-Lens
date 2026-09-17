# ============================================================
# Legal Lens — Demo Mode Dockerfile
# ============================================================
# One image, one command, no local Node/npm setup needed.
#
# Build:  docker build -t legal-lens-demo .
# Run:    docker run -p 3000:3000 legal-lens-demo
# Open:   http://localhost:3000
# ============================================================

# ---- deps: install dependencies ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install

# ---- builder: build the Next.js app ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- runner: minimal production image ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Next.js "standalone" output already contains only what's needed to run
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
