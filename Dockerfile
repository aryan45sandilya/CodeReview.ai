FROM node:20.19.0-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build
RUN cp -r public .next/standalone/public
RUN cp -r .next/static .next/standalone/.next/static

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", ".next/standalone/server.js"]