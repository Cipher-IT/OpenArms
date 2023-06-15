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
RUN apk add --no-cache tesseract-ocr tesseract-ocr-dev leptonica-dev poppler-utils wget
RUN mkdir -p /usr/local/share/tessdata
RUN cd /usr/local/share/tessdata && wget https://github.com/tesseract-ocr/tessdata/raw/main/eng.traineddata && wget https://github.com/tesseract-ocr/tessdata/raw/main/ara.traineddata && wget https://github.com/tesseract-ocr/tessdata/raw/main/deu.traineddata
ENV TESSDATA_PREFIX=/usr/local/share/tessdata
COPY package*.json ./
RUN npm install --only=production
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["npm", "run", "start:prod"]