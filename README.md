# Frontend Despacho — Innovatech Chile

Sistema de gestión de despachos desarrollado en React + Vite, contenedorizado con Docker y desplegado en AWS EC2 mediante CI/CD con GitHub Actions.

## Tecnologías

| Tecnología | Uso |
|---|---|
| React 18 + Vite | Framework y bundler del frontend |
| Docker (multi-stage) | Contenedorización: Node build → Nginx producción |
| Nginx | Servidor web y proxy inverso al backend |
| GitHub Actions | Pipeline CI/CD automático |
| AWS EC2 | Servidor de producción |

## Estructura del proyecto

```
frontend-despacho/
├── src/
│   ├── App.jsx          # Componente principal con gestión de despachos
│   ├── App.css          # Estilos del sistema
│   ├── main.jsx         # Punto de entrada de React
│   └── index.css        # Estilos globales y variables CSS
├── Dockerfile           # Multi-stage: Node (build) → Nginx (producción)
├── nginx.conf           # Configuración del servidor web
├── docker-compose.yml   # Orquestación del contenedor
├── .dockerignore        # Excluye node_modules del contexto de build
└── .github/
    └── workflows/
        └── deploy.yml   # Pipeline CI/CD GitHub Actions
```

## Desarrollo local

```bash
# Instalar dependencias
npm install

# Levantar en modo desarrollo (con hot reload)
npm run dev
# → Abre http://localhost:3000

# Con Docker Compose
docker-compose up --build
# → Abre http://localhost:80
```

## Variables de entorno

| Variable | Descripción | Ejemplo |
|---|---|---|
| `VITE_BACKEND_URL` | URL del backend Spring Boot | `http://IP_PRIVADA_BACKEND:8081` |

## Pipeline CI/CD

El pipeline se activa automáticamente al hacer `push` a la rama `deploy`:

1. **Checkout** → Descarga el código
2. **Login Docker Hub** → Autenticación con secrets de GitHub
3. **Build & Push** → Construye imagen multi-stage y sube a Docker Hub
4. **SSH Deploy** → Se conecta a EC2 y actualiza el contenedor

```bash
# Para activar el deploy:
git checkout deploy
git merge main
git push origin deploy
```

## Secrets de GitHub requeridos

| Secret | Descripción |
|---|---|
| `DOCKERHUB_USERNAME` | Usuario de Docker Hub |
| `DOCKERHUB_TOKEN` | Token de acceso de Docker Hub |
| `EC2_FRONTEND_HOST` | IP pública de la instancia EC2 |
| `EC2_USER` | Usuario SSH (`ec2-user`) |
| `EC2_SSH_KEY` | Contenido del archivo `.pem` |
| `BACKEND_URL` | URL del backend (`http://IP_PRIVADA:8081`) |

## Decisiones técnicas

**¿Por qué multi-stage build?**
La imagen final no incluye Node.js ni las herramientas de build. Solo contiene Nginx y los archivos estáticos compilados. Resultado: imagen de ~25MB en vez de ~1GB.

**¿Por qué usuario no-root?**
Principio de mínimo privilegio. Si el contenedor fuera comprometido, el atacante no tendría permisos de administrador en el sistema host.

**¿Por qué Nginx?**
Sirve archivos estáticos eficientemente y actúa como proxy inverso al backend, evitando problemas de CORS.

---

*ISY1101 — Introducción a Herramientas DevOps | EP2 | Innovatech Chile*
