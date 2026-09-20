FROM oven/bun:1-alpine AS base
WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install production dependencies
RUN bun install --frozen-lockfile --production

# Copy application source code
COPY . .

# Expose backend port
EXPOSE 8000

ENV NODE_ENV=production
ENV PORT=8000

CMD ["bun", "run", "src/index.ts"]
