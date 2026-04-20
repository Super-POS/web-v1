# Stage 1
FROM node:18-alpine as node

# Build-time URLs (browser must reach host-mapped ports; see docker-compose build args)
ARG API_BASE_URL
ARG FILE_BASE_URL
ARG SOCKET_URL
ARG RecaptchaSiteKey
ENV API_BASE_URL=${API_BASE_URL}
ENV FILE_BASE_URL=${FILE_BASE_URL}
ENV SOCKET_URL=${SOCKET_URL}
ENV RecaptchaSiteKey=${RecaptchaSiteKey}

WORKDIR /usr/app
RUN npm uninstall ws
COPY ./package.json /usr/app/package.json
COPY ./package-lock.json /usr/app/package-lock.json

# Install Dependencies
RUN npm install --legacy-peer-deps

COPY ./ /usr/app

# Increase Node heap memory limit before build
ENV NODE_OPTIONS=--max_old_space_size=2048

# Build
RUN npm run build --prod

# Stage 2
FROM nginx:1.15.8-alpine

COPY --from=node /usr/app/dist /usr/share/nginx/html