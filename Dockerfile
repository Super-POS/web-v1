# Stage 1
FROM node:18-alpine AS node

# Build-time URLs (browser must reach host-mapped ports; see docker-compose build args)
ARG API_BASE_URL
ARG FILE_BASE_URL
ARG SOCKET_URL
ARG RecaptchaSiteKey
ENV API_BASE_URL=${API_BASE_URL}
ENV FILE_BASE_URL=${FILE_BASE_URL}
ENV SOCKET_URL=${SOCKET_URL}
ENV RecaptchaSiteKey=${RecaptchaSiteKey}

# utf-8-validate / bufferutil (transitive of ws) need node-gyp → Python + build tools on Alpine
RUN apk add --no-cache python3 make g++ \
    && ln -sf python3 /usr/bin/python

WORKDIR /usr/app

RUN apk add --no-cache python3 make g++

COPY ./package.json /usr/app/package.json
COPY ./package-lock.json /usr/app/package-lock.json

# Increase Node heap memory limit for install and build
ENV NODE_OPTIONS=--max_old_space_size=4096

# Install Dependencies
RUN npm install --legacy-peer-deps

COPY ./ /usr/app

# Build
RUN npm run build -- --configuration=production

# Stage 2
FROM nginx:1.27-alpine

COPY --from=node /usr/app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf