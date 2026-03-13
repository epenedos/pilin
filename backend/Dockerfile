FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --production=false

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["sh", "-c", "node dist/migrate.js && node dist/index.js"]
