FROM node:20-alpine

WORKDIR /app

# Install deps (will be cached in image layers; runtime deps live in named volume)
COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
