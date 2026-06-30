# ============================================================
# ETAPA 1 - BUILD: Compila la app React con Node.js
# ============================================================
FROM node:20-alpine AS builder

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos primero SOLO los archivos de dependencias
# Esto aprovecha el cache de capas de Docker:
# si el código cambia pero package.json no, no se reinstalan dependencias
COPY package*.json ./

# Instala dependencias (npm ci es más estricto y reproducible que npm install)
RUN npm ci

# Ahora copiamos el resto del código fuente
ARG VITE_BACKEND_URL
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
COPY . .

# Construye la app para producción (genera la carpeta /app/dist)
RUN npm run build

# ============================================================
# ETAPA 2 - PRODUCCIÓN: Solo Nginx con los archivos compilados
# La imagen final NO incluye Node.js (~1GB -> ~25MB)
# ============================================================
FROM nginx:1.25-alpine AS production

# Crear usuario sin privilegios root (seguridad: principio de mínimo privilegio)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copiar SOLO los archivos compilados desde la etapa builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Ajustar permisos para el usuario no-root
RUN chown -R appuser:appgroup /usr/share/nginx/html \
    && chown -R appuser:appgroup /var/cache/nginx \
    && chown -R appuser:appgroup /var/log/nginx \
    && touch /var/run/nginx.pid \
    && chown appuser:appgroup /var/run/nginx.pid

# Cambiar al usuario sin privilegios
USER appuser

# Nginx escucha en el puerto 80
EXPOSE 8080

# Comando para iniciar Nginx en primer plano (modo daemon off para Docker)
CMD ["nginx", "-g", "daemon off;"]
