FROM node:20-bullseye

ENV NODE_OPTIONS="--max-old-space-size=2048"

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY prisma ./prisma/
RUN npx prisma generate

COPY src ./src

EXPOSE 3005

CMD ["node", "src/server.js"]
