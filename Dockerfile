ARG NODE_VERSION=21.6.0
FROM node:${NODE_VERSION}-slim

WORKDIR /app

ENV NODE_ENV="production"

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3 && \
    rm -rf /var/lib/apt/lists/*

COPY --link package.json package-lock.json ./

RUN npm install --include=dev && npm cache clean --force

COPY --link . .

RUN npm run build

RUN npm prune --omit=dev

VOLUME /data

EXPOSE 3000

CMD [ "node", "dist/index.js" ]
