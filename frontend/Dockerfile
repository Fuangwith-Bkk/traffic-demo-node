FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Frontend usually runs on 3000
EXPOSE 3000

CMD ["node", "index.js"]