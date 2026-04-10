FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --legacy-peer-deps

# Copy .env.docker thành .env
COPY .env.docker .env

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
