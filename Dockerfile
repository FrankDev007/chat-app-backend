FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

# Install nodemon globally
RUN npm install -g nodemon

COPY . .

EXPOSE 3000

CMD ["nodemon", "index.js"]
