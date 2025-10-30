FROM node:18-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --production --silent || npm install --silent
COPY . .
EXPOSE 3000
CMD ["node","server.js"]
