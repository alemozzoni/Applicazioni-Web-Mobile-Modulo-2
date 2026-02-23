# syntax=docker/dockerfile:1
FROM node:20-alpine AS deps
WORKDIR /app

# Install only production deps
COPY package*.json ./
RUN npm install --omit=dev

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Optional: create writable dirs (not needed for Postgres)
USER root

# Drop privileges
USER node

# App files
COPY --chown=node:node --from=deps /app/node_modules ./node_modules
COPY --chown=node:node . ./

# (On Alpine, mkdir works without sudo if executed before USER; so we just rely on volume mount)
EXPOSE 5000

CMD ["node", "src/server.js"]
