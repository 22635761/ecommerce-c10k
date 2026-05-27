FROM node:20-bullseye

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY server.js ./

EXPOSE 3007

CMD ["node", "--max-old-space-size=2048", "server.js"]
