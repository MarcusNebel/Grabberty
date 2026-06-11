FROM node:20-alpine
WORKDIR /app

# Kopiere package.json
COPY package*.json ./

COPY . .
RUN npm i
RUN npm run build

RUN npm install -g serve
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]