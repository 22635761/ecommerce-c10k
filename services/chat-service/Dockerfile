FROM node:20-bullseye

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY server.js ./

EXPOSE 3007

CMD ["node", "server.js"]
