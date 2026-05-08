## Dockerfile for packaged pigon server.

FROM node:24-slim

WORKDIR /

COPY package*.json ./

RUN npm install --production

COPY . .

CMD ["node", "index.js"]
