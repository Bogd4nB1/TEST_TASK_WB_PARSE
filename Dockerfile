FROM node:18-alpine

# Установка временной зоны
RUN apk add --no-cache tzdata
ENV TZ=Europe/Moscow

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN apk add --no-cache netcat-openbsd
EXPOSE 8000