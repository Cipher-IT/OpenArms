# Build stage
FROM node:16 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM node:16-alpine
WORKDIR /app
RUN apk add --no-cache tesseract-ocr
COPY package*.json ./
RUN npm install --only=production
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["npm", "run", "start:prod"]