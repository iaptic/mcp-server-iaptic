# MCP server over stdio: run with `docker run -i --rm -e IAPTIC_API_KEY -e IAPTIC_APP_NAME <image>`
FROM node:24-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json tsconfig.json ./
RUN npm ci

COPY src ./src
RUN npm run build

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist

# stdio transport: no port to expose. Run as the unprivileged "node" user.
USER node
ENTRYPOINT ["node", "dist/server.js"]
