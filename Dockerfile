# -------- BUILD --------
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# -------- NGINX --------
FROM nginx:alpine

# Copiamos el build de Vite
COPY --from=build /app/dist /usr/share/nginx/html

# Copiamos configuración SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
