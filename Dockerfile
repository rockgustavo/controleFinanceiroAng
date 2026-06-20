FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --silent
COPY . .
RUN npm run build -- --configuration docker

FROM nginx:alpine AS runtime
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /app/dist/controle-financeiro/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
