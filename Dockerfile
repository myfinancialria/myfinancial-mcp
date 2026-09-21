# Dockerfile for MyFinancial Market Data MCP.
# Builds the TypeScript stdio bridge and runs it. Pass your Tapetide token as
# MYFINANCIAL_TOKEN (free at https://tapetide.com/settings/tokens); without it
# the bridge starts in preview mode (tool catalog only).
#
#   docker build -t myfinancial-mcp .
#   docker run -i --rm -e MYFINANCIAL_TOKEN=tpt_rt_... myfinancial-mcp

FROM node:20-alpine AS build
WORKDIR /app

# Install all deps (incl. devDeps like typescript) for the build.
COPY package.json package-lock.json* ./
RUN npm install

# Compile TypeScript -> dist/
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ── Runtime image ─────────────────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Only the compiled output and package manifest are needed at runtime;
# the bridge has zero runtime dependencies.
COPY package.json ./
COPY --from=build /app/dist ./dist

# stdio MCP server — communicates over stdin/stdout (JSON-RPC).
ENTRYPOINT ["node", "dist/index.js"]
