FROM node:22-alpine3.19

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 8083

CMD ["node", "src/app.js"]
