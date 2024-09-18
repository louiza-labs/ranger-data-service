# syntax = docker/dockerfile:1

ARG BUN_VERSION=1.1.26
FROM oven/bun:${BUN_VERSION}-slim as base

LABEL fly_launch_runtime="Bun"

WORKDIR /app
ENV NODE_ENV="production"

# Build stage
FROM base as build
RUN apt-get update -qq && apt-get install --no-install-recommends -y build-essential pkg-config python-is-python3

COPY --link bun.lockb package.json ./
RUN bun install --ci

# Copy application code
COPY --link . .

# Final stage for the app image
FROM base
COPY --from=build /app /app

# Set Fly.io PORT (set this to 8080 if you keep the port in fly.toml)
EXPOSE 8080

# Let Fly.io handle which command to run, so don't specify a default CMD
# CMD [ "bun", "run", "start" ]  <-- you can remove or modify this line

